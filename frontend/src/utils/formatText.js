/**
 * 标注文本渲染工具。
 *
 * 三步处理管道：
 * 1. HTML 转义防止 XSS
 * 2. [[word|翻译]] → <span class="vocab-word"> + <span class="translation">
 * 3. 剩余纯文本单词 → <span class="text-word" data-word="...">
 *
 * masteredWords: 已掌握词 Set，匹配到的词渲染为无标注样式
 * manuallyAnnotated: 用户手动添加的生词 Map，渲染为带翻译的高亮样式
 */

// HTML 实体转义，防止 v-html 中的 XSS
const escapeHtml = (value = '') => {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export const formatAnnotatedText = (
  annotatedText = '',
  masteredWords = new Set(),
  manuallyAnnotated = new Map()
) => {
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

  // 将段落 HTML 拆分为标签片段与文本片段，仅对文本片段做单词包装
  const wrapPlain = (paragraphHtml) => {
    const parts = paragraphHtml.split(/(<[^>]+>)/g)
    return parts.map(part => {
      if (part.startsWith('<')) return part
      return part.replace(
        /\b([a-zA-Z]+(?:'[a-zA-Z]+)?)\b/g,
        (_, word) => {
          const key = word.toLowerCase()
          if (masteredWords.has(key)) {
            return `<span class="text-word" data-word="${word}">${word}</span>`
          }
          if (manuallyAnnotated.has(key)) {
            const trans = escapeHtml(manuallyAnnotated.get(key))
            return `<span class="vocab-word" data-word="${word}">${word}</span><span class="translation">(${trans})</span>`
          }
          return `<span class="text-word" data-word="${word}">${word}</span>`
        }
      )
    }).join('')
  }

  return text
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${wrapPlain(p)}</p>`)
    .join('')
}
