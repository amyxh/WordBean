<template>
  <div class="game-result">
    <div class="header">
      <button @click="backToHome" class="back-btn">返回首页</button>
    </div>
    <div class="result-card">
      <h2>{{ isPass ? '恭喜完成！' : '继续加油！' }}</h2>
      <div class="result-icon">
        <div v-if="isPass" class="success-icon">✓</div>
        <div v-else class="fail-icon">✗</div>
      </div>
      <div class="result-stats">
        <div class="stat-item">
          <span class="stat-label">得分</span>
          <span class="stat-value">{{ score }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">用时</span>
          <span class="stat-value">{{ formattedTime }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">正确率</span>
          <span class="stat-value">{{ correctRate }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">匹配对数</span>
          <span class="stat-value">{{ matchedPairs }} / {{ totalPairs }}</span>
        </div>
      </div>
      <div class="medal-section" v-if="isPass">
        <div class="medal-icon">🏅</div>
        <p>获得1枚单词豆勋章！</p>
        <p>累计勋章：{{ totalMedals }}枚</p>
      </div>
      <div class="action-buttons">
        <button @click="restartGame" class="restart-btn">重新挑战</button>
        <button @click="backToHome" class="home-btn">返回首页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 游戏结果数据
const score = ref(parseInt(route.query.score || 0))
const time = ref(parseInt(route.query.time || 0)) // 秒
const matchedPairs = ref(parseInt(route.query.matchedPairs || 0))
const totalPairs = ref(parseInt(route.query.totalPairs || 0))
const isPass = ref(route.query.isPass === 'true')
const medalCount = ref(parseInt(route.query.medalCount || 0))
const correctRate = ref(parseFloat(route.query.correctRate || 0) * 100)
const wrongWords = ref([]) // 简化处理，不再显示错误单词
const totalMedals = ref(medalCount.value) // 简化处理，仅显示当前获得的勋章

// 格式化时间
const formattedTime = computed(() => {
  const minutes = Math.floor(time.value / 60)
  const seconds = time.value % 60
  return `${minutes}分${seconds}秒`
})

// 组件挂载时初始化数据
onMounted(() => {
  // 简化处理，不再从数据库获取数据
})

// 重新挑战
const restartGame = () => {
  // 获取当前难度（默认为简单）
  const difficulty = localStorage.getItem('lastDifficulty') || 'easy'
  // 直接跳转到游戏页面，使用相同难度重新开始
  router.push({
    path: '/gamePlay',
    query: {
      difficulty: difficulty,
      mode: 'word-paraphrase'
    }
  })
}

// 返回首页
const backToHome = () => {
  router.push('/')
}
</script>

<style scoped>
.game-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f0f9ff;
  padding: 1rem;
}

.header {
  width: 100%;
  max-width: 400px;
  display: flex;
  justify-content: flex-start;
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

.result-card {
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.result-card h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.result-card h2:first-child {
  color: #10b981;
}

.result-icon {
  margin: 1.5rem 0;
}

.success-icon {
  font-size: 4rem;
  color: #10b981;
  font-weight: bold;
  background-color: #d1fae5;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.fail-icon {
  font-size: 4rem;
  color: #ef4444;
  font-weight: bold;
  background-color: #fee2e2;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;
}

.medal-section {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #fef3c7;
  border-radius: 8px;
}

.medal-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.medal-section p {
  margin: 0.25rem 0;
  color: #92400e;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
}

.restart-btn, .home-btn {
  flex: 1;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.restart-btn {
  background-color: #3b82f6;
  color: white;
}

.restart-btn:hover {
  background-color: #2563eb;
}

.home-btn {
  background-color: #6b7280;
  color: white;
}

.home-btn:hover {
  background-color: #4b5563;
}
</style>