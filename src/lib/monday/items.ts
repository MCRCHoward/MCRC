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

  const data = await mondayGraphQL<{ create_item: { id: string } }>(query, variables)
  return { itemId: data.create_item.id }
}


