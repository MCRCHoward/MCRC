import { adminDb } from '@/lib/firebase-admin'
import { MONDAY_MASTER_BOARD_ID } from './config'
import { mondayGraphQL } from './client'
import {
  type ColumnDefinition,
  type ColumnScope,
  type ColumnScopeRequest,
  type ColumnIdMap,
  COLUMN_DEFINITIONS,
  createEmptyColumnIdMap,
  getColumnDefinitions,
  FORM_TYPE_LABELS,
} from './column-schemas'

type BoardRegistryScopes = Record<ColumnScope, Record<string, ColumnRegistryEntry>>

export type ColumnRegistryEntry = {
  columnId: string
  slug: string
  scope: ColumnScope
  title: string
  type: string
  createdAt: number
}

export type ColumnRegistryMap = Record<string, BoardRegistryScopes>

interface ColumnRegistryDoc {
  boards: ColumnRegistryMap
}

interface MondayBoardColumn {
  id: string
  title: string
  type: string
  settings_str?: string
}

const COLUMN_REGISTRY_COLLECTION = adminDb.collection('integrations')
const COLUMN_REGISTRY_DOC = COLUMN_REGISTRY_COLLECTION.doc('mondayColumnRegistry')

function createEmptyBoardRegistry(): BoardRegistryScopes {
  return {
    shared: {},
    mediation: {},
    restorative: {},
  }
}

async function fetchColumnRegistry(): Promise<ColumnRegistryDoc> {
  const snapshot = await COLUMN_REGISTRY_DOC.get()
  if (!snapshot.exists) {
    return { boards: {} }
  }
  const data = snapshot.data() as ColumnRegistryDoc | undefined
  if (!data || !data.boards) {
    return { boards: {} }
  }
  return data
}

async function saveColumnRegistry(registry: ColumnRegistryDoc) {
  await COLUMN_REGISTRY_DOC.set(registry, { merge: true })
}

async function listBoardColumns(boardId: number): Promise<MondayBoardColumn[]> {
  const query = /* GraphQL */ `
    query GetBoardColumns($boardId: [ID!]) {
      boards(ids: $boardId) {
        id
        columns {
          id
          title
          type
          settings_str
        }
      }
    }
  `

  const data = await mondayGraphQL<{
    boards: Array<{ id: string; columns: MondayBoardColumn[] }>
  }>(query, { boardId: [String(boardId)] })

  return data.boards?.[0]?.columns ?? []
}

function parseDropdownLabels(settingsStr: string | undefined): string[] {
  if (!settingsStr) return []
  try {
    const settings = JSON.parse(settingsStr)
    // Monday stores dropdown labels in settings.labels as an object with numeric keys
    if (settings?.labels && typeof settings.labels === 'object') {
      return Object.values(settings.labels) as string[]
    }
    return []
  } catch {
    return []
  }
}


async function createColumnOnMonday(boardId: number, definition: ColumnDefinition): Promise<string> {
  const mutation = /* GraphQL */ `
    mutation CreateColumn(
      $boardId: ID!
      $title: String!
      $columnType: ColumnType!
      $defaults: JSON
    ) {
      create_column(
        board_id: $boardId
        title: $title
        column_type: $columnType
        defaults: $defaults
      ) {
        id
      }
    }
  `

  const variables = {
    boardId,
    title: definition.title,
    columnType: definition.type,
    defaults: definition.defaults ? JSON.stringify(definition.defaults) : null,
  }

  const data = await mondayGraphQL<{ create_column: { id: string } }>(mutation, variables)
  return data.create_column.id
}

function ensureRegistryScopes(
  registry: ColumnRegistryDoc,
  boardId: string,
): BoardRegistryScopes {
  if (!registry.boards[boardId]) {
    registry.boards[boardId] = createEmptyBoardRegistry()
  }
  return registry.boards[boardId]
}

function findColumnByTitle(
  columns: MondayBoardColumn[],
  title: string,
): MondayBoardColumn | undefined {
  return columns.find((column) => column.title === title)
}

function addEntryToRegistry(
  registry: BoardRegistryScopes,
  definition: ColumnDefinition,
  columnId: string,
): ColumnRegistryEntry {
  const entry: ColumnRegistryEntry = {
    columnId,
    slug: definition.slug,
    scope: definition.scope,
    title: definition.title,
    type: definition.type,
    createdAt: Date.now(),
  }
  registry[definition.scope][definition.slug] = entry
  return entry
}

function recordColumnId(
  map: ColumnIdMap,
  definition: ColumnDefinition,
  columnId: string,
) {
  if (definition.scope === 'shared') {
    map.shared[definition.slug] = columnId
  } else {
    map.specific[definition.slug] = columnId
  }
}

function columnStillExists(
  columns: MondayBoardColumn[],
  columnId: string,
): boolean {
  return columns.some((column) => column.id === columnId)
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function ensureMondayColumns(
  scope: ColumnScopeRequest,
): Promise<ColumnIdMap> {
  const boardId = MONDAY_MASTER_BOARD_ID
  const registryDoc = await fetchColumnRegistry()
  const boardRegistry = ensureRegistryScopes(registryDoc, String(boardId))
  const columns = await listBoardColumns(boardId)
  const columnMap = createEmptyColumnIdMap()
  let registryUpdated = false

  const definitions = getColumnDefinitions(scope)

  for (const definition of definitions) {
    try {
      const scopeRegistry = boardRegistry[definition.scope]
      const existingEntry = scopeRegistry[definition.slug]
      if (existingEntry && columnStillExists(columns, existingEntry.columnId)) {
        recordColumnId(columnMap, definition, existingEntry.columnId)
        
        // Check if dropdown column needs labels
        if (definition.type === 'dropdown' && definition.defaults) {
          const column = columns.find((c) => c.id === existingEntry.columnId)
          if (column && definition.defaults.labels) {
            const requiredLabels = definition.defaults.labels as string[]
            const existingLabels = parseDropdownLabels(column.settings_str)
            const missingLabels = requiredLabels.filter(
              (label) => !existingLabels.includes(label),
            )
            if (missingLabels.length > 0) {
              console.warn(
                `   ⚠ Dropdown column "${definition.title}" is missing labels: ${missingLabels.join(', ')}. Please add these labels manually in Monday.com`,
              )
            }
          }
        }
        continue
      }

      const matchingColumn = findColumnByTitle(columns, definition.title)
      if (matchingColumn) {
        addEntryToRegistry(boardRegistry, definition, matchingColumn.id)
        recordColumnId(columnMap, definition, matchingColumn.id)
        registryUpdated = true
        
        // Check if dropdown column needs labels
        if (definition.type === 'dropdown' && definition.defaults) {
          const requiredLabels = definition.defaults.labels as string[]
          const existingLabels = parseDropdownLabels(matchingColumn.settings_str)
          const missingLabels = requiredLabels.filter(
            (label) => !existingLabels.includes(label),
          )
          if (missingLabels.length > 0) {
            console.warn(
              `   ⚠ Dropdown column "${definition.title}" is missing labels: ${missingLabels.join(', ')}. Please add these labels manually in Monday.com`,
            )
          }
        }
        continue
      }

      // Create new column with delay to avoid complexity budget
      // Only delay when actually creating columns, not when checking existing ones
      await sleep(500) // 500ms delay between column creations
      const newColumnId = await createColumnOnMonday(boardId, definition)
      addEntryToRegistry(boardRegistry, definition, newColumnId)
      recordColumnId(columnMap, definition, newColumnId)
      registryUpdated = true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      
      // If it's a complexity budget error, suggest waiting
      if (errorMsg.includes('Complexity budget')) {
        throw new Error(
          `Complexity budget exhausted while creating column "${definition.title}". Please wait 25-30 seconds and try again, or run the script with fewer items at a time.`,
        )
      }
      
      throw new Error(
        `Failed to ensure column "${definition.title}" (${definition.slug}): ${errorMsg}`,
      )
    }
  }

  if (registryUpdated) {
    await saveColumnRegistry(registryDoc)
  }

  return columnMap
}

export function getColumnTitleBySlug(scope: ColumnScopeRequest, slug: string): string | undefined {
  const definitions = COLUMN_DEFINITIONS[scope] ?? []
  const sharedMatch = COLUMN_DEFINITIONS.shared.find((def) => def.slug === slug)
  if (sharedMatch) return sharedMatch.title
  const match = definitions.find((def) => def.slug === slug)
  return match?.title
}

export function formatFormTypeLabel(scope: ColumnScopeRequest): string {
  return FORM_TYPE_LABELS[scope]
}


