#!/usr/bin/env tsx
/**
 * Helper script to list all groups on a Monday.com board.
 * This helps identify the correct group IDs for MONDAY_GROUP_MEDIATION_REFERRALS
 * and MONDAY_GROUP_RESTORATIVE_REFERRALS.
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

async function listMondayGroups() {
  // Dynamically import Monday modules after env vars are loaded
  const { mondayGraphQL } = await import('../src/lib/monday/client')
  const { MONDAY_MASTER_BOARD_ID } = await import('../src/lib/monday/config')

  const boardId = MONDAY_MASTER_BOARD_ID
  console.log(`📋 Querying Monday board ${boardId} for groups...\n`)

  const query = /* GraphQL */ `
    query GetBoardGroups($boardId: [ID!]) {
      boards(ids: $boardId) {
        id
        name
        groups {
          id
          title
        }
      }
    }
  `

  try {
    const data = await mondayGraphQL<{
      boards: Array<{
        id: string
        name: string
        groups: Array<{
          id: string
          title: string
        }>
      }>
    }>(query, { boardId: [String(boardId)] })

    const board = data.boards[0]
    if (!board) {
      console.error(`✗ Board ${boardId} not found`)
      process.exit(1)
    }

    console.log(`✅ Board: ${board.name} (ID: ${board.id})\n`)
    console.log('📦 Available Groups:')
    console.log('─'.repeat(60))

    if (board.groups.length === 0) {
      console.log('   No groups found on this board.')
    } else {
      for (const group of board.groups) {
        console.log(`\n   Group ID: "${group.id}"`)
        console.log(`   Title:    "${group.title}"`)
        console.log(`   ─${'─'.repeat(58)}`)
      }
    }

    console.log('\n💡 To use these groups, update your .env.local:')
    console.log('   MONDAY_GROUP_MEDIATION_REFERRALS=<group_id_from_above>')
    console.log('   MONDAY_GROUP_RESTORATIVE_REFERRALS=<group_id_from_above>\n')
  } catch (error) {
    console.error('✗ Failed to query Monday board:')
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

listMondayGroups().catch((error) => {
  console.error('\n✗ Unexpected error')
  console.error(error)
  process.exit(1)
})

