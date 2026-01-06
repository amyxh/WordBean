# 单词豆（儿童英语单词连连看小游戏）详细设计文档（V1.0）

文档版本：V1.0

编写日期：2025年12月30日

编写人：资深软件架构师

适用范围：开发团队（前端/测试），作为V1.0版本代码实现、模块对接、测试用例设计的直接依据，确保开发过程符合架构规范，功能与需求一致，0成本落地。

参考文档：1. 《单词豆（儿童英语单词连连看小游戏）需求说明文档（V1.0）》；2. 《单词豆（儿童英语单词连连看小游戏）程序概要设计文档（V1.0）》；3. 《单词豆V1.0 0成本开发优先级清单》

# 一、文档引言

## 1.1 设计目的

1.  细化概要设计中的架构与模块，明确各模块的技术实现细节、代码结构、数据流转逻辑、接口参数规范，降低开发门槛，确保开发团队按统一标准落地；

2.  聚焦0成本开发核心，明确免费技术栈的具体应用方式、开源资源的集成方案，规避付费依赖，确保开发全程无成本投入；

3.  解决开发中的关键技术难点（如多端适配、批量导入解析、卡片匹配算法），提供具体实现方案与代码示例，提升开发效率，减少技术踩坑；

4.  明确数据存储结构、加密方式、异常处理机制，确保本地数据安全稳定，多端适配流畅，满足非功能需求中的性能、安全要求。

## 1.2 设计范围

覆盖单词豆V1.0版本全量P0级核心功能模块，包括：自定义单词管理模块、连连看核心游戏模块、基础进度跟踪模块、基础设置模块、多端适配模块，同时包含数据层、接口层、异常处理、性能优化等技术细节，不涉及P1/P2级延后功能的详细设计。

## 1.3 核心设计约束

1. **成本约束**：全程采用免费技术栈/开源资源，禁止使用任何付费工具、插件、服务，核心算法基于原生JS实现，无第三方付费依赖；

2. **技术约束**：前端框架统一为Uni-app（Vue3+Vite），UI组件库为uView UI免费版，本地存储采用Uni-app Storage+SQLite，多端适配基于Uni-app条件编译；

3. **性能约束**：首屏加载≤3秒，关卡加载≤1秒，操作响应≤0.5秒，连续运行1小时无闪退、卡顿，本地数据存储无丢失；

4. **安全约束**：用户数据仅本地加密存储（AES-128），无云端上传，不收集个人信息，仅申请必要权限（拍照/相册），符合《未成年人网络保护条例》；

5. **适配约束**：兼容Android 8.0+/iOS 12.0+/Windows 10+/macOS 10.15+，微信小程序7.0+，核心功能多端表现一致，无界面错乱。

# 二、总体技术架构细化

## 2.1 架构分层详细设计

基于概要设计的四层架构，进一步细化各层的职责、目录结构、核心组件，确保代码组织规范，模块解耦清晰。

### 2.1.1 UI层（视图层）

**核心职责**：负责多端界面渲染、用户操作交互、视觉反馈展示，适配不同终端的分辨率与操作习惯，复用通用组件，减少重复开发。

**目录结构（Uni-app规范）**：

```text

pages/                  // 页面目录（按模块划分）
  index/                // 首页（入口页面）
    index.vue           // 首页布局（单词集列表+游戏入口+设置入口）
  wordManage/           // 自定义单词管理模块页面
    wordInput.vue       // 单词录入（单条+批量导入）
    wordSetList.vue     // 单词集列表
    wordSetEdit.vue     // 单词集编辑/删除
  game/                 // 连连看游戏模块页面
    gameSelect.vue      // 游戏选择（单词集+难度+模式）
    gamePlay.vue        // 游戏游玩界面
    gameResult.vue      // 游戏结束结果页
  progress/             // 进度跟踪模块页面
    dailyReport.vue     // 学习日报
    wordMastery.vue     // 单词掌握率
  setting/              // 基础设置模块页面
    settingIndex.vue    // 设置首页
    dataManage.vue      // 数据备份/清除
components/             // 通用组件目录（全局复用）
  common/               // 基础通用组件
    Card.vue            // 单词卡片组件（游戏/列表通用）
    Button.vue          // 自定义按钮组件（儿童友好型）
    Modal.vue           // 弹窗组件（确认/提示）
  game/                 // 游戏专用组件
    GameCard.vue        // 游戏匹配卡片组件
    HintButton.vue      // 提示按钮组件
    RewardAnimation.vue // 奖励动画组件
  word/                 // 单词管理专用组件
    WordForm.vue        // 单词录入表单组件
    BatchImport.vue     // 批量导入组件
static/                 // 静态资源目录（免费资源）
  images/               // 图片资源（无版权图库获取）
  audio/                // 音效资源（开源免费音效）
  animation/            // 动画资源（Lottie免费模板）
uni_modules/            // 第三方组件（uView UI免费版）
```

**核心组件设计**：

1. **Card.vue（通用单词卡片）**：支持展示单词、音标、释义、配图，可配置点击事件、选中状态，适配多端尺寸（手机端宽80px，平板端宽100px）；

2. **GameCard.vue（游戏卡片）**：继承通用卡片组件，新增匹配状态（未匹配/选中/已消除）、动画效果（消除/选中动画），支持高亮提示；

3. **WordForm.vue（单词录入表单）**：包含单词、音标、释义输入框，配图上传按钮，表单校验逻辑，支持单条录入与批量导入预览。

### 2.1.2 业务逻辑层（核心层）

**核心职责**：实现各模块核心业务逻辑，处理UI层的交互请求，调用数据访问层接口操作数据，确保业务流程闭环，模块间通过事件总线通信，无直接依赖。

**目录结构**：

```text

store/                  // 全局状态管理（Pinia，Vue3推荐）
  modules/
    wordStore.js        // 单词管理模块状态（当前选中单词集、单词列表）
    gameStore.js        // 游戏模块状态（难度、模式、关卡数据）
    progressStore.js    // 进度跟踪模块状态（当日学习数据、掌握率）
utils/                  // 工具类目录（全局复用）
  common.js             // 通用工具（格式校验、日期处理、加密解密）
  gameUtil.js           // 游戏工具（卡片排列、匹配校验、提示逻辑）
  wordUtil.js           // 单词工具（批量导入解析、单词集管理）
services/               // 业务服务层（封装核心业务逻辑）
  wordService.js        // 单词管理服务（录入、编辑、删除、查询）
  gameService.js        // 游戏服务（关卡生成、匹配判断、奖励发放）
  progressService.js    // 进度跟踪服务（学习记录、日报生成、掌握率计算）
  settingService.js     // 基础设置服务（时长限制、音效设置、数据备份）
eventBus/               // 事件总线（跨组件/跨模块通信）
  index.js              // 事件总线封装（on/off/emit）
```

**核心服务设计**：

1. **wordService.js**：封装单词录入、单词集管理的核心逻辑，调用数据访问层接口操作本地数据库，返回统一格式的结果（success、data、message）；

2. **gameService.js**：封装关卡生成、卡片匹配、提示逻辑、奖励发放，基于游戏状态动态更新数据，触发进度跟踪服务记录学习数据；

3. **progressService.js**：监听游戏结束事件，收集学习数据，计算单词掌握率，每日24点自动生成学习日报，提供数据查询接口。

### 2.1.3 数据访问层（数据层）

**核心职责**：负责本地数据的存储、读取、更新、删除，实现数据加密与安全管控，封装数据库操作接口，供业务逻辑层调用，确保数据操作高效、安全。

**目录结构**：

```text

db/                    // 数据库目录
  index.js              // 数据库初始化（SQLite+Uni-app Storage）
  wordDao.js            // 单词数据访问对象（CRUD操作）
  wordSetDao.js         // 单词集数据访问对象（CRUD操作）
  progressDao.js        // 进度数据访问对象（CRUD操作）
  settingDao.js         // 设置数据访问对象（CRUD操作）
encrypt/                // 数据加密目录
  aes.js                // AES-128加密/解密工具（本地数据加密）
backup/                 // 数据备份目录
  backupUtil.js         // 数据备份/恢复工具（本地文本导出/导入）
```

**数据库设计细化**：

1. **数据库选型**：采用SQLite（结构化数据，如单词、单词集、学习记录）+ Uni-app Storage（简易数据，如设置项、缓存数据），均为免费本地存储方案；

2. **数据库初始化**：App首次启动时，自动创建数据库（word_bean.db），创建4张核心数据表（word、word_set、learning_record、setting），并初始化3个内置单词集数据；

3. **数据加密**：单词表、学习记录表的核心字段（如wordText、paraphrase、wrongWordIds）采用AES-128加密存储，密钥基于设备唯一标识生成，避免数据泄露。

### 2.1.4 基础支撑层（支撑层）

**核心职责**：提供多端适配、权限管理、日志记录、异常处理等基础支撑，保障整体架构稳定运行，适配不同终端的个性化需求。

**核心支撑模块**：

1. **多端适配模块**：基于Uni-app条件编译，封装适配工具（adaptUtil.js），提供终端判断、尺寸适配、布局调整等接口，统一多端表现；

2. **权限管理模块**：封装权限申请工具（permissionUtil.js），仅申请拍照、相册权限，申请前提示权限用途，兼容多端权限申请逻辑；

3. **日志记录模块**：封装日志工具（logUtil.js），记录错误日志、操作日志（本地存储，最大100条，自动清理过期日志），便于问题排查；

4. **异常处理模块**：封装全局异常捕获工具（errorUtil.js），统一处理接口异常、页面异常、数据异常，弹窗提示用户，避免程序闪退。

## 2.2 技术栈详细配置

### 2.2.1 核心技术配置（免费开源）

|技术类别|具体技术|版本要求|配置要点|
|---|---|---|---|
|框架|Uni-app（Vue3+Vite）|Vue3.2+，Vite2.0+|pages.json中配置多端页面路径，manifest.json中设置多端适配参数，关闭不必要的权限申请|
|UI组件库|uView UI（免费版）|2.0+（Vue3版）|main.js中全局注册，配置自定义主题（蓝、黄、绿为主色调），适配儿童审美|
|本地存储|SQLite+Uni-app Storage|Uni-app基础库2.20.0+|SQLite数据库版本1.0，Uni-app Storage设置加密存储（AES-128）|
|工具类|Day.js、js-base64|Day.js1.11+，js-base643.7+|Day.js用于日期格式化（学习日报、创建时间），js-base64辅助加密|
|动画/音效|Lottie、uni.createInnerAudioContext|Lottie5.10+|Lottie加载免费动画模板，音效文件压缩至单文件≤50KB，避免加载卡顿|
### 2.2.2 0成本资源配置

1. **图片资源**：选用Pexels、Pixabay等免费无版权图库，下载后压缩处理（png格式，单张≤200KB），内置单词集配图统一存储在static/images/builtin目录；

2. **音效资源**：从Freesound、Mixkit等免费音效网站下载，格式转为mp3，压缩至单文件≤50KB，存储在static/audio目录，包含匹配正确、错误、奖励等音效；

3. **动画资源**：从LottieFiles免费模板库下载动画（如卡片消除、奖励弹出），JSON格式存储在static/animation目录，通过lottie-miniprogram插件加载；

4. **字体资源**：选用思源黑体（免费商用），通过@font-face引入，设置为全局字体，确保多端字体一致，适配儿童阅读。

# 三、核心模块详细设计

## 3.1 自定义单词管理模块（P0级）

### 3.1.1 模块概述

核心功能：实现单词单条录入、文本批量导入、单词集创建/编辑/删除、单词集分享（简化版），核心数据存储在本地SQLite数据库，支持加密存储，适配多端操作。

技术难点：批量导入文本解析、单词集与单词的关联关系、多端适配下的配图上传。

### 3.1.2 数据结构细化

#### 1. 单词表（word）

|字段名称|字段类型|是否必填|长度限制|加密状态|备注|
|---|---|---|---|---|---|
|wordId|TEXT|是|32位|否|唯一标识，格式：timeStamp+random(6)，如1735689600123456|
|wordText|TEXT|是|50位|是|单词文本，如apple|
|phonetic|TEXT|否|100位|是|音标，如/ˈæpl/|
|paraphrase|TEXT|是|200位|是|中文释义，如苹果|
|pronunciation|TEXT|否|200位|否|发音路径，默认系统合成，格式：system:wordText|
|imageUrl|TEXT|否|200位|否|配图路径，本地存储路径，如：/storage/emulated/0/word_bean/images/123.png|
|setId|TEXT|是|32位|否|关联单词集ID，外键关联word_set表的setId|
|createTime|TEXT|是|20位|否|创建时间，格式：YYYY-MM-DD HH:MM:SS|
|masteryCount|INTEGER|是|默认0|否|正确匹配次数，≥3次标记为已掌握|
#### 2. 单词集表（word_set）

|字段名称|字段类型|是否必填|长度限制|加密状态|备注|
|---|---|---|---|---|---|
|setId|TEXT|是|32位|否|单词集唯一标识，格式：timeStamp+random(6)|
|setName|TEXT|是|100位|是|单词集名称，如“三年级上册-人教PEP”|
|category|TEXT|否|50位|是|分类，如“年级/教材/主题”|
|wordCount|INTEGER|是|10-50|否|单词数量，严格限制10-50个|
|createTime|TEXT|是|20位|否|创建时间，格式：YYYY-MM-DD HH:MM:SS|
|isBuiltIn|INTEGER|是|0/1|否|是否内置单词集：0=自定义，1=内置|
|masteryRate|REAL|是|0.00-1.00|否|单词掌握率，保留2位小数|
### 3.1.3 核心功能实现细节

#### 1. 单条单词录入

1. **操作流程**：家长进入单词录入页面 → 填写单词、音标、释义 → 可选上传配图（拍照/相册）→ 选择所属单词集 → 点击“保存”→ 表单校验 → 调用wordService接口 → 数据加密后存入数据库 → 弹窗提示“录入成功”；

2. **表单校验（原生JS实现）**：
        

    - 单词文本：非空校验，长度≤50位，仅允许字母、数字、连字符（-）；

    - 中文释义：非空校验，长度≤200位；

    - 配图：格式校验（仅支持png/jpg/jpeg），大小≤2MB，压缩后存储；

    - 校验失败：弹窗提示具体错误（如“单词不能为空”“配图格式错误”），焦点定位到错误字段。

3. **代码示例（表单校验）**：
        `// utils/wordUtil.js
export const validateWordForm = (form) => {
  const errors = [];
  // 单词校验
  if (!form.wordText.trim()) {
    errors.push("单词不能为空");
  } else if (form.wordText.length > 50) {
    errors.push("单词长度不能超过50位");
  } else if (!/^[a-zA-Z0-9-]+$/.test(form.wordText.trim())) {
    errors.push("单词仅允许字母、数字、连字符");
  }
  // 释义校验
  if (!form.paraphrase.trim()) {
    errors.push("中文释义不能为空");
  } else if (form.paraphrase.length > 200) {
    errors.push("释义长度不能超过200位");
  }
  // 配图校验
  if (form.imageUrl && !/.(png|jpg|jpeg)$/i.test(form.imageUrl)) {
    errors.push("配图仅支持png/jpg/jpeg格式");
  }
  return {
    valid: errors.length === 0,
    errors: errors.join("；")
  };
};`

#### 2. 文本批量导入

1. **操作流程**：家长进入批量导入页面 → 点击“选择文件”→ 选择本地.txt文件 → 系统解析文件内容 → 展示导入预览（含错误数据标记）→ 家长确认导入 → 调用wordService接口 → 批量插入数据库 → 弹窗提示“导入成功，成功X个，失败X个”；

2. **文本解析逻辑（原生JS实现）**：
        

    - 文件读取：通过uni.chooseFile选择.txt文件，使用FileReader读取文件内容；

    - 格式解析：按行拆分内容，每行按英文逗号分隔字段（顺序：单词,音标,释义），音标可选（留空则赋值为空字符串）；

    - 错误判断：空行跳过，字段缺失（无单词/释义）标记为错误数据，记录错误原因；

    - 导入限制：单次导入上限50个单词，超过则提示“单次导入最多50个单词”。

3. **代码示例（文本解析）**：
        `// services/wordService.js
export const batchImportWords = async (fileContent, setId) => {
  const lines = fileContent.split("\n");
  const successList = [];
  const failList = [];
  // 遍历解析每行
  lines.forEach((line, index) => {
    const trimLine = line.trim();
    if (!trimLine) return; // 跳过空行
    const [wordText, phonetic = "", paraphrase] = trimLine.split(",");
    // 校验字段
    const validateResult = validateWordForm({ wordText, phonetic, paraphrase });
    if (!validateResult.valid) {
      failList.push({ line: index + 1, content: trimLine, reason: validateResult.errors });
      return;
    }
    // 构造单词数据
    const wordData = {
      wordId: `${Date.now()}${Math.floor(Math.random() * 1000000)}`,
      wordText: wordText.trim(),
      phonetic: phonetic.trim(),
      paraphrase: paraphrase.trim(),
      setId,
      createTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      masteryCount: 0
    };
    // 加密核心字段
    wordData.wordText = encryptAES(wordData.wordText);
    wordData.phonetic = encryptAES(wordData.phonetic);
    wordData.paraphrase = encryptAES(wordData.paraphrase);
    successList.push(wordData);
  });
  // 限制导入数量
  if (successList.length > 50) {
    return { success: false, message: "单次导入最多50个单词" };
  }
  // 批量插入数据库
  if (successList.length > 0) {
    await wordDao.batchInsert(successList);
    // 更新单词集数量
    await wordSetDao.updateWordCount(setId, successList.length);
  }
  return {
    success: true,
    data: { successCount: successList.length, failCount: failList.length, failWords: failList },
    message: `导入完成，成功${successList.length}个，失败${failList.length}个`
  };
};`

#### 3. 单词集管理

1. **创建单词集**：家长输入单词集名称、选择分类 → 校验名称非空（长度≤100位）→ 生成setId → 插入word_set表 → 弹窗提示“创建成功”；内置单词集在数据库初始化时插入（isBuiltIn=1），支持编辑修改；

2. **编辑/删除单词集**：编辑时修改名称、分类，同步更新word_set表；删除时先删除关联的单词数据，再删除单词集数据，删除前弹窗确认，支持10秒内撤销（通过临时存储删除数据实现）；

3. **单词集分享（简化版）**：生成分享链接（格式：word-bean://share?setId=xxx），通过Uni-app的uni.share接口分享至微信，好友打开链接后可导入单词集（读取setId对应的单词数据，复制到本地数据库）。

## 3.2 连连看核心游戏模块（P0级）

### 3.2.1 模块概述

核心功能：实现单词集选择、关卡生成、卡片匹配、提示功能、互动反馈与奖励发放，确保游戏操作流畅，反馈及时，适配多端操作习惯，核心算法基于原生JS实现，无第三方依赖。

技术难点：卡片随机排列、匹配校验、多端动画适配、学习数据实时记录。

### 3.2.2 数据结构细化（学习记录表）

|字段名称|字段类型|是否必填|长度限制/默认值|加密状态|备注|
|---|---|---|---|---|---|
|recordId|TEXT|是|32位|否|学习记录唯一标识，格式：timeStamp+random(6)|
|setId|TEXT|是|32位|否|关联单词集ID|
|setName|TEXT|是|100位|是|单词集名称（加密存储）|
|duration|INTEGER|是|默认0|否|游戏时长（单位：秒）|
|correctRate|REAL|是|0.00-1.00|否|正确率（保留2位小数）|
|wrongWordIds|TEXT|否|不限|是|错误单词ID列表（JSON格式，加密存储）|
|createTime|TEXT|是|20位|否|学习时间，格式：YYYY-MM-DD HH:MM:SS|
|medalCount|INTEGER|是|默认0|否|获得勋章数量（1局1枚）|
### 3.2.3 核心功能实现细节

#### 1. 关卡生成

1. **单词集选择与数据获取**：用户选择单词集 → 调用wordService接口获取单词数据（解密核心字段）→ 按单词数量拆分关卡（10-20个/关，50个单词对应3关）；

2. **难度与布局匹配**：

    - 简单难度：3×4布局（12张卡片，6对匹配项），无时间限制；

    - 中等难度：4×5布局（20张卡片，10对匹配项），10分钟/局；

    - 困难难度：5×6布局（30张卡片，15对匹配项），5分钟/局；

    - 布局尺寸适配：通过adaptUtil.js获取终端尺寸，动态计算卡片大小（手机端卡片宽80px，平板端宽100px，电脑端宽120px）。

3. **卡片数据组装**：根据匹配模式（单词-释义/单词-图片）组装卡片数据，每对匹配项生成两张卡片（如单词卡+释义卡），卡片包含cardId（唯一标识）、content（内容）、type（卡片类型）、matched（匹配状态）、selected（选中状态）；

4. **随机排列算法（Fisher-Yates洗牌）**：
        `// utils/gameUtil.js
export const shuffleCards = (cards) => {
  // 深拷贝卡片数组，避免修改原数组
  const newCards = [...cards];
  for (let i = newCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // 交换位置
    [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
  }
  return newCards;
};`

5. **关卡生成代码示例**：
        `// services/gameService.js
import { shuffleCards } from '@/utils/gameUtil';
import { wordDao } from '@/db/wordDao';
import { wordSetDao } from '@/db/wordSetDao';
import { decryptAES } from '@/encrypt/aes';
import dayjs from 'dayjs';

export const generateLevel = async (setId, difficulty, matchMode) => {
  try {
    // 1. 获取单词集数据（校验合法性）
    const wordSet = await wordSetDao.getById(setId);
    if (!wordSet) {
      throw new Error("单词集不存在或已删除");
    }
    // 2. 获取单词数据（解密核心字段，过滤无效数据）
    let words = await wordDao.getBySetId(setId);
    if (words.length < 10) {
      throw new Error("单词集单词数量不足10个，无法生成关卡");
    }
    // 解密并格式化单词数据
    words = words.map(word => ({
      ...word,
      wordText: decryptAES(word.wordText),
      phonetic: decryptAES(word.phonetic) || '',
      paraphrase: decryptAES(word.paraphrase),
      imageUrl: word.imageUrl || ''
    })).filter(word => word.wordText && word.paraphrase); // 过滤核心字段为空的单词

    // 3. 按难度确定每关单词对数（匹配项数量）
    let pairCount = 0;
    let layout = ''; // 布局标识（用于UI渲染）
    let timeLimit = 0; // 时间限制（秒，0为无限制）
    switch (difficulty) {
      case "easy":
        pairCount = Math.min(6, Math.floor(words.length / 2)); // 最多6对，避免单词不足
        layout = "3x4";
        timeLimit = 0;
        break;
      case "medium":
        pairCount = Math.min(10, Math.floor(words.length / 2));
        layout = "4x5";
        timeLimit = 600; // 10分钟
        break;
      case "hard":
        pairCount = Math.min(15, Math.floor(words.length / 2));
        layout = "5x6";
        timeLimit = 300; // 5分钟
        break;
      default:
        pairCount = 6;
        layout = "3x4";
        timeLimit = 0;
    }

    // 4. 随机选择单词（避免重复），生成匹配卡片对
    const selectedWords = shuffleCards(words).slice(0, pairCount);
    const cards = [];
    selectedWords.forEach(word => {
      // 生成卡片唯一ID（时间戳+随机数，确保不重复）
      const cardId1 = `card_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const cardId2 = `card_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // 根据匹配模式生成两张对应卡片
      if (matchMode === "word-paraphrase") {
        // 模式1：单词卡 + 释义卡
        cards.push({
          cardId: cardId1,
          content: word.wordText,
          type: "word",
          matched: false,
          selected: false,
          wordId: word.wordId // 关联单词ID，用于记录学习数据
        });
        cards.push({
          cardId: cardId2,
          content: word.paraphrase,
          type: "paraphrase",
          matched: false,
          selected: false,
          wordId: word.wordId
        });
      } else if (matchMode === "word-image") {
        // 模式2：单词卡 + 图片卡（无图片则降级为释义卡）
        const imageContent = word.imageUrl ? word.imageUrl : word.paraphrase;
        const imageType = word.imageUrl ? "image" : "paraphrase";
        cards.push({
          cardId: cardId1,
          content: word.wordText,
          type: "word",
          matched: false,
          selected: false,
          wordId: word.wordId
        });
        cards.push({
          cardId: cardId2,
          content: imageContent,
          type: imageType,
          matched: false,
          selected: false,
          wordId: word.wordId
        });
      }
    });

    // 5. 洗牌打乱卡片顺序，生成关卡数据
    const shuffledCards = shuffleCards(cards);
    const levelData = {
      levelId: `level_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      setId: setId,
      setName: decryptAES(wordSet.setName),
      difficulty: difficulty,
      matchMode: matchMode,
      layout: layout,
      timeLimit: timeLimit,
      cards: shuffledCards,
      totalPairs: pairCount,
      matchedPairs: 0, // 已匹配对数（初始为0）
      startTime: dayjs().format("YYYY-MM-DD HH:mm:ss"), // 关卡开始时间
      wrongCount: 0, // 错误匹配次数（初始为0）
      hintCount: 0 // 提示使用次数（初始为0）
    };

    // 6. 存储当前关卡数据到全局状态，供游戏界面使用
    const gameStore = useGameStore();
    gameStore.setCurrentLevel(levelData);

    return {
      success: true,
      data: levelData,
      message: `关卡生成成功，共${pairCount}对匹配项，布局：${layout}`
    };
  } catch (error) {
    // 异常捕获与日志记录
    console.error("关卡生成失败：", error);
    logUtil.recordError("gameService.generateLevel", error.message);
    return {
      success: false,
      message: `关卡生成失败：${error.message}`
    };
  }
` `};`

6. **关卡加载优化**：关卡数据生成后，优先渲染卡片布局，再异步加载图片资源（图片采用懒加载，未加载完成时显示占位图），确保关卡加载≤1秒；同时缓存当前单词集的关卡数据，同一单词集短时间内重复进入可直接复用缓存，减少重复计算。

#### 2. 卡片匹配核心逻辑

1. **匹配交互流程**：用户点击第一张卡片（设置selected=true，播放选中动画）→ 点击第二张卡片（设置selected=true）→ 调用匹配校验接口 → 匹配成功/失败 → 执行对应反馈（动画+音效）→ 更新关卡状态；

2. **匹配校验规则**：
        核心校验：两张卡片的wordId一致，且类型为对应匹配模式（如word-paraphrase模式需一张为word类型、一张为paraphrase类型）；

3. 无效点击过滤：点击已匹配卡片（matched=true）、重复点击同一卡片、短时间内连续点击（300ms防抖），均不触发匹配校验；

4. 防抖处理：通过setTimeout实现300ms防抖，避免快速点击导致的匹配错乱。

5. **匹配逻辑代码示例**：
        `// services/gameService.js
export const checkCardMatch = async (card1Id, card2Id) => {
  const gameStore = useGameStore();
  const currentLevel = gameStore.currentLevel;
  if (!currentLevel) {
    throw new Error("当前无活跃关卡");
  }

  // 1. 获取两张卡片数据
  const card1 = currentLevel.cards.find(card => card.cardId === card1Id);
  const card2 = currentLevel.cards.find(card => card.cardId === card2Id);
  if (!card1 || !card2) {
    throw new Error("卡片不存在");
  }
  if (card1.matched || card2.matched) {
    throw new Error("无法点击已匹配卡片");
  }
  if (card1Id === card2Id) {
    throw new Error("请选择不同的卡片");
  }

  // 2. 匹配校验
  const isMatched = (card1.wordId === card2.wordId) && 
                    ((card1.type === "word" && card2.type === "paraphrase") || 
                     (card1.type === "paraphrase" && card2.type === "word") || 
                     (card1.type === "word" && card2.type === "image") || 
                     (card1.type === "image" && card2.type === "word"));

  // 3. 执行匹配结果处理
  if (isMatched) {
    // 匹配成功：更新卡片状态，播放成功动画与音效
    card1.matched = true;
    card1.selected = false;
    card2.matched = true;
    card2.selected = false;
    currentLevel.matchedPairs += 1;
    // 记录单词正确匹配次数（更新掌握度）
    await wordDao.incrementMasteryCount(card1.wordId);
    // 播放成功反馈（音效+动画，通过事件总线通知UI层）
    eventBus.emit("cardMatchSuccess", { card1, card2 });
  } else {
    // 匹配失败：重置选中状态，播放失败动画与音效，记录错误次数
    currentLevel.wrongCount += 1;
    // 记录错误单词（用于后续复习）
    if (!currentLevel.wrongWordIds.includes(card1.wordId)) {
      currentLevel.wrongWordIds.push(card1.wordId);
    }
    if (!currentLevel.wrongWordIds.includes(card2.wordId)) {
      currentLevel.wrongWordIds.push(card2.wordId);
    }
    // 300ms后重置选中状态（给用户视觉反馈时间）
    setTimeout(() => {
      card1.selected = false;
      card2.selected = false;
      // 播放失败反馈
      eventBus.emit("cardMatchFail", { card1, card2 });
    }, 300);
  }

  // 4. 更新全局关卡状态
  gameStore.updateCurrentLevel(currentLevel);

  // 5. 检查关卡是否结束（已匹配对数=总对数）
  if (currentLevel.matchedPairs === currentLevel.totalPairs) {
    await endLevel(currentLevel);
  }

  return {
    success: true,
    data: { isMatched, matchedPairs: currentLevel.matchedPairs, totalPairs: currentLevel.totalPairs },
    message: isMatched ? "匹配成功！" : "匹配失败，再试试~"
  };
` `};`

#### 3. 提示功能实现（无成本）

1. **提示逻辑**：基于当前关卡未匹配卡片，随机筛选一对可匹配卡片，通过高亮边框（红色/黄色）提示用户，每局游戏提示次数限制为3次（避免过度依赖），使用提示后更新hintCount；

2. **代码示例**：
        `// utils/gameUtil.js
export const getHint = (cards) => {
  // 筛选未匹配的卡片
  const unmatchedCards = cards.filter(card => !card.matched);
  if (unmatchedCards.length < 2) {
    return null; // 无可用提示
  }

  // 查找一对可匹配的卡片
  const matchedPairs = [];
  for (let i = 0; i < unmatchedCards.length; i++) {
    for (let j = i + 1; j < unmatchedCards.length; j++) {
      const card1 = unmatchedCards[i];
      const card2 = unmatchedCards[j];
      const isMatched = (card1.wordId === card2.wordId) && 
                        ((card1.type === "word" && card2.type === "paraphrase") || 
                         (card1.type === "paraphrase" && card2.type === "word") || 
                         (card1.type === "word" && card2.type === "image") || 
                         (card1.type === "image" && card2.type === "word"));
      if (isMatched) {
        matchedPairs.push([card1, card2]);
      }
    }
  }

  // 随机返回一对提示（无匹配对则返回null）
  if (matchedPairs.length === 0) {
    return null;
  }
  return matchedPairs[Math.floor(Math.random() * matchedPairs.length)];
` `};`

3. **提示交互**：用户点击提示按钮 → 校验提示次数（≤3次）→ 调用getHint获取提示卡片对 → UI层高亮提示卡片（持续1.5秒）→ 提示次数+1，更新关卡状态。

#### 4. 关卡结束与学习数据记录

1. **关卡结束触发条件**：已匹配对数=总对数（通关）、时间限制内未通关（超时）、用户主动退出关卡；

2. **结束逻辑代码示例**：
        `// services/gameService.js
export const endLevel = async (levelData) => {
  try {
    // 1. 计算关卡结束相关数据
    const endTime = dayjs();
    const startTime = dayjs(levelData.startTime);
    const duration = endTime.diff(startTime, 'second'); // 游戏时长（秒）
    const totalClicks = levelData.matchedPairs * 2 + levelData.wrongCount; // 总点击次数
    const correctRate = totalClicks > 0 ? (levelData.matchedPairs * 2 / totalClicks).toFixed(2) : 0; // 正确率
    const isPass = levelData.matchedPairs === levelData.totalPairs; // 是否通关
    const medalCount = isPass ? 1 : 0; // 通关获1枚勋章，未通关0枚

    // 2. 组装学习记录数据（加密核心字段）
    const learningRecord = {
      recordId: `record_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      setId: levelData.setId,
      setName: encryptAES(levelData.setName),
      duration: duration,
      correctRate: parseFloat(correctRate),
      wrongWordIds: encryptAES(JSON.stringify([...new Set(levelData.wrongWordIds)])), // 去重后加密
      createTime: endTime.format("YYYY-MM-DD HH:mm:ss"),
      medalCount: medalCount,
      difficulty: levelData.difficulty,
      matchMode: levelData.matchMode,
      isPass: isPass ? 1 : 0 // 1=通关，0=未通关
    };

    // 3. 存储学习记录到数据库
    await progressDao.insertLearningRecord(learningRecord);

    // 4. 更新单词集掌握率
    await progressService.updateWordSetMastery(levelData.setId);

    // 5. 生成关卡结果数据，通知UI层展示结果页
    const levelResult = {
      isPass: isPass,
      medalCount: medalCount,
      duration: duration,
      correctRate: correctRate,
      matchedPairs: levelData.matchedPairs,
      totalPairs: levelData.totalPairs,
      wrongCount: levelData.wrongCount,
      hintCount: levelData.hintCount,
      wrongWords: await getWrongWordsDetail(levelData.wrongWordIds) // 获取错误单词详情（解密后）
    };

    // 6. 清空当前关卡状态，缓存结果数据
    const gameStore = useGameStore();
    gameStore.clearCurrentLevel();
    gameStore.setLevelResult(levelResult);

    // 7. 通知UI层跳转至结果页
    eventBus.emit("levelEnd", levelResult);

    return {
      success: true,
      data: levelResult,
      message: isPass ? "关卡通关！" : "关卡未通关~"
    };
  } catch (error) {
    console.error("关卡结束处理失败：", error);
    logUtil.recordError("gameService.endLevel", error.message);
    return {
      success: false,
      message: `关卡结束处理失败：${error.message}`
    };
  }
` `};`

3. **学习数据联动**：关卡结束后，自动调用进度跟踪服务，更新单词掌握度、单词集掌握率，生成当日学习日报，供进度跟踪模块展示。

#### 5. 多端适配与性能优化

1. **卡片交互适配**：手机端支持点击/长按操作，平板端支持点击/滑动选择，电脑端支持鼠标点击/键盘方向键选择，通过adaptUtil.js判断终端类型，动态绑定事件；

2. **动画优化**：卡片选中/消除动画采用CSS3动画（transform+opacity），避免使用JS动画导致卡顿；动画时长控制在300ms内，确保交互流畅；

3. **内存优化**：关卡结束后，及时清理卡片数据缓存，销毁未使用的DOM元素，避免内存泄漏；连续运行1小时后，自动清理历史日志与临时缓存。

## 3.3 基础进度跟踪模块（P0级）

### 3.3.1 模块概述

核心功能：实现学习日报生成、单词掌握率统计、单词集掌握率统计，数据仅本地存储，支持按日期查询历史学习记录，适配多端展示，无云端同步功能（P1级迭代）。

技术难点：掌握率实时计算、日报数据聚合、多端数据展示适配。

### 3.3.2 核心功能实现细节

#### 1. 单词掌握率计算

1. **计算规则**：单词掌握率=正确匹配次数/总匹配次数（保留2位小数），正确匹配次数≥3次且掌握率≥0.8，标记为“已掌握”；正确匹配次数≤1次且掌握率≤0.3，标记为“未掌握”；其余为“待巩固”；

2. **代码示例**：
        `// services/progressService.js
export const calculateWordMastery = async (wordId) => {
  // 获取单词数据（含正确匹配次数）
  const word = await wordDao.getById(wordId);
  if (!word) {
    throw new Error("单词不存在");
  }
  // 获取该单词的学习记录（近30天）
  const records = await progressDao.getLearningRecordsByWordId(wordId, 30);
  // 计算总匹配次数（正确+错误）
  let totalMatchCount = 0;
  records.forEach(record => {
    const wrongWords = JSON.parse(decryptAES(record.wrongWordIds)) || [];
    const wrongCount = wrongWords.filter(id => id === wordId).length;
    const correctCount = word.masteryCount;
    totalMatchCount += correctCount + wrongCount;
  });
  // 计算掌握率（避免除数为0）
  const masteryRate = totalMatchCount > 0 ? (word.masteryCount / totalMatchCount).toFixed(2) : 0;
  // 标记掌握状态
  let masteryStatus = "pending"; // pending=待巩固
  if (word.masteryCount >= 3 && masteryRate >= 0.8) {
    masteryStatus = "mastered"; // mastered=已掌握
  } else if (word.masteryCount <= 1 && masteryRate <= 0.3) {
    masteryStatus = "unmastered"; // unmastered=未掌握
  }
  // 更新单词掌握率与状态
  await wordDao.updateMasteryInfo(wordId, { masteryRate, masteryStatus });
  return {
    wordId: wordId,
    wordText: decryptAES(word.wordText),
    masteryCount: word.masteryCount,
    totalMatchCount: totalMatchCount,
    masteryRate: masteryRate,
    masteryStatus: masteryStatus
  };
` `};`

3. **更新时机**：单词匹配成功后、关卡结束后、每日24点自动批量更新（通过定时任务实现）。

#### 2. 学习日报生成

1. **日报数据维度**：日期、总学习时长、总通关局数、总获得勋章数、平均正确率、已掌握单词数、未掌握单词数、重点复习单词（错误次数≥2次）；

2. **生成逻辑**：每日24点触发定时任务，聚合当日所有学习记录，计算各维度数据，生成日报并存储到数据库；支持手动触发生成（针对当日未自动生成的情况）；

3. **代码示例（日报生成）**：
        `// services/progressService.js
export const generateDailyReport = async (date = dayjs().format("YYYY-MM-DD")) => {
  // 1. 查询当日学习记录（00:00:00 - 23:59:59）
  const startDate = dayjs(date).startOf('day').format("YYYY-MM-DD HH:mm:ss");
  const endDate = dayjs(date).endOf('day').format("YYYY-MM-DD HH:mm:ss");
  const records = await progressDao.getLearningRecordsByTimeRange(startDate, endDate);
  if (records.length === 0) {
    // 无学习记录，生成空日报
    const emptyReport = {
      reportId: `report_${date}_${Math.floor(Math.random() * 1000)}`,
      reportDate: date,
      totalDuration: 0,
      totalPassLevels: 0,
      totalMedals: 0,
      avgCorrectRate: 0,
      masteredWordCount: 0,
      unmasteredWordCount: 0,
      reviewWordIds: [],
      createTime: dayjs().format("YYYY-MM-DD HH:mm:ss")
    };
    await progressDao.insertDailyReport(emptyReport);
    return emptyReport;
  }

  // 2. 聚合日报数据
  let totalDuration = 0;
  let totalPassLevels = 0;
  let totalMedals = 0;
  let totalCorrectRate = 0;
  const allWrongWordIds = [];
  const allWordIds = new Set();

  records.forEach(record => {
    totalDuration += record.duration;
    totalPassLevels += record.isPass;
    totalMedals += record.medalCount;
    totalCorrectRate += record.correctRate;
    // 收集错误单词ID
    const wrongWords = JSON.parse(decryptAES(record.wrongWordIds)) || [];
    allWrongWordIds.push(...wrongWords);
    // 收集所有涉及的单词ID
    const words = await wordDao.getBySetId(record.setId);
    words.forEach(word => allWordIds.add(word.wordId));
  });

  // 3. 计算衍生数据
  const avgCorrectRate = (totalCorrectRate / records.length).toFixed(2);
  const masteredWordCount = await wordDao.countByMasteryStatus("mastered", Array.from(allWordIds));
  const unmasteredWordCount = await wordDao.countByMasteryStatus("unmastered", Array.from(allWordIds));
  // 筛选重点复习单词（错误次数≥2次）
  const reviewWordIds = Object.entries(allWrongWordIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {})).filter(([_, count]) => count >= 2).map(([id]) => id);

  // 4. 生成并存储日报
  const dailyReport = {
    reportId: `report_${date}_${Math.floor(Math.random() * 1000)}`,
    reportDate: date,
    totalDuration: totalDuration,
    totalPassLevels: totalPassLevels,
    totalMedals: totalMedals,
    avgCorrectRate: parseFloat(avgCorrectRate),
    masteredWordCount: masteredWordCount,
    unmasteredWordCount: unmasteredWordCount,
    reviewWordIds: encryptAES(JSON.stringify(reviewWordIds)),
    createTime: dayjs().format("YYYY-MM-DD HH:mm:ss")
  };
  await progressDao.insertDailyReport(dailyReport);

  return {
    ...dailyReport,
    reviewWordIds: reviewWordIds // 解密后返回，供UI展示
  };
` `};`

4. **日报展示**：UI层以卡片、图表（简易文本图表，无第三方图表库）形式展示日报数据，支持切换日期查看历史日报，重点复习单词可点击跳转至对应单词集复习。

#### 3. 单词集掌握率计算

1. **计算规则**：单词集掌握率=该单词集中“已掌握”单词数/总单词数（保留2位小数），掌握率≥0.8标记为“已掌握”，≥0.5且<0.8标记为“待巩固”，&lt;0.5标记为“未掌握”；

2. **更新时机**：单词掌握状态更新后、关卡结束后、手动触发刷新时，自动更新对应单词集的掌握率；

3. **代码示例**：
       `// services/progressService.js
export const updateWordSetMastery = async (setId) => {
  // 获取单词集下所有单词
  const words = await wordDao.getBySetId(setId);
  if (words.length === 0) {
    throw new Error("单词集无单词数据");
  }
  // 统计已掌握单词数
  const masteredWordCount = words.filter(word => word.masteryStatus === "mastered").length;
  // 计算掌握率
  const masteryRate = (masteredWordCount / words.length).toFixed(2);
  // 更新单词集掌握率
  await wordSetDao.updateMasteryRate(setId, parseFloat(masteryRate));
  // 返回更新后的数据
  const wordSet = await wordSetDao.getById(setId);
  return {
    setId: setId,
    setName: decryptAES(wordSet.setName),
    masteryRate: parseFloat(masteryRate),
    masteredWordCount: masteredWordCount,
    totalWordCount: words.length,
    masteryStatus: masteryRate >= 0.8 ? "mastered" : (masteryRate >= 0.5 ? "pending" : "unmastered")
  };
` `};`

## 3.4 基础设置模块（P0级）

### 3.4.1 模块概述

核心功能：实现游戏基础设置（音效开关、背景音乐开关、难度默认值）、学习时长限制设置、数据备份/清除，设置项本地存储，适配多端，无付费增值功能。

技术难点：多端音效适配、本地数据备份/恢复、时长限制精准控制。

### 3.4.2 数据结构细化（设置表）

|字段名称|字段类型|是否必填|默认值|加密状态|备注|
|---|---|---|---|---|---|
|settingId|TEXT|是|default_setting|否|唯一标识，固定为default_setting（单条设置数据）|
|soundEnabled|INTEGER|是|1|否|音效开关：1=开启，0=关闭|
|musicEnabled|INTEGER|是|1|否|背景音乐开关：1=开启，0=关闭|
|defaultDifficulty|TEXT|是|easy|否|默认难度：easy=简单，medium=中等，hard=困难|
|dailyTimeLimit|INTEGER|是|30|否|每日学习时长限制（分钟），0=无限制|
|lastBackupTime|TEXT|否|""|否|最后一次备份时间，格式：YYYY-MM-DD HH:MM:SS|
|updateTime|TEXT|是|YYYY-MM-DD HH:MM:SS|否|设置更新时间，默认创建时间|
### 3.4.3 核心功能实现细节

#### 1. 音效与背景音乐控制

1. **音效适配**：使用Uni-app原生API uni.createInnerAudioContext创建音频上下文，适配多端音频播放；音效文件预加载（游戏启动时），避免播放延迟；

2. **控制逻辑代码示例**：`// services/settingService.js
import { settingDao } from '@/db/settingDao';

// 全局音频上下文管理（单例模式）
class AudioManager {
  constructor() {
    this.soundContext = null; // 音效上下文
    this.musicContext = null; // 背景音乐上下文
    this.isInitialized = false; // 是否初始化完成
  }

  // 初始化音频上下文
  async init() {
    if (this.isInitialized) return;
    const setting = await settingDao.getSetting();
    // 初始化音效上下文（匹配成功/失败音效）
    this.soundContext = uni.createInnerAudioContext();
    this.soundContext.volume = 0.5; // 音效音量
    this.soundContext.obeyMuteSwitch = false; // 不受系统静音影响

    // 初始化背景音乐上下文
    this.musicContext = uni.createInnerAudioContext();
    this.musicContext.src = "/static/audio/background.mp3"; // 背景音乐路径
    this.musicContext.loop = true; // 循环播放
    this.musicContext.volume = 0.3; // 背景音乐音量
    this.musicContext.obeyMuteSwitch = false;

    // 根据设置开启/关闭音频
    if (setting.musicEnabled) {
      this.musicContext.play();
    }
    this.isInitialized = true;
  }

  // 播放音效（type：success/fail/hint）
  async playSound(type) {
    await this.init();
    const setting = await settingDao.getSetting();
    if (!setting.soundEnabled) return;
    switch (type) {
      case "success":
        this.soundContext.src = "/static/audio/success.mp3";
        break;
      case "fail":
        this.soundContext.src = "/static/audio/fail.mp3";
        break;
      case "hint":
        this.soundContext.src = "/static/audio/hint.mp3";
        break;
      default:
        return;
    }
    this.soundContext.play();
  }

  // 切换背景音乐状态
  async toggleMusic() {
    await this.init();
    const setting = await settingDao.getSetting();
    const newStatus = setting.musicEnabled ? 0 : 1;
    // 更新设置
    await settingDao.updateSetting({
      musicEnabled: newStatus,
      updateTime: dayjs().format("YYYY-MM-DD HH:mm:ss")
    });
    // 播放/暂停背景音乐
    if (newStatus) {
      this.musicContext.play();
    } else {
      this.musicContext.pause();
    }
    return newStatus;
  }

  // 切换音效状态
  async toggleSound() {
    await this.init();
    const setting = await settingDao.getSetting();
    const newStatus = setting.soundEnabled ? 0 : 1;
    // 更新设置
    await settingDao.updateSetting({
      soundEnabled: newStatus,
      updateTime: dayjs().format("YYYY-MM-DD HH:mm:ss")
    });
    return newStatus;
  }
}

// 导出单例实例
` `export const audioManager = new AudioManager();`

3. **交互逻辑**：用户点击音效/背景音乐开关 → 调用toggleSound/toggleMusic接口 → 更新设置表数据 → 切换音频播放状态 → UI层更新开关状态。

#### 2. 学习时长限制控制

1. **限制逻辑**：每日00:00重置时长统计，用户进入游戏时，计算当日已学习时长（聚合当日所有学习记录的duration）→ 若已超过设置的dailyTimeLimit（且不为0）→ 弹窗提示“今日学习时长已耗尽”，禁止进入游戏；

2. **实时监控**：游戏过程中，每30秒检查一次累计学习时长，若达到限制 → 提示用户并自动退出关卡，返回首页；

3. **代码示例**：
        `// services/settingService.js
export const checkTimeLimit = async () => {
  const setting = await settingDao.getSetting();
  // 无时长限制（0），直接通过校验
  if (setting.dailyTimeLimit === 0) {
    return {
      pass: true,
      remainingTime: -1 // -1表示无限制
    };
  }

  // 计算今日已学习时长（秒）
  const today = dayjs().format("YYYY-MM-DD");
  const startDate = dayjs(today).startOf('day').format("YYYY-MM-DD HH:mm:ss");
  const endDate = dayjs(today).endOf('day').format("YYYY-MM-DD HH:mm:ss");
  const records = await progressDao.getLearningRecordsByTimeRange(startDate, endDate);
  const usedTime = records.reduce((total, record) => total + record.duration, 0);
  const limitTime = setting.dailyTimeLimit * 60; // 转换为秒
  const remainingTime = limitTime - usedTime; // 剩余时长（秒）

  // 校验是否超过限制
  if (remainingTime <= 0) {
    return {
      pass: false,
      remainingTime: 0,
      message: `今日学习时长已耗尽（限制${setting.dailyTimeLimit}分钟）`
    };
  }

  return {
    pass: true,
    remainingTime: remainingTime,
    message: `今日剩余学习时长：${Math.ceil(remainingTime / 60)}分钟`
  };
` `};`

#### 3. 本地数据备份与清除

1. **数据备份**：
        备份内容：单词表、单词集表、学习记录表、设置表的所有数据（加密后）；

2. 备份格式：JSON文本文件（命名格式：word_bean_backup_YYYYMMDD_HHMMSS.json）；

3. 备份流程：用户点击“备份数据”→ 读取所有表数据 → 加密核心字段 → 组装JSON数据 → 通过uni.saveFile保存到本地（多端适配保存路径）→ 更新最后备份时间 → 弹窗提示“备份成功”；

4. 代码示例（备份核心逻辑）：
            `// services/settingService.js
import { backupUtil } from '@/backup/backupUtil';

export const backupData = async () => {
  try {
    // 1. 读取所有核心表数据
    const words = await wordDao.getAll();
    const wordSets = await wordSetDao.getAll();
    const learningRecords = await progressDao.getAllLearningRecords();
    const setting = await settingDao.getSetting();

    // 2. 组装备份数据（已加密，无需二次加密）
    const backupData = {
      version: "1.0",
      backupTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      data: {
        words: words,
        wordSets: wordSets,
        learningRecords: learningRecords,
        setting: setting
      }
    };

    // 3. 保存为JSON文件（多端适配）
    const backupPath = await backupUtil.saveBackupFile(backupData);

    // 4. 更新最后备份时间
    await settingDao.updateSetting({
      lastBackupTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      updateTime: dayjs().format("YYYY-MM-DD HH:mm:ss")
    });

    return {
      success: true,
      message: "数据备份成功",
      backupPath: backupPath
    };
  } catch (error) {
    console.error("数据备份失败：", error);
    logUtil.recordError("settingService.backupData", error.message);
    return {
      success: false,
      message: `数据备份失败：${error.message}`
    };
  }
` `};`

5. **数据清除**：
        清除选项：支持清除所有学习记录、清除自定义单词集（保留内置）、清除所有数据（谨慎操作）；

6. 清除流程：用户选择清除选项 → 弹窗二次确认 → 执行对应表数据删除 → 弹窗提示“清除成功”；

7. 安全机制：清除所有数据前，强制提示用户备份数据，避免误操作导致数据丢失。

8. **数据恢复**：用户选择本地备份文件 → 解析JSON数据 → 校验数据格式与版本 → 清空现有对应表数据 → 批量插入备份数据 → 弹窗提示“恢复成功”（恢复后需重启App生效）。

## 3.5 多端适配模块（P0级）

### 3.5.1 模块概述

核心功能：基于Uni-app条件编译，实现多端（Android/iOS/Windows/macOS/微信小程序）界面适配、操作适配、资源适配，确保核心功能多端表现一致，无界面错乱、操作异常。

技术难点：不同终端尺寸适配、小程序权限限制适配、跨端资源兼容性。

### 3.5.2 核心适配实现细节

#### 1. 尺寸适配（响应式布局）

1. **适配方案**：采用Uni-app rpx单位（自动适配屏幕宽度），结合Flex/Grid布局，核心组件尺寸按屏幕宽度比例动态调整；禁止使用固定px单位（特殊场景除外）；

2. **适配工具封装**：
        `// utils/adaptUtil.js
export const adaptUtil = {
  // 获取终端类型（返回：android/ios/windows/macos/weixin）
  getTerminalType() {
    const sysInfo = uni.getSystemInfoSync();
    switch (sysInfo.osName) {
      case "android":
        return "android";
      case "ios":
        return "ios";
      case "windows":
        return "windows";
      case "macos":
        return "macos";
      default:
        // 微信小程序单独判断
        if (sysInfo.platform === "devtools" || sysInfo.platform === "weixin") {
          return "weixin";
        }
        return "android"; // 默认安卓
      }
  },

  // 获取屏幕尺寸信息（返回：宽度、高度、像素比）
  getScreenInfo() {
    const sysInfo = uni.getSystemInfoSync();
    return {
      screenWidth: sysInfo.screenWidth,
      screenHeight: sysInfo.screenHeight,
      pixelRatio: sysInfo.pixelRatio,
      windowWidth: sysInfo.windowWidth,
      windowHeight: sysInfo.windowHeight
    };
  },

  // 动态计算组件尺寸（基于屏幕宽度比例）
  calculateSize(designWidth, targetWidth) {
    // designWidth：设计稿宽度（默认375px）
    const { screenWidth } = this.getScreenInfo();
    return (targetWidth / designWidth) * screenWidth;
  },

  // 判断是否为大屏设备（平板/电脑）
  isLargeScreen() {
    const { screenWidth } = this.getScreenInfo();
    return screenWidth > 768; // 宽度>768px视为大屏
  }
` `};`

3. **界面适配示例**：游戏卡片宽度在手机端（屏幕宽≤375px）为80rpx，平板端（屏幕宽>768px）为120rpx，通过adaptUtil.calculateSize动态计算，或直接使用rpx单位自适应。

#### 2. 操作适配

1. **终端操作绑定**：通过条件编译判断终端类型，动态绑定操作事件，如：
`<!-- 游戏卡片组件（GameCard.vue） -->
<template>
  <view 
    class="game-card"
    @click="handleClick"
    <!-- 电脑端绑定键盘事件 -->
    #ifdef H5 || APP-PLUS-WIN || APP-PLUS-MAC
    @keydown.enter="handleClick"
    #endif
    <!-- 平板端绑定滑动事件 -->
    #ifdef APP-PLUS
    @touchmove="handleSwipe"
    #endif
  >
    <!-- 卡片内容 -->
  </view>
</template>

<script setup>
import { adaptUtil } from '@/utils/adaptUtil';

const handleClick = () => {
  // 点击事件逻辑
  emit('cardClick', props.cardId);
};

const handleSwipe = (e) => {
  // 滑动事件逻辑（平板端）
  const startX = e.touches[0].clientX;
  const startY = e.touches[0].clientY;
  e.target.addEventListener('touchend', (endE) => {
    const endX = endE.changedTouches[0].clientX;
    const endY = endE.changedTouches[0].clientY;
    const dx = endX - startX;
    const dy = endY - startY;
    // 横向滑动超过50px视为选择卡片
    if (Math.abs(dx) > 50 && Math.abs(dy) < 30) {
      emit('cardClick', props.cardId);
    }
  });
};
` `</script>`

2. **小程序权限适配**：微信小程序中，拍照/相册权限申请需通过wx.getSetting判断，文件选择需使用wx.chooseMessageFile（兼容旧版本），避免使用Uni-app通用API导致适配问题；

3. **操作反馈适配**：手机端点击反馈为震动（uni.vibrateShort），平板/电脑端为音效反馈，通过adaptUtil.getTerminalType判断终端，执行对应反馈逻辑。

#### 3. 资源适配

1. **资源格式适配**：针对不同终端的资源兼容性要求，统一资源格式标准，避免加载异常；
- 图片资源：优先使用png格式（兼容性强），避免使用webp（小程序旧版本不支持），内置图片压缩至单张≤200KB，确保加载速度；
- 音效资源：统一为mp3格式，采样率44.1kHz，比特率128kbps，压缩后单文件≤50KB，适配多端音频解码；
- 动画资源：采用Lottie JSON格式（跨端兼容），避免使用AE原生动画导出文件，动画时长控制在300-500ms，减少性能消耗。

2. **资源加载策略**：采用“预加载+懒加载”结合的方式，优化资源加载效率，避免首屏卡顿；
- 预加载：App启动时，通过uni.getStorageSync判断是否首次启动，首次启动预加载核心资源（首页图片、默认音效、常用组件），非首次启动直接复用缓存资源；游戏模块进入时，预加载当前关卡所需卡片图片、匹配音效，确保游戏过程中无资源加载延迟；
- 懒加载：单词集列表中的配图、历史学习记录中的图片，采用滚动懒加载（通过uni.createIntersectionObserver监听元素可见性），仅当元素进入视口时才加载资源，减少初始加载压力；
- 缓存策略：资源加载成功后，缓存至Uni-app Storage（有效期7天），再次加载时优先读取缓存，缓存过期或不存在时重新请求本地资源（无云端资源）。

3. **兼容性处理**：针对不同终端的资源限制，做降级适配，确保核心功能正常使用；
- 小程序资源限制适配：微信小程序单个分包体积≤2MB，将静态资源按模块拆分至对应分包，避免主包体积超标；小程序不支持本地文件绝对路径访问，将配图、音效等资源统一放在static目录，通过相对路径引用；
- 旧版本系统适配：Android 8.0以下、iOS 12.0以下系统，不支持Lottie动画，降级为CSS3基础动画（如fadeIn、scale）；不支持AES-128加密的旧设备，采用base64编码替代（降低加密强度，保证基础安全）；
- 资源缺失适配：当本地资源（如单词配图、音效文件）丢失或损坏时，自动加载默认占位资源（如默认单词图标、通用提示音效），并弹窗提示用户“部分资源缺失，已启用默认资源”，避免界面错乱或功能失效。

4. **资源管理代码示例**：`// utils/resourceUtil.js
import { adaptUtil } from '@/utils/adaptUtil';
import { getStorageSync, setStorageSync, removeStorageSync } from '@/uni_modules/uni-storage/js_sdk/uni-storage';

export const resourceUtil = {
  // 资源类型枚举
  RESOURCE_TYPE: {
    IMAGE: "image",
    AUDIO: "audio",
    ANIMATION: "animation"
  },

  // 获取资源路径（适配多端+缓存）
  async getResourcePath(resourceType, resourceName, defaultPath) {
    try {
      const terminalType = adaptUtil.getTerminalType();
      // 构建资源基础路径（按终端区分）
      let basePath = `/static/${resourceType}s/`;
      // 小程序资源路径适配
      if (terminalType === "weixin") {
        basePath = `/subPackages/game/static/${resourceType}s/`;
      }
      const resourcePath = `${basePath}${resourceName}`;

      // 检查缓存中是否存在该资源
      const cacheKey = `resource_${resourceType}_${resourceName}`;
      const cachedPath = getStorageSync(cacheKey);
      if (cachedPath) {
        // 校验缓存资源是否存在（本地文件）
        const exists = await this.checkResourceExists(cachedPath);
        if (exists) return cachedPath;
      }

      // 校验本地资源是否存在
      const exists = await this.checkResourceExists(resourcePath);
      if (exists) {
        // 存入缓存（有效期7天）
        setStorageSync(cacheKey, resourcePath, { expires: 7 * 24 * 60 * 60 });
        return resourcePath;
      }

      // 资源缺失，返回默认路径
      console.warn(`资源${resourceName}缺失，启用默认资源`);
      return defaultPath || this.getDefaultResourcePath(resourceType);
    } catch (error) {
      console.error("获取资源路径失败：", error);
      return defaultPath || this.getDefaultResourcePath(resourceType);
    }
  },

  // 检查资源是否存在（本地文件）
  checkResourceExists(resourcePath) {
    return new Promise((resolve) => {
      #ifdef APP-PLUS
      // App端检查本地文件
      plus.io.resolveLocalFileSystemURL(resourcePath, () => resolve(true), () => resolve(false));
      #endif
      #ifdef H5 || MP-WEIXIN
      // H5/小程序端通过请求校验
      uni.getImageInfo({
        src: resourcePath,
        success: () => resolve(true),
        fail: () => resolve(false)
      });
      #endif
    });
  },

  // 获取默认资源路径
  getDefaultResourcePath(resourceType) {
    switch (resourceType) {
      case this.RESOURCE_TYPE.IMAGE:
        return "/static/images/default.png";
      case this.RESOURCE_TYPE.AUDIO:
        return "/static/audio/default.mp3";
      case this.RESOURCE_TYPE.ANIMATION:
        return "/static/animation/default.json";
      default:
        return "/static/images/default.png";
    }
  },

  // 清理过期资源缓存
  clearExpiredResourceCache() {
    const keys = getStorageSync().keys();
    const now = Date.now() / 1000;
    keys.forEach(key => {
      if (key.startsWith("resource_")) {
        const cacheInfo = getStorageSync(key, { getInfo: true });
        if (cacheInfo.expires && cacheInfo.expires < now) {
          removeStorageSync(key);
          console.log(`清理过期资源缓存：${key}`);
        }
      }
    });
  }
` `};`

# 四、数据安全与异常处理设计

## 4.1 数据安全设计

### 4.1.1 数据加密策略

1. **加密范围**：仅对核心敏感数据进行加密存储，非敏感数据（如创建时间、ID、状态字段）不加密，平衡安全性与性能；核心加密字段包括：单词表（wordText、phonetic、paraphrase）、单词集表（setName、category）、学习记录表（setName、wrongWordIds）；

2. **加密算法**：采用AES-128对称加密算法，CBC模式，PKCS7填充；密钥生成规则：基于设备唯一标识（如uni.getSystemInfoSync().deviceId）+ 固定盐值（WordBean2025_），通过MD5加密生成16位密钥，IV向量为密钥前16位，确保不同设备密钥唯一，避免批量数据泄露；

3. **加密工具封装**：`// encrypt/aes.js
import CryptoJS from 'crypto-js'; // 开源免费加密库（无付费依赖）
import { getSystemInfoSync } from '@dcloudio/uni-app';

// 固定盐值（请勿修改，修改后将导致历史加密数据无法解密）
const SALT = "WordBean2025_";

// 生成AES密钥（16位）
const generateKey = () => {
  try {
    // 获取设备唯一标识
    const deviceId = getSystemInfoSync().deviceId || "defaultDeviceId123";
    // 密钥 = MD5(设备ID + 盐值) 取前16位
    const key = CryptoJS.MD5(deviceId + SALT).toString().substring(0, 16);
    return CryptoJS.enc.Utf8.parse(key);
  } catch (error) {
    console.error("生成AES密钥失败，使用默认密钥", error);
    return CryptoJS.enc.Utf8.parse("WordBeanDefaultKey"); // 兜底默认密钥
  }
};

// 生成IV向量（16位，与密钥一致）
const generateIV = () => {
  const key = generateKey();
  return key;
};

// AES-128-CBC加密
export const encryptAES = (data) => {
  if (!data || typeof data !== "string") {
    return "";
  }
  const key = generateKey();
  const iv = generateIV();
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString(); // 返回Base64格式加密结果
};

// AES-128-CBC解密
export const decryptAES = (encryptedData) => {
  if (!encryptedData || typeof encryptedData !== "string") {
    return "";
  }
  const key = generateKey();
  const iv = generateIV();
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("AES解密失败", error);
    return ""; // 解密失败返回空字符串，避免程序崩溃
  }
` `};`

4. **加密数据处理**：加密后的数据统一存储为字符串格式，解密时优先校验数据完整性（通过简单校验位判断），若解密失败，视为数据损坏，触发数据恢复机制（从最近一次备份中恢复）。

### 4.1.2 数据存储安全

1. **存储介质选择**：结构化数据（单词、单词集、学习记录）存储于SQLite数据库（本地文件，路径隐藏），简易数据（设置项、缓存）存储于Uni-app Storage（加密存储）；数据库文件设置为只读（除App内部操作外，禁止外部访问），避免root/越狱设备篡改数据；

2. **数据备份安全**：备份文件采用JSON格式加密存储（核心字段二次加密，避免备份文件泄露），备份路径默认隐藏（如Android/data/com.wordbean/files/backup/），支持用户自定义备份路径（需申请文件读写权限）；备份文件命名包含时间戳，便于用户追溯历史备份；

3. **数据销毁机制**：用户执行“清除所有数据”操作时，不仅删除数据库表数据，还会删除数据库文件、备份文件、缓存资源，同时覆盖存储分区对应区域（填充随机数据），避免数据被恢复工具还原；App卸载时，自动清理所有本地存储数据（通过Uni-app原生API监听卸载事件）。

### 4.1.3 权限与隐私保护

1. **权限申请规范**：仅申请必要权限，无冗余权限申请；拍照/相册权限（用于单词配图上传）仅在用户点击“上传配图”时申请，申请前明确提示权限用途（如“需要访问相册以选择单词配图”），用户拒绝后提供替代方案（如使用默认配图）；不申请定位、通讯录、麦克风等无关权限；

2. **隐私保护合规**：不收集用户个人信息（如姓名、年龄、手机号），所有数据仅本地存储，无任何云端上传行为，符合《未成年人网络保护条例》《个人信息保护法》；App启动时展示隐私政策弹窗（简化版，适配儿童家长阅读），用户同意后方可使用核心功能；

3. **未成年人保护**：支持家长设置学习时长限制、禁用批量导入（避免儿童误操作），学习记录仅家长可查看/删除，无社交分享功能（避免未成年人隐私泄露）；界面无广告、无付费入口，营造纯净学习环境。

## 4.2 异常处理设计

### 4.2.1 异常分类与捕获

1. **异常分类**：按模块分为数据层异常（数据库操作失败、数据加密/解密异常、数据备份/恢复失败）、业务层异常（关卡生成失败、匹配校验异常、进度计算异常）、UI层异常（组件渲染失败、交互事件异常、资源加载失败）、系统层异常（权限申请失败、设备不兼容、内存不足）；

2. **异常捕获机制**：采用“全局捕获+局部捕获”结合的方式；全局异常通过Uni-app onError、onUnhandledRejection监听，捕获未被局部捕获的异常；局部异常在各模块核心函数中通过try-catch捕获，针对特定异常做个性化处理；

3. **异常日志记录**：异常发生时，通过logUtil工具记录异常信息（包含异常类型、发生时间、模块名称、错误栈、设备信息），日志本地存储（最大100条，自动清理30天前过期日志），支持用户导出日志（供开发团队排查问题）；日志内容不包含敏感数据，避免隐私泄露。

### 4.2.2 异常处理策略

1. **数据层异常处理**：
- 数据库操作失败（如插入/更新数据报错）：重试操作（最多3次，每次间隔500ms），重试失败则触发数据恢复机制（从最近一次备份恢复数据），并弹窗提示用户“数据操作失败，已尝试恢复数据”；
- 数据加密/解密异常：使用默认密钥重试解密，重试失败则标记数据为损坏，隔离损坏数据（不影响其他数据使用），提示用户“部分数据损坏，建议备份后清除异常数据”；
- 数据备份/恢复失败：检查存储路径权限、备份文件完整性，权限不足则引导用户开启权限，文件损坏则提示用户选择其他备份文件恢复；

2. **业务层异常处理**：
- 关卡生成失败（如单词数量不足、数据为空）：弹窗提示具体原因（如“单词集单词数量不足10个，无法生成关卡”），引导用户补充单词或选择其他单词集；
- 匹配校验异常（如卡片数据不存在、状态异常）：忽略当前操作，重置卡片状态，播放提示音效，避免游戏卡顿或闪退；
- 进度计算异常（如掌握率计算出错）：使用默认值（如0.00）填充，后台异步重新计算，计算完成后自动更新，不影响用户当前操作；

3. **UI层异常处理**：
- 组件渲染失败（如卡片组件渲染异常）：降级为默认组件（如显示空白卡片），控制台记录异常信息，不影响整体界面展示；
- 资源加载失败（如图片/音效加载失败）：加载默认资源，弹窗提示“部分资源加载失败，已启用默认资源”，后台异步重新加载资源；
- 交互事件异常（如点击无响应）：触发防抖/节流处理，重置事件绑定，若多次异常则提示用户重启App；

4. **系统层异常处理**：
- 权限申请失败：提供替代方案（如拒绝相册权限则无法上传自定义配图，可使用默认配图），不阻断核心功能使用；
- 设备不兼容（如系统版本过低）：弹窗提示“当前设备版本过低，部分功能可能无法正常使用”，列出最低兼容版本，引导用户升级系统；
- 内存不足（如连续运行1小时后内存占用过高）：自动清理缓存资源、历史日志，释放内存，弹窗提示用户“当前内存不足，已为您清理缓存”。

### 4.2.3 异常反馈与容错机制

1. **异常反馈**：异常发生时，通过弹窗、Toast提示用户具体异常信息（简化版，避免技术术语），同时提供解决方案（如“数据恢复失败，请手动导入备份文件”）；严重异常（如App闪退前兆）触发紧急保存机制（保存当前游戏进度、学习数据），重启App后可恢复数据；

2. **容错机制**：核心功能支持离线使用（无网络依赖），断网环境下不影响游戏、单词管理等核心功能；数据读取失败时，使用本地缓存数据临时替代，联网时（若后续迭代支持云端同步）同步最新数据；组件依赖失败时，自动加载备用组件，确保功能闭环；

3. **异常监控与迭代**：开发团队定期导出用户反馈的异常日志，分析高频异常类型、触发场景，在后续版本中优化处理逻辑；针对用户反馈的严重异常（如闪退、数据丢失），优先迭代修复，发布紧急更新。

# 五、性能优化设计

## 5.1 启动与加载优化

### 5.1.1 首屏加载优化

1. **资源压缩与分包**：静态资源（图片、音效、动画）通过TinyPNG、Audacity等免费工具压缩，减少资源体积；采用Uni-app分包加载机制，将游戏模块、单词管理模块拆分为独立分包，主包仅包含首页、设置页核心资源，主包体积控制在1MB以内，确保首屏加载≤3秒；

2. **代码优化**：删除冗余代码、注释，通过Tree Shaking移除未使用的组件/工具类；核心算法（如卡片洗牌、匹配校验）采用原生JS实现，避免使用重量级第三方库；Vue组件采用按需加载（import动态导入），减少首屏组件渲染压力；

3. **缓存策略**：App启动时，优先读取缓存的首页数据（单词集列表、学习进度），后台异步更新最新数据；核心资源（如通用组件、默认图片）预加载至内存，减少后续页面加载时间；避免首屏做大量数据计算、数据库查询操作，将非核心初始化操作（如日志清理、缓存检查）延迟至首屏渲染完成后执行。

### 5.1.2 关卡加载优化

1. **关卡数据预生成**：用户选择单词集后，后台异步生成当前难度的关卡数据，缓存至全局状态，用户进入游戏页面时直接复用缓存数据，避免关卡加载时实时计算；单词数据解密操作在后台异步执行，不阻塞关卡布局渲染；

2. **图片懒加载**：关卡卡片图片采用懒加载，优先渲染卡片布局、文字内容，图片未加载完成时显示占位图（默认图标），图片进入视口后再加载；图片加载失败时自动重试（最多2次），重试失败则显示默认图片；

3. **加载状态反馈**：关卡加载时显示加载动画（Lottie轻量动画），搭配文字提示（如“关卡加载中...”），避免用户误以为App卡顿；加载超时（超过1秒）时提示用户“加载较慢，建议清理缓存后重试”，并提供重试按钮。

## 5.2 运行时性能优化

### 5.2.1 渲染优化

1. **组件渲染优化**：游戏卡片、单词列表等高频渲染组件，使用Vue3 Teleport、Fragment减少DOM层级；避免使用v-if频繁切换组件显示/隐藏，优先使用v-show（适合频繁切换场景）；列表组件（如单词集列表）使用uni-ui的uni-list组件，支持虚拟滚动，减少长列表渲染时的DOM数量，提升滚动流畅度；

2. **动画优化**：卡片选中、消除等动画采用CSS3动画（transform、opacity），开启GPU加速（transform: translateZ(0)），避免使用JS动画导致的卡顿；动画时长控制在300ms内，避免长时间动画阻塞交互；批量卡片消除时，采用请求AnimationFrame分批执行动画，避免同时触发大量动画导致的性能消耗；

3. **减少重绘与回流**：避免频繁修改DOM样式（如卡片选中状态切换），优先通过添加/移除CSS类实现样式变更；固定卡片布局尺寸，避免动态修改宽高导致的页面回流；使用CSS3 will-change属性，提前告知浏览器可能发生变化的元素，优化渲染性能。

### 5.2.2 数据与计算优化

1. **数据库操作优化**：批量插入/更新数据时，使用SQLite事务（transaction）减少数据库IO操作，提升执行效率；查询数据时添加索引（如单词表的setId字段、学习记录表的createTime字段），减少查询耗时；避免频繁查询数据库，将常用数据缓存至全局状态，定期同步更新数据库；

2. **计算优化**：核心算法（如卡片匹配校验、掌握率计算）优化时间复杂度，如卡片匹配校验从O(n²)优化为O(1)（通过wordId直接匹配）；避免在组件生命周期钩子（如onUpdate、onMounted）中做大量计算，将复杂计算放在后台异步执行，计算结果通过事件总线通知UI层更新；

3. **内存优化**：关卡结束后，及时清理关卡数据缓存、销毁未使用的组件实例，释放内存；避免全局变量存储大量数据，优先使用局部变量，使用完后手动置为null；连续运行1小时后，自动清理历史日志、临时缓存，释放内存，确保App长时间运行无卡顿、闪退。

## 5.3 多端性能适配

1. **终端性能适配**：通过adaptUtil判断终端性能（如低配置手机、旧版本系统），自动降级功能（如关闭复杂动画、降低图片分辨率），确保核心功能流畅运行；低配置设备上，减少同时渲染的卡片数量（如简单难度从3×4布局改为2×3布局），降低性能消耗；

2. **小程序性能适配**：微信小程序中，避免使用过多全局变量、避免频繁调用setData（采用数据节流，批量更新数据）；分包体积严格控制在2MB以内，避免分包加载超时；小程序后台运行时，及时清理缓存数据，释放内存，避免被微信回收；

3. **性能监控**：封装性能监控工具（perfUtil.js），实时监控首屏加载时间、关卡加载时间、操作响应时间等关键指标，超过阈值时记录日志，后台异步上传至开发团队（若后续支持云端监控）；提供性能诊断页面（隐藏入口，供开发/测试人员使用），展示当前设备性能指标、内存占用、异常日志，便于排查性能问题。

# 六、测试要点与验收标准

## 6.1 核心功能测试要点

### 6.1.1 自定义单词管理模块

1. 单条单词录入：校验字段非空、长度限制、格式限制（如单词仅允许字母/数字/连字符），配图上传格式/大小校验，录入成功后数据库数据正确存储（核心字段加密）；

2. 批量导入：测试不同格式的.txt文件（正确格式、空行、字段缺失、超长字段），验证解析逻辑正确性，导入数量限制（单次≤50个），导入失败时错误提示准确，成功后单词集数量同步更新；

3. 单词集管理：创建/编辑/删除单词集功能正常，删除单词集时关联单词数据同步删除，撤销删除功能有效（10秒内），单词集分享链接生成正确，好友可正常导入；

4. 多端适配：不同终端（手机/平板/小程序）下单词录入、批量导入、单词集管理操作正常，界面无错乱，配图上传权限申请流程合规。

### 6.1.2 连连看核心游戏模块

1. 关卡生成：不同难度、匹配模式下关卡生成正常，布局尺寸适配多端，卡片随机排列无重复，单词数量不足时提示准确；关卡加载时间≤1秒，图片懒加载正常；

2. 卡片匹配：匹配校验规则正确（wordId一致+类型对应），无效点击（已匹配/重复点击/快速点击）过滤有效，匹配成功/失败反馈（动画+音效）正常，学习数据实时记录；

3. 提示功能：提示次数限制（每局≤3次）有效，提示卡片高亮显示正常，无提示时反馈准确；

4. 关卡结束：通关、超时、主动退出场景下关卡结束逻辑正常，学习记录数据准确（时长、正确率、错误单词），勋章发放正确，进度跟踪模块数据同步更新；

5. 多端适配：不同终端操作（点击/滑动/键盘）正常，动画流畅无卡顿，长时间运行（1小时）无闪退、内存泄漏。

### 6.1.3 基础进度跟踪模块

1. 掌握率计算：单词正确匹配后掌握率实时更新，掌握状态（已掌握/待巩固/未掌握）判断准确，30天内学习记录聚合计算正确；

2. 学习日报：每日24点自动生成日报，手动触发生成有效，日报数据（时长、正确率、勋章数等）准确，历史日报查询正常，重点复习单词跳转功能有效；

3. 单词集掌握率：单词掌握状态更新后，单词集掌握率同步更新，掌握状态判断准确，多端展示一致；

4. 数据安全：学习记录核心字段加密存储，数据备份/恢复后日报、掌握率数据完整无丢失。

### 6.1.4 基础设置模块

1. 音效与背景音乐：开关控制正常，不同场景（匹配成功/失败/提示）音效播放准确，多端音频适配正常，静音状态下无声音输出；

2. 学习时长限制：每日时长统计准确，达到限制后禁止进入游戏，游戏中实时监控时长，超时自动退出关卡，提示准确；

3. 数据备份/清除：备份文件生成正常，存储路径正确，备份数据完整；不同清除选项（学习记录/自定义单词集/所有数据）执行正确，清除后数据无法恢复（符合销毁机制），数据恢复功能正常；

4. 多端适配：设置项修改后多端同步（如默认难度），设置数据本地存储准确，重启App后设置项保留。

### 6.1.5 多端适配模块

1. 尺寸适配：不同终端（手机/平板/电脑/小程序）界面布局正常，无错乱、拉伸，核心组件（卡片、按钮）尺寸适配合理；

2. 操作适配：不同终端操作方式（点击/滑动/键盘）正常，操作反馈准确，小程序权限申请流程合规；

3. 资源适配：资源加载正常，缺失资源降级适配有效，旧版本系统资源兼容性良好；

4. 兼容性测试：覆盖指定兼容版本（Android 8.0+/iOS 12.0+/Windows 10+/macOS 10.15+/微信小程序7.0+），核心功能无异常。

## 6.2 非功能测试要点

1. **性能测试**：首屏加载≤3秒，关卡加载≤1秒，操作响应≤0.5秒；连续运行1小时无闪退、卡顿，内存占用稳定（≤200MB）；数据库批量操作（如批量导入50个单词）耗时≤1秒；

2. **安全测试**：核心数据加密存储（AES-128），解密正常；数据库文件禁止外部访问，root/越狱设备无法篡改数据；数据备份文件加密，清除数据后无法恢复；无敏感数据泄露风险；

3. **异常测试**：网络中断、资源缺失、数据库损坏、权限拒绝等异常场景下，App无闪退，异常处理机制有效，提示准确；重复操作（如连续点击匹配）无逻辑错乱；

4. **易用性测试**：界面简洁直观，适配儿童操作习惯（按钮尺寸适中、文字清晰），家长可快速上手设置；错误提示简洁明了，提供解决方案；无复杂操作流程，核心功能3步内可完成。

## 6.3 验收标准

1. **功能验收**：所有P0级核心功能实现完整，符合需求说明文档与本详细设计文档要求，无功能缺失、逻辑错误；多端核心功能表现一致，无适配问题；

2. **性能验收**：首屏加载≤3秒，关卡加载≤1秒，操作响应≤0.5秒，连续运行1小时无闪退、卡顿，内存占用≤200MB，数据库操作耗时≤1秒；

3. **安全验收**：核心数据加密存储，无敏感数据泄露；权限申请合规，无冗余权限；数据备份/清除/恢复功能正常，符合安全设计要求；

4. **兼容性验收**：覆盖指定兼容终端与系统版本，核心功能无异常，界面无错乱，操作无异常；

5. **文档验收**：代码实现符合本详细设计文档的技术规范、接口参数、数据结构要求；测试用例覆盖所有核心功能与异常场景，测试报告完整，无未解决的严重bug；

6. **交付物验收**：交付物包括完整源代码（含注释）、编译后的多端安装包、测试报告、用户手册、备份数据示例，交付物完整可运行，无依赖缺失。

# 七、附则

## 7.1 文档修订记录

|修订版本|修订日期|修订人|修订内容|备注|
|---|---|---|---|---|
|V1.0|2025年12月30日|资深软件架构师|完成V1.0版本全量P0级核心模块详细设计，包含架构细化、模块设计、安全与异常处理、性能优化、测试要点等内容|初始版本，供V1.0开发与测试使用|
## 7.2 设计说明

1. 本文档为单词豆V1.0版本详细设计文档，仅覆盖P0级核心功能，P1/P2级延后功能（如云端同步、单词发音评测、多用户管理）将在后续版本（V1.1/V2.0）中补充详细设计；

2. 文档中代码示例为核心逻辑片段，实际开发需结合Uni-app规范、团队编码规范补充完整（如异常处理、注释、类型定义）；

3. 0成本开发为核心约束，所有技术选型、资源使用均需符合免费开源要求，禁止引入任何付费依赖；

4. 开发过程中若需修改设计方案（如数据结构调整、算法优化），需提交设计变更申请，经架构师审核通过后，更新本文档并同步至开发团队；

5. 本文档最终解释权归开发团队所有，未尽事宜可参考相关参考文档，或联系编写人补充说明。

## 7.3 联系方式

编写人：资深软件架构师

联系邮箱：wordbean_design@163.com

修订反馈截止时间：2026年1月10日
> （注：文档部分内容可能由 AI 生成）