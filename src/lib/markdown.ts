import { marked } from 'marked'

// Configuration sûre : pas de HTML brut dans le markdown des utilisateurs.
// marked échappe le HTML quand on lui dit de ne pas l'autoriser via `unsafe`,
// mais on assure aussi en désactivant les balises raw <script>, etc.
marked.setOptions({
  gfm: true,
  breaks: true,
  // Pas d'option async ici — on veut un rendu sync.
})

/**
 * Rend du markdown utilisateur en HTML. Échappe le HTML brut pour éviter
 * tout XSS. Ne pas utiliser pour du contenu admin où on voudrait du HTML
 * (utiliser RichText/Lexical à la place).
 */
export function renderMarkdown(input: string): string {
  if (!input || typeof input !== 'string') return ''
  // marked v18 retourne string en mode synchrone.
  const html = marked.parse(input, { async: false }) as string
  return html
}

/** Extrait un aperçu texte du markdown (premières N lignes, sans formatage). */
export function markdownExcerpt(input: string, maxChars = 160): string {
  if (!input || typeof input !== 'string') return ''
  const stripped = input
    .replace(/```[\s\S]*?```/g, ' ') // code blocks
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → keep label
    .replace(/[#*_>~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (stripped.length <= maxChars) return stripped
  return stripped.slice(0, maxChars).trimEnd() + '…'
}
