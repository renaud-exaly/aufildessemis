/**
 * Helpers minimalistes pour produire des documents Lexical à partir de texte
 * brut côté serveur (formulaires, seeds, scripts). On garde une structure
 * paragraphe-simple : suffisant pour un journal de jardin où l'on n'a pas
 * besoin de gras/italique côté front-end.
 */

type LexicalDoc = {
  root: {
    type: 'root'
    format: ''
    indent: 0
    version: 1
    direction: 'ltr'
    children: Array<{
      type: 'paragraph'
      format: ''
      indent: 0
      version: 1
      direction: 'ltr'
      textFormat: 0
      children: Array<{
        type: 'text'
        format: 0
        style: ''
        mode: 'normal'
        text: string
        detail: 0
        version: 1
      }>
    }>
  }
}

export function plainTextToLexical(text: string): LexicalDoc {
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((p) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [
          {
            type: 'text',
            format: 0,
            style: '',
            mode: 'normal',
            text: p,
            detail: 0,
            version: 1,
          },
        ],
      })),
    },
  }
}

/** Extrait le texte brut d'un doc Lexical (pour preview/SEO). */
export function lexicalToPlainText(doc: unknown): string {
  if (!doc || typeof doc !== 'object') return ''
  const walk = (node: unknown): string => {
    if (!node || typeof node !== 'object') return ''
    const n = node as { text?: string; children?: unknown[] }
    if (typeof n.text === 'string') return n.text
    if (Array.isArray(n.children)) {
      return n.children.map(walk).join('')
    }
    return ''
  }
  const root = (doc as { root?: { children?: unknown[] } }).root
  if (!root?.children) return ''
  return root.children.map((c) => walk(c)).join('\n\n').trim()
}
