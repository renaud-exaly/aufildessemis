'use client'

import Link from '@tiptap/extension-link'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { useEffect, useState } from 'react'

type Props = {
  name: string
  defaultValue?: string
  placeholder?: string
  minHeight?: number
}

// Éditeur Tiptap léger. Toolbar minimale + shortcuts markdown actifs
// (StarterKit fournit déjà **bold**, *italic*, `>`, `1.`, `-`, etc).
// Sortie : markdown brut stocké dans un <input type="hidden">.
export function MarkdownEditor({
  name,
  defaultValue = '',
  placeholder = 'Écris quelque chose…',
  minHeight = 180,
}: Props) {
  const [markdown, setMarkdown] = useState(defaultValue)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
          class: 'text-tomato underline underline-offset-4',
        },
      }),
      Markdown.configure({
        html: false,
        linkify: true,
        breaks: true,
        transformPastedText: true,
      }),
    ],
    content: defaultValue,
    onUpdate({ editor }) {
      // tiptap-markdown ajoute `storage.markdown` au runtime mais le type
      // Storage est `{}`. Cast ciblé plutôt qu'augmentation globale.
      const storage = editor.storage as unknown as {
        markdown?: { getMarkdown: () => string }
      }
      const md = storage.markdown?.getMarkdown() ?? ''
      setMarkdown(md)
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-stone max-w-none focus:outline-none px-4 py-3 leading-relaxed text-ink',
        style: `min-height: ${minHeight}px`,
        'aria-label': placeholder,
      },
    },
  })

  // Si le defaultValue change après mount (cas rare), on resync.
  useEffect(() => {
    if (editor && defaultValue && editor.isEmpty) {
      editor.commands.setContent(defaultValue)
    }
  }, [defaultValue, editor])

  return (
    <div className="rounded-soft border border-green-soft/60 bg-cream-warm focus-within:border-green-deep focus-within:ring-2 focus-within:ring-green-deep/30">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={markdown} />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null

  const Btn = ({
    onClick,
    active,
    children,
    label,
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    label: string
  }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded transition-colors ${
        active
          ? 'bg-green-deep text-white'
          : 'text-ink-soft hover:bg-cream hover:text-green-deep'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-green-soft/40 bg-cream px-2 py-1.5">
      <Btn
        label="Gras"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong className="text-sm">B</strong>
      </Btn>
      <Btn
        label="Italique"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em className="text-sm">I</em>
      </Btn>
      <span className="mx-1 h-5 w-px bg-green-soft/60" aria-hidden />
      <Btn
        label="Titre"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <span className="text-xs font-bold">H</span>
      </Btn>
      <Btn
        label="Liste à puces"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1" fill="currentColor" />
          <circle cx="4" cy="12" r="1" fill="currentColor" />
          <circle cx="4" cy="18" r="1" fill="currentColor" />
        </svg>
      </Btn>
      <Btn
        label="Liste numérotée"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
          <path d="M4 6h1v4M4 10h2M4 18h2a1 1 0 0 0 0-2 1 1 0 0 0 0-2H4" />
        </svg>
      </Btn>
      <Btn
        label="Citation"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 21c0-3.5 2.5-6 6-6v-3c-3 0-6 1.5-6 6Zm10 0c0-3.5 2.5-6 6-6v-3c-3 0-6 1.5-6 6Z" />
        </svg>
      </Btn>
      <span className="mx-1 h-5 w-px bg-green-soft/60" aria-hidden />
      <Btn
        label="Lien"
        active={editor.isActive('link')}
        onClick={() => {
          const previous = editor.getAttributes('link').href
          const url = window.prompt('URL du lien', previous ?? 'https://')
          if (url === null) return
          if (url === '') {
            editor.chain().focus().unsetLink().run()
            return
          }
          editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: url })
            .run()
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </Btn>
    </div>
  )
}
