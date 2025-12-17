'use client'

import * as React from 'react'
import { EditorProvider, useCurrentEditor } from '@/components/ui/shadcn-io/editor'
import type { JSONContent } from '@/components/ui/shadcn-io/editor'
import StarterKit from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { Placeholder } from '@tiptap/extension-placeholder'
import { CharacterCount } from '@tiptap/extension-character-count'
import { useEditor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading2,
  Heading3,
} from 'lucide-react'
import { cn } from '@/utilities/ui'

interface EventDescriptionEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minLength?: number
  maxLength?: number
  className?: string
}

// Convert HTML string to Tiptap JSON
function htmlToJSON(html: string): JSONContent {
  if (!html) return { type: 'doc', content: [] }
  // Simple parser - in production, use a proper HTML parser
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: html ? [{ type: 'text', text: html }] : [],
      },
    ],
  }
}

// Convert Tiptap JSON to HTML string
function jsonToHTML(json: JSONContent): string {
  if (!json || !json.content) return ''
  // Simple converter - Tiptap handles this better
  return ''
}

export function EventDescriptionEditor({
  value,
  onChange,
  placeholder = 'Enter event description...',
  minLength = 50,
  maxLength = 5000,
  className,
}: EventDescriptionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
          '[&_p]:my-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2',
          '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2',
          '[&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6',
          '[&_a]:text-primary [&_a]:underline',
        ),
      },
    },
  })

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) {
    return <div className="h-[200px] animate-pulse bg-muted rounded-md" />
  }

  const characterCount = editor.storage.characterCount.characters()
  const isOverLimit = characterCount > maxLength
  const isUnderMin = characterCount < minLength

  return (
    <div className={cn('space-y-2', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border rounded-md bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={cn(editor.isActive('bold') && 'bg-background')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={cn(editor.isActive('italic') && 'bg-background')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(editor.isActive('heading', { level: 2 }) && 'bg-background')}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(editor.isActive('heading', { level: 3 }) && 'bg-background')}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(editor.isActive('bulletList') && 'bg-background')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(editor.isActive('orderedList') && 'bg-background')}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={cn(editor.isActive('link') && 'bg-background')}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="border rounded-md min-h-[200px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <EditorProvider editor={editor}>
          <div className="min-h-[200px]" />
        </EditorProvider>
      </div>

      {/* Character Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {isUnderMin && (
            <span className="text-destructive">
              Minimum {minLength} characters required ({characterCount}/{minLength})
            </span>
          )}
          {!isUnderMin && !isOverLimit && (
            <span>
              {characterCount} / {maxLength} characters
            </span>
          )}
          {isOverLimit && (
            <span className="text-destructive">
              Exceeds maximum length ({characterCount}/{maxLength})
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

