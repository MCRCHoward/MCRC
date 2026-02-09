'use client'

import { UseFormReturn } from 'react-hook-form'
import {
  Search,
  Loader2,
  Check,
  AlertTriangle,
  ExternalLink,
  Link as LinkIcon,
  Plus,
  UserPlus,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

import type { PaperIntakeFormValues } from '@/lib/schemas/paper-intake-schema'
import type { DuplicateCheckResult, LeadSearchResult } from '@/types/paper-intake'

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

interface DuplicateCheckStepProps {
  form: UseFormReturn<PaperIntakeFormValues>
  p1State: DuplicateState
  p2State: DuplicateState
  onSearch: (participant: 1 | 2) => Promise<void>
  onAction: (
    participant: 1 | 2,
    action: 'create' | 'link',
    leadId?: number,
    leadUrl?: string
  ) => void
}

// =============================================================================
// Participant Search Card
// =============================================================================

interface ParticipantSearchCardProps {
  participant: 1 | 2
  name: string
  email: string
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  state: DuplicateState
  onSearch: () => void
  onAction: (action: 'create' | 'link', leadId?: number, leadUrl?: string) => void
  disabled?: boolean
}

function ParticipantSearchCard({
  participant,
  name,
  email,
  onNameChange,
  onEmailChange,
  state,
  onSearch,
  onAction,
  disabled,
}: ParticipantSearchCardProps) {
  const hasMatches = state.result?.hasPotentialDuplicates ?? false
  const isResolved = state.searched && (!hasMatches || state.action !== null)

  return (
    <Card className={cn(isResolved && 'border-green-200 bg-green-50/30')}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" aria-hidden="true" />
            Participant {participant}
            {participant === 1 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Required
              </Badge>
            )}
          </CardTitle>
          {isResolved && (
            <Badge variant="outline" className="border-green-500 text-green-700">
              <Check className="h-3 w-3 mr-1" aria-hidden="true" />
              {state.action === 'link' ? 'Linking to existing' : 'Creating new'}
            </Badge>
          )}
        </div>
        <CardDescription>
          Enter the participant&apos;s name to search for existing records in Insightly
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Name & Email Inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`p${participant}-name`}>
              Full Name {participant === 1 && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={`p${participant}-name`}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter full name"
              disabled={disabled}
              aria-required={participant === 1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`p${participant}-email`}>
              Email <span className="text-muted-foreground text-xs">(improves matching)</span>
            </Label>
            <Input
              id={`p${participant}-email`}
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="email@example.com"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Search Button */}
        <Button
          type="button"
          variant={state.searched ? 'outline' : 'default'}
          onClick={onSearch}
          disabled={!name?.trim() || state.searching || disabled}
          className="w-full sm:w-auto"
        >
          {state.searching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Searching...
            </>
          ) : state.searched ? (
            <>
              <Search className="mr-2 h-4 w-4" aria-hidden="true" />
              Search Again
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" aria-hidden="true" />
              Search for Duplicates
            </>
          )}
        </Button>

        {/* Search Results */}
        {state.searched && state.result && (
          <DuplicateResults
            result={state.result}
            selectedAction={state.action}
            linkedLeadId={state.linkedLeadId}
            onAction={onAction}
          />
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Duplicate Results Display
// =============================================================================

interface DuplicateResultsProps {
  result: DuplicateCheckResult
  selectedAction: 'create' | 'link' | null
  linkedLeadId?: number
  onAction: (action: 'create' | 'link', leadId?: number, leadUrl?: string) => void
}

function DuplicateResults({
  result,
  selectedAction,
  linkedLeadId,
  onAction,
}: DuplicateResultsProps) {
  if (!result.hasPotentialDuplicates) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <Check className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">No Duplicates Found</AlertTitle>
        <AlertDescription className="text-green-700">
          No existing leads match &quot;{result.searchedName}&quot;. A new Lead will be created in
          Insightly.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Potential Duplicates Found</AlertTitle>
        <AlertDescription className="text-amber-700">
          Found {result.matches.length} existing Lead{result.matches.length > 1 ? 's' : ''} that may
          match this participant. Please choose an action below.
        </AlertDescription>
      </Alert>

      {/* Match List */}
      <div className="space-y-2" role="list" aria-label="Potential duplicate leads">
        {result.matches.map((lead) => (
          <LeadMatchCard
            key={lead.leadId}
            lead={lead}
            isSelected={selectedAction === 'link' && linkedLeadId === lead.leadId}
            onSelect={() => onAction('link', lead.leadId, lead.leadUrl)}
          />
        ))}
      </div>

      {/* Create New Option */}
      <Button
        type="button"
        variant={selectedAction === 'create' ? 'default' : 'outline'}
        onClick={() => onAction('create')}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Create New Lead Anyway
      </Button>
    </div>
  )
}

// =============================================================================
// Lead Match Card
// =============================================================================

interface LeadMatchCardProps {
  lead: LeadSearchResult
  isSelected: boolean
  onSelect: () => void
}

function LeadMatchCard({ lead, isSelected, onSelect }: LeadMatchCardProps) {
  return (
    <div
      role="listitem"
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border transition-colors',
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border hover:border-muted-foreground/50'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{lead.fullName}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {lead.email && <span className="truncate">{lead.email}</span>}
          {lead.phone && <span>{lead.phone}</span>}
          <Badge variant="secondary" className="text-xs">
            {lead.leadStatus}
          </Badge>
        </div>
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {lead.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground"
        >
          <a
            href={lead.leadUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${lead.fullName} in Insightly (opens in new tab)`}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button
          type="button"
          variant={isSelected ? 'default' : 'secondary'}
          size="sm"
          onClick={onSelect}
          aria-pressed={isSelected}
        >
          <LinkIcon className="mr-1 h-4 w-4" aria-hidden="true" />
          {isSelected ? 'Linked' : 'Link'}
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Main Step Component
// =============================================================================

export function DuplicateCheckStep({
  form,
  p1State,
  p2State,
  onSearch,
  onAction,
}: DuplicateCheckStepProps) {
  const hasParticipant2 = form.watch('hasParticipant2')
  const p1Name = form.watch('participant1.name') || ''
  const p1Email = form.watch('participant1.email') || ''
  const p2Name = form.watch('participant2.name') || ''
  const p2Email = form.watch('participant2.email') || ''

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Alert>
        <Search className="h-4 w-4" />
        <AlertTitle>Before You Begin</AlertTitle>
        <AlertDescription>
          Search for each participant in Insightly to avoid creating duplicate records. You can
          either link to an existing Lead or create a new one.
        </AlertDescription>
      </Alert>

      {/* Participant 1 - Always Required */}
      <ParticipantSearchCard
        participant={1}
        name={p1Name}
        email={p1Email}
        onNameChange={(value) => form.setValue('participant1.name', value)}
        onEmailChange={(value) => form.setValue('participant1.email', value)}
        state={p1State}
        onSearch={() => onSearch(1)}
        onAction={(action, leadId, leadUrl) => onAction(1, action, leadId, leadUrl)}
      />

      {/* Participant 2 Toggle */}
      <div className="flex items-center space-x-3 py-2">
        <Checkbox
          id="hasParticipant2"
          checked={hasParticipant2}
          onCheckedChange={(checked) => form.setValue('hasParticipant2', checked === true)}
          aria-describedby="hasParticipant2-description"
        />
        <div>
          <Label htmlFor="hasParticipant2" className="cursor-pointer font-medium">
            This case has a second participant
          </Label>
          <p id="hasParticipant2-description" className="text-sm text-muted-foreground">
            Uncheck if this is a single-party case
          </p>
        </div>
      </div>

      {/* Participant 2 - Conditional */}
      {hasParticipant2 && (
        <ParticipantSearchCard
          participant={2}
          name={p2Name}
          email={p2Email}
          onNameChange={(value) => form.setValue('participant2.name', value)}
          onEmailChange={(value) => form.setValue('participant2.email', value)}
          state={p2State}
          onSearch={() => onSearch(2)}
          onAction={(action, leadId, leadUrl) => onAction(2, action, leadId, leadUrl)}
        />
      )}
    </div>
  )
}
