'use client'

import { useState, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Check, ChevronLeft, ChevronRight, Loader2, Search, FileText, Users, ClipboardCheck, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

import {
  paperIntakeFormSchema,
  FORM_STEPS,
  STEP_FIELDS,
  DEFAULT_FORM_VALUES,
  type PaperIntakeFormValues,
} from '@/lib/schemas/paper-intake-schema'
import {
  createPaperIntake,
  searchForDuplicates,
} from '@/lib/actions/paper-intake-actions'
import type { DuplicateCheckResult, PaperIntakeInput } from '@/types/paper-intake'

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

export function PaperIntakeForm({ userId, userName }: PaperIntakeFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const stepContentRef = useRef<HTMLDivElement>(null)

  // Step state
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Duplicate check state (separate from form)
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
  const form = useForm<PaperIntakeFormValues>({
    resolver: zodResolver(paperIntakeFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onTouched',
  })

  const totalSteps = FORM_STEPS.length
  const progress = ((currentStep + 1) / totalSteps) * 100
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

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
    // Step 0: Duplicate check validation
    if (currentStep === 0) {
      if (!canProceedFromDuplicateCheck()) {
        toast.error('Please complete the duplicate check for all participants')
        return
      }
      setCurrentStep(1)
      scrollToTop()
      return
    }

    // Other steps: Validate form fields
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
      // CRITICAL: Destructure hasParticipant2 out - it's UI-only, not part of PaperIntakeInput
      const { hasParticipant2, ...formData } = data

      // Build the input payload matching PaperIntakeInput type exactly
      const input: PaperIntakeInput = {
        ...formData,
        dataEntryBy: userId,
        dataEntryByName: userName,
        // Only include participant2 if enabled and has a name
        participant2: hasParticipant2 && formData.participant2?.name?.trim()
          ? formData.participant2
          : undefined,
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

      // Success feedback
      if (result.intake?.overallSyncStatus === 'success') {
        toast.success('Paper intake submitted and synced to Insightly!')
      } else if (result.intake?.overallSyncStatus === 'partial') {
        toast.warning('Submitted with partial sync — some items need retry')
      } else {
        toast.error('Submitted but sync failed — you can retry from history')
      }

      // Reset form for next entry
      form.reset(DEFAULT_FORM_VALUES)
      setCurrentStep(0)
      setP1Duplicate({ searched: false, searching: false, result: null, action: null })
      setP2Duplicate({ searched: false, searching: false, result: null, action: null })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        aria-busy={isSubmitting}
      >
        {/* Progress Section */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <Progress
              value={progress}
              className="h-2"
              aria-label={`Form progress: ${Math.round(progress)}%`}
            />
          </div>

          {/* Step Indicators */}
          <nav aria-label="Form steps" className="hidden sm:block">
            <ol className="flex items-center justify-between" role="list">
              {FORM_STEPS.map((step, index) => {
                const Icon = STEP_ICONS[index]!
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
                    {index < FORM_STEPS.length - 1 && (
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
              const Icon = STEP_ICONS[currentStep]!
              return (
                <>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{FORM_STEPS[currentStep]!.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {FORM_STEPS[currentStep]!.description}
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
          aria-label={`Step ${currentStep + 1}: ${FORM_STEPS[currentStep]!.title}`}
          tabIndex={-1}
        >
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
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
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

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {currentStep === 0 && !canProceedFromDuplicateCheck() && (
              <span className="text-amber-600">Complete duplicate check to continue</span>
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
              disabled={isSubmitting}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                  Submit to Insightly
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
          {isSubmitting && 'Submitting form, please wait...'}
        </div>
      </form>
    </Form>
  )
}
