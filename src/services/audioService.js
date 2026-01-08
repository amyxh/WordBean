// 音效服务
// 使用Web Audio API实现音效和音乐播放

import logUtil from '../utils/logUtil'

// 创建音频上下文
let audioContext = null;

// 音效缓冲区
const soundBuffers = {
  success: null,
  fail: null,
  select: null,
  hint: null,
  complete: null
};

// 背景音乐源
let bgmSource = null;
let bgmBuffer = null;
let bgmGainNode = null;

// 音频实例和定时器管理
let bgmOscillators = []; // 存储所有创建的振荡器实例
let bgmTimers = []; // 存储所有相关的定时器
let bgmGainNodes = []; // 存储所有创建的增益节点
let repeatTimer = null; // 存储重复播放的定时器

// 设置
let soundEnabled = true;
let musicEnabled = true;
let soundVolume = 0.5;
let musicVolume = 0.3;

// 初始化音频上下文
const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
};

// 生成简单的音效波形
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

// 播放背景音乐 - 圣诞歌曲
const playBgm = () => {
  if (!musicEnabled || !audioContext) return;
  
  initAudioContext();
  
  // 停止当前的背景音乐和所有实例
  stopBgm();
  
  // 使用平安夜的旋律片段作为基础
  // 平安夜简谱：1 1 5 5 6 6 5 - 4 4 3 3 2 2 1 - 5 5 4 4 3 3 2 - 5 5 4 4 3 3 2 - 1 1 5 5 6 6 5 - 4 4 3 3 2 2 1
  // C大调：C D E F G A B C
  const startTime = audioContext.currentTime;
  const noteDuration = 0.6; // 每个音符持续0.6秒
  
  // 平安夜旋律（C大调）
  const melodyNotes = [
    261.63, 261.63, 392.00, 392.00, 440.00, 440.00, 392.00, // 1 1 5 5 6 6 5
    349.23, 349.23, 329.63, 329.63, 293.66, 293.66, 261.63, // 4 4 3 3 2 2 1
    392.00, 392.00, 349.23, 349.23, 329.63, 329.63, 293.66, // 5 5 4 4 3 3 2
    392.00, 392.00, 349.23, 349.23, 329.63, 329.63, 293.66, // 5 5 4 4 3 3 2
    261.63, 261.63, 392.00, 392.00, 440.00, 440.00, 392.00, // 1 1 5 5 6 6 5
    349.23, 349.23, 329.63, 329.63, 293.66, 293.66, 261.63  // 4 4 3 3 2 2 1
  ];
  
  // 创建音量节点
  bgmGainNode = audioContext.createGain();
  bgmGainNode.connect(audioContext.destination);
  bgmGainNodes.push(bgmGainNode);
  
  // 设置平滑的音量变化
  bgmGainNode.gain.setValueAtTime(0, startTime);
  bgmGainNode.gain.linearRampToValueAtTime(musicVolume * 0.4, startTime + 1); // 淡入
  
  // 创建一个简单的伴奏（使用低八度的C大调和弦）
  const createAccompaniment = (startTime, duration) => {
    const chords = [
      [261.63 * 0.5, 329.63 * 0.5, 392.00 * 0.5], // C大调和弦
      [349.23 * 0.5, 440.00 * 0.5, 523.25 * 0.5], // F大调和弦
      [392.00 * 0.5, 493.88 * 0.5, 587.33 * 0.5], // G大调和弦
      [349.23 * 0.5, 440.00 * 0.5, 523.25 * 0.5]  // F大调和弦
    ];
    
    const chordDuration = 4 * noteDuration;
    
    chords.forEach((chord, index) => {
      const chordStartTime = startTime + index * chordDuration;
      
      chord.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(bgmGainNode);
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(musicVolume * 0.2, chordStartTime);
        gain.gain.exponentialRampToValueAtTime(musicVolume * 0.1, chordStartTime + chordDuration);
        
        osc.start(chordStartTime);
        osc.stop(chordStartTime + chordDuration);
        
        // 保存实例到数组中
        bgmOscillators.push(osc);
        bgmGainNodes.push(gain);
      });
    });
  };
  
  // 播放伴奏
  createAccompaniment(startTime, melodyNotes.length * noteDuration);
  
  // 播放主旋律
  melodyNotes.forEach((frequency, index) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(bgmGainNode);
    
    osc.type = 'sine';
    osc.frequency.value = frequency;
    
    // 设置平滑的音量包络
    const noteStartTime = startTime + index * noteDuration;
    gain.gain.setValueAtTime(0, noteStartTime);
    gain.gain.linearRampToValueAtTime(musicVolume * 0.4, noteStartTime + 0.1);
    gain.gain.linearRampToValueAtTime(musicVolume * 0.3, noteStartTime + noteDuration - 0.1);
    gain.gain.linearRampToValueAtTime(0, noteStartTime + noteDuration);
    
    osc.start(noteStartTime);
    osc.stop(noteStartTime + noteDuration);
    
    // 保存实例到数组中
    bgmOscillators.push(osc);
    bgmGainNodes.push(gain);
  });
  
  // 淡出效果
  const totalDuration = melodyNotes.length * noteDuration;
  bgmGainNode.gain.linearRampToValueAtTime(0, startTime + totalDuration - 1);
  
  // 3秒后重新播放
  if (repeatTimer) {
    clearTimeout(repeatTimer);
  }
  repeatTimer = setTimeout(playBgm, (totalDuration + 3) * 1000);
};

// 停止背景音乐
const stopBgm = () => {
  // 停止所有振荡器实例
  bgmOscillators.forEach(osc => {
    try {
      osc.stop(0);
    } catch (e) {
      // 忽略已经停止的实例
    }
  });
  
  // 断开所有增益节点的连接
  bgmGainNodes.forEach(gainNode => {
    try {
      gainNode.disconnect();
    } catch (e) {
      // 忽略已经断开的节点
    }
  });
  
  // 清除所有定时器
  bgmTimers.forEach(timer => clearTimeout(timer));
  
  // 清除重复播放的定时器
  if (repeatTimer) {
    clearTimeout(repeatTimer);
    repeatTimer = null;
  }
  
  // 重置所有数组
  bgmOscillators = [];
  bgmGainNodes = [];
  bgmTimers = [];
  
  // 重置主音量节点
  if (bgmGainNode) {
    try {
      bgmGainNode.disconnect();
    } catch (e) {
      // 忽略已经断开的节点
    }
    bgmGainNode = null;
  }
  
  // 重置bgmSource（虽然目前未使用）
  bgmSource = null;
};

// 设置音效开关
const setSoundEnabled = (enabled) => {
  soundEnabled = enabled;
};

// 设置音乐开关
const setMusicEnabled = (enabled) => {
  musicEnabled = enabled;
  if (enabled) {
    playBgm();
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
  if (bgmGainNode) {
    bgmGainNode.gain.setValueAtTime(musicVolume, audioContext.currentTime);
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
const initAudioService = () => {
  loadSettings();
  initAudioContext();
  if (musicEnabled) {
    playBgm();
  }
};

export {
  initAudioService,
  playSound,
  playBgm,
  stopBgm,
  setSoundEnabled,
  setMusicEnabled,
  setSoundVolume,
  setMusicVolume,
  loadSettings
};