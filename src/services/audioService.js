// 音效服务
// 使用Web Audio API实现音效和音乐播放

import logUtil from '../utils/logUtil'

// 创建音频上下文
let audioContext = null;

// 音频缓冲区 - 用于音效
const soundBuffers = {
  success: null,
  fail: null,
  select: null,
  hint: null,
  complete: null
};

// 背景音乐缓冲区 - 用于存储不同场景的音乐
const bgmBuffers = {
  main: null,     // 主菜单/游戏选择
  game: null,     // 游戏进行中
  victory: null,  // 胜利场景
  defeat: null    // 失败场景
};

// 当前播放的背景音乐源
let currentBgmSource = null;
let currentBgmGainNode = null;
let currentBgmType = null;
let bgmFadeTimer = null;
// 存储背景音乐循环定时器
let bgmTimers = [];

// 设置
let soundEnabled = true;
let musicEnabled = true;
let soundVolume = 0.5;
let musicVolume = 0.3;
let crossfadeDuration = 1.0; // 平滑切换音乐的时间（秒）

// 初始化音频上下文
const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
};

// 加载音频文件到缓冲区
const loadAudioBuffer = async (url) => {
  initAudioContext();
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    logUtil.error('加载音频文件失败', { module: 'AudioService', url }, error);
    throw error;
  }
};

// 预加载所有背景音乐
const preloadBackgroundMusic = async () => {
  try {
    // 这里使用模拟的音频文件路径，实际项目中需要替换为真实的音频文件
    // 注意：由于我们没有实际的音频文件，这里暂时不加载，而是保留原有的音效生成逻辑
    // 后续需要添加真实的音频文件并取消注释以下代码
    
    // bgmBuffers.main = await loadAudioBuffer('/src/assets/audio/main_piano.mp3');
    // bgmBuffers.game = await loadAudioBuffer('/src/assets/audio/game_piano.mp3');
    // bgmBuffers.victory = await loadAudioBuffer('/src/assets/audio/victory_piano.mp3');
    // bgmBuffers.defeat = await loadAudioBuffer('/src/assets/audio/defeat_piano.mp3');
    
    logUtil.info('背景音乐预加载完成', { module: 'AudioService' });
  } catch (error) {
    logUtil.error('预加载背景音乐失败', { module: 'AudioService' }, error);
  }
};

// 生成简单的音效波形（保留原有的音效生成逻辑）
const generateTone = (frequency, duration, type = 'sine') => {
  initAudioContext();
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  // 设置音量包络
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(soundVolume, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

// 播放音效
const playSound = (soundType) => {
  if (!soundEnabled) return;
  
  initAudioContext();
  
  switch (soundType) {
    case 'success':
      // 成功音效：上升的音调
      generateTone(440, 0.3);
      setTimeout(() => generateTone(554, 0.3), 300);
      break;
    case 'fail':
      // 失败音效：下降的音调
      generateTone(554, 0.2);
      setTimeout(() => generateTone(440, 0.2), 200);
      break;
    case 'select':
      // 选择音效：短音调
      generateTone(659, 0.15);
      break;
    case 'hint':
      // 提示音效：特殊波形
      generateTone(330, 0.4, 'triangle');
      break;
    case 'complete':
      // 完成音效：和弦
      generateTone(440, 0.5);
      setTimeout(() => generateTone(554, 0.5), 100);
      setTimeout(() => generateTone(659, 0.5), 200);
      break;
    default:
      break;
  }
};

// 播放钢琴风格的背景音乐（实现连续不间断播放）
const playPianoBgm = (melodyNotes, noteDuration = 0.5) => {
  if (!musicEnabled || !audioContext) return;
  
  initAudioContext();
  
  const startTime = audioContext.currentTime;
  
  // 如果当前没有音量节点，创建一个新的
  if (!currentBgmGainNode) {
    currentBgmGainNode = audioContext.createGain();
    currentBgmGainNode.connect(audioContext.destination);
    // 初始音量为0，准备淡入
    currentBgmGainNode.gain.setValueAtTime(0, startTime);
  } else {
    // 如果已经有音量节点，保持当前音量
    currentBgmGainNode.gain.setValueAtTime(musicVolume * 0.7, startTime);
  }
  
  // 设置平滑的音量变化（淡入）
  currentBgmGainNode.gain.linearRampToValueAtTime(musicVolume * 0.7, startTime + crossfadeDuration);
  
  // 优化的钢琴风格音量包络，更接近真实钢琴音色
  const createPianoNote = (freq, time, duration) => {
    // 主音振荡器
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(currentBgmGainNode);
    
    // 使用三角波作为基础，更接近钢琴的音色
    osc.type = 'triangle';
    osc.frequency.value = freq;
    
    // 钢琴音量包络：快速上升，然后自然衰减
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(musicVolume * 0.6, time + 0.005); // 更快速的击键感
    gain.gain.exponentialRampToValueAtTime(musicVolume * 0.02, time + duration); // 更自然的衰减
    
    // 添加泛音，增强音色丰富度
    const overtone1 = audioContext.createOscillator();
    const overtone1Gain = audioContext.createGain();
    overtone1.connect(overtone1Gain);
    overtone1Gain.connect(currentBgmGainNode);
    overtone1.type = 'triangle';
    overtone1.frequency.value = freq * 2; // 二次泛音
    overtone1Gain.gain.setValueAtTime(0, time);
    overtone1Gain.gain.linearRampToValueAtTime(musicVolume * 0.2, time + 0.005);
    overtone1Gain.gain.exponentialRampToValueAtTime(musicVolume * 0.01, time + duration);
    
    // 启动振荡器
    osc.start(time);
    osc.stop(time + duration);
    overtone1.start(time);
    overtone1.stop(time + duration);
    
    return osc;
  };
  
  // 创建更丰富的钢琴伴奏
  const createPianoAccompaniment = (startTime, duration) => {
    // 使用更适合儿童游戏的明亮和弦进行
    const chords = [
      [261.63 * 0.5, 329.63 * 0.5, 392.00 * 0.5], // C大和弦
      [349.23 * 0.5, 440.00 * 0.5, 523.25 * 0.5], // F大和弦
      [392.00 * 0.5, 493.88 * 0.5, 587.33 * 0.5], // G大和弦
      [293.66 * 0.5, 369.99 * 0.5, 440.00 * 0.5]  // D小和弦
    ];
    
    const chordDuration = 4 * noteDuration;
    
    chords.forEach((chord, index) => {
      const chordStartTime = startTime + index * chordDuration;
      
      chord.forEach((freq, i) => {
        createPianoNote(freq, chordStartTime, chordDuration);
      });
    });
  };
  
  // 播放伴奏
  createPianoAccompaniment(startTime, melodyNotes.length * noteDuration);
  
  // 播放主旋律
  melodyNotes.forEach((frequency, index) => {
    const noteStartTime = startTime + index * noteDuration;
    createPianoNote(frequency, noteStartTime, noteDuration * 0.95);
  });
  
  // 总时长
  const totalDuration = melodyNotes.length * noteDuration;
  
  // 无缝循环：在音乐结束前提前启动下一次播放，实现真正的无缝衔接
  const nextPlayTime = startTime + totalDuration - crossfadeDuration * 0.5;
  
  // 设置定时器，在当前音乐即将结束时开始下一次播放
  const loopTimer = setTimeout(() => {
    if (musicEnabled && currentBgmType) {
      // 递归调用，实现连续不间断播放
      playPianoBgm(melodyNotes, noteDuration);
    }
  }, (totalDuration - crossfadeDuration * 0.5) * 1000);
  
  // 保存定时器引用，以便在停止音乐时清除
  bgmTimers.push(loopTimer);
};

// 播放不同场景的背景音乐
const playBgm = (type = 'game') => {
  if (!musicEnabled || !audioContext) return;
  
  initAudioContext();
  
  // 如果已经在播放相同类型的音乐，直接返回，避免重复播放
  if (currentBgmType === type) {
    return;
  }
  
  // 停止当前正在播放的音乐
  stopBgm();
  
  // 记录当前播放类型
  currentBgmType = type;
  
  // 钢琴风格的旋律（根据不同场景使用不同的旋律）
  let melodyNotes = [];
  let noteDuration = 0.5;
  
  switch (type) {
    case 'main':
      // 主菜单音乐：舒缓、愉悦的钢琴旋律，适合儿童游戏
      melodyNotes = [
        261.63, 293.66, 329.63, 293.66, 261.63, 293.66, 329.63, // C D E D C D E
        349.23, 392.00, 349.23, 329.63, 293.66, 329.63, 261.63, // F G F E D E C
        293.66, 329.63, 349.23, 329.63, 293.66, 329.63, 261.63, // D E F E D E C
        261.63, 293.66, 329.63, 293.66, 261.63, 261.63, 261.63  // C D E D C C C
      ];
      noteDuration = 0.6;
      break;
      
    case 'game':
      // 游戏进行中：轻快、活泼的钢琴旋律，适合儿童游戏
      melodyNotes = [
        392.00, 440.00, 523.25, 440.00, 392.00, 349.23, 329.63, // G A C A G F E
        349.23, 392.00, 440.00, 392.00, 349.23, 329.63, 293.66, // F G A G F E D
        293.66, 329.63, 349.23, 329.63, 293.66, 261.63, 261.63, // D E F E D C C
        329.63, 349.23, 392.00, 349.23, 329.63, 293.66, 261.63  // E F G F E D C
      ];
      noteDuration = 0.35; // 更轻快的节奏
      break;
      
    case 'victory':
      // 胜利场景：欢快、活泼的钢琴旋律，带有庆祝感
      melodyNotes = [
        523.25, 587.33, 659.25, 587.33, 523.25, 587.33, 659.25, // C D E D C D E
        698.46, 659.25, 587.33, 523.25, 587.33, 523.25, 392.00, // F E D C D C G
        392.00, 440.00, 523.25, 440.00, 392.00, 349.23, 329.63, // G A C A G F E
        349.23, 392.00, 440.00, 523.25, 587.33, 523.25, 261.63  // F G A C D C C
      ];
      noteDuration = 0.3; // 更快的节奏，更有庆祝感
      break;
      
    case 'defeat':
      // 失败场景：温柔、鼓励性的钢琴旋律，不那么悲伤
      melodyNotes = [
        261.63, 246.94, 261.63, 293.66, 261.63, 246.94, 196.00, // C B C D C B G
        196.00, 220.00, 246.94, 261.63, 246.94, 220.00, 196.00, // G A B C B A G
        220.00, 246.94, 261.63, 246.94, 220.00, 196.00, 196.00, // A B C B A G G
        261.63, 293.66, 329.63, 293.66, 261.63, 261.63, 261.63  // C D E D C C C
      ];
      noteDuration = 0.6; // 更舒缓的节奏，带有鼓励性
      break;
      
    default:
      // 默认使用游戏进行中的音乐
      melodyNotes = [
        392.00, 440.00, 523.25, 440.00, 392.00, 349.23, 329.63,
        349.23, 392.00, 440.00, 392.00, 349.23, 329.63, 293.66,
        293.66, 329.63, 349.23, 329.63, 293.66, 261.63, 261.63,
        329.63, 349.23, 392.00, 349.23, 329.63, 293.66, 261.63
      ];
      noteDuration = 0.35;
  }
  
  // 播放钢琴风格的音乐
  playPianoBgm(melodyNotes, noteDuration);
};

// 立即停止背景音乐
const stopBgm = () => {
  // 清除所有循环播放的定时器
  bgmTimers.forEach(timer => clearTimeout(timer));
  bgmTimers = [];
  
  // 清除淡入淡出定时器
  if (bgmFadeTimer) {
    clearTimeout(bgmFadeTimer);
    bgmFadeTimer = null;
  }
  
  // 立即停止所有音频播放
  if (currentBgmGainNode && audioContext) {
    // 立即将音量设置为0
    currentBgmGainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    // 断开并清除当前增益节点
    try {
      currentBgmGainNode.disconnect();
    } catch (e) {
      // 忽略已经断开的节点
    }
    currentBgmGainNode = null;
  }
  
  // 停止当前音频源（如果存在）
  if (currentBgmSource) {
    try {
      currentBgmSource.stop();
    } catch (e) {
      // 忽略已经停止的实例
    }
    currentBgmSource = null;
  }
  
  // 重置当前音乐类型，以便下次播放能正常开始
  currentBgmType = null;
};

// 完全销毁音频服务，释放所有资源
const destroyAudioService = () => {
  // 停止所有音乐
  stopBgm();
  
  // 关闭音频上下文（如果存在）
  if (audioContext) {
    try {
      audioContext.close();
    } catch (e) {
      // 忽略关闭错误
    }
    audioContext = null;
  }
  
  // 重置所有状态
  soundEnabled = true;
  musicEnabled = true;
  soundVolume = 0.5;
  musicVolume = 0.3;
  
  // 清除所有音频缓冲区引用，便于垃圾回收
  for (const key in soundBuffers) {
    soundBuffers[key] = null;
  }
  
  for (const key in bgmBuffers) {
    bgmBuffers[key] = null;
  }
};

// 切换到不同的背景音乐（带有平滑过渡）
const switchBgm = (type) => {
  if (!musicEnabled || currentBgmType === type) return;
  
  // 先淡出当前音乐
  stopBgm();
  
  // 延迟后播放新音乐，实现平滑过渡
  setTimeout(() => {
    playBgm(type);
  }, crossfadeDuration * 500); // 交叉淡入淡出
};

// 设置音效开关
const setSoundEnabled = (enabled) => {
  soundEnabled = enabled;
};

// 设置音乐开关
const setMusicEnabled = (enabled) => {
  musicEnabled = enabled;
  if (enabled) {
    playBgm(currentBgmType || 'game');
  } else {
    stopBgm();
  }
};

// 设置音效音量
const setSoundVolume = (volume) => {
  soundVolume = Math.max(0, Math.min(1, volume));
};

// 设置音乐音量
const setMusicVolume = (volume) => {
  musicVolume = Math.max(0, Math.min(1, volume));
  if (currentBgmGainNode && audioContext) {
    currentBgmGainNode.gain.setValueAtTime(musicVolume, audioContext.currentTime);
  }
};

// 加载设置
const loadSettings = () => {
  try {
    const settingStr = localStorage.getItem('wordBeanSetting');
    if (settingStr) {
      const setting = JSON.parse(settingStr);
      soundEnabled = setting.soundEnabled !== false;
      musicEnabled = setting.musicEnabled !== false;
    }
  } catch (error) {
    logUtil.error('加载音效设置失败', { module: 'AudioService' }, error);
  }
};

// 初始化音效服务
const initAudioService = async () => {
  loadSettings();
  initAudioContext();
  
  // 预加载背景音乐
  await preloadBackgroundMusic();
  
  // 如果音乐开启，播放默认背景音乐
  if (musicEnabled) {
    playBgm('main');
  }
};

export {
  initAudioService,
  destroyAudioService,
  playSound,
  playBgm,
  stopBgm,
  switchBgm,
  setSoundEnabled,
  setMusicEnabled,
  setSoundVolume,
  setMusicVolume,
  loadSettings
};