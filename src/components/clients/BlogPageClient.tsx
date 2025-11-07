'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Slash, X } from 'lucide-react'
import { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react'
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

// Constants
const POSTS_PER_PAGE = 6

/**
 * Memoized card component to prevent unnecessary re-renders
 */
const ResourcesCard = memo(function ResourcesCard({
  category,
  title,
  thumbnail,
  summary,
  link,
  cta,
}: CardPost) {
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
              loading="lazy"
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
})

ResourcesCard.displayName = 'ResourcesCard'

/**
 * Filter form component with optimized state management
 */
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

  // Sync form state with controlled selection (only when selection actually changes)
  useEffect(() => {
    const currentItems = form.getValues('items')
    const hasChanged =
      currentItems.length !== selectedCategories.length ||
      !currentItems.every((item, index) => item === selectedCategories[index])

    if (hasChanged) {
      form.setValue('items', selectedCategories, { shouldDirty: false })
    }
  }, [selectedCategories, form])

  const handleCheckboxChange = useCallback(
    (
      checked: boolean | string,
      categoryValue: string,
      field: ControllerRenderProps<z.infer<typeof FilterFormSchema>, 'items'>,
    ) => {
      // Special case: clicking "All" selects only "all"
      if (categoryValue === 'all') {
        if (checked) {
          onCategoryChange(['all'])
        } else {
          // If user unchecks "All" and nothing else is selected, keep "all"
          if (!field.value || field.value.length === 0 || field.value.every((v) => v === 'all')) {
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

      // Avoid unnecessary updates by comparing arrays properly
      const currentSet = new Set(field.value)
      const updatedSet = new Set(updated)
      if (
        currentSet.size !== updatedSet.size ||
        !Array.from(currentSet).every((item) => updatedSet.has(item))
      ) {
        onCategoryChange(updated)
      }
    },
    [onCategoryChange],
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

/**
 * Main results component with optimized filtering and pagination
 */
function ResourcesResult({ posts, categories }: BlogsResultProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Memoize category value set for efficient lookups
  const validValues = useMemo(
    () => new Set(categories.map((c) => c.value.toLowerCase())),
    [categories],
  )

  // Parse URL params once
  const urlParams = useMemo(() => {
    const rawCat = searchParams.get('cat') ?? ''
    const pageParam = Number.parseInt(searchParams.get('page') || '1', 10)
    return {
      rawCat: rawCat.trim(),
      page: Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
    }
  }, [searchParams])

  // Parse initial selected categories from URL
  const initialSelected = useMemo(() => {
    if (!urlParams.rawCat) return ['all']
    const list = urlParams.rawCat
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .filter((v) => validValues.has(v))

    if (list.length === 0) return ['all']
    return list.includes('all') && list.length > 1 ? list.filter((v) => v !== 'all') : list
  }, [urlParams.rawCat, validValues])

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSelected)
  const [currentPage, setCurrentPage] = useState<number>(urlParams.page)

  // Sync state with URL params (consolidated into single effect)
  useEffect(() => {
    setSelectedCategories(initialSelected)
    setCurrentPage(urlParams.page)
  }, [initialSelected, urlParams.page])

  // Optimized category mappings - computed once and reused
  const categoryMappings = useMemo(() => {
    const labelToValue = new Map<string, string>()
    const valueToLabel = new Map<string, string>()

    for (const c of categories) {
      const normalizedLabel = c.label.toLowerCase().trim()
      labelToValue.set(c.label, c.value)
      valueToLabel.set(c.value, c.label)
      // Only add normalized if different from original
      if (normalizedLabel !== c.label) {
        labelToValue.set(normalizedLabel, c.value)
      }
    }

    return { labelToValue, valueToLabel }
  }, [categories])

  // Optimized URL update function
  const replaceUrl = useCallback(
    (page: number, cats: string[]) => {
      const sp = new URLSearchParams()
      sp.set('page', String(page))
      const onlyAll = cats.length === 1 && cats[0] === 'all'
      if (!onlyAll) {
        sp.set('cat', cats.join(','))
      }
      router.replace(`?${sp.toString()}`, { scroll: false })
    },
    [router],
  )

  // Optimized category change handler
  const handleCategoryChange = useCallback(
    (selected: string[]) => {
      setSelectedCategories(selected)
      setCurrentPage(1)
      replaceUrl(1, selected)
      // Use setTimeout instead of requestAnimationFrame for better browser compatibility
      setTimeout(() => {
        const grid = document.querySelector('[data-blog-grid]')
        if (grid) {
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 0)
    },
    [replaceUrl],
  )

  const handleRemoveFilter = useCallback(
    (value: string) => {
      if (value === 'all') return
      const next = selectedCategories.filter((v) => v !== value)
      handleCategoryChange(next.length ? next : ['all'])
    },
    [selectedCategories, handleCategoryChange],
  )

  const handleClearFilters = useCallback(() => {
    handleCategoryChange(['all'])
  }, [handleCategoryChange])

  // Optimized filtering logic
  const filteredPosts = useMemo(() => {
    const wantsAll = selectedCategories.includes('all')
    if (wantsAll) {
      return posts
    }

    const selectedValues = new Set(
      selectedCategories.map((s) => s.toLowerCase().trim()).filter(Boolean),
    )

    return posts.filter((p) => {
      if (!p.category) return false

      const postCategoryNormalized = p.category.toLowerCase().trim()
      const categoryValue =
        categoryMappings.labelToValue.get(p.category) ||
        categoryMappings.labelToValue.get(postCategoryNormalized)

      if (categoryValue) {
        return selectedValues.has(categoryValue.toLowerCase().trim())
      }

      // Fallback: direct comparison
      return selectedValues.has(postCategoryNormalized)
    })
  }, [posts, selectedCategories, categoryMappings])

  // Pagination calculations
  const pagination = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE))
    const safePage = Math.min(Math.max(1, currentPage), totalPages)
    const start = (safePage - 1) * POSTS_PER_PAGE
    const pageItems = filteredPosts.slice(start, start + POSTS_PER_PAGE)
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

    return { totalPages, safePage, pageItems, pages }
  }, [filteredPosts, currentPage])

  const goToPage = useCallback(
    (p: number) => {
      const next = Math.min(Math.max(1, p), pagination.totalPages)
      setCurrentPage(next)
      replaceUrl(next, selectedCategories)
      setTimeout(() => {
        const grid = document.querySelector('[data-blog-grid]')
        if (grid) {
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 0)
    },
    [pagination.totalPages, replaceUrl, selectedCategories],
  )

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
              {categoryMappings.valueToLabel.get(v) ?? v}
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
        {pagination.pageItems.length > 0 ? (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3" data-blog-grid>
            {pagination.pageItems.map((post) => (
              <ResourcesCard key={post.link} {...post} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No posts match the selected categories.</p>
        )}

        {/* Pagination */}
        {filteredPosts.length > 0 && pagination.totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  aria-disabled={pagination.safePage === 1}
                  className={
                    pagination.safePage === 1 ? 'pointer-events-none opacity-50' : undefined
                  }
                  onClick={() => goToPage(pagination.safePage - 1)}
                />
              </PaginationItem>

              {pagination.pages.map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink isActive={p === pagination.safePage} onClick={() => goToPage(p)}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  aria-disabled={pagination.safePage === pagination.totalPages}
                  className={
                    pagination.safePage === pagination.totalPages
                      ? 'pointer-events-none opacity-50'
                      : undefined
                  }
                  onClick={() => goToPage(pagination.safePage + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  )
}

/**
 * Memoized breadcrumb component
 */
const BreadcrumbBlog = memo(function BreadcrumbBlog({ breadcrumb }: BreadcrumbBlogProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumb.map((item, i) => (
          <Fragment key={`${item.label}-${i}`}>
            <BreadcrumbItem>
              <BreadcrumbLink href={item.link}>{item.label}</BreadcrumbLink>
            </BreadcrumbItem>
            {i < breadcrumb.length - 1 ? (
              <BreadcrumbSeparator>
                <Slash />
              </BreadcrumbSeparator>
            ) : null}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
})

BreadcrumbBlog.displayName = 'BreadcrumbBlog'

const EmailFormSchema = z
  .object({
    email: z.string().email({ message: 'Invalid email address' }),
  })
  .required({ email: true })

/**
 * Email form component
 */
function EmailForm() {
  const form = useForm<z.infer<typeof EmailFormSchema>>({
    resolver: zodResolver(EmailFormSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = useCallback((values: z.infer<typeof EmailFormSchema>) => {
    // TODO: Implement email submission
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[EmailForm] Submission:', values)
    }
  }, [])

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

/**
 * Main blog page client component
 */

export default function BlogPageClient({
  featured,
  posts,
  categories,
  breadcrumb,
}: BlogPageClientProps) {
  console.log('BlogPageClient: posts', posts)
  return (
    <section className="pb-32">
      <div className="bg-muted bg-[url('https://deifkwefumgah.cloudfront.net/shadcnblocks/block/patterns/dot-pattern-2.svg')] bg-[length:3.125rem_3.125rem] bg-repeat">
        <div className="container flex flex-col items-start justify-start gap-16 pt-32 pb-20 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col justify-between gap-12">
            <div className="flex w-full max-w-[36rem] flex-col gap-8">
              <BreadcrumbBlog breadcrumb={breadcrumb} />
              <div className="flex w-full flex-col gap-5">
                <h1 className="text-[2.5rem] font-semibold leading-[1.2] md:text-5xl lg:text-6xl">
                  The MCRC Journal
                </h1>
                <p className="text-foreground text-xl font-semibold leading-[1.4]">
                  News, how-tos, and lived lessons that empower people to solve their own challenges
                  and build a more connected Howard County.
                </p>
              </div>
              <div className="max-w-[30rem]">{/* <EmailForm /> */}</div>
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
            All Posts & Guides
          </h2>
          <div>
            <ResourcesResult posts={posts} categories={categories} />
          </div>
        </div>
      </div>
    </section>
  )
}
