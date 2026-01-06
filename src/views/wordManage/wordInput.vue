<template>
  <div class="word-input">
    <div class="header">
      <button @click="$router.push('/wordManage')" class="back-btn">返回列表</button>
      <h2>单词录入</h2>
    </div>
    <div class="input-form">
      <div class="form-group">
        <label>单词集名称</label>
        <input v-model="wordSetName" type="text" placeholder="请输入单词集名称">
      </div>
      <div class="form-group">
        <label>单词</label>
        <input v-model="currentWord.word" type="text" placeholder="请输入单词">
      </div>
      <div class="form-group">
        <label>音标</label>
        <input v-model="currentWord.phonetic" type="text" placeholder="请输入音标（可选）">
      </div>
      <div class="form-group">
        <label>中文释义</label>
        <input v-model="currentWord.paraphrase" type="text" placeholder="请输入中文释义">
      </div>
      <div class="action-buttons">
        <button @click="addWord" class="add-word-btn">添加单词</button>
        <button @click="saveWordSet" class="save-btn">保存单词集</button>
      </div>
    </div>
    <div class="word-list">
      <h3>已添加单词（{{ wordList.length }}个）</h3>
      <div class="word-item" v-for="(word, index) in wordList" :key="index">
        <span>{{ word.word }} {{ word.phonetic }} - {{ word.paraphrase }}</span>
        <button @click="removeWord(index)" class="remove-btn">删除</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { wordService } from '@/services/wordService'
import { useRouter } from 'vue-router'

const router = useRouter()

// 单词集名称
const wordSetName = ref('')

// 当前输入的单词
const currentWord = ref({
  wordText: '',
  phonetic: '',
  paraphrase: ''
})

// 已添加的单词列表
const wordList = ref([])

// 加载状态
const loading = ref(false)

// 添加单词
const addWord = () => {
  if (!currentWord.value.wordText || !currentWord.value.paraphrase) {
    alert('单词和释义不能为空')
    return
  }
  wordList.value.push({ ...currentWord.value })
  // 清空当前输入
  currentWord.value = {
    wordText: '',
    phonetic: '',
    paraphrase: ''
  }
}

// 移除单词
const removeWord = (index) => {
  wordList.value.splice(index, 1)
}

// 保存单词集
const saveWordSet = async () => {
  if (!wordSetName.value) {
    alert('单词集名称不能为空')
    return
  }
  if (wordList.value.length === 0) {
    alert('请至少添加一个单词')
    return
  }
  
  loading.value = true
  try {
    // 1. 创建单词集
    const createSetResult = await wordService.createWordSet({
      setName: wordSetName.value,
      description: '' // 可以扩展添加描述字段
    })
    
    if (!createSetResult.success) {
      alert('创建单词集失败：' + createSetResult.message)
      return
    }
    
    const setId = createSetResult.data.setId
    
    // 2. 批量添加单词
    for (const word of wordList.value) {
      await wordService.singleAdd({
        ...word,
        setId
      })
    }
    
    alert('单词集保存成功！')
    router.push('/wordSetList')
  } catch (error) {
    console.error('保存单词集失败:', error)
    alert('保存单词集失败：' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.word-input {
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
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
  margin-bottom: 1.5rem;
}

.input-form {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #1f2937;
}

.form-group input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.action-buttons button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.add-word-btn {
  background-color: #10b981;
  color: white;
}

.add-word-btn:hover {
  background-color: #059669;
}

.save-btn {
  background-color: #3b82f6;
  color: white;
}

.save-btn:hover {
  background-color: #2563eb;
}

.word-list {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.word-list h3 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.word-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  border-bottom: 1px solid #e5e7eb;
}

.word-item:last-child {
  border-bottom: none;
}

.remove-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.remove-btn:hover {
  background-color: #dc2626;
}
</style>