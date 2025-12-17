'use client'

import * as React from 'react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/utilities/ui'

export interface FormStep {
  id: string
  title: string
  description?: string
  component: React.ReactNode
}

interface EventFormStepperProps {
  steps: FormStep[]
  currentStep: number
  onStepChange: (step: number) => void
  onNext: () => void | Promise<void>
  onBack: () => void
  onFinish: () => void | Promise<void>
  isSubmitting?: boolean
  canProceed?: boolean
  className?: string
}

export function EventFormStepper({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onBack,
  onFinish,
  isSubmitting = false,
  canProceed = true,
  className,
}: EventFormStepperProps) {
  const totalSteps = steps.length
  const progress = ((currentStep + 1) / totalSteps) * 100
  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0

  const handleNext = async () => {
    if (isLastStep) {
      await onFinish()
    } else {
      await onNext()
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isClickable = isCompleted || (index === currentStep + 1 && canProceed)

          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => {
                  if (isClickable && !isCurrent) {
                    onStepChange(index)
                  }
                }}
                disabled={!isClickable || isCurrent}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                  isCompleted &&
                    'bg-primary text-primary-foreground border-primary cursor-pointer hover:bg-primary/90',
                  isCurrent &&
                    'bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2',
                  !isCompleted &&
                    !isCurrent &&
                    'bg-background border-muted-foreground text-muted-foreground',
                  !isClickable && 'cursor-not-allowed opacity-50',
                )}
                aria-label={`Go to step ${index + 1}: ${step.title}`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>
              {index < steps.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-2', isCompleted ? 'bg-primary' : 'bg-muted')} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Title and Description */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{steps[currentStep]?.title || ''}</h3>
        {steps[currentStep]?.description && (
          <p className="text-sm text-muted-foreground">{steps[currentStep]?.description}</p>
        )}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">{steps[currentStep]?.component}</div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isFirstStep || isSubmitting}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="button" onClick={handleNext} disabled={!canProceed || isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="mr-2">Processing...</span>
            </>
          ) : isLastStep ? (
            'Create Event'
          ) : (
            <>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
