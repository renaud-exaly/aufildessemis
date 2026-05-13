/**
 * Convertit un texte brut (multi-paragraphes séparés par des lignes vides)
 * en SerializedEditorState Lexical compatible avec les champs richText
 * de Payload (collections SowingUpdates.note, Tips.body, Plants.description…).
 */
export function plainTextToLexical(text: string) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.length
        ? paragraphs.map((p) => ({
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
          }))
        : [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              direction: 'ltr',
              textFormat: 0,
              children: [],
            },
          ],
    },
  }
}

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
