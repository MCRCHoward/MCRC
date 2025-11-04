'use client'

import { useTransition, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import slugify from 'slugify'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Checkbox } from '@/components/ui/checkbox'
import { FileInput } from '@/components/ui/file-inputs'
import { BlogEditor } from './BlogEditor'
import { createPost } from '@/app/(frontend)/(cms)/dashboard/blog/firebase-actions'
import type { PostInput } from '@/types'

type CategoryLike = { id: string; name?: string | null; slug?: string | null }

const BlogFormSchema = z.object({
  // Hero Section
  title: z.string().min(1, 'Main header is required'),
  heroSubHeader: z.string().optional(),
  heroBriefSummary: z.string().max(150, 'Brief summary must be 150 characters or less'),
  heroImageFile: z.custom<File>().optional(),

  // Blog Post Outline
  categoryIds: z.array(z.string()).min(1, 'Please select at least one category'),
  featured: z.boolean(),

  // Main Content
  contentHtml: z.string().min(1, 'Blog content is required'),
})

type BlogFormValues = z.infer<typeof BlogFormSchema>

interface BlogFormProps {
  categories: CategoryLike[]
}

export default function BlogForm({ categories }: BlogFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(BlogFormSchema),
    defaultValues: {
      title: '',
      heroSubHeader: '',
      heroBriefSummary: '',
      heroImageFile: undefined,
      categoryIds: [],
      featured: false,
      contentHtml: '',
    },
    // Clear any validation errors on mount
    shouldUnregister: false,
  })

  // Clear any stale form errors for removed fields
  useEffect(() => {
    if (form.formState.errors.title) {
      form.clearErrors('title')
    }
  }, [form])

  const onSubmit = async (values: BlogFormValues) => {
    console.log('[BlogForm] onSubmit called with values:', values)
    console.log('[BlogForm] Form errors:', form.formState.errors)
    startTransition(async () => {
      try {
        // Compute derived fields
        const text = values.contentHtml
          .replace(/<[^>]+>/g, ' ') // strip HTML tags
          .replace(/&[^;]+;/g, ' ') // strip HTML entities
          .trim()
        const wordCount = text ? text.split(/\s+/).length : 0
        const readingTimeMinutes = Math.floor(wordCount / 200)

        const now = new Date()
        const monthNames = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ] as const
        const publishedDisplay = `${monthNames[now.getMonth()]} ${now.getFullYear()}`

        // Upload hero image if provided (via API route)
        let heroImageUrl: string | undefined = undefined
        if (values.heroImageFile) {
          try {
            const formData = new FormData()
            formData.append('file', values.heroImageFile)
            formData.append('alt', values.title ?? 'Uploaded image')
            formData.append('type', 'blog') // Organize blog images separately

            const res = await fetch('/api/media', {
              method: 'POST',
              body: formData,
            })

            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ error: 'Upload failed' }))
              console.error('Image upload failed:', errorData)
              toast.error(errorData.error || 'Failed to upload image. Please try again.')
              return // Stop form submission if upload fails
            }

            const uploaded = (await res.json()) as { id: string; url: string }
            heroImageUrl = uploaded.url
          } catch (uploadError) {
            console.error('Image upload failed:', uploadError)
            toast.error('Failed to upload image. Please try again.')
            return // Stop form submission if upload fails
          }
        }

        // Build post data with hero metadata
        const postData: PostInput = {
          slug: slugify(values.title, { lower: true, strict: true, trim: true }),
          excerpt: values.heroBriefSummary?.slice(0, 150) ?? '',
          authors: [], // TODO: Add authors from current user
          categories: values.categoryIds,
          contentHtml: values.contentHtml,
          heroImage: heroImageUrl,
          _status: 'published', // Start as published, user can change to draft later
          // Hero section metadata
          title: values.title,
          heroSubHeader: values.heroSubHeader,
          heroBriefSummary: values.heroBriefSummary,
          // Blog post outline metadata
          readingTime: String(readingTimeMinutes),
          publishedDateDisplay: publishedDisplay,
          featured: values.featured || false,
        }

        // Create the post
        const result = await createPost(postData)

        if (result?.id) {
          toast.success('Blog post created successfully!')
          router.push(`/dashboard/blog/${result.id}/edit`)
          router.refresh()
        }
      } catch (error) {
        console.error('Error creating blog post:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to create blog post')
      }
    })
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">New Blog Post</CardTitle>
          <CardDescription>
            Create a new blog post with hero section, outline, and rich content
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.error('[BlogForm] Validation errors:', errors)
                toast.error('Please fix the form errors before submitting')
              })}
              className="space-y-8"
            >
              {/* Hero Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Hero Section</h3>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Header Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter main header" {...field} />
                      </FormControl>
                      <FormDescription>
                        Large headline displayed in the hero section
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="heroSubHeader"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub Header</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter sub header (optional)" {...field} />
                      </FormControl>
                      <FormDescription>Smaller text above the main header</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="heroBriefSummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brief Post Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description (max 150 characters)"
                          maxLength={150}
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/150 characters - Displayed in hero overlay
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="heroImageFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hero Background Image</FormLabel>
                      <FormControl>
                        <FileInput
                          value={(field.value as File | null) ?? null}
                          onChange={(file) => field.onChange(file ?? undefined)}
                          accept="image/*"
                        />
                      </FormControl>
                      <FormDescription>
                        Background image for the hero section (recommended: 1920x1080)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Blog Post Outline */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold">Blog Post Outline</h3>

                {/* Reading time and published date are auto-derived on submit */}

                <FormField
                  control={form.control}
                  name="categoryIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Post Category</FormLabel>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {categories.map((cat) => {
                          const id = cat.id
                          const checked = (form.watch('categoryIds') ?? []).includes(id)
                          return (
                            <label
                              key={id}
                              className="flex cursor-pointer items-center gap-2 rounded-md border p-2"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  const curr = new Set(form.watch('categoryIds') ?? [])
                                  if (v) curr.add(id)
                                  else curr.delete(id)
                                  form.setValue('categoryIds', Array.from(curr), {
                                    shouldDirty: true,
                                  })
                                }}
                              />
                              <span className="text-sm">
                                {cat.name || cat.slug || `Category ${id}`}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                      <FormDescription>Select at least one category</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Featured Post</FormLabel>
                        <FormDescription>
                          Check this to feature this post on the blog listing page. Only one post
                          should be featured at a time.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Main Content */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold">Blog Content</h3>

                <FormField
                  control={form.control}
                  name="contentHtml"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <BlogEditor
                          content={field.value}
                          onChange={(html) => {
                            field.onChange(html)
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Write your blog post content using the rich text editor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 border-t pt-6">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1"
                  onClick={() => {
                    console.log('Blogform button was clicked')
                    console.log('Form state:', {
                      isValid: form.formState.isValid,
                      errors: form.formState.errors,
                      values: form.getValues(),
                    })
                  }}
                >
                  {isPending ? 'Creating...' : 'Create Blog Post'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
