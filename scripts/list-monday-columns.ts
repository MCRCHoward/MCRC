#!/usr/bin/env tsx
/**
 * Helper script to list all columns on a Monday.com board.
 * This helps identify the correct column IDs for mapping Firestore data.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables FIRST, before any Monday modules
const envLocal = path.join(process.cwd(), '.env.local')
const envFile = path.join(process.cwd(), '.env')

dotenv.config({ path: envLocal })
dotenv.config({ path: envFile })

console.log('✓ Loaded environment variables from .env.local')
console.log('✓ Loaded environment variables from .env\n')

async function listMondayColumns() {
  // Dynamically import Monday modules after env vars are loaded
  const { mondayGraphQL } = await import('../src/lib/monday/client')
  const { MONDAY_MASTER_BOARD_ID } = await import('../src/lib/monday/config')

  const boardId = MONDAY_MASTER_BOARD_ID
  console.log(`📋 Querying Monday board ${boardId} for columns...\n`)

  const query = /* GraphQL */ `
    query GetBoardColumns($boardId: [ID!]) {
      boards(ids: $boardId) {
        id
        name
        columns {
          id
          title
          type
          settings_str
        }
      }
    }
  `

  try {
    const data = await mondayGraphQL<{
      boards: Array<{
        id: string
        name: string
        columns: Array<{
          id: string
          title: string
          type: string
          settings_str: string
        }>
      }>
    }>(query, { boardId: [String(boardId)] })

    const board = data.boards[0]
    if (!board) {
      console.error(`✗ Board ${boardId} not found`)
      process.exit(1)
    }

    console.log(`✅ Board: ${board.name} (ID: ${board.id})\n`)
    console.log('📦 Available Columns:')
    console.log('─'.repeat(80))

    if (board.columns.length === 0) {
      console.log('   No columns found on this board.')
    } else {
      for (const column of board.columns) {
        console.log(`\n   Column ID: "${column.id}"`)
        console.log(`   Title:     "${column.title}"`)
        console.log(`   Type:      ${column.type}`)
        console.log(`   ─${'─'.repeat(78)}`)
      }
    }

    console.log('\n💡 To use these columns, update your .env.local:')
    console.log('   MONDAY_COLUMN_STATUS=<column_id_from_above>')
    console.log('   MONDAY_COLUMN_FORM_TYPE=<column_id_from_above>')
    console.log('   MONDAY_COLUMN_SUBMISSION_DATE=<column_id_from_above>')
    console.log('   MONDAY_COLUMN_PRIMARY_CONTACT=<column_id_from_above>')
    console.log('   ... (and so on for all columns you want to map)\n')
  } catch (error) {
    console.error('✗ Failed to query Monday board:')
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

listMondayColumns().catch((error) => {
  console.error('\n✗ Unexpected error')
  console.error(error)
  process.exit(1)
})

