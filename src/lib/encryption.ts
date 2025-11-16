/**
 * Encryption Utilities
 *
 * Simple encryption/decryption helpers for storing sensitive data in Firestore.
 * Uses Node.js built-in crypto module with AES-256-GCM.
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

/**
 * Get encryption key from environment variable
 * Falls back to a default key in development (not secure for production)
 */
function getEncryptionKey(): string {
  const key = process.env.CALENDLY_ENCRYPTION_KEY

  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CALENDLY_ENCRYPTION_KEY is required in production. Generate with: openssl rand -base64 32',
      )
    }
    // Development fallback (not secure - only for local dev)
    console.warn(
      '[Encryption] Using default encryption key. Set CALENDLY_ENCRYPTION_KEY in production!',
    )
    return 'default-dev-key-not-secure-change-in-production-32chars!!'
  }

  if (key.length < 32) {
    throw new Error('CALENDLY_ENCRYPTION_KEY must be at least 32 characters')
  }

  return key
}

/**
 * Derive a key from the encryption key using scrypt
 */
async function deriveKey(salt: Buffer): Promise<Buffer> {
  const key = getEncryptionKey()
  return (await scryptAsync(key, salt, 32)) as Buffer
}

/**
 * Encrypt a string value
 *
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: salt:iv:encrypted:authTag
 */
export async function encrypt(text: string): Promise<string> {
  try {
    const salt = randomBytes(16)
    const iv = randomBytes(16)
    const key = await deriveKey(salt)

    const cipher = createCipheriv('aes-256-gcm', key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Format: salt:iv:encrypted:authTag (all hex encoded)
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`
  } catch (error) {
    console.error('[Encryption] Failed to encrypt:', error)
    throw new Error('Encryption failed')
  }
}

/**
 * Decrypt an encrypted string
 *
 * @param encryptedText - Encrypted string in format: salt:iv:encrypted:authTag
 * @returns Decrypted plain text
 */
export async function decrypt(encryptedText: string): Promise<string> {
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted format')
    }

    const [saltHex, ivHex, encrypted, authTagHex] = parts
    
    // Validate all parts exist (TypeScript safety check)
    if (!saltHex || !ivHex || !encrypted || !authTagHex) {
      throw new Error('Invalid encrypted format: missing components')
    }
    
    const salt = Buffer.from(saltHex, 'hex')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const key = await deriveKey(salt)

    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('[Encryption] Failed to decrypt:', error)
    throw new Error('Decryption failed')
  }
}

/**
 * Check if a string appears to be encrypted
 * (Simple heuristic - checks for the expected format)
 */
export function isEncrypted(text: string): boolean {
  const parts = text.split(':')
  return parts.length === 4 && parts.every((part) => /^[0-9a-f]+$/i.test(part))
}

