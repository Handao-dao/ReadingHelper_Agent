/**
 * 已掌握词汇共享状态（单例 composable）。
 *
 * 利用模块级 ref + loaded 标志确保全局只加载一次，
 * 阅读页、生词本、历史记录页共享同一份 masteredWords Set。
 */
import { ref } from 'vue'
import { fetchMasteredWords } from '../api/vocabulary'

// 模块级单例状态，跨组件共享
const masteredWords = ref(new Set())
let loaded = false

export function useMasteredWords() {
  if (!loaded) {
    loaded = true
    fetchMasteredWords().then(s => { masteredWords.value = s })
  }
  return masteredWords
}
