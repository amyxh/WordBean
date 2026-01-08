<template>
  <div class="daily-report">
    <div class="header">
      <button @click="$router.push('/')" class="back-btn">返回首页</button>
      <h2>学习日报</h2>
    </div>
    <div class="date-selector">
      <button @click="prevDate" class="date-btn">&lt;</button>
      <span class="current-date">{{ currentDate }}</span>
      <button @click="nextDate" class="date-btn">&gt;</button>
    </div>
    <div class="report-card">
      <div class="report-header">
        <h3>{{ formattedDate }}</h3>
      </div>
      <div class="report-stats">
        <div class="stat-item">
          <div class="stat-icon">⏱️</div>
          <div class="stat-info">
            <div class="stat-label">总学习时长</div>
            <div class="stat-value">{{ totalDuration }}分钟</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">🎮</div>
          <div class="stat-info">
            <div class="stat-label">完成局数</div>
            <div class="stat-value">{{ completedLevels }}局</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">🏅</div>
          <div class="stat-info">
            <div class="stat-label">获得勋章</div>
            <div class="stat-value">{{ medalsEarned }}枚</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-label">平均正确率</div>
            <div class="stat-value">{{ avgCorrectRate }}%</div>
          </div>
        </div>
      </div>
      <div class="mastery-section">
        <h4>单词掌握情况</h4>
        <div class="mastery-stats">
          <div class="mastery-item">
            <span class="mastery-label">已掌握</span>
            <div class="mastery-bar">
              <div class="mastery-fill mastered" :style="{ width: masteredRate + '%' }"></div>
            </div>
            <span class="mastery-count">{{ masteredWords }}个</span>
          </div>
          <div class="mastery-item">
            <span class="mastery-label">待巩固</span>
            <div class="mastery-bar">
              <div class="mastery-fill pending" :style="{ width: pendingRate + '%' }"></div>
            </div>
            <span class="mastery-count">{{ pendingWords }}个</span>
          </div>
          <div class="mastery-item">
            <span class="mastery-label">未掌握</span>
            <div class="mastery-bar">
              <div class="mastery-fill unmastered" :style="{ width: unmasteredRate + '%' }"></div>
            </div>
            <span class="mastery-count">{{ unmasteredWords }}个</span>
          </div>
        </div>
      </div>
      <div class="word-sets-section">
        <h4>学习的单词集</h4>
        <div class="word-set-item" v-for="set in studiedWordSets" :key="set.setId">
          <div class="set-info">
            <h5>{{ set.setName }}</h5>
            <p>{{ set.playCount }}局，平均正确率{{ set.avgCorrectRate }}%</p>
          </div>
        </div>
      </div>
      <div class="review-section" v-if="reviewWords.length > 0">
        <h4>重点复习单词</h4>
        <div class="review-word-item" v-for="word in reviewWords" :key="word.wordId">
          <span>{{ word.word }} - {{ word.paraphrase }}</span>
          <button @click="addToReviewList(word)" class="review-btn">加入复习</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import dayjs from 'dayjs'
import { progressDao } from '@/db/progressDao'
import { wordDao } from '@/db/wordDao'

// 当前日期
const currentDate = ref(dayjs())
const loading = ref(false)

// 日报数据
const reportData = ref({
  totalDuration: 0,
  completedLevels: 0,
  medalsEarned: 0,
  avgCorrectRate: 0,
  masteredWords: 0,
  pendingWords: 0,
  unmasteredWords: 0,
  studiedWordSets: [],
  reviewWords: []
})

// 格式化日期
const formattedDate = computed(() => {
  return currentDate.value.format('YYYY年MM月DD日')
})

// 掌握率计算
const totalWords = computed(() => {
  return reportData.value.masteredWords + reportData.value.pendingWords + reportData.value.unmasteredWords
})

const masteredRate = computed(() => {
  return totalWords.value > 0 ? Math.round((reportData.value.masteredWords / totalWords.value) * 100) : 0
})

const pendingRate = computed(() => {
  return totalWords.value > 0 ? Math.round((reportData.value.pendingWords / totalWords.value) * 100) : 0
})

const unmasteredRate = computed(() => {
  return totalWords.value > 0 ? Math.round((reportData.value.unmasteredWords / totalWords.value) * 100) : 0
})

// 获取指定日期的日报数据
const fetchDailyReport = async () => {
  loading.value = true
  try {
    const dateStr = currentDate.value.format('YYYY-MM-DD')
    
    // 1. 获取学习记录
    const records = await progressDao.getLearningRecordsByDate(dateStr)
    
    // 2. 计算基本统计数据
    const totalDuration = records.reduce((sum, record) => sum + record.duration, 0)
    const completedLevels = records.filter(record => record.isPass === 1).length
    const medalsEarned = records.reduce((sum, record) => sum + (record.medalCount || 0), 0)
    const avgCorrectRate = records.length > 0 ? 
      Math.round((records.reduce((sum, record) => sum + record.correctRate, 0) / records.length) * 100) : 0
    
    // 3. 获取单词掌握情况
    const masteryStats = await wordDao.getMasteryStatsByDate(dateStr)
    
    // 4. 获取学习的单词集
    const wordSets = await progressDao.getStudiedWordSetsByDate(dateStr)
    
    // 5. 获取需要复习的单词
    const reviewWords = await wordDao.getWordsToReview()
    
    // 6. 更新日报数据
    reportData.value = {
      totalDuration: Math.round(totalDuration / 60), // 转换为分钟
      completedLevels,
      medalsEarned,
      avgCorrectRate,
      masteredWords: masteryStats.mastered || 0,
      pendingWords: masteryStats.pending || 0,
      unmasteredWords: masteryStats.unmastered || 0,
      studiedWordSets: wordSets,
      reviewWords: reviewWords.map(word => ({
        wordId: word.wordId,
        word: word.wordText,
        paraphrase: word.paraphrase
      }))
    }
  } catch (error) {
    import('@/utils/logUtil').then((logUtil) => {
      logUtil.error('获取日报数据失败', { module: 'DailyReport' }, error)
    })
  } finally {
    loading.value = false
  }
}

// 前一天
const prevDate = () => {
  currentDate.value = currentDate.value.subtract(1, 'day')
}

// 后一天
const nextDate = () => {
  if (currentDate.value.isBefore(dayjs(), 'day')) {
    currentDate.value = currentDate.value.add(1, 'day')
  }
}

// 加入复习列表
const addToReviewList = (word) => {
  import('@/utils/logUtil').then(({ debug }) => {
    debug('加入复习列表', { module: 'DailyReport', word })
  })
  // 这里可以添加加入复习列表的逻辑
}

// 监听日期变化，重新获取数据
watch(currentDate, () => {
  fetchDailyReport()
})

// 组件挂载时获取数据
onMounted(() => {
  fetchDailyReport()
})
</script>

<style scoped>
.daily-report {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
  background-color: #f0f9ff;
  min-height: 100vh;
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

.date-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.date-btn {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.date-btn:hover {
  background-color: #2563eb;
}

.current-date {
  font-size: 1.2rem;
  font-weight: bold;
  color: #1f2937;
}

.report-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.report-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.report-header h3 {
  color: #1f2937;
  font-size: 1.3rem;
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
}

.stat-icon {
  font-size: 2rem;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #3b82f6;
}

.mastery-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
}

.mastery-section h4 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.mastery-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.mastery-item:last-child {
  margin-bottom: 0;
}

.mastery-label {
  width: 80px;
  font-size: 0.9rem;
  color: #6b7280;
}

.mastery-bar {
  flex: 1;
  height: 12px;
  background-color: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.mastery-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.mastery-fill.mastered {
  background-color: #10b981;
}

.mastery-fill.pending {
  background-color: #f59e0b;
}

.mastery-fill.unmastered {
  background-color: #ef4444;
}

.mastery-count {
  width: 60px;
  font-size: 0.9rem;
  font-weight: bold;
  color: #374151;
  text-align: right;
}

.word-sets-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
}

.word-sets-section h4 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.word-set-item {
  padding: 1rem;
  background-color: white;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.word-set-item:last-child {
  margin-bottom: 0;
}

.set-info h5 {
  margin-bottom: 0.25rem;
  color: #1f2937;
}

.set-info p {
  font-size: 0.9rem;
  color: #6b7280;
}

.review-section {
  padding: 1rem;
  background-color: #fef3c7;
  border-radius: 8px;
}

.review-section h4 {
  margin-bottom: 1rem;
  color: #92400e;
}

.review-word-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: white;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.review-word-item:last-child {
  margin-bottom: 0;
}

.review-btn {
  padding: 0.4rem 0.8rem;
  background-color: #f59e0b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.review-btn:hover {
  background-color: #d97706;
}
</style>