export async function lookupWord(word, sentence) {
  const res = await fetch('/api/word-lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, sentence }),
  })
  if (!res.ok) throw new Error('查词失败')
  return res.json()
}

export async function addVocabToDB(word, translation, context) {
  const res = await fetch('/api/vocabulary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, translation, context }),
  })
  if (!res.ok) throw new Error('添加生词失败')
  return res.json()
}
