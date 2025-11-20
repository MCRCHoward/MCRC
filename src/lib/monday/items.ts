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

  try {
    const data = await mondayGraphQL<{ create_item: { id: string } }>(query, variables)
    return { itemId: data.create_item.id }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    
    // If dropdown label doesn't exist, try again without the dropdown value
    if (errorMsg.includes('dropdown label') && errorMsg.includes('does not exist')) {
      try {
        const columnValuesObj = JSON.parse(input.columnValues) as Record<string, unknown>
        // Find and remove the dropdown column that's causing the issue
        const cleanedValues: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(columnValuesObj)) {
          // Skip dropdown values that have labels array (these are the problematic ones)
          if (value && typeof value === 'object' && 'labels' in value) {
            console.warn(`   ⚠ Skipping dropdown value for column ${key} - label doesn't exist in Monday`)
            continue
          }
          cleanedValues[key] = value
        }
        
        // Retry with cleaned values
        const cleanedVariables = {
          ...variables,
          columnValues: JSON.stringify(cleanedValues),
        }
        const data = await mondayGraphQL<{ create_item: { id: string } }>(query, cleanedVariables)
        console.warn(`   ⚠ Created item without dropdown value - please add labels manually in Monday.com`)
        return { itemId: data.create_item.id }
      } catch {
        // If retry also fails, throw the original error
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

  try {
    await mondayGraphQL(mutation, variables)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    
    // If dropdown label doesn't exist, try again without the dropdown value
    if (errorMsg.includes('dropdown label') && errorMsg.includes('does not exist')) {
      try {
        const columnValuesObj = JSON.parse(input.columnValues) as Record<string, unknown>
        // Find and remove the dropdown column that's causing the issue
        const cleanedValues: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(columnValuesObj)) {
          // Skip dropdown values that have labels array (these are the problematic ones)
          if (value && typeof value === 'object' && 'labels' in value) {
            console.warn(`   ⚠ Skipping dropdown value for column ${key} - label doesn't exist in Monday`)
            continue
          }
          cleanedValues[key] = value
        }
        
        // Retry with cleaned values
        const cleanedVariables = {
          ...variables,
          columnValues: JSON.stringify(cleanedValues),
        }
        await mondayGraphQL(mutation, cleanedVariables)
        console.warn(`   ⚠ Updated item without dropdown value - please add labels manually in Monday.com`)
        return
      } catch {
        // If retry also fails, throw the original error
        throw error
      }
    }
    
    throw error
  }
}


