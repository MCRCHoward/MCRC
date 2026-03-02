import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUnsavedChangesWarning } from '../useUnsavedChangesWarning'

// =============================================================================
// Mocks
// =============================================================================

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// =============================================================================
// Tests
// =============================================================================

describe('useUnsavedChangesWarning', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('navigateWithCheck', () => {
    it('navigates immediately when not dirty', () => {
      const { result } = renderHook(() =>
        useUnsavedChangesWarning({ isDirty: false, enabled: true }),
      )

      act(() => {
        result.current.navigateWithCheck('/history')
      })

      expect(mockPush).toHaveBeenCalledWith('/history')
      expect(result.current.showDialog).toBe(false)
    })

    it('navigates immediately when disabled', () => {
      const { result } = renderHook(() =>
        useUnsavedChangesWarning({ isDirty: true, enabled: false }),
      )

      act(() => {
        result.current.navigateWithCheck('/history')
      })

      expect(mockPush).toHaveBeenCalledWith('/history')
      expect(result.current.showDialog).toBe(false)
    })

    it('shows dialog when dirty and enabled', () => {
      const { result } = renderHook(() =>
        useUnsavedChangesWarning({ isDirty: true, enabled: true }),
      )

      act(() => {
        result.current.navigateWithCheck('/history')
      })

      expect(mockPush).not.toHaveBeenCalled()
      expect(result.current.showDialog).toBe(true)
    })
  })

  describe('confirmNavigation', () => {
    it('closes dialog and navigates to pending URL', () => {
      const { result } = renderHook(() =>
        useUnsavedChangesWarning({ isDirty: true, enabled: true }),
      )

      // Trigger dialog
      act(() => {
        result.current.navigateWithCheck('/history')
      })
      expect(result.current.showDialog).toBe(true)

      // Confirm navigation
      act(() => {
        result.current.confirmNavigation()
      })

      expect(result.current.showDialog).toBe(false)
      expect(mockPush).toHaveBeenCalledWith('/history')
    })
  })

  describe('cancelNavigation', () => {
    it('closes dialog without navigating', () => {
      const { result } = renderHook(() =>
        useUnsavedChangesWarning({ isDirty: true, enabled: true }),
      )

      // Trigger dialog
      act(() => {
        result.current.navigateWithCheck('/history')
      })

      // Cancel
      act(() => {
        result.current.cancelNavigation()
      })

      expect(result.current.showDialog).toBe(false)
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('beforeunload', () => {
    it('adds event listener when dirty and enabled', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')

      renderHook(() =>
        useUnsavedChangesWarning({ isDirty: true, enabled: true }),
      )

      const beforeUnloadCalls = addSpy.mock.calls.filter(
        ([event]) => event === 'beforeunload',
      )
      expect(beforeUnloadCalls.length).toBeGreaterThan(0)

      addSpy.mockRestore()
    })

    it('does not add listener when not dirty', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')

      renderHook(() =>
        useUnsavedChangesWarning({ isDirty: false, enabled: true }),
      )

      const beforeUnloadCalls = addSpy.mock.calls.filter(
        ([event]) => event === 'beforeunload',
      )
      expect(beforeUnloadCalls.length).toBe(0)

      addSpy.mockRestore()
    })

    it('does not add listener when disabled', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')

      renderHook(() =>
        useUnsavedChangesWarning({ isDirty: true, enabled: false }),
      )

      const beforeUnloadCalls = addSpy.mock.calls.filter(
        ([event]) => event === 'beforeunload',
      )
      expect(beforeUnloadCalls.length).toBe(0)

      addSpy.mockRestore()
    })
  })

  describe('popstate (browser back/forward)', () => {
    it('adds popstate listener and pushes guard state when dirty and enabled', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      const pushStateSpy = vi.spyOn(window.history, 'pushState')

      renderHook(() =>
        useUnsavedChangesWarning({ isDirty: true, enabled: true }),
      )

      expect(addSpy).toHaveBeenCalledWith('popstate', expect.any(Function))
      expect(pushStateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ __unsavedChangesGuard: true }),
        '',
        expect.any(String),
      )

      addSpy.mockRestore()
      pushStateSpy.mockRestore()
    })

    it('shows dialog when back button pressed while blocking', () => {
      const { result } = renderHook(() =>
        useUnsavedChangesWarning({ isDirty: true, enabled: true }),
      )

      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'))
      })

      expect(result.current.showDialog).toBe(true)
    })

    it('does not add listener when not blocking', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')

      renderHook(() =>
        useUnsavedChangesWarning({ isDirty: false, enabled: true }),
      )

      const popstateCalls = addSpy.mock.calls.filter(
        ([event]) => event === 'popstate',
      )
      expect(popstateCalls.length).toBe(0)

      addSpy.mockRestore()
    })
  })

  describe('state changes', () => {
    it('updates blocking when isDirty changes', () => {
      const { result, rerender } = renderHook(
        ({ isDirty }) => useUnsavedChangesWarning({ isDirty, enabled: true }),
        { initialProps: { isDirty: false } },
      )

      // Initially not dirty — should navigate immediately
      act(() => {
        result.current.navigateWithCheck('/test')
      })
      expect(mockPush).toHaveBeenCalledWith('/test')
      mockPush.mockClear()

      // Become dirty — should show dialog
      rerender({ isDirty: true })
      act(() => {
        result.current.navigateWithCheck('/test2')
      })
      expect(mockPush).not.toHaveBeenCalled()
      expect(result.current.showDialog).toBe(true)
    })
  })
})
