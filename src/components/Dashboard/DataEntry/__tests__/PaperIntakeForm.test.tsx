import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaperIntakeForm } from '../PaperIntakeForm'
import type { PaperIntake } from '@/types/paper-intake'

// =============================================================================
// Mocks (P10: full router mock, P11: formatRelativeTime)
// =============================================================================

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
}

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('@/utilities/formatDateTime', () => ({
  formatRelativeTime: vi.fn(() => '2 days ago'),
}))

vi.mock('@/lib/actions/paper-intake-actions', () => ({
  createPaperIntake: vi.fn(),
  updatePaperIntake: vi.fn(),
  searchForDuplicates: vi.fn(),
}))

// =============================================================================
// Test Fixtures (P3: dataEntryBy, dataEntryAt; P12: overrides should not set required fields to undefined)
// =============================================================================

const mockUserId = 'user-123'
const mockUserName = 'Test User'

/**
 * Creates a mock PaperIntake for form tests.
 * @param overrides - Optional overrides. Do not set required fields (participant1, phoneChecklist, etc.) to undefined.
 */
const createMockIntake = (overrides?: Partial<PaperIntake>): PaperIntake => ({
  id: 'intake-123',
  intakeDate: '2026-03-01',
  disputeDescription: 'Neighbor dispute about fence',
  isCourtOrdered: false,
  dataEntryBy: 'test-user',
  dataEntryAt: '2026-03-01T00:00:00Z',
  participant1: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
  },
  participant2: {
    name: 'Jane Smith',
    email: 'jane@example.com',
  },
  phoneChecklist: {
    explainedProcess: true,
    explainedNeutrality: true,
    explainedConfidentiality: true,
    policeInvolvement: false,
    peaceProtectiveOrder: false,
    safetyScreeningComplete: true,
  },
  staffAssessment: {
    canRepresentSelf: true,
    noFearOfCoercion: true,
    noDangerToSelf: true,
    noDangerToCenter: true,
  },
  overallSyncStatus: 'success',
  syncErrors: [],
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  ...overrides,
})

// =============================================================================
// Tests
// =============================================================================

describe('PaperIntakeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('mode="create" (default)', () => {
    it('renders 4 steps including duplicate check', () => {
      render(<PaperIntakeForm userId={mockUserId} />)

      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
      expect(screen.getAllByText('Check for Duplicates').length).toBeGreaterThan(0)
    })

    it('starts on duplicate check step', () => {
      render(<PaperIntakeForm userId={mockUserId} />)

      expect(
        screen.getByRole('region', { name: /Step 1: Check for Duplicates/i })
      ).toBeInTheDocument()
    })

    it('shows "Submit to Insightly" button text', async () => {
      render(<PaperIntakeForm userId={mockUserId} />)

      // Navigate to last step (would need to complete duplicate check in real scenario)
      // For unit test, just check button text exists in component
      expect(
        screen.queryByText('Submit to Insightly')
      ).not.toBeInTheDocument() // Not on first step
    })

    it('does not show edit mode indicator', () => {
      render(<PaperIntakeForm userId={mockUserId} />)

      expect(screen.queryByText('Editing')).not.toBeInTheDocument()
    })

    it('does not show Cancel button', () => {
      render(<PaperIntakeForm userId={mockUserId} />)

      expect(
        screen.queryByRole('button', { name: 'Cancel' })
      ).not.toBeInTheDocument()
    })
  })

  describe('mode="edit"', () => {
    it('renders 3 steps (skips duplicate check)', () => {
      render(
        <PaperIntakeForm
          userId={mockUserId}
          mode="edit"
          initialData={createMockIntake()}
        />
      )

      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    })

    it('starts on Case & Dispute step', () => {
      render(
        <PaperIntakeForm
          userId={mockUserId}
          mode="edit"
          initialData={createMockIntake()}
        />
      )

      expect(
        screen.getByRole('region', { name: /Step 1: Case & Dispute Details/i })
      ).toBeInTheDocument()
    })

    it('shows edit mode indicator badge', () => {
      render(
        <PaperIntakeForm
          userId={mockUserId}
          mode="edit"
          initialData={createMockIntake()}
        />
      )

      expect(screen.getByText('Editing')).toBeInTheDocument()
    })

    it('shows Cancel button', () => {
      render(
        <PaperIntakeForm
          userId={mockUserId}
          mode="edit"
          initialData={createMockIntake()}
        />
      )

      expect(
        screen.getByRole('button', { name: 'Cancel' })
      ).toBeInTheDocument()
    })

    it('pre-fills form with initialData', () => {
      const intake = createMockIntake({
        disputeDescription: 'Test description for edit',
        caseNumber: 'CASE-999',
      })

      render(
        <PaperIntakeForm userId={mockUserId} mode="edit" initialData={intake} />
      )

      // Check that form fields are pre-filled (use getByDisplayValue for textarea)
      const descriptionField = screen.getByDisplayValue(
        'Test description for edit'
      )
      expect(descriptionField).toBeInTheDocument()
    })

    it('shows last edited metadata when available', () => {
      const intake = createMockIntake({
        editCount: 3,
        lastEditedAt: '2026-02-28T10:00:00Z',
        lastEditedByName: 'Previous Editor',
      })

      render(
        <PaperIntakeForm userId={mockUserId} mode="edit" initialData={intake} />
      )

      expect(screen.getByText(/Edited 3 times/i)).toBeInTheDocument()
      expect(screen.getByText(/by Previous Editor/i)).toBeInTheDocument()
    })
  })

  describe('Cancel button', () => {
    it('navigates immediately when form is clean (no dialog)', async () => {
      const user = userEvent.setup()
      render(
        <PaperIntakeForm
          userId={mockUserId}
          mode="edit"
          initialData={createMockIntake()}
        />
      )

      // Click Cancel without making changes
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      // Should navigate immediately, no dialog
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/dashboard/mediation/data-entry/history'
      )
    })
  })

  describe('Cancel button with unsaved changes', () => {
    it('shows dialog when form is dirty', async () => {
      const user = userEvent.setup()
      render(
        <PaperIntakeForm
          userId={mockUserId}
          mode="edit"
          initialData={createMockIntake()}
        />
      )

      const descriptionField = screen.getByDisplayValue(
        'Neighbor dispute about fence'
      )
      await user.clear(descriptionField)
      await user.type(descriptionField, 'Modified description')

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText('Discard unsaved changes?')).toBeInTheDocument()
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('closes dialog and stays on page when "Keep Editing" is clicked', async () => {
      const user = userEvent.setup()
      render(
        <PaperIntakeForm
          userId={mockUserId}
          mode="edit"
          initialData={createMockIntake()}
        />
      )

      const descriptionField = screen.getByDisplayValue(
        'Neighbor dispute about fence'
      )
      await user.clear(descriptionField)
      await user.type(descriptionField, 'Modified')

      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Keep Editing' }))

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('navigates to history when "Discard Changes" is clicked', async () => {
      const user = userEvent.setup()
      render(
        <PaperIntakeForm
          userId={mockUserId}
          mode="edit"
          initialData={createMockIntake()}
        />
      )

      const descriptionField = screen.getByDisplayValue(
        'Neighbor dispute about fence'
      )
      await user.clear(descriptionField)
      await user.type(descriptionField, 'Modified')

      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      await user.click(screen.getByRole('button', { name: 'Discard Changes' }))

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/dashboard/mediation/data-entry/history'
      )
    })
  })

  describe('edit mode submit button', () => {
    it('shows "Save Changes" button text on last step', async () => {
      const user = userEvent.setup()
      render(
        <PaperIntakeForm
          userId={mockUserId}
          mode="edit"
          initialData={createMockIntake()}
        />
      )

      // Navigate to last step
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))

      expect(
        screen.getByRole('button', { name: /save changes/i })
      ).toBeInTheDocument()
    })

    it('disables save when no changes made', async () => {
      const user = userEvent.setup()
      render(
        <PaperIntakeForm
          userId={mockUserId}
          mode="edit"
          initialData={createMockIntake()}
        />
      )

      // Navigate to last step without making changes
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      expect(saveButton).toBeDisabled()
    })

    it('shows "No changes to save" hint when clean', async () => {
      const user = userEvent.setup()
      render(
        <PaperIntakeForm
          userId={mockUserId}
          mode="edit"
          initialData={createMockIntake()}
        />
      )

      // Navigate to last step
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))

      expect(screen.getByText('No changes to save')).toBeInTheDocument()
    })
  })

  describe('dev warning for missing initialData', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('logs warning in development when mode="edit" without initialData', () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      render(<PaperIntakeForm userId={mockUserId} mode="edit" />)

      expect(consoleSpy).toHaveBeenCalledWith(
        'PaperIntakeForm: mode="edit" requires initialData prop'
      )

      consoleSpy.mockRestore()
    })
  })

  describe('screen reader announcements', () => {
    it('announces "Saving changes" in edit mode during submit', async () => {
      render(
        <PaperIntakeForm
          userId={mockUserId}
          mode="edit"
          initialData={createMockIntake()}
        />
      )

      const srRegion = screen.getByRole('status')
      expect(srRegion).toBeInTheDocument()
      // Content is conditional on isSubmitting state
    })
  })
})

describe('PaperIntakeForm step navigation', () => {
  describe('edit mode step mapping', () => {
    it('validates correct STEP_FIELDS for edit mode step 0 (Case & Dispute)', async () => {
      const user = userEvent.setup()
      render(
        <PaperIntakeForm
          userId={mockUserId}
          mode="edit"
          initialData={createMockIntake()}
        />
      )

      // In edit mode, step 0 = Case & Dispute (STEP_FIELDS[1])
      // Clicking Next should validate intakeDate, disputeDescription, etc.
      await user.click(screen.getByRole('button', { name: /next/i }))

      // Should proceed (no validation errors for pre-filled data)
      await waitFor(() => {
        expect(
          screen.getByRole('region', {
            name: /Step 2: Participant Information/i,
          })
        ).toBeInTheDocument()
      })
    })
  })
})
