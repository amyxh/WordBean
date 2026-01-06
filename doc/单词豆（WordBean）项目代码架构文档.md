# 单词豆（WordBean）项目代码架构文档
## 1. 项目概述
### 1.1 项目定位
单词豆 是一个专为3-12岁儿童设计的英语单词记忆轻量化游戏工具，采用连连看游戏机制，支持自定义单词录入和学习进度跟踪。

### 1.2 技术栈
- 前端框架 : Vue 3 + Vite
- 路由管理 : Vue Router 4
- 数据库 : SQLite（支持内存数据库备选）
- 日期处理 : Day.js
- 编码支持 : js-base64
- 构建工具 : Vite 5

## 2. 项目目录结构

```
e:\AI\WordBean/
├── .trae/                    # Trae
配置目录
│   └── rules/
│       └── project_rules.md  # 项目规则配置
├── dist/                     # 构建输出目录
│   ├── assets/               # 编译后的静态资源
│   └── index.html            # 入口HTML文件
├── doc/                      # 项目文档
│   ├── 单词豆APPV1.0 0成本开发优先级清单.md
│   ├── 单词豆APP概要设计文档（V1.0）.md
│   ├── 单词豆APP详细设计文档（V1.0）.md
│   └── 单词豆APP需求说明文档（V1.0）.md
├── src/                      # 源代码目录
│   ├── assets/               # 静态资源
│   │   └── defaultWordSets.json  #默认单词集数据
│   ├── db/                 # 数据访问层（DAO层）
│   │   ├── index.js        # 数据库入口
│   │   ├── progressDao.js  # 学习记录数据访问
│   │   ├── settingDao.js   # 设置数据访问
│   │   ├── wordDao.js      # 单词数据访问
│   │   └── wordSetDao.js   # 单词集数据访问
│   ├── router/             # 路由配置
│   │   └── index.js        # 路由定义
│   ├── services/           # 业务逻辑层
│   │   ├── gameService.js  # 游戏业务逻辑
│   │   └── wordService.js  # 单词业务逻辑
│   ├── utils/              # 工具类
│   │   ├── dbUtil.js       # 数据库工具
│   │   ├── gameUtil.js     # 游戏工具
│   │   └── wordUtil.js     # 单词工具
│   ├── views/              # 视图组件
│   │   ├── game/           # 游戏相关组件
│   │   │   ├── gamePlay.vue    # 游戏进行页面
│   │   │   ├── gameResult.vue  # 游戏结果页面
│   │   │   └── gameSelect.vue  # 游戏选择页面
│   │   ├── index/          # 首页
│   │   │   └── index.vue       # 主页面组件
│   │   ├── progress/       # 进度跟踪
│   │   │   └── dailyReport.vue # 学习日报
│   │   ├── setting/        # 设置页面
│   │   │   └── settingIndex.vue # 设置主页
│   │   └── wordManage/     # 单词管理
│   │       ├── wordInput.vue    # 单词录入
│   │       └── wordSetList.vue  # 单词集列表
│   ├── App.vue             # 根组件
│   └── main.js             # 应用入口
├── index.html              # 项目入口
├── package.json            # 项目配置
├── package-lock.json       # 依赖锁定
├── vite.config.js          # Vite配置
└── 开发计划.md             # 开发计划文档
```
## 3. 架构分层设计
### 3.1 四层架构概述
项目采用经典的四层架构模式，各层职责分明，依赖关系清晰：

```
┌─────────────────────┐
│   UI层（视图层）      │  ← 用户界面展示与交互
├─────────────────────┤
│  业务逻辑层（Service）│  ← 核心业务逻辑处理
├─────────────────────┤
│   数据访问层（DAO）   │  ← 数据持久化操作
├─────────────────────┤
│  基础支撑层（Utils）  │  ← 通用工具和基础设施
└─────────────────────┘
```
### 3.2 各层详细职责 3.2.1 UI层（视图层）
位置 : src/views/ + src/App.vue + src/main.js 职责 :

- 用户界面渲染和交互
- 响应用户操作
- 展示业务数据
核心组件 :

- 首页组件 ( index/index.vue ): 应用入口和功能导航
- 游戏模块 ( game/ ): 游戏相关界面
  - gameSelect.vue : 单词集选择页面
  - gamePlay.vue : 游戏进行页面
  - gameResult.vue : 游戏结果页面
- 单词管理模块 ( wordManage/ ):
  - wordSetList.vue : 单词集列表管理
  - wordInput.vue : 单词录入界面
- 进度跟踪模块 ( progress/dailyReport.vue ): 学习日报
- 设置模块 ( setting/settingIndex.vue ): 应用设置 3.2.2 业务逻辑层（Service层）
位置 : src/services/ 职责 : 实现核心业务逻辑，处理复杂业务操作

核心服务 :

- GameService ( gameService.js ):
  
  - 关卡生成逻辑
  - 卡片匹配算法
  - 提示功能实现
  - 奖励机制
  - 学习记录处理
- WordService ( wordService.js ):
  
  - 单词CRUD操作
  - 单词集管理
  - 批量导入处理 3.2.3 数据访问层（DAO层）
  位置 : src/db/ 职责 : 封装数据持久化操作，提供统一的数据访问接口

核心DAO :

- WordDao ( wordDao.js ): 单词数据访问对象
  
  - 单词的增删改查
  - 批量操作支持
  - 掌握状态统计
- WordSetDao ( wordSetDao.js ): 单词集数据访问对象
  
  - 单词集的CRUD操作
  - 关联单词管理
- ProgressDao ( progressDao.js ): 学习记录数据访问
  
  - 学习记录存储
  - 进度统计分析
- SettingDao ( settingDao.js ): 应用设置数据访问
  
  - 用户配置管理 3.2.4 基础支撑层（Utils层）
  位置 : src/utils/ 职责 : 提供通用工具和基础设施支持

核心工具 :

- DbUtil ( dbUtil.js ):
  
  - 数据库连接管理
  - SQL操作封装
  - 多环境适配（SQLite/WebSQL/内存数据库）
- GameUtil ( gameUtil.js ): 游戏相关工具
  
  - 卡片洗牌算法
  - 游戏配置管理
- WordUtil ( wordUtil.js ): 单词处理工具
  
  - 数据格式验证
  - 编码转换
## 4. 路由架构
### 4.1 路由配置
文件 : src/router/index.js

采用Vue Router 4的动态导入模式，支持代码分割和懒加载：

```
const routes = [
  { path: '/', name: 'Home', component:()=>import('../views/index/index.vue') },
  { path: '/wordManage', name:'WordManage', component: () =>import('../views/wordManage/wordSetList.vue') },
  { path: '/wordInput', name: 'WordInput', component: () => import('../views/wordManage/wordInput.vue') },
  { path: '/gameSelect', name:'GameSelect', component: () =>import('../views/game/gameSelect.vue') },
  { path: '/gamePlay', name:'GamePlay', component: () => import('../views/game/gamePlay.vue') },
  { path: '/gameResult', name:'GameResult', component: () => import('../views/game/gameResult.vue') },
  { path: '/progress', name:'Progress', component: () => import('../views/progress/dailyReport.vue') },
  { path: '/setting', name:'Setting', component: () => import('../views/setting/settingIndex.vue') }
]
```
### 4.2 页面导航关系
```
首页 (/)
    ├── 单词管理 (/wordManage)
    │   └── 单词录入 (/wordInput)
    ├── 游戏选择 (/gameSelect)
    │   ├── 游戏进行 (/gamePlay)
    │   └── 游戏结果 (/gameResult)
    ├── 学习进度 (/progress)
    └── 设置 (/setting)
```
## 5. 数据库设计
### 5.1 数据库架构
项目使用SQLite作为主要数据库，支持多环境适配：

1. 原生SQLite : 生产环境首选
2. Web SQL : 浏览器环境备选
3. 内存数据库 : 开发调试环境
### 5.2 核心数据表

###  5.2.1 单词表 (word)

```
CREATE TABLE word (
  wordId TEXT PRIMARY KEY,         -- 单词唯一标识
  wordText TEXT NOT NULL,          -- 单词文本
  phonetic TEXT,                   -- 音标
  paraphrase TEXT NOT NULL,        -- 中文释义
  pronunciation TEXT,              -- 发音路径
  imageUrl TEXT,                   -- 配图路径
  setId TEXT NOT NULL,             -- 关联单词集ID
  createTime TEXT NOT NULL,        -- 创建时间
  masteryCount INTEGER DEFAULT 0,  -- 掌握次数
  masteryRate REAL DEFAULT 0,      -- 掌握率
  masteryStatus TEXT DEFAULT 'pending'      -- 掌握状态
)
```
5.2.2 单词集表 (wordSet)

CREATE TABLE wordSet (
  setId TEXT PRIMARY KEY,               -- 单词集ID
  setName TEXT NOT NULL,             -- 单词集名称
  category  TEXT,                                 -- 分类
  wordCount INTEGER DEFAULT 0,  -- 单词数量
  createTime TEXT NOT  NULL,         -- 创建时间
  isBuiltIn INTEGER DEFAULT 0,        -- 是否内置
  masteryRate REAL DEFAULT  0      -- 掌握率
)

``` 5.2.3 学习记录表 (learningRecord)
```
CREATE TABLE learningRecord (
  recordId TEXT PRIMARY  KEY,         	-- 记录ID
  setId TEXT NOT  NULL,                    	 -- 关联单词集ID
  setName TEXT NOT NULL,               	-- 单词集名称
  duration INTEGER NOT NULL,       	 -- 学习时长（秒）
  correctRate REAL NOT NULL,         	-- 正确率
  wrongWordIds  TEXT,                 		 -- 错误单词ID列表（JSON）
  createTime TEXT NOT NULL,          	-- 学习时间
  medalCount INTEGER DEFAULT 0,     -- 获得勋章数
  difficulty  TEXT,                   					-- 难度级别
  matchMode  TEXT,                   			 -- 匹配模式
  isPass INTEGER DEFAULT  0           	 -- 是否通关
)



6. 核心功能模块
### 6.1 单词管理模块
组件位置 : src/views/wordManage/ 服务位置 : src/services/wordService.js DAO位置 : src/db/wordDao.js , src/db/wordSetDao.js

功能特性 :

- 单条单词录入
- 批量文本导入
- 单词集创建和管理
- 单词掌握状态跟踪
### 6.2 连连看游戏模块
组件位置 : src/views/game/ 服务位置 : src/services/gameService.js 工具位置 : src/utils/gameUtil.js

核心算法 :

- 卡片匹配算法 : 基于单词ID的键值对匹配
- 随机排列算法 : Fisher-Yates洗牌算法
- 提示算法 : 遍历查找可匹配卡片对
### 6.3 学习进度模块
组件位置 : src/views/progress/dailyReport.vue DAO位置 : src/db/progressDao.js

功能特性 :

- 实时学习记录
- 单词掌握率统计
- 学习日报生成
- 历史数据管理
### 6.4 设置管理模块
组件位置 : src/views/setting/settingIndex.vue DAO位置 : src/db/settingDao.js

## 7. 数据流向分析
### 7.1 游戏流程数据流

```
用户选择单词集 → GameService.generateLevel() → 获取单词数据 → 生成关卡卡片
                    ↓
用户点击卡片 ← 匹配结果处理 ← GameService.checkMatch() ← 卡片选择交互
                    ↓
关卡结束 → GameService.endLevel() → 更新学习记录 → 更新掌握状态
```
### 7.2 单词管理数据流
```
用户录入单词 → WordService处理 → WordDao存储 → 数据库持久化
            ↓
单词集管理 ← WordSetService处理 ← WordSetDao ← 单词集CRUD操作
```
## 8. 模块依赖关系
### 8.1 依赖关系图
```
App.vue (根组件)
    ↓
main.js (入口文件)
    ↓
router (路由层)
    ↓
views/ (UI层)  ← 依赖 → services/ (业务逻辑层)
    ↓                              ↓
组件渲染                 GameService + WordService
                              ↓
                          db/ (数据访问层)
                              ↓
                          utils/ (工具层)
```
### 8.2 核心依赖
- UI层 → 业务逻辑层 : 通过Service接口调用

- 业务逻辑层 → 数据访问层 : 通过DAO接口调用
- 数据访问层 → 工具层 : 使用Utils提供的工具函数
- 所有层 → 路由层 : 使用Vue Router进行页面导航
## 9. 开发规范
### 9.1 命名规范
- 文件命名 : 使用kebab-case（如: word-service.js ）
- 组件命名 : 使用PascalCase（如: WordInput.vue ）
- 变量命名 : 使用camelCase（如: wordText ）
- 常量命名 : 使用UPPER_SNAKE_CASE（如: DB_NAME ）
### 9.2 架构原则
- 单一职责 : 每个模块专注于单一功能
- 依赖倒置 : 上层依赖接口，不依赖具体实现
- 开闭原则 : 对扩展开放，对修改关闭
- 接口隔离 : 提供最小化接口
## 10. 性能优化
### 10.1 代码分割
- 使用Vue Router的懒加载实现路由级别的代码分割
- 组件按需加载，减少初始包体积
### 10.2 数据库优化
- 使用事务处理批量操作
- 合理的索引设计
- 连接池管理
### 10.3 内存管理
- 及时清理事件监听器
- 避免内存泄漏
- 合理的数据缓存策略
## 11. 扩展性设计
### 11.1 模块化设计
- 各模块独立封装，耦合度低
- 可独立开发和测试
- 便于功能扩展和维护
### 11.2 数据层扩展
- 支持多种数据库后端
- DAO模式便于数据源切换
- 工具类可复用
### 11.3 业务层扩展
- Service层可轻松添加新业务
- 插件化的奖励机制
- 可配置的游戏规则
这份架构文档详细描述了单词豆项目的代码结构、各模块职责和相互关系，为开发团队提供了全面的技术参考。项目的四层架构设计确保了代码的可维护性和可扩展性，为后续功能迭代奠定了坚实基础。

7/7 已完成

分析项目整体目录结构

分析核心配置文件和依赖

分析视图层组件结构

分析数据访问层架构

分析业务逻辑层服务

分析路由和工具类

生成完整的代码架构文档

Thought

###
我已经为您完成了单词豆项目的全面代码结构分析，并生成了一份详细的中文代码架构文档。

## 文档主要内容总结：
### 📋 项目概述
- 项目定位：专为3-12岁儿童设计的英语单词记忆游戏工具
- 技术栈：Vue 3 + Vite + SQLite + Vue Router 4
### 🏗️ 四层架构设计
1. UI层（视图层） : 用户界面渲染与交互
2. 业务逻辑层（Service） : 核心业务逻辑处理
3. 数据访问层（DAO） : 数据持久化操作
4. 基础支撑层（Utils） : 通用工具和基础设施
### 📁 目录结构
完整的项目目录树状图，包含：

- 源代码目录（ src/ ）
- 静态资源（ assets/ ）
- 数据库访问层（ db/ ）
- 业务服务层（ services/ ）
- 视图组件（ views/ ）
- 工具类（ utils/ ）
- 路由配置（ router/ ）
### 🗃️ 数据库设计
详细的数据表结构：

- 单词表（word）
- 单词集表（wordSet）
- 学习记录表（learningRecord）
- 支持多环境适配（SQLite/WebSQL/内存数据库）
### 🔄 数据流向
清晰的模块间数据流向图，包括：

- 游戏流程数据流
- 单词管理数据流
- 模块依赖关系图
### 🎯 核心功能模块
- 连连看游戏模块
- 单词管理模块
- 学习进度模块
- 设置管理模块
### 🚀 性能优化与扩展性
- 代码分割策略
- 数据库优化
- 内存管理
- 模块化设计原则
这份架构文档为开发团队提供了：

- ✅ 完整的项目结构视图
- ✅ 清晰的模块职责划分
- ✅ 详细的依赖关系说明
- ✅ 便于代码定位的路径指引
- ✅ 符合开发规范的架构指导
文档内容条理清晰、层次分明，使用中文完整输出，便于开发人员快速理解项目架构和进行代码开发维护。