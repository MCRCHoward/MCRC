'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { updateAccount } from './account-actions'
import { getRoleMetadata } from '@/lib/user-roles'
import type { User } from '@/types'

const accountFormSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(100, 'Name must be less than 100 characters.'),
  email: z.string().email('Invalid email address.').min(1, 'Email is required.'),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

interface AccountFormProps {
  user: User
}

export default function AccountForm({ user }: AccountFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
    },
  })

  const onSubmit = async (data: AccountFormValues) => {
    setIsSubmitting(true)
    try {
      await updateAccount(data)
      toast.success('Account updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Failed to update account:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update account. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleMetadata = getRoleMetadata(user.role)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Update your account information. You cannot change your role from this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Role (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="role">Current Role</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {roleMetadata.label}
                </Badge>
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {roleMetadata.description}
                </span>
              </div>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                Role changes must be made by an administrator.
              </p>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                {...form.register('name')}
                disabled={isSubmitting}
                className="dark:text-foreground"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                disabled={isSubmitting}
                className="dark:text-foreground"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Member Since (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="createdAt">Member Since</Label>
              <Input
                id="createdAt"
                type="text"
                value={new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                disabled
                className="dark:text-foreground"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

