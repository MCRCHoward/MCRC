'use client'

import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { EditorState, SerializedEditorState } from 'lexical'

import { editorTheme } from '@/components/editor/themes/editor-theme'
import { TooltipProvider } from '@/components/ui/tooltip'

import { nodes } from './nodes'
import { Plugins } from './plugins'

const editorConfig: InitialConfigType = {
  namespace: 'Editor',
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error)
  },
}

// Plugin to extract HTML and call onHtmlChange
function HtmlChangePlugin({ onHtmlChange }: { onHtmlChange?: (html: string) => void }) {
  const [editor] = useLexicalComposerContext()

  return (
    <OnChangePlugin
      ignoreSelectionChange={true}
      onChange={() => {
        // Use setTimeout to ensure DOM is updated after Lexical renders
        setTimeout(() => {
          const rootElement = editor.getRootElement()
          if (rootElement && onHtmlChange) {
            // getRootElement() returns the contentEditable div with the actual content
            // We need to get the inner div that contains the rendered content
            const contentEditable = rootElement.querySelector('[contenteditable="true"]')
            const html = contentEditable
              ? (contentEditable as HTMLElement).innerHTML.trim()
              : rootElement.innerHTML.trim()
            // Log HTML value to console for debugging
            console.log('[Editor HTML]:', html)
            // Update form field with HTML content
            onHtmlChange(html)
          }
        }, 0)
      }}
    />
  )
}

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  onHtmlChange,
}: {
  editorState?: EditorState
  editorSerializedState?: SerializedEditorState
  onChange?: (editorState: EditorState) => void
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
  onHtmlChange?: (html: string) => void
}) {
  return (
    <div className="bg-background overflow-hidden rounded-lg border shadow">
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          ...(editorState ? { editorState } : {}),
          ...(editorSerializedState ? { editorState: JSON.stringify(editorSerializedState) } : {}),
        }}
      >
        <TooltipProvider>
          <Plugins />

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState) => {
              onChange?.(editorState)
              onSerializedChange?.(editorState.toJSON())
            }}
          />

          {onHtmlChange && <HtmlChangePlugin onHtmlChange={onHtmlChange} />}
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}
