'use client'

import { useState, useCallback, useMemo } from 'react'

export const MAX_SELECTION = 100

export interface UseBulkSelectionReturn<T extends { id: string }> {
  selectedIds: Set<string>
  selectedCount: number
  hasSelection: boolean
  isAllSelected: boolean
  isIndeterminate: boolean
  isSelected: (id: string) => boolean
  toggle: (id: string) => void
  select: (id: string) => void
  deselect: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  toggleAll: () => void
  getSelectedItems: () => T[]
  isMaxReached: boolean
}

export function useBulkSelection<T extends { id: string }>(
  items: T[],
  options: {
    maxSelection?: number
    onSelectionChange?: (selectedIds: Set<string>) => void
  } = {},
): UseBulkSelectionReturn<T> {
  const { maxSelection = MAX_SELECTION, onSelectionChange } = options

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const validIds = useMemo(() => new Set(items.map((item) => item.id)), [items])

  const effectiveSelectedIds = useMemo(() => {
    const cleaned = new Set<string>()
    selectedIds.forEach((id) => {
      if (validIds.has(id)) {
        cleaned.add(id)
      }
    })
    return cleaned
  }, [selectedIds, validIds])

  const selectedCount = effectiveSelectedIds.size
  const hasSelection = selectedCount > 0
  const isAllSelected = items.length > 0 && selectedCount === items.length
  const isIndeterminate = hasSelection && !isAllSelected
  const isMaxReached = selectedCount >= maxSelection

  const isSelected = useCallback(
    (id: string) => effectiveSelectedIds.has(id),
    [effectiveSelectedIds],
  )

  const updateSelection = useCallback(
    (updater: (prev: Set<string>) => Set<string>) => {
      setSelectedIds((prev) => {
        const next = updater(prev)
        onSelectionChange?.(next)
        return next
      })
    },
    [onSelectionChange],
  )

  const toggle = useCallback(
    (id: string) => {
      updateSelection((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else if (next.size < maxSelection) {
          next.add(id)
        }
        return next
      })
    },
    [maxSelection, updateSelection],
  )

  const select = useCallback(
    (id: string) => {
      updateSelection((prev) => {
        if (prev.has(id) || prev.size >= maxSelection) return prev
        const next = new Set(prev)
        next.add(id)
        return next
      })
    },
    [maxSelection, updateSelection],
  )

  const deselect = useCallback(
    (id: string) => {
      updateSelection((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    },
    [updateSelection],
  )

  const selectAll = useCallback(() => {
    updateSelection(() => {
      const next = new Set<string>()
      const itemsToSelect = items.slice(0, maxSelection)
      itemsToSelect.forEach((item) => next.add(item.id))
      return next
    })
  }, [items, maxSelection, updateSelection])

  const clearSelection = useCallback(() => {
    updateSelection(() => new Set())
  }, [updateSelection])

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      clearSelection()
    } else {
      selectAll()
    }
  }, [isAllSelected, clearSelection, selectAll])

  const getSelectedItems = useCallback(() => {
    return items.filter((item) => effectiveSelectedIds.has(item.id))
  }, [items, effectiveSelectedIds])

  return {
    selectedIds: effectiveSelectedIds,
    selectedCount,
    hasSelection,
    isAllSelected,
    isIndeterminate,
    isSelected,
    toggle,
    select,
    deselect,
    selectAll,
    clearSelection,
    toggleAll,
    getSelectedItems,
    isMaxReached,
  }
}
