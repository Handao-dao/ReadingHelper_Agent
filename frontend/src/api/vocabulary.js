/**
 * 生词本 API。
 * - fetchVocabulary: 查询生词列表（支持搜索/筛选/分页）
 * - setMastered / setMasteredByWord: 标记已掌握/取消
 * - deleteVocabulary: 删除生词（即"忽略"）
 * - fetchMasteredWords: 拉取全部已掌握词，转为 Set 供渲染过滤用
 */

const BASE = '/api/vocabulary'

export async function fetchVocabulary({ search = '', mastered = undefined, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (mastered !== undefined) params.set('mastered', mastered)
  params.set('limit', String(limit))
  params.set('offset', String(offset))

  const res = await fetch(`${BASE}?${params}`)
  if (!res.ok) throw new Error(`获取生词列表失败: ${res.status}`)
  return res.json()
}

export async function setMasteredByWord(word, mastered) {
  const res = await fetch(`${BASE}/mark-by-word`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, mastered }),
  })
  if (!res.ok) throw new Error(`标记失败: ${res.status}`)
  return res.json()
}

export async function setMastered(vocabId, mastered) {
  const res = await fetch(`${BASE}/${vocabId}/master`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mastered }),
  })
  if (!res.ok) throw new Error(`更新掌握状态失败: ${res.status}`)
  return res.json()
}

export async function deleteVocabulary(vocabId) {
  const res = await fetch(`${BASE}/${vocabId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`删除生词失败: ${res.status}`)
  return res.json()
}

export async function fetchMasteredWords() {
  const { items } = await fetchVocabulary({ mastered: 1, limit: 5000 })
  return new Set(items.map((v) => v.word.toLowerCase()))
}
