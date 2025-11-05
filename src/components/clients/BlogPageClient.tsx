'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Slash, X } from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { ControllerRenderProps, useForm } from 'react-hook-form'
import Image from 'next/image'
import { z } from 'zod'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { CardPost } from '@/app/(frontend)/(default)/blog/page'
import Link from 'next/link'

type Category = { label: string; value: string }
type BreadcrumbItemType = { label: string; link: string }

interface BlogsResultProps {
  posts: Array<CardPost>
  categories: Array<Category>
}

interface BreadcrumbBlogProps {
  breadcrumb: Array<BreadcrumbItemType>
}

interface BlogPageClientProps {
  featured: CardPost | null
  posts: CardPost[]
  categories: Category[]
  breadcrumb: BreadcrumbItemType[]
}

const FilterFormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.length > 0, {
    message: 'At least one category should be selected.',
  }),
})

function ResourcesCard({ category, title, thumbnail, summary, link, cta }: CardPost) {
  return (
    <Link href={link} className="block h-full w-full">
      <Card className="size-full border py-0">
        <CardContent className="p-0">
          <div className="text-muted-foreground border-b p-2.5 text-sm font-medium leading-[1.2]">
            {category}
          </div>
          <AspectRatio ratio={1.520833333} className="overflow-hidden">
            <Image
              src={thumbnail}
              alt={title}
              className="block size-full object-cover object-center"
              width={500}
              height={500}
            />
          </AspectRatio>
          <div className="flex w-full flex-col gap-5 p-5">
            <h2 className="text-lg font-bold leading-none md:text-2xl">{title}</h2>
            {summary ? (
              <div className="w-full max-w-[20rem]">
                <p className="text-foreground text-sm font-medium leading-[1.4]">{summary}</p>
              </div>
            ) : null}
            <div>
              <Badge className="rounded-full">
                {cta}
                <ArrowRight />
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function FilterForm({
  categories,
  selectedCategories,
  onCategoryChange,
}: {
  categories: Array<Category>
  selectedCategories: string[]
  onCategoryChange: (selectedCategories: string[]) => void
}) {
  const form = useForm<z.infer<typeof FilterFormSchema>>({
    resolver: zodResolver(FilterFormSchema),
    defaultValues: {
      items: selectedCategories.length ? selectedCategories : [categories[0]?.value ?? 'all'],
    },
  })

  // keep RHF in sync with controlled selection
  useEffect(() => {
    form.setValue('items', selectedCategories)
  }, [selectedCategories, form])

  const handleCheckboxChange = useCallback(
    (
      checked: boolean | string,
      categoryValue: string,
      field: ControllerRenderProps<z.infer<typeof FilterFormSchema>, 'items'>,
    ) => {
      // --- SPECIAL CASE: clicking "All" selects only "all" ---
      if (categoryValue === 'all') {
        if (checked) {
          form.setValue('items', ['all'])
          onCategoryChange(['all'])
        } else {
          // If user unchecks "All" and nothing else is selected, keep "all" to satisfy the schema
          if (!field.value || field.value.length === 0 || field.value.every((v) => v === 'all')) {
            form.setValue('items', ['all'])
            onCategoryChange(['all'])
          }
        }
        return
      }

      // Normal categories
      let updated = checked
        ? [...field.value.filter((v) => v !== 'all'), categoryValue]
        : field.value.filter((v) => v !== categoryValue)

      // If everything is unchecked, fall back to "all"
      if (updated.length === 0) {
        updated = ['all']
      }

      // Avoid unnecessary updates
      if (JSON.stringify(field.value) !== JSON.stringify(updated)) {
        form.setValue('items', updated)
        onCategoryChange(updated)
      }
    },
    [form, onCategoryChange],
  )

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="items"
          render={({ field }) => (
            <FormItem className="flex w-full flex-wrap items-center gap-2.5">
              {categories.map((category) => {
                const isChecked = field.value?.includes(category.value)
                return (
                  <FormItem
                    key={category.value}
                    className="flex flex-row items-start space-x-3 space-y-0"
                  >
                    <FormControl>
                      <Label className="bg-muted flex cursor-pointer items-center gap-2.5 rounded-full px-2.5 py-1.5">
                        <div>{category.label}</div>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(checked, category.value, field)
                          }
                        />
                      </Label>
                    </FormControl>
                  </FormItem>
                )
              })}
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

function ResourcesResult({ posts, categories }: BlogsResultProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // helpers
  const validValues = useMemo(
    () => new Set(categories.map((c) => c.value.toLowerCase())),
    [categories],
  )

  const rawCat = searchParams.get('cat') // "accessibility,performance"
  const pageParam = Number(searchParams.get('page') || '1')

  const initialSelected = useMemo(() => {
    if (!rawCat || rawCat.trim() === '') return ['all']
    const list = rawCat
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .filter((v) => validValues.has(v))

    if (list.length === 0) return ['all']
    return list.includes('all') && list.length > 1 ? list.filter((v) => v !== 'all') : list
  }, [rawCat, validValues])

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSelected)

  // page state
  const [currentPage, setCurrentPage] = useState<number>(
    Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
  )
  const normalizedPage = Number(searchParams.get('page') || '1') || 1

  useEffect(() => {
    console.log('[BlogPageClient] categories:', categories)
    console.log('[BlogPageClient] posts (count):', posts.length)
    console.log('[BlogPageClient] initialSelected:', initialSelected)
    setSelectedCategories(initialSelected)
  }, [initialSelected, categories, posts.length])

  useEffect(() => {
    setCurrentPage(normalizedPage)
  }, [normalizedPage])

  // build URL
  const replaceUrl = useCallback(
    (page: number, cats: string[]) => {
      const sp = new URLSearchParams()
      sp.set('page', String(page))
      const onlyAll = cats.length === 1 && cats[0] === 'all'
      if (!onlyAll) sp.set('cat', cats.join(','))
      router.replace(`?${sp.toString()}`, { scroll: false })
    },
    [router],
  )

  // change filters
  const handleCategoryChange = useCallback(
    (selected: string[]) => {
      console.log('[BlogPageClient] handleCategoryChange → selected:', selected)
      setSelectedCategories(selected)
      setCurrentPage(1)
      replaceUrl(1, selected)
      requestAnimationFrame(() => {
        const grid = document.querySelector('[data-blog-grid]')
        grid?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    [replaceUrl],
  )

  // remove a single filter chip
  const handleRemoveFilter = (value: string) => {
    if (value === 'all') return // nothing to remove
    const next = selectedCategories.filter((v) => v !== value)
    handleCategoryChange(next.length ? next : ['all'])
  }

  // clear all -> just 'all'
  const handleClearFilters = () => {
    handleCategoryChange(['all'])
  }

  // Create a mapping from category label to value for filtering
  const categoryLabelToValue = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of categories) {
      // Map both label and normalized label to value (only if different)
      const normalizedLabel = c.label.toLowerCase().trim()
      m.set(c.label, c.value)
      // Only add normalized if it's different from the original label
      if (normalizedLabel !== c.label) {
        m.set(normalizedLabel, c.value)
      }
    }
    console.log('[BlogPageClient] categoryLabelToValue:', Array.from(m.entries()))
    return m
  }, [categories])

  // Filter posts
  const filteredPosts = useMemo(() => {
    const wantsAll = selectedCategories.includes('all')
    if (wantsAll) {
      console.log('[BlogPageClient] wantsAll=true → returning all posts:', posts.length)
      return posts
    }

    const selectedValues = new Set(selectedCategories.map((s) => s.toLowerCase().trim()))

    const result = posts.filter((p) => {
      if (!p.category) return false

      // Get the normalized category from the post
      const postCategoryNormalized = p.category.toLowerCase().trim()

      // Check if the post's category matches any selected category value
      // First, try to get the value from the label mapping
      const categoryValue =
        categoryLabelToValue.get(p.category) || categoryLabelToValue.get(postCategoryNormalized)

      if (categoryValue) {
        return selectedValues.has(categoryValue.toLowerCase().trim())
      }

      // Fallback: direct comparison (for backward compatibility)
      return selectedValues.has(postCategoryNormalized)
    })

    console.log('[BlogPageClient] filter debug:', {
      selectedCategories,
      selectedValues: Array.from(selectedValues),
      postsCount: posts.length,
      filteredCount: result.length,
      samplePostCategories: posts.slice(0, 5).map((p) => p.category),
    })

    return result
  }, [posts, selectedCategories, categoryLabelToValue])

  // Pagination
  const perPage = 6
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / perPage))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)

  const start = (safePage - 1) * perPage
  const pageItems = filteredPosts.slice(start, start + perPage)

  const goToPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages)
    setCurrentPage(next)
    replaceUrl(next, selectedCategories)
    requestAnimationFrame(() => {
      const grid = document.querySelector('[data-blog-grid]')
      grid?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  // map for labels
  const labelByValue = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of categories) m.set(c.value, c.label)
    return m
  }, [categories])

  const showClear =
    !(selectedCategories.length === 1 && selectedCategories[0] === 'all') &&
    selectedCategories.length > 0

  return (
    <div>
      {/* Filter controls */}
      <FilterForm
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryChange={handleCategoryChange}
      />

      {/* Active filter chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {selectedCategories.map((v) =>
          v === 'all' ? (
            <Badge key="all" className="rounded-full">
              All
            </Badge>
          ) : (
            <Button
              key={v}
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => handleRemoveFilter(v)}
            >
              {labelByValue.get(v) ?? v}
              <X className="ml-1 h-4 w-4" />
            </Button>
          ),
        )}

        {showClear && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={handleClearFilters}
            title="Clear all filters"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Results */}
      <div className="flex w-full flex-col gap-4 py-8">
        {pageItems.length > 0 ? (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3" data-blog-grid>
            {pageItems.map((post) => (
              <ResourcesCard key={post.link} {...post} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No posts match the selected categories.</p>
        )}

        {/* Pagination */}
        {filteredPosts.length > 0 && totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  aria-disabled={safePage === 1}
                  className={safePage === 1 ? 'pointer-events-none opacity-50' : undefined}
                  onClick={() => goToPage(safePage - 1)}
                />
              </PaginationItem>

              {pages.map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink isActive={p === safePage} onClick={() => goToPage(p)}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  aria-disabled={safePage === totalPages}
                  className={safePage === totalPages ? 'pointer-events-none opacity-50' : undefined}
                  onClick={() => goToPage(safePage + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  )
}

function BreadcrumbBlog({ breadcrumb }: BreadcrumbBlogProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumb.map((item, i) => {
          return (
            <Fragment key={`${item.label}`}>
              <BreadcrumbItem>
                <BreadcrumbLink href={item.link}>{item.label}</BreadcrumbLink>
              </BreadcrumbItem>
              {i < breadcrumb.length - 1 ? (
                <BreadcrumbSeparator>
                  <Slash />
                </BreadcrumbSeparator>
              ) : null}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

const EmailFormSchema = z
  .object({
    email: z.string().email({ message: 'Invalid email address' }),
  })
  .required({ email: true })

function EmailForm() {
  const form = useForm<z.infer<typeof EmailFormSchema>>({
    resolver: zodResolver(EmailFormSchema),
    defaultValues: { email: '' },
  })
  function onSubmit(values: z.infer<typeof EmailFormSchema>) {
    console.log(values)
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="w-full">
                  <div className="relative flex w-full flex-col gap-2 lg:block">
                    <Input
                      {...field}
                      type="email"
                      id="emailInput"
                      placeholder="What's your work email?"
                      className="bg-background h-fit py-4 pl-5 pr-5 lg:pr-[13.75rem]"
                    />
                    <div className="right-2.5 top-1/2 lg:absolute lg:-translate-y-1/2">
                      <Button type="submit" className="w-full rounded-full lg:w-fit">
                        See Company in action
                        <ArrowRight />
                      </Button>
                    </div>
                  </div>
                  <FormMessage className="py-1" />
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

export default function BlogPageClient({
  featured,
  posts,
  categories,
  breadcrumb,
}: BlogPageClientProps) {
  return (
    <section className="pb-32">
      <div className="bg-muted bg-[url('https://deifkwefumgah.cloudfront.net/shadcnblocks/block/patterns/dot-pattern-2.svg')] bg-[length:3.125rem_3.125rem] bg-repeat">
        <div className="container flex flex-col items-start justify-start gap-16 pt-32 pb-20 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col justify-between gap-12">
            <div className="flex w-full max-w-[36rem] flex-col gap-8">
              <BreadcrumbBlog breadcrumb={breadcrumb} />
              <div className="flex w-full flex-col gap-5">
                <h1 className="text-[2.5rem] font-semibold leading-[1.2] md:text-5xl lg:text-6xl">
                  Explore Reports
                </h1>
                <p className="text-foreground text-xl font-semibold leading-[1.4]">
                  The best Reports is one that captivates readers with engaging, well-researched
                  content presented in a clear and relatable way.
                </p>
              </div>
              <div className="max-w-[30rem]">
                <EmailForm />
              </div>
            </div>
          </div>

          <div className="w-full max-w-[27.5rem]">
            {featured ? <ResourcesCard {...featured} /> : null}
          </div>
        </div>
      </div>

      <div className="py-20">
        <div className="container flex flex-col gap-8">
          <h2 className="text-[1.75rem] font-medium leading-none md:text-[2.25rem] lg:text-[2rem]">
            All Reports
          </h2>
          <div>
            <ResourcesResult posts={posts} categories={categories} />
          </div>
        </div>
      </div>
    </section>
  )
}
