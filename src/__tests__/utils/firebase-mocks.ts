import { vi } from 'vitest'

/**
 * Creates a chainable Firestore query mock that tracks call args.
 *
 * Usage:
 *   const query = createMockQueryChain()
 *   query.mockGet.mockResolvedValue({ empty: true, docs: [], size: 0 })
 *   query.mockCountGet.mockResolvedValue(createMockCountResult(0))
 *   // ... wire into collection mock
 */
export function createMockQueryChain() {
  const mockGet = vi.fn()
  const mockLimit = vi.fn()
  const mockOrderBy = vi.fn()
  const mockWhere = vi.fn()
  const mockCount = vi.fn()
  const mockCountGet = vi.fn()

  // Each chain method returns the chain for fluent usage
  const chain = {
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    count: mockCount,
    get: mockGet,
  }

  mockWhere.mockReturnValue(chain)
  mockOrderBy.mockReturnValue(chain)
  mockLimit.mockReturnValue(chain)
  mockCount.mockReturnValue({
    get: mockCountGet,
  })

  return { chain, mockGet, mockWhere, mockOrderBy, mockLimit, mockCount, mockCountGet }
}

/**
 * Creates a mock Firestore document reference.
 */
export function createMockDocRef(
  data: Record<string, unknown> | undefined = undefined,
  exists = true,
) {
  const mockUpdate = vi.fn().mockResolvedValue(undefined)
  const mockDelete = vi.fn().mockResolvedValue(undefined)
  const mockGet = vi.fn().mockResolvedValue({
    exists,
    data: () => data,
    id: 'mock-doc-id',
  })

  return { get: mockGet, update: mockUpdate, delete: mockDelete, mockGet, mockUpdate }
}

/**
 * Creates a mock snapshot from an array of documents.
 */
export function createMockSnapshot(
  docs: Array<{ id: string; data: Record<string, unknown> }> = [],
) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: docs.map((doc) => ({
      id: doc.id,
      data: () => doc.data,
      exists: true,
    })),
  }
}

/**
 * Creates a mock result for Firestore count aggregation.
 */
export function createMockCountResult(count: number) {
  return {
    data: () => ({ count }),
  }
}

/**
 * Creates a mock Firestore `adminDb` with collection/doc routing.
 *
 * The returned object has helpers to set up per-query responses.
 * Tracks `add()` and `update()` calls for assertion.
 */
export function createMockAdminDb() {
  const addedDocs: Array<{ collection: string; data: Record<string, unknown> }> = []
  const mockAdd = vi.fn().mockImplementation((data: Record<string, unknown>) => {
    addedDocs.push({ collection: 'unknown', data })
    return Promise.resolve({ id: `mock-id-${addedDocs.length}` })
  })

  // Default query chain for collection-level queries
  const defaultQuery = createMockQueryChain()

  // Default doc ref for doc-level access
  const defaultDocRef = createMockDocRef(undefined, false)

  const mockCollection = vi.fn().mockReturnValue({
    ...defaultQuery.chain,
    add: mockAdd,
    doc: vi.fn().mockReturnValue(defaultDocRef),
  })

  const mockDoc = vi.fn().mockReturnValue(defaultDocRef)

  const db = {
    collection: mockCollection,
    doc: mockDoc,
  }

  return {
    db,
    mockCollection,
    mockDoc,
    mockAdd,
    defaultQuery,
    defaultDocRef,
    getAddedDocs: () => addedDocs,
    getLastAddedDoc: () => addedDocs[addedDocs.length - 1],
  }
}
