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
        }
      }
    }
  `

  const data = await mondayGraphQL<{
    boards: Array<{ id: string; columns: MondayBoardColumn[] }>
  }>(query, { boardId: [String(boardId)] })

  return data.boards?.[0]?.columns ?? []
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

export async function ensureMondayColumns(
  scope: ColumnScopeRequest,
): Promise<ColumnIdMap> {
  const boardId = MONDAY_MASTER_BOARD_ID
  const registryDoc = await fetchColumnRegistry()
  const boardRegistry = ensureRegistryScopes(registryDoc, String(boardId))
  const columns = await listBoardColumns(boardId)
  const columnMap = createEmptyColumnIdMap()
  let registryUpdated = false

  for (const definition of getColumnDefinitions(scope)) {
    const scopeRegistry = boardRegistry[definition.scope]
    const existingEntry = scopeRegistry[definition.slug]
    if (existingEntry && columnStillExists(columns, existingEntry.columnId)) {
      recordColumnId(columnMap, definition, existingEntry.columnId)
      continue
    }

    const matchingColumn = findColumnByTitle(columns, definition.title)
    if (matchingColumn) {
      addEntryToRegistry(boardRegistry, definition, matchingColumn.id)
      recordColumnId(columnMap, definition, matchingColumn.id)
      registryUpdated = true
      continue
    }

    const newColumnId = await createColumnOnMonday(boardId, definition)
    addEntryToRegistry(boardRegistry, definition, newColumnId)
    recordColumnId(columnMap, definition, newColumnId)
    registryUpdated = true
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


