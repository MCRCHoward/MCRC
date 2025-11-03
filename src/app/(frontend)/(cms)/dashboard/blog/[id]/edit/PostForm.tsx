'use client'

import { useMemo, useState, useTransition } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
import { Checkbox } from '@/components/ui/checkbox'
import { FileInput } from '@/components/ui/file-inputs'
import { Editor } from '@/components/editor/editor'

type CategoryLike = { id: string | number; title?: string | null; slug?: string | null }
type PostSectionLike = { title?: string | null; contentHtml?: string | null }
type MediaLike = { url?: string | null } | string | number | null

type PostLike = {
  id?: string | number
  title?: string | null
  excerpt?: string | null
  // THE FIX: Added `| null` to match the auto-generated Post type from Payload
  categories?: Array<string | number | CategoryLike> | null
  sections?: PostSectionLike[]
  contentHtml?: string | null
  heroImage?: MediaLike
}

export type PostFormProps = {
  mode: 'new' | 'edit'
  post?: PostLike | null // ← no more `any`
  categories: CategoryLike[]
}

const SectionSchema = z.object({
  title: z.string().trim().optional(),
  content: z.string().optional(),
  imageFile: z.custom<File>().optional(),
})

const FormSchema = z.object({
  title: z.string().min(2, 'Please enter a title'),
  excerpt: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  heroImageFile: z.custom<File>().optional(),
  section1: SectionSchema.optional(),
  section2: SectionSchema.optional(),
  section3: SectionSchema.optional(),
  conclusion: z.string().optional(), // HTML string from TipTap
})

type FormValues = z.infer<typeof FormSchema>

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"']/g, '')
    .replace(/\W+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

export default function PostForm({ mode, post, categories }: PostFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const totalSteps = 5
  const [isPending] = useTransition() // 🔧 drop unused `startTransition`

  // 🔧 remove `(c: any)` — type the relation union you actually support
  type CategoryRel = string | number | CategoryLike
  const defaultCategoryIds: string[] = useMemo(() => {
    const arr: CategoryRel[] = (
      Array.isArray(post?.categories) ? post?.categories : []
    ) as CategoryRel[]

    return arr.map((c) => (typeof c === 'object' && c ? String(c.id) : String(c))).filter(Boolean)
  }, [post])

  const defaultValues: FormValues = {
    title: asString(post?.title),
    excerpt: asString(post?.excerpt),
    categoryIds: defaultCategoryIds,
    heroImageFile: undefined,
    section1: {
      title: asString(post?.sections?.[0]?.title),
      content: asString(post?.sections?.[0]?.contentHtml),
      imageFile: undefined,
    },
    section2: {
      title: asString(post?.sections?.[1]?.title),
      content: asString(post?.sections?.[1]?.contentHtml),
      imageFile: undefined,
    },
    section3: {
      title: asString(post?.sections?.[2]?.title),
      content: asString(post?.sections?.[2]?.contentHtml),
      imageFile: undefined,
    },
    conclusion: asString(post?.contentHtml),
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const title = form.watch('title')
  const slugPreview = title ? slugify(title) : ''

  const [submitting, setSubmitting] = useState(false)

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1)
      return
    }

    const fd = new FormData()
    fd.append(
      'data',
      JSON.stringify({
        title: values.title,
        excerpt: values.excerpt,
        categoryIds: values.categoryIds ?? [],
        sections: [
          values.section1?.title || values.section1?.content ? values.section1 : null,
          values.section2?.title || values.section2?.content ? values.section2 : null,
          values.section3?.title || values.section3?.content ? values.section3 : null,
        ].filter(Boolean),
        conclusion: values.conclusion,
      }),
    )

    if (values.heroImageFile instanceof File && values.heroImageFile.size > 0) {
      fd.append('heroImage', values.heroImageFile, values.heroImageFile.name)
    }
    if (values.section1?.imageFile instanceof File)
      fd.append('sectionImage-0', values.section1.imageFile)
    if (values.section2?.imageFile instanceof File)
      fd.append('sectionImage-1', values.section2.imageFile)
    if (values.section3?.imageFile instanceof File)
      fd.append('sectionImage-2', values.section3.imageFile)

    setSubmitting(true)
    try {
      const actions = await import('@/app/(frontend)/(cms)/dashboard/blog/firebase-actions')
      if (mode === 'new') {
        await actions.createPostFromForm(fd)
        toast.success('Post created')
      } else {
        await actions.updatePostFromForm(String(post?.id), fd)
        toast.success('Post updated')
      }
      router.push('/dashboard/blog')
    } catch (e: unknown) {
      // 🔧 no more `any`
      const message = e instanceof Error ? e.message : 'Something went wrong creating the post'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBack = () => setStep((s) => Math.max(0, s - 1))

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center justify-center">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center">
            <div
              className={cn(
                'w-4 h-4 rounded-full transition-all duration-300 ease-in-out',
                index <= step ? 'bg-primary' : 'bg-primary/30',
                index < step && 'bg-primary',
              )}
            />
            {index < totalSteps - 1 && (
              <div className={cn('w-8 h-0.5', index < step ? 'bg-primary' : 'bg-primary/30')} />
            )}
          </div>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{mode === 'new' ? 'New post' : 'Edit post'}</CardTitle>
          <CardDescription>Current step {step + 1}</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-y-4">
              {/* STEP 0 — BASICS */}
              {step === 0 && (
                <>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Blog Post Title"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URL preview: /blog/{slugPreview || 'your-title'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt</FormLabel>
                        <FormControl>
                          <Input placeholder="Summary of Blog Post" autoComplete="off" {...field} />
                        </FormControl>
                        <FormDescription />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Categories */}
                  <FormField
                    control={form.control}
                    name="categoryIds"
                    render={() => (
                      <FormItem>
                        <FormLabel>Categories</FormLabel>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {categories.map((cat) => {
                            const id = String(cat.id)
                            const checked = (form.getValues('categoryIds') ?? []).includes(id)
                            return (
                              <label
                                key={id}
                                className="flex cursor-pointer items-center gap-2 rounded-md border p-2"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    const curr = new Set(form.getValues('categoryIds') ?? [])
                                    if (v) curr.add(id)
                                    else curr.delete(id)
                                    form.setValue('categoryIds', Array.from(curr), {
                                      shouldDirty: true,
                                    })
                                  }}
                                />
                                <span className="text-sm">
                                  {cat.title || cat.slug || `Category ${id}`}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                        <FormDescription>Select one or more.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hero image (single file) */}
                  <FormField
                    control={form.control}
                    name="heroImageFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Image Upload</FormLabel>
                        <FormControl>
                          <FileInput
                            value={(field.value as File | null) ?? null}
                            onChange={(file) => field.onChange(file ?? undefined)}
                            accept="image/*"
                          />
                        </FormControl>
                        {post?.heroImage &&
                        typeof post.heroImage === 'object' &&
                        post.heroImage?.url ? (
                          <p className="text-xs text-muted-foreground">
                            Current: {post.heroImage.url}
                          </p>
                        ) : null}
                        <FormDescription />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* STEP 1 — SECTION 1 */}
              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="section1.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section 1 Title</FormLabel>
                        <FormControl>
                          <Input placeholder="First Section" autoComplete="off" {...field} />
                        </FormControl>
                        <FormDescription>
                          Shown in the left &quot;Sections&quot; navigation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="section1.content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section 1 Content</FormLabel>
                        <FormDescription>This is the body of the section</FormDescription>
                        <FormControl>
                          <Editor content={asString(field.value)} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="section1.imageFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>(Optional) Image for Section 1</FormLabel>
                        <FormControl>
                          <FileInput
                            value={(field.value as File | null) ?? null}
                            onChange={(file) => field.onChange(file ?? undefined)}
                            accept="image/*"
                          />
                        </FormControl>
                        <FormDescription />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* STEP 2 — SECTION 2 */}
              {step === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="section2.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section 2 Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Second Section" autoComplete="off" {...field} />
                        </FormControl>
                        <FormDescription>Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="section2.content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section 2 Content</FormLabel>
                        <FormControl>
                          <Editor content={asString(field.value)} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="section2.imageFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>(Optional) Image for Section 2</FormLabel>
                        <FormControl>
                          <FileInput
                            value={(field.value as File | null) ?? null}
                            onChange={(file) => field.onChange(file ?? undefined)}
                            accept="image/*"
                          />
                        </FormControl>
                        <FormDescription />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* STEP 3 — SECTION 3 */}
              {step === 3 && (
                <>
                  <FormField
                    control={form.control}
                    name="section3.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section 3 Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional section" autoComplete="off" {...field} />
                        </FormControl>
                        <FormDescription />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="section3.content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section 3 Content</FormLabel>
                        <FormControl>
                          <Editor content={asString(field.value)} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="section3.imageFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>(Optional) Image for Section 3</FormLabel>
                        <FormControl>
                          <FileInput
                            value={(field.value as File | null) ?? null}
                            onChange={(file) => field.onChange(file ?? undefined)}
                            accept="image/*"
                          />
                        </FormControl>
                        <FormDescription />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* STEP 4 — CONCLUSION */}
              {step === 4 && (
                <>
                  <FormField
                    control={form.control}
                    name="conclusion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conclusion</FormLabel>
                        <FormDescription>Optional, but helpful for readers.</FormDescription>
                        <FormControl>
                          <Editor content={asString(field.value)} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  className="font-medium"
                  size="sm"
                  onClick={handleBack}
                  disabled={step === 0 || isPending}
                  variant="secondary"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="font-medium"
                  disabled={submitting || isPending}
                >
                  {submitting
                    ? 'Loading...'
                    : step === totalSteps - 1
                      ? mode === 'new'
                        ? 'Create post'
                        : 'Save changes'
                      : 'Next'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
