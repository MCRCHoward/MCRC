#!/usr/bin/env node

/**
 * Pre-flight check for Firebase Emulator dependencies.
 * Verifies Java 11+ is installed before attempting to start emulators.
 */

import { execSync } from 'node:child_process'

function getJavaVersion() {
  try {
    const output = execSync('java -version 2>&1', { encoding: 'utf-8' })
    const match = output.match(/version "(\d+)/)
    if (match) {
      return parseInt(match[1], 10)
    }
    // Older format: "1.8.0_xxx" → major version 8
    const legacyMatch = output.match(/version "1\.(\d+)/)
    if (legacyMatch) {
      return parseInt(legacyMatch[1], 10)
    }
    return null
  } catch {
    return null
  }
}

const javaVersion = getJavaVersion()

if (javaVersion === null) {
  console.error('\n  Firebase Emulator requires Java 11 or later.')
  console.error('  Java was not found on your system.\n')
  console.error('  Install Java:')
  console.error('    macOS:  brew install openjdk@17')
  console.error('    Ubuntu: sudo apt install openjdk-17-jre-headless')
  console.error('    Other:  https://adoptium.net/\n')
  process.exit(1)
}

if (javaVersion < 11) {
  console.error(`\n  Firebase Emulator requires Java 11+, found Java ${javaVersion}.\n`)
  console.error('  Upgrade Java:')
  console.error('    macOS:  brew install openjdk@17')
  console.error('    Ubuntu: sudo apt install openjdk-17-jre-headless')
  console.error('    Other:  https://adoptium.net/\n')
  process.exit(1)
}

console.log(`  Java ${javaVersion} detected — emulator dependencies OK.`)
