'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Check, ChevronLeft, ChevronRight, Loader2, Pencil, Search, FileText, Users, ClipboardCheck, type LucideIcon } from 'lucide-react'

import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import { cn } from '@/lib/utils'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatRelativeTime } from '@/utilities/formatDateTime'

import {
  paperIntakeFormSchema,
  FORM_STEPS,
  STEP_FIELDS,
  DEFAULT_FORM_VALUES,
  convertIntakeToFormValues,
  type PaperIntakeFormValues,
} from '@/lib/schemas/paper-intake-schema'
import {
  createPaperIntake,
  searchForDuplicates,
  updatePaperIntake,
} from '@/lib/actions/paper-intake-actions'
import type { DuplicateCheckResult, PaperIntake, PaperIntakeInput } from '@/types/paper-intake'

// Step Components
import { DuplicateCheckStep } from './steps/DuplicateCheckStep'
import { CaseDisputeStep } from './steps/CaseDisputeStep'
import { ParticipantsStep } from './steps/ParticipantsStep'
import { ReviewStep } from './steps/ReviewStep'

// =============================================================================
// Types
// =============================================================================

interface DuplicateState {
  searched: boolean
  searching: boolean
  result: DuplicateCheckResult | null
  action: 'create' | 'link' | null
  linkedLeadId?: number
  linkedLeadUrl?: string
}

interface PaperIntakeFormProps {
  userId: string
  userName?: string
  /** Form mode: 'create' for new intakes, 'edit' for modifying existing */
  mode?: 'create' | 'edit'
  /** Initial data for edit mode (required when mode='edit') */
  initialData?: PaperIntake
}

// Step icons for visual clarity
const STEP_ICONS: readonly [LucideIcon, LucideIcon, LucideIcon, LucideIcon] = [
  Search,
  FileText,
  Users,
  ClipboardCheck,
]

// =============================================================================
// Main Component
// =============================================================================

export function PaperIntakeForm({
  userId,
  userName,
  mode = 'create',
  initialData,
}: PaperIntakeFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const stepContentRef = useRef<HTMLDivElement>(null)

  // Edit mode configuration
  const isEditMode = mode === 'edit'
  const EDIT_STEPS = FORM_STEPS.slice(1)
  const EDIT_STEP_ICONS: readonly [LucideIcon, LucideIcon, LucideIcon] = [
    FileText,
    Users,
    ClipboardCheck,
  ]
  const activeSteps = isEditMode ? EDIT_STEPS : FORM_STEPS
  const activeStepIcons: readonly LucideIcon[] = isEditMode
    ? EDIT_STEP_ICONS
    : STEP_ICONS
  const totalSteps = activeSteps.length

  // Step state
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Duplicate check state (separate from form, not used in edit mode)
  const [p1Duplicate, setP1Duplicate] = useState<DuplicateState>({
    searched: false,
    searching: false,
    result: null,
    action: null,
  })
  const [p2Duplicate, setP2Duplicate] = useState<DuplicateState>({
    searched: false,
    searching: false,
    result: null,
    action: null,
  })

  // Form setup
  const defaultValues =
    isEditMode && initialData
      ? convertIntakeToFormValues(initialData)
      : DEFAULT_FORM_VALUES

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isEditMode && !initialData) {
      console.warn('PaperIntakeForm: mode="edit" requires initialData prop')
    }
  }, [isEditMode, initialData])

  const form = useForm<PaperIntakeFormValues>({
    resolver: zodResolver(paperIntakeFormSchema),
    defaultValues,
    mode: 'onTouched',
  })

  const progress = ((currentStep + 1) / totalSteps) * 100
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1
  const isDirty = form.formState.isDirty

  // Unsaved changes warning (browser close/refresh, back button, in-app navigation)
  const {
    showDialog: showCancelDialog,
    confirmNavigation,
    cancelNavigation,
    navigateWithCheck,
  } = useUnsavedChangesWarning({
    isDirty,
    enabled: isEditMode,
  })

  // ==========================================================================
  // Duplicate Check Handlers
  // ==========================================================================

  const handleDuplicateSearch = useCallback(
    async (participant: 1 | 2) => {
      const name =
        participant === 1
          ? form.getValues('participant1.name')
          : form.getValues('participant2.name')
      const email =
        participant === 1
          ? form.getValues('participant1.email')
          : form.getValues('participant2.email')

      if (!name?.trim()) {
        toast.error(`Please enter Participant ${participant}'s name first`)
        return
      }

      const setState = participant === 1 ? setP1Duplicate : setP2Duplicate
      setState((prev) => ({ ...prev, searching: true }))

      try {
        const result = await searchForDuplicates(name, email || undefined)

        if (!result.success) {
          throw new Error(result.error)
        }

        setState({
          searched: true,
          searching: false,
          result: result.result || null,
          action: result.result?.hasPotentialDuplicates ? null : 'create',
        })

        if (result.result?.hasPotentialDuplicates) {
          toast.warning(
            `Found ${result.result.matches.length} potential match${result.result.matches.length > 1 ? 'es' : ''}`
          )
        } else {
          toast.success('No duplicates found — a new Lead will be created')
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Search failed')
        setState((prev) => ({ ...prev, searching: false }))
      }
    },
    [form]
  )

  const handleDuplicateAction = useCallback(
    (
      participant: 1 | 2,
      action: 'create' | 'link',
      leadId?: number,
      leadUrl?: string
    ) => {
      const setState = participant === 1 ? setP1Duplicate : setP2Duplicate
      setState((prev) => ({
        ...prev,
        action,
        linkedLeadId: action === 'link' ? leadId : undefined,
        linkedLeadUrl: action === 'link' ? leadUrl : undefined,
      }))
    },
    []
  )

  // ==========================================================================
  // Navigation
  // ==========================================================================

  const canProceedFromDuplicateCheck = useCallback(() => {
    const p1Name = form.getValues('participant1.name')
    const hasP2 = form.getValues('hasParticipant2')
    const p2Name = form.getValues('participant2.name')

    // P1 must have name and be checked
    if (!p1Name?.trim()) return false
    if (!p1Duplicate.searched) return false
    if (p1Duplicate.result?.hasPotentialDuplicates && !p1Duplicate.action) return false

    // P2 check only if enabled and has name
    if (hasP2 && p2Name?.trim()) {
      if (!p2Duplicate.searched) return false
      if (p2Duplicate.result?.hasPotentialDuplicates && !p2Duplicate.action) return false
    }

    return true
  }, [form, p1Duplicate, p2Duplicate])

  const scrollToTop = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Focus the step content for screen readers
    setTimeout(() => {
      stepContentRef.current?.focus()
    }, 100)
  }

  const goNext = async () => {
    // Edit mode: No duplicate check step; map edit step index to STEP_FIELDS
    if (isEditMode) {
      const stepFieldIndex = currentStep + 1
      const fields = STEP_FIELDS[stepFieldIndex] ?? []
      if (fields.length > 0) {
        const isValid = await form.trigger(fields, { shouldFocus: true })
        if (!isValid) {
          toast.error('Please fix the errors before continuing')
          return
        }
      }
      setCurrentStep((s) => Math.min(totalSteps - 1, s + 1))
      scrollToTop()
      return
    }

    // Create mode: Step 0 is duplicate check validation
    if (currentStep === 0) {
      if (!canProceedFromDuplicateCheck()) {
        toast.error('Please complete the duplicate check for all participants')
        return
      }
      setCurrentStep(1)
      scrollToTop()
      return
    }

    // Create mode: Other steps validate form fields
    const fields = STEP_FIELDS[currentStep] ?? []
    if (fields.length > 0) {
      const isValid = await form.trigger(fields, { shouldFocus: true })
      if (!isValid) {
        toast.error('Please fix the errors before continuing')
        return
      }
    }

    setCurrentStep((s) => Math.min(totalSteps - 1, s + 1))
    scrollToTop()
  }

  const goBack = () => {
    setCurrentStep((s) => Math.max(0, s - 1))
    scrollToTop()
  }

  const goToStep = (step: number) => {
    // Only allow going back to completed steps
    if (step < currentStep) {
      setCurrentStep(step)
      scrollToTop()
    }
  }

  // ==========================================================================
  // Form Submission (CRITICAL FIXES APPLIED)
  // ==========================================================================

  const onSubmit = async (data: PaperIntakeFormValues) => {
    setIsSubmitting(true)

    try {
      const { hasParticipant2, ...formData } = data
      const participant2 =
        hasParticipant2 && formData.participant2?.name?.trim()
          ? formData.participant2
          : undefined

      if (isEditMode && initialData) {
        const input: Partial<PaperIntakeInput> = {
          ...formData,
          participant2,
        }
        const result = await updatePaperIntake(initialData.id, input)

        if (!result.success) {
          throw new Error(result.error)
        }

        if (result.intake?.overallSyncStatus === 'success') {
          toast.success('Changes saved and synced to Insightly!')
        } else if (result.intake?.overallSyncStatus === 'partial') {
          toast.warning('Saved with partial sync — some items need retry')
        } else {
          toast.error('Saved but sync failed — you can retry from history')
        }

        // Brief delay so user sees the success state
        await new Promise((resolve) => setTimeout(resolve, 500))
        router.push('/dashboard/mediation/data-entry/history')
      } else {
        const input: PaperIntakeInput = {
          ...formData,
          dataEntryBy: userId,
          dataEntryByName: userName,
          participant2,
        }
        const result = await createPaperIntake(input, {
          participant1LinkedLeadId:
            p1Duplicate.action === 'link' ? p1Duplicate.linkedLeadId : undefined,
          participant2LinkedLeadId:
            p2Duplicate.action === 'link' ? p2Duplicate.linkedLeadId : undefined,
        })

        if (!result.success) {
          throw new Error(result.error)
        }

        if (result.intake?.overallSyncStatus === 'success') {
          toast.success('Paper intake submitted and synced to Insightly!')
        } else if (result.intake?.overallSyncStatus === 'partial') {
          toast.warning('Submitted with partial sync — some items need retry')
        } else {
          toast.error('Submitted but sync failed — you can retry from history')
        }

        form.reset(DEFAULT_FORM_VALUES)
        setCurrentStep(0)
        setP1Duplicate({ searched: false, searching: false, result: null, action: null })
        setP2Duplicate({ searched: false, searching: false, result: null, action: null })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==========================================================================
  // Form Keyboard Handling
  // ==========================================================================

  const handleFormKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      // Allow Enter in textareas (for newlines)
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }

      // Prevent Enter from submitting the form
      // Only explicit clicks on the submit button should submit
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement
        const isSubmitButton =
          target.tagName === 'BUTTON' &&
          target.getAttribute('type') === 'submit'

        if (!isSubmitButton) {
          e.preventDefault()
        }
      }
    },
    [],
  )

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        onKeyDown={handleFormKeyDown}
        className="space-y-8"
        aria-busy={isSubmitting}
      >
        {/* Progress Section */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                {isEditMode && (
                  <Badge variant="secondary">
                    <Pencil className="h-3 w-3 mr-1" />
                    Editing
                  </Badge>
                )}
              </div>
              <span className="text-muted-foreground shrink-0">{Math.round(progress)}% complete</span>
            </div>
            <Progress
              value={progress}
              className="h-2"
              aria-label={`Form progress: ${Math.round(progress)}%`}
            />
            {isEditMode && initialData && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-2 mt-2">
                {initialData.editCount != null && initialData.editCount > 0 && (
                  <span>
                    Edited {initialData.editCount} time
                    {initialData.editCount !== 1 ? 's' : ''}
                  </span>
                )}
                {initialData.lastEditedAt && (
                  <span>Last edited {formatRelativeTime(initialData.lastEditedAt)}</span>
                )}
                {initialData.lastEditedByName && (
                  <span>by {initialData.lastEditedByName}</span>
                )}
              </div>
            )}
          </div>

          {/* Step Indicators */}
          <nav aria-label="Form steps" className="hidden sm:block">
            <ol className="flex items-center justify-between" role="list">
              {activeSteps.map((step, index) => {
                const Icon = activeStepIcons[index]!
                const isCompleted = index < currentStep
                const isCurrent = index === currentStep
                const isClickable = index < currentStep

                return (
                  <li key={step.id} className="flex items-center flex-1">
                    <button
                      type="button"
                      onClick={() => isClickable && goToStep(index)}
                      disabled={!isClickable}
                      className={cn(
                        'flex flex-col items-center gap-2 group transition-colors',
                        isClickable && 'cursor-pointer',
                        !isClickable && !isCurrent && 'cursor-not-allowed'
                      )}
                      aria-label={`${isCompleted ? 'Go back to ' : ''}Step ${index + 1}: ${step.title}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all',
                          isCompleted &&
                            'bg-primary text-primary-foreground border-primary group-hover:bg-primary/90',
                          isCurrent &&
                            'bg-primary text-primary-foreground border-primary ring-2 ring-primary/20 ring-offset-2',
                          !isCompleted &&
                            !isCurrent &&
                            'bg-muted border-muted-foreground/30 text-muted-foreground'
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium text-center max-w-[80px]',
                          isCurrent && 'text-primary',
                          isCompleted && 'text-primary',
                          !isCompleted && !isCurrent && 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </span>
                    </button>

                    {/* Connector Line */}
                    {index < activeSteps.length - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-0.5 mx-3 mt-[-24px]',
                          isCompleted ? 'bg-primary' : 'bg-muted'
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>

          {/* Mobile Step Indicator */}
          <div className="sm:hidden flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            {(() => {
              const Icon = activeStepIcons[currentStep]!
              return (
                <>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {activeSteps[currentStep]!.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeSteps[currentStep]!.description}
                    </p>
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        {/* Step Content */}
        <div
          ref={stepContentRef}
          className="min-h-[450px]"
          role="region"
          aria-label={`Step ${currentStep + 1}: ${activeSteps[currentStep]!.title}`}
          tabIndex={-1}
        >
          {isEditMode ? (
            <>
              {currentStep === 0 && <CaseDisputeStep form={form} />}
              {currentStep === 1 && <ParticipantsStep form={form} />}
              {currentStep === 2 && (
                <ReviewStep
                  form={form}
                  p1Duplicate={p1Duplicate}
                  p2Duplicate={p2Duplicate}
                  mode="edit"
                  initialHadP2={Boolean(initialData?.participant2?.name?.trim())}
                />
              )}
            </>
          ) : (
            <>
              {currentStep === 0 && (
                <DuplicateCheckStep
                  form={form}
                  p1State={p1Duplicate}
                  p2State={p2Duplicate}
                  onSearch={handleDuplicateSearch}
                  onAction={handleDuplicateAction}
                />
              )}
              {currentStep === 1 && <CaseDisputeStep form={form} />}
              {currentStep === 2 && <ParticipantsStep form={form} />}
              {currentStep === 3 && (
                <ReviewStep
                  form={form}
                  p1Duplicate={p1Duplicate}
                  p2Duplicate={p2Duplicate}
                  mode="create"
                />
              )}
            </>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            {isEditMode && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigateWithCheck('/dashboard/mediation/data-entry/history')}
                  disabled={isSubmitting}
                  className="mr-2"
                >
                  Cancel
                </Button>

                <AlertDialog
                  open={showCancelDialog}
                  onOpenChange={(open) => !open && cancelNavigation()}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Discard unsaved changes?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You have unsaved changes that will be lost. Are you
                        sure you want to leave this page?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={cancelNavigation}>
                        Keep Editing
                      </AlertDialogCancel>
                      <AlertDialogAction
                        type="button"
                        onClick={confirmNavigation}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Discard Changes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isFirstStep || isSubmitting}
              className="min-w-[100px]"
            >
              <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {!isEditMode &&
              currentStep === 0 &&
              !canProceedFromDuplicateCheck() && (
                <span className="text-amber-600">
                  Complete duplicate check to continue
                </span>
              )}
            {isEditMode && !isDirty && isLastStep && (
              <span className="text-muted-foreground">No changes to save</span>
            )}
          </div>

          {!isLastStep ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting || (isEditMode && !isDirty)}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  {isEditMode ? 'Saving...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                  {isEditMode ? 'Save Changes' : 'Submit to Insightly'}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Screen reader status announcements */}
        <div
          id="submit-status"
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {isSubmitting && (isEditMode ? 'Saving changes, please wait...' : 'Submitting form, please wait...')}
        </div>
      </form>
    </Form>
  )
}
