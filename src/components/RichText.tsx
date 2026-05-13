import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

type RichTextProps = {
  data: SerializedEditorState | null | undefined
  className?: string
}

export function RichText({ data, className }: RichTextProps) {
  if (!data) return null
  return <PayloadRichText className={className} data={data} />
}
