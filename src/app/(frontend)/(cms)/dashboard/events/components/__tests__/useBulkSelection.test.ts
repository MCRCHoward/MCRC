// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBulkSelection, MAX_SELECTION } from '../useBulkSelection'

const createMockItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Item ${i + 1}`,
  }))

describe('useBulkSelection', () => {
  describe('initial state', () => {
    it('starts with empty selection', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      expect(result.current.selectedCount).toBe(0)
      expect(result.current.hasSelection).toBe(false)
      expect(result.current.isAllSelected).toBe(false)
      expect(result.current.isIndeterminate).toBe(false)
    })

    it('returns empty array for getSelectedItems', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      expect(result.current.getSelectedItems()).toEqual([])
    })
  })

  describe('toggle', () => {
    it('selects an item when toggled', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.toggle('item-1')
      })

      expect(result.current.isSelected('item-1')).toBe(true)
      expect(result.current.selectedCount).toBe(1)
      expect(result.current.hasSelection).toBe(true)
    })

    it('deselects an item when toggled again', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.toggle('item-1')
      })
      act(() => {
        result.current.toggle('item-1')
      })

      expect(result.current.isSelected('item-1')).toBe(false)
      expect(result.current.selectedCount).toBe(0)
    })

    it('can select multiple items', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.toggle('item-1')
        result.current.toggle('item-3')
        result.current.toggle('item-5')
      })

      expect(result.current.selectedCount).toBe(3)
      expect(result.current.isSelected('item-1')).toBe(true)
      expect(result.current.isSelected('item-2')).toBe(false)
      expect(result.current.isSelected('item-3')).toBe(true)
    })
  })

  describe('select and deselect', () => {
    it('select adds item to selection', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.select('item-1')
      })

      expect(result.current.isSelected('item-1')).toBe(true)
    })

    it('select does not duplicate item', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.select('item-1')
        result.current.select('item-1')
      })

      expect(result.current.selectedCount).toBe(1)
    })

    it('deselect removes item from selection', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.select('item-1')
        result.current.deselect('item-1')
      })

      expect(result.current.isSelected('item-1')).toBe(false)
    })
  })

  describe('selectAll and clearSelection', () => {
    it('selectAll selects all items', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.selectAll()
      })

      expect(result.current.selectedCount).toBe(5)
      expect(result.current.isAllSelected).toBe(true)
    })

    it('clearSelection removes all selections', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.selectAll()
        result.current.clearSelection()
      })

      expect(result.current.selectedCount).toBe(0)
      expect(result.current.hasSelection).toBe(false)
    })
  })

  describe('toggleAll', () => {
    it('selects all when none selected', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.toggleAll()
      })

      expect(result.current.isAllSelected).toBe(true)
    })

    it('clears all when all selected', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.selectAll()
      })
      act(() => {
        result.current.toggleAll()
      })

      expect(result.current.selectedCount).toBe(0)
    })

    it('selects all when some selected', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.toggle('item-1')
        result.current.toggle('item-2')
        result.current.toggleAll()
      })

      expect(result.current.isAllSelected).toBe(true)
    })
  })

  describe('isIndeterminate', () => {
    it('is false when none selected', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      expect(result.current.isIndeterminate).toBe(false)
    })

    it('is true when some selected', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.toggle('item-1')
      })

      expect(result.current.isIndeterminate).toBe(true)
    })

    it('is false when all selected', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.selectAll()
      })

      expect(result.current.isIndeterminate).toBe(false)
    })
  })

  describe('getSelectedItems', () => {
    it('returns selected item objects', () => {
      const items = createMockItems(5)
      const { result } = renderHook(() => useBulkSelection(items))

      act(() => {
        result.current.toggle('item-2')
        result.current.toggle('item-4')
      })

      const selected = result.current.getSelectedItems()
      expect(selected).toHaveLength(2)
      expect(selected.map((i) => i.id)).toContain('item-2')
      expect(selected.map((i) => i.id)).toContain('item-4')
    })
  })

  describe('max selection limit', () => {
    it('respects max selection limit', () => {
      const items = createMockItems(150)
      const { result } = renderHook(() =>
        useBulkSelection(items, { maxSelection: 10 }),
      )

      act(() => {
        for (let i = 1; i <= 15; i++) {
          result.current.toggle(`item-${i}`)
        }
      })

      expect(result.current.selectedCount).toBe(10)
      expect(result.current.isMaxReached).toBe(true)
    })

    it('selectAll respects max selection', () => {
      const items = createMockItems(150)
      const { result } = renderHook(() =>
        useBulkSelection(items, { maxSelection: 50 }),
      )

      act(() => {
        result.current.selectAll()
      })

      expect(result.current.selectedCount).toBe(50)
    })
  })

  describe('items change handling', () => {
    it('cleans up selection when items change', () => {
      const items1 = createMockItems(5)
      const { result, rerender } = renderHook(
        ({ items }) => useBulkSelection(items),
        { initialProps: { items: items1 } },
      )

      act(() => {
        result.current.toggle('item-1')
        result.current.toggle('item-2')
      })

      expect(result.current.selectedCount).toBe(2)

      const items2 = [
        { id: 'item-6', name: 'Item 6' },
        { id: 'item-7', name: 'Item 7' },
      ]
      rerender({ items: items2 })

      expect(result.current.selectedCount).toBe(0)
    })
  })

  describe('onSelectionChange callback', () => {
    it('calls callback when selection changes', () => {
      const items = createMockItems(5)
      const onSelectionChange = vi.fn()
      const { result } = renderHook(() =>
        useBulkSelection(items, { onSelectionChange }),
      )

      act(() => {
        result.current.toggle('item-1')
      })

      expect(onSelectionChange).toHaveBeenCalledTimes(1)
      expect(onSelectionChange).toHaveBeenCalledWith(expect.any(Set))
    })
  })

  describe('MAX_SELECTION constant', () => {
    it('exports MAX_SELECTION as 100', () => {
      expect(MAX_SELECTION).toBe(100)
    })
  })
})
