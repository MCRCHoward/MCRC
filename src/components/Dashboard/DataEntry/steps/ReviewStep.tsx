'use client'

import { UseFormReturn } from 'react-hook-form'
import {
  Check,
  AlertTriangle,
  Link as LinkIcon,
  Plus,
  ClipboardCheck,
  Shield,
  FileText,
  Users,
  Scale,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import type { PaperIntakeFormValues } from '@/lib/schemas/paper-intake-schema'
import type { DuplicateCheckResult } from '@/types/paper-intake'

interface DuplicateState {
  searched: boolean
  searching: boolean
  result: DuplicateCheckResult | null
  action: 'create' | 'link' | null
  linkedLeadId?: number
  linkedLeadUrl?: string
}

interface ReviewStepProps {
  form: UseFormReturn<PaperIntakeFormValues>
  p1Duplicate: DuplicateState
  p2Duplicate: DuplicateState
}

// =============================================================================
// Checklist Item Component
// =============================================================================

interface ChecklistItemProps {
  form: UseFormReturn<PaperIntakeFormValues>
  name: keyof PaperIntakeFormValues['phoneChecklist'] | keyof PaperIntakeFormValues['staffAssessment']
  label: string
  description?: string
  prefix: 'phoneChecklist' | 'staffAssessment'
  variant?: 'default' | 'warning'
}

function ChecklistItem({
  form,
  name,
  label,
  description,
  prefix,
  variant = 'default',
}: ChecklistItemProps) {
  const fieldName = `${prefix}.${name}` as const

  return (
    <FormField
      control={form.control}
      name={fieldName as any}
      render={({ field }) => (
        <FormItem
          className={cn(
            'flex flex-row items-start space-x-3 space-y-0 rounded-md p-3 transition-colors',
            field.value && variant === 'warning' && 'bg-amber-50 border border-amber-200',
            field.value && variant === 'default' && 'bg-green-50/50'
          )}
        >
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              className={cn(
                variant === 'warning' && field.value && 'border-amber-500 data-[state=checked]:bg-amber-500'
              )}
            />
          </FormControl>
          <div className="space-y-0.5 leading-none flex-1">
            <FormLabel className="cursor-pointer text-sm font-medium">{label}</FormLabel>
            {description && (
              <FormDescription className="text-xs">{description}</FormDescription>
            )}
          </div>
          {variant === 'warning' && field.value && (
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" aria-hidden="true" />
          )}
        </FormItem>
      )}
    />
  )
}

// =============================================================================
// Summary Section Component
// =============================================================================

interface SummarySectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

function SummarySection({ title, icon, children }: SummarySectionProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
        {icon}
        {title}
      </h4>
      <div className="pl-6 space-y-1 text-sm">{children}</div>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value?: string | boolean | null }) {
  if (value === undefined || value === null || value === '') {
    return (
      <div className="flex justify-between py-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/50">—</span>
      </div>
    )
  }

  if (typeof value === 'boolean') {
    return (
      <div className="flex justify-between py-1">
        <span className="text-muted-foreground">{label}</span>
        <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
          {value ? 'Yes' : 'No'}
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex justify-between py-1 gap-4">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  )
}

// =============================================================================
// Main Step Component
// =============================================================================

export function ReviewStep({ form, p1Duplicate, p2Duplicate }: ReviewStepProps) {
  const values = form.getValues()
  const hasParticipant2 = values.hasParticipant2 && values.participant2?.name

  // Check for safety concerns
  const hasSafetyConcerns =
    values.phoneChecklist.policeInvolvement ||
    values.phoneChecklist.peaceProtectiveOrder ||
    !values.staffAssessment.canRepresentSelf ||
    !values.staffAssessment.noFearOfCoercion ||
    !values.staffAssessment.noDangerToSelf ||
    !values.staffAssessment.noDangerToCenter

  return (
    <div className="space-y-6">
      {/* Phone Checklist Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            Phone Checklist
          </CardTitle>
          <CardDescription>
            Confirm the intake process was completed correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ChecklistItem
            form={form}
            prefix="phoneChecklist"
            name="explainedProcess"
            label="Explained mediation process"
            description="Including 2-hour sessions and free service"
          />
          <ChecklistItem
            form={form}
            prefix="phoneChecklist"
            name="explainedNeutrality"
            label="Explained neutrality of mediator"
            description="And possibility of an observer"
          />
          <ChecklistItem
            form={form}
            prefix="phoneChecklist"
            name="explainedConfidentiality"
            label="Explained confidentiality"
            description="And voluntary nature of mediation"
          />

          <Separator className="my-4" />

          <p className="text-sm font-medium text-muted-foreground mb-2">Safety Screening</p>

          <ChecklistItem
            form={form}
            prefix="phoneChecklist"
            name="policeInvolvement"
            label="Police involvement in this dispute"
            variant="warning"
          />
          <ChecklistItem
            form={form}
            prefix="phoneChecklist"
            name="peaceProtectiveOrder"
            label="Active peace/protective order"
            variant="warning"
          />
          <ChecklistItem
            form={form}
            prefix="phoneChecklist"
            name="safetyScreeningComplete"
            label="Safety screening completed"
            description="Asked about fear of harm after mediation"
          />
        </CardContent>
      </Card>

      {/* Staff Assessment Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" aria-hidden="true" />
            Staff Assessment
          </CardTitle>
          <CardDescription>
            Center staff&apos;s assessment of participant readiness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ChecklistItem
            form={form}
            prefix="staffAssessment"
            name="canRepresentSelf"
            label="Can represent their own needs and interests"
          />
          <ChecklistItem
            form={form}
            prefix="staffAssessment"
            name="noFearOfCoercion"
            label="Without fear of coercion or harm"
          />
          <ChecklistItem
            form={form}
            prefix="staffAssessment"
            name="noDangerToSelf"
            label="Without danger to themselves or others"
          />
          <ChecklistItem
            form={form}
            prefix="staffAssessment"
            name="noDangerToCenter"
            label="Without danger to the mediation center"
          />
        </CardContent>
      </Card>

      {/* Staff Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Staff Notes</CardTitle>
          <CardDescription>
            Any handwritten notes or additional context from the paper form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="staffNotes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Enter any additional notes from the paper form..."
                    className="min-h-[100px] resize-y"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Safety Alert */}
      {hasSafetyConcerns && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Safety Concerns Noted</AlertTitle>
          <AlertDescription className="text-amber-700">
            This case has safety-related flags. Please ensure appropriate protocols are followed.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Card */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Summary</CardTitle>
          <CardDescription>
            Review the information before submitting to Insightly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Case Info */}
          <SummarySection
            title="Case Information"
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
          >
            <SummaryItem label="Case Number" value={values.caseNumber} />
            <SummaryItem label="Intake Date" value={values.intakeDate} />
            <SummaryItem label="Referral Source" value={values.referralSource} />
            <SummaryItem label="Court Ordered" value={values.isCourtOrdered} />
            {values.isCourtOrdered && (
              <SummaryItem label="Judge/Magistrate" value={values.magistrateJudge} />
            )}
          </SummarySection>

          <Separator />

          {/* Dispute */}
          <SummarySection
            title="Dispute"
            icon={<Scale className="h-4 w-4" aria-hidden="true" />}
          >
            <SummaryItem label="Type" value={values.disputeType} />
            <div className="py-1">
              <span className="text-muted-foreground block mb-1">Description</span>
              <p className="text-sm bg-background rounded p-2 border">
                {values.disputeDescription || '—'}
              </p>
            </div>
          </SummarySection>

          <Separator />

          {/* Participants */}
          <SummarySection
            title="Participants"
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
          >
            <div className="space-y-4">
              {/* Participant 1 */}
              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{values.participant1.name}</span>
                  <Badge variant={p1Duplicate.action === 'link' ? 'secondary' : 'default'}>
                    {p1Duplicate.action === 'link' ? (
                      <>
                        <LinkIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                        Linking
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                        New Lead
                      </>
                    )}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  {values.participant1.email && <div>{values.participant1.email}</div>}
                  {values.participant1.phone && <div>{values.participant1.phone}</div>}
                </div>
              </div>

              {/* Participant 2 */}
              {hasParticipant2 && (
                <div className="p-3 bg-background rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{values.participant2!.name}</span>
                    <Badge variant={p2Duplicate.action === 'link' ? 'secondary' : 'default'}>
                      {p2Duplicate.action === 'link' ? (
                        <>
                          <LinkIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                          Linking
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                          New Lead
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    {values.participant2!.email && <div>{values.participant2!.email}</div>}
                    {values.participant2!.phone && <div>{values.participant2!.phone}</div>}
                  </div>
                </div>
              )}
            </div>
          </SummarySection>
        </CardContent>
      </Card>

      {/* Final Confirmation */}
      <Alert>
        <Check className="h-4 w-4" />
        <AlertTitle>Ready to Submit</AlertTitle>
        <AlertDescription>
          This will create {p1Duplicate.action === 'link' ? 'link to an existing Lead' : 'a new Lead'} for Participant 1
          {hasParticipant2 && (
            <>
              , {p2Duplicate.action === 'link' ? 'link to an existing Lead' : 'create a new Lead'} for Participant 2
            </>
          )}
          , and create a new Case (Opportunity) in Insightly with all participants linked.
        </AlertDescription>
      </Alert>
    </div>
  )
}
