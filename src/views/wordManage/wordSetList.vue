<template>
  <div class="word-set-list">
    <div class="header">
      <button @click="$router.push('/')" class="back-btn">返回首页</button>
      <h2>单词集管理</h2>
    </div>
    <button @click="$router.push('/wordInput')" class="add-btn">添加单词集</button>
    <div class="list-container">
      <div class="word-set-item" v-for="item in wordSets" :key="item.id">
        <h3>{{ item.name }}</h3>
        <p>{{ item.wordCount }}个单词</p>
        <div class="action-buttons">
          <button @click="editWordSet(item)">编辑</button>
          <button @click="deleteWordSet(item)">删除</button>
          <button @click="playGame(item)">开始游戏</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { wordService } from '@/services/wordService'

const router = useRouter()
const wordSets = ref([])
const loading = ref(false)

// 获取单词集列表
const fetchWordSets = async () => {
  loading.value = true
  try {
    const result = await wordService.getAllWordSets()
    if (result.success) {
      wordSets.value = result.data
    } else {
      import('@/utils/logUtil').then((logUtil) => {
        logUtil.error('获取单词集失败', { module: 'WordSetList', message: result.message })
      })
    }
  } catch (error) {
    import('@/utils/logUtil').then((logUtil) => {
      logUtil.error('获取单词集失败', { module: 'WordSetList' }, error)
    })
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchWordSets()
})

// 编辑单词集
const editWordSet = (wordSet) => {
  import('@/utils/logUtil').then(({ debug }) => {
    debug('编辑单词集', { module: 'WordSetList', wordSet })
  })
  // 这里可以跳转到编辑页面，传递单词集ID
  // router.push({ path: '/wordEdit', query: { setId: wordSet.setId } })
}

// 删除单词集
const deleteWordSet = async (wordSet) => {
  if (confirm(`确定要删除单词集"${wordSet.setName}"吗？`)) {
    try {
      const result = await wordService.deleteWordSet(wordSet.setId)
      if (result.success) {
        alert('单词集删除成功')
        // 重新获取单词集列表
        fetchWordSets()
      } else {
        alert('删除失败：' + result.message)
      }
    } catch (error) {
      import('@/utils/logUtil').then((logUtil) => {
        logUtil.error('删除单词集失败', { module: 'WordSetList', wordSet }, error)
      })
      alert('删除失败：' + error.message)
    }
  }
}

// 开始游戏
const playGame = (wordSet) => {
  import('@/utils/logUtil').then(({ debug }) => {
    debug('开始游戏', { module: 'WordSetList', wordSet })
  })
  // 跳转到游戏选择页面，并传递单词集ID
  router.push({ path: '/gameSelect', query: { setId: wordSet.setId } })
}
</script>

<style scoped>
.word-set-list {
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.back-btn {
  background-color: #6b7280;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background-color: #4b5563;
}

h2 {
  text-align: center;
  color: #3b82f6;
  margin: 0;
}

.add-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  display: block;
  margin-left: auto;
}

.add-btn:hover {
  background-color: #059669;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.word-set-item {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.word-set-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.word-set-item h3 {
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.word-set-item p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-buttons button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.action-buttons button:first-child {
  background-color: #3b82f6;
  color: white;
}

.action-buttons button:first-child:hover {
  background-color: #2563eb;
}

.action-buttons button:nth-child(2) {
  background-color: #ef4444;
  color: white;
}

.action-buttons button:nth-child(2):hover {
  background-color: #dc2626;
}

.action-buttons button:nth-child(3) {
  background-color: #f59e0b;
  color: white;
}

.action-buttons button:nth-child(3):hover {
  background-color: #d97706;
}
</style>