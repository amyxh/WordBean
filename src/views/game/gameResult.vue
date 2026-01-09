<template>
  <div class="game-result">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
const correctRate = ref(Math.round(parseFloat(route.query.correctRate || 0) * 100)) // 格式化为整数百分比
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
  // 根据游戏结果播放相应的背景音乐
  import('@/services/audioService').then((audioService) => {
    audioService.playBgm(isPass.value ? 'victory' : 'defeat')
  })
})

// 组件卸载时停止音乐
onUnmounted(() => {
  import('@/services/audioService').then((audioService) => {
    audioService.stopBgm()
  })
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
  min-height: 100vh;
  background-color: #f0f9ff;
  padding: 1rem;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.result-card {
  background-color: white;
  padding: 1.2rem;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 380px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  flex-shrink: 0;
  max-height: calc(100vh - 1.5rem);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.result-card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.6rem;
}

.result-card h2:first-child {
  color: #10b981;
}

.result-card h2:not(:first-child) {
  color: #ef4444;
}

.result-icon {
  margin: 0.8rem 0;
}

.success-icon {
  font-size: 2.5rem;
  color: #10b981;
  font-weight: bold;
  background-color: #d1fae5;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.fail-icon {
  font-size: 2.5rem;
  color: #ef4444;
  font-weight: bold;
  background-color: #fee2e2;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
  margin: 0.8rem 0;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 6px;
  box-sizing: border-box;
  width: 100%;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 50px;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  white-space: nowrap;
}

.stat-value {
  font-size: 1.15rem;
  font-weight: bold;
  color: #3b82f6;
  white-space: nowrap;
}

/* 响应式设计，确保在小屏幕上正确显示 */
@media (max-width: 768px) {
  .result-card {
    max-width: 100%;
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .game-result {
    padding: 0.5rem;
  }
  

  
  .result-card {
    padding: 1.2rem;
  }
  
  .result-card h2 {
    font-size: 1.8rem;
  }
  
  .result-icon {
    margin: 1rem 0;
  }
  
  .success-icon,
  .fail-icon {
    width: 80px;
    height: 80px;
    font-size: 3rem;
  }
  
  .result-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
    margin: 1rem 0;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    min-height: auto;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .stat-item:last-child {
    border-bottom: none;
  }
  
  .stat-label {
    margin-bottom: 0;
    font-size: 0.85rem;
  }
  
  .stat-value {
    font-size: 1.3rem;
  }
  
  .medal-section {
    margin: 1rem 0;
    padding: 0.8rem;
  }
  
  .medal-icon {
    font-size: 2.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
    margin: 1rem 0;
  }
  
  .restart-btn,
  .home-btn {
    padding: 0.7rem 1.2rem;
  }
}

.medal-section {
  margin: 1.2rem 0;
  padding: 1rem;
  background-color: #fef3c7;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.medal-icon {
  font-size: 2rem;
  margin-bottom: 0.4rem;
  display: block;
}

.medal-section p {
  margin: 0.25rem 0;
  color: #92400e;
  font-size: 0.85rem;
  line-height: 1.3;
}

.action-buttons {
  display: flex;
  gap: 0.8rem;
  margin: 1.2rem 0 0;
  padding: 0.8rem 0 0;
  border-top: 1px solid #e5e7eb;
}

.restart-btn, .home-btn {
  flex: 1;
  padding: 0.7rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.restart-btn {
  background-color: #3b82f6;
  color: white;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
}

.restart-btn:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(59, 130, 246, 0.3);
}

.restart-btn:active {
  transform: translateY(0);
}

.home-btn {
  background-color: #6b7280;
  color: white;
  box-shadow: 0 2px 6px rgba(107, 114, 128, 0.2);
}

.home-btn:hover {
  background-color: #4b5563;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(107, 114, 128, 0.3);
}

.home-btn:active {
  transform: translateY(0);
}
</style>