'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { RotateCcw, Trash2 } from 'lucide-react'
import { restorePost, permanentlyDeletePost } from '../firebase-actions'
import type { Post } from '@/types'

interface TrashPageClientProps {
  deletedPosts: Post[]
}

export function TrashPageClient({ deletedPosts }: TrashPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleRestore = (id: string, title: string) => {
    setRestoringId(id)
    startTransition(async () => {
      try {
        await restorePost(id)
        toast.success(`"${title}" has been restored`)
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to restore post'
        toast.error(message)
      } finally {
        setRestoringId(null)
      }
    })
  }

  const handlePermanentDelete = (id: string, title: string) => {
    setDeletingId(id)
    startTransition(async () => {
      try {
        await permanentlyDeletePost(id)
        toast.success(`"${title}" has been permanently deleted`)
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to permanently delete post'
        toast.error(message)
      } finally {
        setDeletingId(null)
      }
    })
  }

  if (deletedPosts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No deleted posts found.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Posts moved to trash will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3">
      {deletedPosts.map((post) => {
        const isRestoring = restoringId === post.id
        const isDeleting = deletingId === post.id
        const isProcessing = isRestoring || isDeleting || isPending

        return (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{post.title ?? '(untitled)'}</CardTitle>
                <Badge variant="secondary">Deleted</Badge>
              </div>
              <CardDescription>
                {post.slug ? `/${post.slug}` : 'No slug'} &middot; Deleted{' '}
                {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString() : 'recently'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleRestore(post.id, post.title || '(untitled)')}
                  disabled={isProcessing}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {isRestoring ? 'Restoring...' : 'Restore'}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isProcessing}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Permanently Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &quot;{post.title || '(untitled)'}&quot;. This
                        action cannot be undone. The post will be removed from Firestore and cannot
                        be recovered.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handlePermanentDelete(post.id, post.title || '(untitled)')}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
