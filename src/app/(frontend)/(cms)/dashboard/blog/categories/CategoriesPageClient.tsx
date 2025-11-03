'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createCategory, deleteCategory } from './firebase-actions'
import DeleteCategoryButton from '@/components/Dashboard/blog/categories/DeleteCategoryButton'
import type { Category } from '@/types'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoriesPageProps {
  categories: Category[]
}

export default function CategoriesPageClient({
  categories: initialCategories,
}: CategoriesPageProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState<Category[]>(initialCategories)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const onSubmit = async (data: CategoryFormValues) => {
    startTransition(async () => {
      try {
        const result = await createCategory({
          name: data.name,
          description: data.description,
        })

        if (result?.id) {
          toast.success('Category added successfully')
          form.reset()
          router.refresh()
          // Optimistically update the list
          setCategories([
            ...categories,
            {
              id: result.id,
              name: data.name,
              slug: data.name.toLowerCase().replace(/\s+/g, '-'),
              description: data.description,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ])
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add category'
        toast.error(message)
      }
    })
  }

  return (
    <section className="py-8 px-4">
      <div className="container max-w-7xl">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Add New Category Form */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="max-w-lg">
              <h2 className="text-primary text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Add New Category
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a new category to organize your blog posts.
              </p>

              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="e.g., Technology, Design, Business"
                    disabled={isPending}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Optional description for this category"
                    rows={3}
                    disabled={isPending}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Adding...' : 'Add Category'}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column - Categories List */}
          <div>
            <h2 className="text-primary text-4xl font-bold tracking-tight sm:text-4xl lg:text-4xl">
              Current <span className="text-muted-foreground">Categories</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {categories.length} {categories.length === 1 ? 'category' : 'categories'} total
            </p>

            <div className="mt-6 border-t border-gray-100 dark:border-white/5">
              {categories.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">No categories yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your first category using the form on the left.
                  </p>
                </div>
              ) : (
                <dl className="divide-y divide-gray-100 dark:divide-white/5">
                  {categories.map((category, index) => (
                    <div
                      key={category.id}
                      className={`px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-3 ${
                        index % 2 === 0
                          ? 'bg-gray-50 dark:bg-gray-800/25'
                          : 'bg-white dark:bg-gray-900'
                      }`}
                    >
                      <dt className="text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center justify-between">
                          <span>{category.name}</span>
                          <DeleteCategoryButton
                            action={deleteCategory.bind(null, category.id)}
                            name={category.name}
                          />
                        </div>
                        {category.slug && (
                          <div className="mt-1 text-xs text-muted-foreground">/{category.slug}</div>
                        )}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-400">
                        {category.description || (
                          <span className="italic text-muted-foreground">No description</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
