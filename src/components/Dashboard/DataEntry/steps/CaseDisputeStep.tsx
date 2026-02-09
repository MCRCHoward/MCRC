'use client'

import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Scale } from 'lucide-react'

import { REFERRAL_SOURCES, DISPUTE_TYPES } from '@/types/paper-intake'
import type { PaperIntakeFormValues } from '@/lib/schemas/paper-intake-schema'

interface CaseDisputeStepProps {
  form: UseFormReturn<PaperIntakeFormValues>
}

export function CaseDisputeStep({ form }: CaseDisputeStepProps) {
  const isCourtOrdered = form.watch('isCourtOrdered')

  return (
    <div className="space-y-6">
      {/* Case Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" aria-hidden="true" />
            Case Information
          </CardTitle>
          <CardDescription>
            Enter the case details from the paper intake form header
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Case Number, Date, Intake Person - Row 1 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="caseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 2025FM1234"
                      {...field}
                      value={field.value ?? ''}
                      aria-describedby="caseNumber-desc"
                    />
                  </FormControl>
                  <FormDescription id="caseNumber-desc">
                    From paper form header
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="intakeDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Intake Date <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value}
                      aria-required="true"
                      aria-describedby="intakeDate-desc"
                    />
                  </FormControl>
                  <FormDescription id="intakeDate-desc">
                    Date on paper form
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="intakePerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intake Person</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Who conducted intake"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Referral Source */}
          <FormField
            control={form.control}
            name="referralSource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referral Source</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger aria-describedby="referralSource-desc">
                      <SelectValue placeholder="Select how they heard about us" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {REFERRAL_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription id="referralSource-desc">
                  Maps to Insightly Lead Source
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Court Ordered Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <FormField
              control={form.control}
              name="isCourtOrdered"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-describedby="isCourtOrdered-desc"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">Court Ordered</FormLabel>
                    <FormDescription id="isCourtOrdered-desc">
                      Check if this case was referred by a court
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {isCourtOrdered && (
              <FormField
                control={form.control}
                name="magistrateJudge"
                render={({ field }) => (
                  <FormItem className="ml-7">
                    <FormLabel>Magistrate/Judge Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter judge or magistrate name"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dispute Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5" aria-hidden="true" />
            Dispute Information
          </CardTitle>
          <CardDescription>
            Describe the nature and type of the dispute
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dispute Type */}
          <FormField
            control={form.control}
            name="disputeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type of Dispute</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger aria-describedby="disputeType-desc">
                      <SelectValue placeholder="Select the dispute category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DISPUTE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription id="disputeType-desc">
                  Maps to Insightly Mediation Case Type
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dispute Description */}
          <FormField
            control={form.control}
            name="disputeDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nature of Dispute <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the nature of the dispute as written on the paper form..."
                    className="min-h-[150px] resize-y"
                    {...field}
                    value={field.value ?? ''}
                    aria-required="true"
                    aria-describedby="disputeDescription-desc"
                  />
                </FormControl>
                <FormDescription id="disputeDescription-desc">
                  Copy the dispute description from the paper intake form
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}
