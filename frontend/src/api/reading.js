/**
 * 阅读标注 API。
 * createProcessTask: POST /api/create-process-task，提交文本 + 阅读水平，返回 task_id。
 */

export async function createProcessTask(text, level = 'intermediate') {
  const res = await fetch('/api/create-process-task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, level })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.detail || '创建处理任务失败')
  }

  return await res.json()
}