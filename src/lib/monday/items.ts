'use server'

import { mondayGraphQL } from './client'

export interface CreateMondayItemInput {
  boardId: number
  groupId: string
  itemName: string
  columnValues: string
}

export async function createMondayItem(
  input: CreateMondayItemInput,
): Promise<{ itemId: string }> {
  console.log('[Monday API] Creating item', {
    boardId: input.boardId,
    groupId: input.groupId,
    itemName: input.itemName,
    columnValuesLength: input.columnValues.length,
  })

  const query = /* GraphQL */ `
    mutation CreateItem(
      $boardId: ID!
      $groupId: String!
      $itemName: String!
      $columnValues: JSON
    ) {
      create_item(
        board_id: $boardId
        group_id: $groupId
        item_name: $itemName
        column_values: $columnValues
      ) {
        id
      }
    }
  `

  const variables = {
    boardId: input.boardId,
    groupId: input.groupId,
    itemName: input.itemName,
    columnValues: input.columnValues,
  }

  // Log the column values structure (parse to show keys)
  try {
    const columnValuesObj = JSON.parse(input.columnValues) as Record<string, unknown>
    console.log('[Monday API] Column values structure', {
      columnKeys: Object.keys(columnValuesObj),
      columnCount: Object.keys(columnValuesObj).length,
    })
  } catch (e) {
    console.warn('[Monday API] Could not parse column values for logging')
  }

  console.log('[Monday API] Sending GraphQL mutation...')
  try {
    const data = await mondayGraphQL<{ create_item: { id: string } }>(query, variables)
    console.log('[Monday API] Item created successfully', {
      itemId: data.create_item.id,
    })
    return { itemId: data.create_item.id }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[Monday API] Create item failed', {
      error: errorMsg,
      boardId: input.boardId,
      groupId: input.groupId,
      itemName: input.itemName,
    })
    
    // If dropdown label doesn't exist, try again without the dropdown value
    if (errorMsg.includes('dropdown label') && errorMsg.includes('does not exist')) {
      console.warn('[Monday API] Dropdown label error detected, attempting retry without dropdown values...')
      try {
        const columnValuesObj = JSON.parse(input.columnValues) as Record<string, unknown>
        // Find and remove the dropdown column that's causing the issue
        const cleanedValues: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(columnValuesObj)) {
          // Skip dropdown values that have labels array (these are the problematic ones)
          if (value && typeof value === 'object' && 'labels' in value) {
            console.warn(`[Monday API] Skipping dropdown value for column ${key} - label doesn't exist in Monday`)
            continue
          }
          cleanedValues[key] = value
        }
        
        console.log('[Monday API] Retrying with cleaned values', {
          originalColumnCount: Object.keys(columnValuesObj).length,
          cleanedColumnCount: Object.keys(cleanedValues).length,
          removedColumns: Object.keys(columnValuesObj).length - Object.keys(cleanedValues).length,
        })
        
        // Retry with cleaned values
        const cleanedVariables = {
          ...variables,
          columnValues: JSON.stringify(cleanedValues),
        }
        const data = await mondayGraphQL<{ create_item: { id: string } }>(query, cleanedVariables)
        console.warn('[Monday API] Created item without dropdown value - please add labels manually in Monday.com', {
          itemId: data.create_item.id,
        })
        return { itemId: data.create_item.id }
      } catch (retryError) {
        // If retry also fails, throw the original error
        console.error('[Monday API] Retry also failed', {
          retryError: retryError instanceof Error ? retryError.message : String(retryError),
        })
        throw error
      }
    }
    
    throw error
  }
}

interface UpdateMondayItemInput {
  boardId: number
  itemId: string
  columnValues: string
}

export async function updateMondayItem(input: UpdateMondayItemInput): Promise<void> {
  console.log('[Monday API] Updating item', {
    boardId: input.boardId,
    itemId: input.itemId,
    columnValuesLength: input.columnValues.length,
  })

  const mutation = /* GraphQL */ `
    mutation UpdateMondayItem(
      $boardId: ID!
      $itemId: ID!
      $columnValues: JSON!
    ) {
      change_multiple_column_values(
        board_id: $boardId
        item_id: $itemId
        column_values: $columnValues
      ) {
        id
      }
    }
  `

  const variables = {
    boardId: input.boardId,
    itemId: input.itemId,
    columnValues: input.columnValues,
  }

  // Log the column values structure (parse to show keys)
  try {
    const columnValuesObj = JSON.parse(input.columnValues) as Record<string, unknown>
    console.log('[Monday API] Update column values structure', {
      columnKeys: Object.keys(columnValuesObj),
      columnCount: Object.keys(columnValuesObj).length,
    })
  } catch (e) {
    console.warn('[Monday API] Could not parse column values for logging')
  }

  console.log('[Monday API] Sending GraphQL mutation to update item...')
  try {
    await mondayGraphQL(mutation, variables)
    console.log('[Monday API] Item updated successfully', { itemId: input.itemId })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[Monday API] Update item failed', {
      error: errorMsg,
      boardId: input.boardId,
      itemId: input.itemId,
    })
    
    // If dropdown label doesn't exist, try again without the dropdown value
    if (errorMsg.includes('dropdown label') && errorMsg.includes('does not exist')) {
      console.warn('[Monday API] Dropdown label error detected, attempting retry without dropdown values...')
      try {
        const columnValuesObj = JSON.parse(input.columnValues) as Record<string, unknown>
        // Find and remove the dropdown column that's causing the issue
        const cleanedValues: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(columnValuesObj)) {
          // Skip dropdown values that have labels array (these are the problematic ones)
          if (value && typeof value === 'object' && 'labels' in value) {
            console.warn(`[Monday API] Skipping dropdown value for column ${key} - label doesn't exist in Monday`)
            continue
          }
          cleanedValues[key] = value
        }
        
        console.log('[Monday API] Retrying update with cleaned values', {
          originalColumnCount: Object.keys(columnValuesObj).length,
          cleanedColumnCount: Object.keys(cleanedValues).length,
          removedColumns: Object.keys(columnValuesObj).length - Object.keys(cleanedValues).length,
        })
        
        // Retry with cleaned values
        const cleanedVariables = {
          ...variables,
          columnValues: JSON.stringify(cleanedValues),
        }
        await mondayGraphQL(mutation, cleanedVariables)
        console.warn('[Monday API] Updated item without dropdown value - please add labels manually in Monday.com', {
          itemId: input.itemId,
        })
        return
      } catch (retryError) {
        // If retry also fails, throw the original error
        console.error('[Monday API] Retry also failed', {
          retryError: retryError instanceof Error ? retryError.message : String(retryError),
        })
        throw error
      }
    }
    
    throw error
  }
}


