const escapeHtml = (value = '') => {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const wrapPlainWords = (paragraphHtml) => {
  const parts = paragraphHtml.split(/(<[^>]+>)/g)
  return parts.map(part => {
    if (part.startsWith('<')) return part
    return part.replace(
      /\b([a-zA-Z]+(?:'[a-zA-Z]+)?)\b/g,
      '<span class="text-word" data-word="$1">$1</span>'
    )
  }).join('')
}

export const formatAnnotatedText = (annotatedText = '', masteredWords = new Set()) => {
  let text = escapeHtml(annotatedText ?? '')

  text = text.replace(
    /\[\[(.+?)\|(.+?)\]\]/g,
    (_, word, translation) => {
      if (masteredWords.has(word.toLowerCase())) {
        return `<span class="text-word" data-word="${word}">${word}</span>`
      }
      return `<span class="vocab-word" data-word="${word}">${word}</span><span class="translation">(${translation})</span>`
    }
  )

  return text
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${wrapPlainWords(p)}</p>`)
    .join('')
}
