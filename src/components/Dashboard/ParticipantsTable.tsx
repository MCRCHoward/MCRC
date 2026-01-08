'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Participant, ParticipantInput } from '@/types/participant'
import {
  createParticipant,
  updateParticipant,
  deleteParticipant,
} from '@/app/(frontend)/(cms)/dashboard/users/participants/participant-actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDateTimeShort } from '@/utilities/formatDateTime'

const participantFormSchema = z.object({
  age: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === '') return true
        const num = parseInt(val, 10)
        return !isNaN(num) && num >= 0 && num <= 150
      },
      { message: 'Age must be a number between 0 and 150' },
    ),
  gender: z.string().trim().max(100).optional().or(z.literal('')),
  race: z.string().trim().max(100).optional().or(z.literal('')),
  income: z.string().trim().max(100).optional().or(z.literal('')),
  education: z.string().trim().max(200).optional().or(z.literal('')),
  militaryStatus: z.string().trim().max(100).optional().or(z.literal('')),
  notes: z.string().trim().max(5000).optional().or(z.literal('')),
})

type ParticipantFormValues = z.infer<typeof participantFormSchema>

interface ParticipantsTableProps {
  participants: Participant[]
}

export default function ParticipantsTable({ participants }: ParticipantsTableProps) {
  const router = useRouter()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<ParticipantFormValues>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      age: '',
      gender: '',
      race: '',
      income: '',
      education: '',
      militaryStatus: '',
      notes: '',
    },
  })

  const handleOpenAddDialog = () => {
    form.reset()
    setIsAddDialogOpen(true)
  }

  const handleOpenEditDialog = (participant: Participant) => {
    form.reset({
      age: participant.age?.toString() ?? '',
      gender: participant.gender ?? '',
      race: participant.race ?? '',
      income: participant.income ?? '',
      education: participant.education ?? '',
      militaryStatus: participant.militaryStatus ?? '',
      notes: participant.notes ?? '',
    })
    setEditingParticipant(participant)
  }

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false)
    setEditingParticipant(null)
    form.reset()
  }

  const onSubmit = async (values: ParticipantFormValues) => {
    setIsSubmitting(true)
    try {
      const input: ParticipantInput = {
        age:
          values.age && values.age !== ''
            ? (() => {
                const num = parseInt(values.age, 10)
                return isNaN(num) ? undefined : num
              })()
            : undefined,
        gender: values.gender || undefined,
        race: values.race || undefined,
        income: values.income || undefined,
        education: values.education || undefined,
        militaryStatus: values.militaryStatus || undefined,
        notes: values.notes || undefined,
      }

      if (editingParticipant) {
        await updateParticipant(editingParticipant.id, input)
        toast.success('Participant updated successfully')
      } else {
        await createParticipant(input)
        toast.success('Participant created successfully')
      }

      handleCloseDialog()
      router.refresh()
    } catch (error) {
      console.error('Failed to save participant:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save participant. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingParticipant) return

    setIsDeleting(true)
    try {
      await deleteParticipant(deletingParticipant.id)
      toast.success('Participant deleted successfully')
      setDeletingParticipant(null)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete participant:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete participant. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatValue = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return '—'
    return String(value)
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Participants</h2>
          <p className="text-sm text-muted-foreground">
            Manage participant demographic data collected from forms
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Participant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Participant</DialogTitle>
              <DialogDescription>
                Enter demographic information for a new participant.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 35"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Male, Female, Non-binary" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="race"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Race</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., White, Black, Asian" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Income</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., $25,000-$50,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Bachelor's degree" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="militaryStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Military Status</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              <SelectItem value="Active Duty">Active Duty</SelectItem>
                              <SelectItem value="Veteran">Veteran</SelectItem>
                              <SelectItem value="Reserve">Reserve</SelectItem>
                              <SelectItem value="National Guard">National Guard</SelectItem>
                              <SelectItem value="None">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this participant..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optional notes for internal use</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingParticipant ? 'Update' : 'Create'} Participant
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {participants.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No participants found.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Click "Add Participant" to create your first participant record.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Race</TableHead>
                <TableHead>Income</TableHead>
                <TableHead>Education</TableHead>
                <TableHead>Military Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>{formatValue(participant.age)}</TableCell>
                  <TableCell>{formatValue(participant.gender)}</TableCell>
                  <TableCell>{formatValue(participant.race)}</TableCell>
                  <TableCell>{formatValue(participant.income)}</TableCell>
                  <TableCell>{formatValue(participant.education)}</TableCell>
                  <TableCell>{formatValue(participant.militaryStatus)}</TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTimeShort(participant.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTimeShort(participant.updatedAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditDialog(participant)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingParticipant(participant)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      {editingParticipant && (
        <Dialog open={!!editingParticipant} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Participant</DialogTitle>
              <DialogDescription>
                Update demographic information for this participant.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 35"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Male, Female, Non-binary" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="race"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Race</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., White, Black, Asian" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Income</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., $25,000-$50,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Bachelor's degree" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="militaryStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Military Status</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              <SelectItem value="Active Duty">Active Duty</SelectItem>
                              <SelectItem value="Veteran">Veteran</SelectItem>
                              <SelectItem value="Reserve">Reserve</SelectItem>
                              <SelectItem value="National Guard">National Guard</SelectItem>
                              <SelectItem value="None">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this participant..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optional notes for internal use</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Participant
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingParticipant}
        onOpenChange={(open) => !open && setDeletingParticipant(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the participant record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
