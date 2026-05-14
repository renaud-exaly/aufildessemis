/**
 * Convertit du markdown (ou du texte brut, qui est du markdown trivial) en
 * SerializedEditorState Lexical compatible avec les champs richText de Payload
 * (Tips.body, Plants.description, SowingUpdates.note…).
 *
 * Couvre les fonctionnalités par défaut de l'éditeur Payload v3 :
 * paragraphes, titres h1-h6, listes (ul/ol), citations, liens, gras, italique,
 * barré, code inline, retours à la ligne, hr. Les images markdown sont
 * remplacées par leur alt text (les vrais uploads passent par le champ Media).
 */

import { marked, type Token, type Tokens } from 'marked'

const FORMAT = {
  BOLD: 1,
  ITALIC: 2,
  STRIKETHROUGH: 4,
  CODE: 16,
} as const

type LexicalText = {
  type: 'text'
  text: string
  format: number
  detail: 0
  mode: 'normal'
  style: ''
  version: 1
}

type LexicalLineBreak = { type: 'linebreak'; version: 1 }

type LexicalLink = {
  type: 'link'
  fields: { url: string; newTab: boolean; linkType: 'custom' }
  format: ''
  indent: 0
  version: 1
  direction: 'ltr'
  children: LexicalInline[]
}

type LexicalInline = LexicalText | LexicalLineBreak | LexicalLink

type LexicalBlock = Record<string, unknown>

const textNode = (text: string, format: number): LexicalText => ({
  type: 'text',
  text,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const emptyParagraph = (): LexicalBlock => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 0,
  children: [],
})

const inlineFromTokens = (
  tokens: Token[] | undefined,
  fmt = 0,
): LexicalInline[] => {
  const out: LexicalInline[] = []
  if (!tokens) return out
  for (const t of tokens) {
    switch (t.type) {
      case 'text':
      case 'escape': {
        const nested = (t as { tokens?: Token[] }).tokens
        if (nested?.length) {
          out.push(...inlineFromTokens(nested, fmt))
        } else {
          out.push(textNode((t as { text: string }).text, fmt))
        }
        break
      }
      case 'strong':
        out.push(...inlineFromTokens(t.tokens, fmt | FORMAT.BOLD))
        break
      case 'em':
        out.push(...inlineFromTokens(t.tokens, fmt | FORMAT.ITALIC))
        break
      case 'del':
        out.push(...inlineFromTokens(t.tokens, fmt | FORMAT.STRIKETHROUGH))
        break
      case 'codespan':
        out.push(textNode(t.text, fmt | FORMAT.CODE))
        break
      case 'br':
        out.push({ type: 'linebreak', version: 1 })
        break
      case 'link':
        out.push({
          type: 'link',
          fields: {
            url: t.href,
            newTab: /^https?:\/\//i.test(t.href),
            linkType: 'custom',
          },
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: inlineFromTokens(t.tokens, fmt),
        })
        break
      case 'image':
        // Pas de support d'images inline dans cette conversion — on garde l'alt.
        out.push(textNode(t.text || t.title || '', fmt))
        break
      case 'html':
        // On strip le HTML brut : la sécurité côté Payload est mieux servie
        // par un éditeur richText sans balises libres.
        out.push(textNode(t.raw.replace(/<[^>]+>/g, ''), fmt))
        break
      default: {
        const maybeText = (t as { text?: string }).text
        if (maybeText) out.push(textNode(maybeText, fmt))
      }
    }
  }
  return out
}

const listItemChildren = (item: Tokens.ListItem): LexicalInline[] => {
  // marked imbrique généralement le contenu d'un <li> dans un sous-token
  // `text` qui porte les vrais tokens inline.
  const inner = item.tokens?.[0]
  if (inner && (inner.type === 'text' || inner.type === 'paragraph')) {
    const nested = (inner as { tokens?: Token[] }).tokens
    if (nested?.length) return inlineFromTokens(nested)
  }
  return inlineFromTokens(item.tokens)
}

const blockFromToken = (t: Token): LexicalBlock | null => {
  switch (t.type) {
    case 'space':
      return null
    case 'paragraph':
      return {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: inlineFromTokens(t.tokens),
      }
    case 'heading': {
      const depth = Math.min(Math.max(t.depth, 1), 6)
      return {
        type: 'heading',
        tag: `h${depth}`,
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: inlineFromTokens(t.tokens),
      }
    }
    case 'list': {
      const list = t as Tokens.List
      return {
        type: 'list',
        listType: list.ordered ? 'number' : 'bullet',
        tag: list.ordered ? 'ol' : 'ul',
        start: typeof list.start === 'number' ? list.start : 1,
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: list.items.map((item: Tokens.ListItem, idx: number) => ({
          type: 'listitem',
          value: idx + 1,
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: listItemChildren(item),
        })),
      }
    }
    case 'blockquote': {
      // Lexical "quote" n'accepte qu'une couche de texte inline ; on aplatit
      // les paragraphes internes en insérant des linebreaks.
      const inner: LexicalInline[] = []
      for (const child of t.tokens ?? []) {
        if (child.type === 'paragraph') {
          if (inner.length)
            inner.push({ type: 'linebreak', version: 1 }, { type: 'linebreak', version: 1 })
          inner.push(...inlineFromTokens(child.tokens))
        }
      }
      return {
        type: 'quote',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: inner,
      }
    }
    case 'code':
      // Pas de CodeBlock par défaut dans Payload Lexical — on rend en
      // paragraphe avec texte au format code (monospace).
      return {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [textNode(t.text, FORMAT.CODE)],
      }
    case 'hr':
      return { type: 'horizontalrule', version: 1 }
    case 'html':
      return {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [textNode(t.raw.replace(/<[^>]+>/g, '').trim(), 0)],
      }
    default:
      return null
  }
}

export function markdownToLexical(input: string) {
  const tokens = marked.lexer(input ?? '')
  const children: LexicalBlock[] = []
  for (const t of tokens) {
    const block = blockFromToken(t)
    if (block) children.push(block)
  }
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: children.length ? children : [emptyParagraph()],
    },
  }
}

/**
 * Alias retro-compatible : un texte brut multi-paragraphes EST du markdown
 * trivial, donc on délègue directement.
 */
export const plainTextToLexical = markdownToLexical

/** Convertit un richText Lexical en texte brut, best effort. */
export function lexicalToPlainText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const root = (value as { root?: { children?: unknown[] } }).root
  if (!root?.children) return ''
  const walk = (nodes: unknown[]): string =>
    nodes
      .map((n) => {
        if (!n || typeof n !== 'object') return ''
        const node = n as { type?: string; text?: string; children?: unknown[] }
        if (node.type === 'text') return node.text ?? ''
        if (node.type === 'linebreak') return '\n'
        if (node.children) return walk(node.children)
        return ''
      })
      .join('')
  return root.children
    .map((p) => {
      const node = p as { children?: unknown[] }
      return node.children ? walk(node.children) : ''
    })
    .filter(Boolean)
    .join('\n\n')
}

