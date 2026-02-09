'use client'

import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

import {
  GENDER_OPTIONS,
  RACE_OPTIONS,
  AGE_RANGES,
  INCOME_RANGES,
  EDUCATION_LEVELS,
  MILITARY_STATUSES,
} from '@/types/paper-intake'
import type { PaperIntakeFormValues } from '@/lib/schemas/paper-intake-schema'

interface ParticipantsStepProps {
  form: UseFormReturn<PaperIntakeFormValues>
}

// =============================================================================
// Participant Form Fields
// =============================================================================

interface ParticipantFieldsProps {
  form: UseFormReturn<PaperIntakeFormValues>
  prefix: 'participant1' | 'participant2'
  participantNumber: 1 | 2
}

function ParticipantFields({ form, prefix, participantNumber }: ParticipantFieldsProps) {
  // Check if demographics has any values
  const demographics = form.watch(`${prefix}.demographics`)
  const demographicsCount = demographics 
    ? Object.values(demographics).filter(Boolean).length 
    : 0

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Contact Information
        </h4>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Phone */}
          <FormField
            control={form.control}
            name={`${prefix}.phone`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="(XXX) XXX-XXXX"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Home Phone */}
          <FormField
            control={form.control}
            name={`${prefix}.homePhone`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Home Phone</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="(XXX) XXX-XXXX"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name={`${prefix}.address.street`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="123 Main St"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-3 grid-cols-6">
            <FormField
              control={form.control}
              name={`${prefix}.address.city`}
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="City"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`${prefix}.address.state`}
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MD"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`${prefix}.address.zipCode`}
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="21043"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Joint Email Consent */}
        <FormField
          control={form.control}
          name={`${prefix}.canSendJointEmail`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-muted/30">
              <FormControl>
                <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-0.5 leading-none">
                <FormLabel className="cursor-pointer text-sm">
                  Can receive joint emails with other participant
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* Scheduling Preferences */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Scheduling & Legal
        </h4>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name={`${prefix}.attorney`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Attorney</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Attorney name (if any)"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`${prefix}.bestCallTime`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Best Time to Call</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Mornings"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name={`${prefix}.bestMeetTime`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Best Days/Times to Meet</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Weekday evenings, Saturday mornings"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Demographics Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="demographics" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 rounded-t-lg data-[state=open]:rounded-b-none">
            <div className="flex items-center gap-2">
              <span className="font-medium">Demographics</span>
              {demographicsCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {demographicsCount} field{demographicsCount !== 1 ? 's' : ''} entered
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <p className="text-sm text-muted-foreground mb-4">
              Optional demographic information for reporting purposes
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Gender */}
              <FormField
                control={form.control}
                name={`${prefix}.demographics.gender`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Race */}
              <FormField
                control={form.control}
                name={`${prefix}.demographics.race`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Race</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RACE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Age Range */}
              <FormField
                control={form.control}
                name={`${prefix}.demographics.ageRange`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age Range</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AGE_RANGES.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Household Income */}
              <FormField
                control={form.control}
                name={`${prefix}.demographics.income`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Household Income</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INCOME_RANGES.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Education */}
              <FormField
                control={form.control}
                name={`${prefix}.demographics.education`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Education Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EDUCATION_LEVELS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Military Status */}
              <FormField
                control={form.control}
                name={`${prefix}.demographics.militaryStatus`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Military Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MILITARY_STATUSES.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

// =============================================================================
// Main Step Component
// =============================================================================

export function ParticipantsStep({ form }: ParticipantsStepProps) {
  const hasParticipant2 = form.watch('hasParticipant2')
  const p1Name = form.watch('participant1.name') || 'Participant 1'
  const p2Name = form.watch('participant2.name') || 'Participant 2'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participant Details</CardTitle>
        <CardDescription>
          Enter contact information and optional demographics for each participant
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasParticipant2 ? (
          <Tabs defaultValue="participant1" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="participant1" className="gap-2">
                <span className="hidden sm:inline">Participant 1:</span>
                <span className="truncate max-w-[100px]">{p1Name}</span>
              </TabsTrigger>
              <TabsTrigger value="participant2" className="gap-2">
                <span className="hidden sm:inline">Participant 2:</span>
                <span className="truncate max-w-[100px]">{p2Name}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="participant1" className="mt-0">
              <ParticipantFields form={form} prefix="participant1" participantNumber={1} />
            </TabsContent>

            <TabsContent value="participant2" className="mt-0">
              <ParticipantFields form={form} prefix="participant2" participantNumber={2} />
            </TabsContent>
          </Tabs>
        ) : (
          // Single participant - no tabs needed
          <ParticipantFields form={form} prefix="participant1" participantNumber={1} />
        )}
      </CardContent>
    </Card>
  )
}
