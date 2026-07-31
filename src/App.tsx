import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Bell, 
  Check, 
  Sparkles, 
  Plus, 
  Award, 
  Info, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  Droplets, 
  Calendar, 
  BookOpen,
  ArrowRight,
  Clock,
  ThumbsUp,
  Heart
} from 'lucide-react';
import { EXERCISES, HEALTH_TIPS, Exercise, HealthTip } from './data';
import StretchAnimation from './components/StretchAnimation';

export default function App() {
  // --- Persistent Storage State ---
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('sedentary_user_name') || '健康办公族';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  // Today progress from localStorage
  const [stats, setStats] = useState(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`sedentary_stats_${todayStr}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      completedCount: 0,
      totalActiveMinutes: 0,
      hydrationGlassCount: 0,
      streakDays: Number(localStorage.getItem('sedentary_streak_days') || '1')
    };
  });

  // Past 7 Days History
  const [history, setHistory] = useState<{ [dateUtc: string]: number }>(() => {
    const saved = localStorage.getItem('sedentary_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    // Generate lovely mock initial data so calendar doesn't look barren
    const mockHist: { [dateUtc: string]: number } = {};
    const today = new Date();
    for (let i = 1; i <= 6; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      const dateStr = pastDate.toISOString().split('T')[0];
      mockHist[dateStr] = Math.floor(Math.random() * 5); // 0 to 4 breaks completed
    }
    return mockHist;
  });

  // Save Today Stats Helper
  const saveTodayStats = (updatedStats: typeof stats) => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(`sedentary_stats_${todayStr}`, JSON.stringify(updatedStats));
    setStats(updatedStats);

    // Also sync the streak count and history
    const updatedHistory = { ...history, [todayStr]: updatedStats.completedCount };
    localStorage.setItem('sedentary_history', JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
  };

  // --- Theme State (Soft and Professional Light theme) ---
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // --- Countdown Working State ---
  const [presetDuration, setPresetDuration] = useState<number>(45); // Minutes
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60); // Seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<'working' | 'stretching' | 'completed'>('working');

  // --- Stretching / Exercises State ---
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState<number>(EXERCISES[0].duration);
  const [exerciseIsPlaying, setExerciseIsPlaying] = useState<boolean>(false);

  // --- Health Tips State ---
  const [activeTipIndex, setActiveTipIndex] = useState<number>(0);

  // Refs for precise interval timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stretchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize notifications status
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // --- Web Audio Synthesizer (Chime & Success melodies) ---
  const playModernChime = (type: 'alarm' | 'success' | 'click' | 'step') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq: number, startTime: number, duration: number, toneType: OscillatorType = 'sine', volume = 0.25) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = toneType;
        osc.frequency.value = freq;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      if (type === 'alarm') {
        // Comforting, repeating major 7th chord (C5 -> E5 -> G5 -> B5) - reminding softly without panic
        playTone(523.25, now, 1.2, 'sine', 0.3); // C5
        playTone(659.25, now + 0.15, 1.0, 'sine', 0.3); // E5
        playTone(783.99, now + 0.3, 1.2, 'sine', 0.3); // G5
        playTone(987.77, now + 0.45, 1.5, 'sine', 0.25); // B5
      } else if (type === 'success') {
        // High, sparkling double fourth interval melody
        playTone(587.33, now, 0.2, 'sine', 0.2); // D5
        playTone(659.25, now + 0.1, 0.2, 'sine', 0.2); // E5
        playTone(783.99, now + 0.2, 0.3, 'sine', 0.25); // G5
        playTone(1046.50, now + 0.35, 0.8, 'sine', 0.3); // C6
      } else if (type === 'step') {
        // Soft bubble pop
        playTone(440.00, now, 0.15, 'sine', 0.15);
        playTone(880.00, now + 0.05, 0.15, 'sine', 0.1);
      } else {
        // Tiny tap click
        playTone(600, now, 0.08, 'sine', 0.2);
      }
    } catch (e) {
      console.warn('Audio synthesis is blocked by browser gesture rules', e);
    }
  };

  // --- Working Countdown Ticker ---
  useEffect(() => {
    if (isRunning && currentPhase === 'working') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            triggerStretchStation();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, currentPhase]);

  // --- Stretch Session Countdown Ticker ---
  useEffect(() => {
    if (exerciseIsPlaying && currentPhase === 'stretching') {
      stretchTimerRef.current = setInterval(() => {
        setExerciseTimeLeft((prev) => {
          if (prev <= 1) {
            // Exercise completed - advance automatically or complete
            playModernChime('step');
            handleNextExercise();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (stretchTimerRef.current) clearInterval(stretchTimerRef.current);
    }

    return () => {
      if (stretchTimerRef.current) clearInterval(stretchTimerRef.current);
    };
  }, [exerciseIsPlaying, currentPhase, activeExerciseIndex]);

  // Push notifications mechanism
  const triggerStretchStation = () => {
    setCurrentPhase('stretching');
    setActiveExerciseIndex(0);
    setExerciseTimeLeft(EXERCISES[0].duration);
    setExerciseIsPlaying(true);
    playModernChime('alarm');

    if (Notification.permission === 'granted') {
      new Notification('坐得有点久啦，起来活动一下身体！', {
        body: '「时间到啦」放下手头的工作，跟随屏幕进行 3 分钟微拉伸，保护你的脊椎和眼睛。',
        icon: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=150&h=150',
      });
    }
  };

  // Request & test notifications
  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert('您的浏览器不支持桌面通知。');
      return;
    }
    playModernChime('click');
    const res = await Notification.requestPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      new Notification('通知开启成功！', {
        body: '当久坐时间结束时，我会在桌面及时提醒您进行舒展拉伸！',
      });
    }
  };

  // Manual fast trigger for tests
  const handleQuickStretch = () => {
    playModernChime('click');
    setCurrentPhase('stretching');
    setActiveExerciseIndex(0);
    setExerciseTimeLeft(EXERCISES[0].duration);
    setExerciseIsPlaying(true);
  };

  // Preset Timer Switcher
  const handleSetPreset = (mins: number) => {
    playModernChime('click');
    setPresetDuration(mins);
    setTimeLeft(mins * 60);
    setIsRunning(false);
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setPresetDuration(val);
    setTimeLeft(val * 60);
    setIsRunning(false);
  };

  // Timer Control
  const toggleTimer = () => {
    playModernChime('click');
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    playModernChime('click');
    setIsRunning(false);
    setTimeLeft(presetDuration * 60);
  };

  // --- Stretch Action Handlers ---
  const handlePrevExercise = () => {
    if (activeExerciseIndex > 0) {
      playModernChime('click');
      const idx = activeExerciseIndex - 1;
      setActiveExerciseIndex(idx);
      setExerciseTimeLeft(EXERCISES[idx].duration);
    }
  };

  const handleNextExercise = () => {
    if (activeExerciseIndex < EXERCISES.length - 1) {
      playModernChime('click');
      const idx = activeExerciseIndex + 1;
      setActiveExerciseIndex(idx);
      setExerciseTimeLeft(EXERCISES[idx].duration);
    } else {
      // Completed last exercise of the series!
      handleCompleteStretchSeries();
    }
  };

  const handleCompleteStretchSeries = () => {
    playModernChime('success');
    setCurrentPhase('completed');
    setExerciseIsPlaying(false);

    // Save statistics
    const todayActiveSec = EXERCISES.reduce((acc, curr) => acc + curr.duration, 0);
    const updatedStats = {
      ...stats,
      completedCount: stats.completedCount + 1,
      totalActiveMinutes: stats.totalActiveMinutes + Math.round(todayActiveSec / 60),
    };
    saveTodayStats(updatedStats);
  };

  const handleExitToWork = () => {
    playModernChime('click');
    setCurrentPhase('working');
    setTimeLeft(presetDuration * 60);
    setIsRunning(false);
  };

  // Water Drink logger
  const handleDrinkWater = () => {
    playModernChime('step');
    const updated = {
      ...stats,
      hydrationGlassCount: stats.hydrationGlassCount + 1
    };
    saveTodayStats(updated);
  };

  const handleResetWater = () => {
    playModernChime('click');
    const updated = {
      ...stats,
      hydrationGlassCount: 0
    };
    saveTodayStats(updated);
  };

  // Name editing handler
  const saveName = () => {
    playModernChime('click');
    const finalName = nameInput.trim() || '健康办公族';
    setUserName(finalName);
    localStorage.setItem('sedentary_user_name', finalName);
    setIsEditingName(false);
  };

  // Quick Tip Navigator
  const rotateTip = () => {
    playModernChime('click');
    setActiveTipIndex((prev) => (prev + 1) % HEALTH_TIPS.length);
  };

  // Progress Bar Helper
  const progressPercent = ((presetDuration * 60 - timeLeft) / (presetDuration * 60)) * 100;

  // Format MM:SS helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get Calendar Heatmap Colors
  const getPastDateStr = (offsetDays: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors duration-500 selection:bg-emerald-200">
      
      {/* Decorative Warm Top Background Banner */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-emerald-100/50 to-transparent pointer-events-none" />

      {/* Primary Contain Area */}
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10 flex flex-col min-h-screen">
        
        {/* UPPER BAR: Header and Ambient User Welcome */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-200/60">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200/50">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                久坐提醒助手
                <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">健康办公</span>
              </h1>
              <p className="text-xs text-slate-500">坐立相伴，张弛有度 · 拯救办公室僵硬关节</p>
            </div>
          </div>

          {/* User Name Greetings & Settings */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 text-sm bg-white border border-slate-200/80 rounded-xl px-4 py-2 shadow-sm">
              <span className="text-emerald-500">👤</span>
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={15}
                    className="w-28 text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-xs"
                    aria-label="用户名"
                  />
                  <button 
                    onClick={saveName} 
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    title="保存"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-slate-600 font-medium">嗨，{userName}</span>
                  <button 
                    onClick={() => {
                      setNameInput(userName);
                      setIsEditingName(true);
                    }} 
                    className="text-xs text-slate-400 hover:text-emerald-600 ml-1.5 underline underline-offset-2"
                  >
                    修改
                  </button>
                </div>
              )}
            </div>

            {/* General Utilities Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-xl border transition-all ${
                  soundEnabled 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100' 
                    : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
                }`}
                title={soundEnabled ? "音效开" : "静音中"}
              >
                <Volume2 className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleRequestPermission}
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-medium ${
                  notificationPermission === 'granted'
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="hidden md:inline">
                  {notificationPermission === 'granted' ? '通知已开启' : '启用通知'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* CORE WORKSPACE ZONE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-grow">
          
          {/* LEFT-CENTER COLUMN: Interactive Session Panel */}
          <main className="lg:col-span-8 flex flex-col gap-8">
            
            <AnimatePresence mode="wait">
              
              {/* PHASE 1: COUNTDOWN WORKING VIEW */}
              {currentPhase === 'working' && (
                <motion.div
                  key="working_view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-md shadow-slate-200/30 flex flex-col items-center text-center relative overflow-hidden"
                >
                  {/* Subtle Background Glow when Timer is Active */}
                  {isRunning && (
                    <motion.div 
                      className="absolute inset-0 bg-emerald-500/5 mix-blend-multiply filter blur-3xl rounded-full"
                      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 6, repeat: Infinity }}
                    />
                  )}

                  <div className="mb-3 text-xs uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1.5 bg-slate-50 border border-slate-200/50 rounded-full px-3.5 py-1 z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isRunning ? '专注办公中 · 久坐计时器' : '倒计时准备 · 设定你的久坐阈值'}
                  </div>

                  {/* Circular Timer Visualizer representation using standard SVG and dasharray */}
                  <div className="relative my-6 flex items-center justify-center">
                    <svg className="w-64 h-64 sm:w-72 sm:h-72 transform -rotate-90">
                      {/* Trail Background track */}
                      <circle 
                        cx="128" 
                        cy="128" 
                        r="110" 
                        className="stroke-slate-100" 
                        strokeWidth="10" 
                        fill="transparent" 
                      />
                      {/* Active green progressing track */}
                      <motion.circle 
                        cx="128" 
                        cy="128" 
                        r="110" 
                        className="stroke-emerald-500" 
                        strokeWidth="10" 
                        fill="transparent" 
                        strokeDasharray="691.15" // 2 * PI * r (r = 110)
                        animate={{ strokeDashoffset: 691.15 - (691.15 * progressPercent) / 100 }}
                        transition={{ ease: "easeOut", duration: 0.5 }}
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Numeric Clock Inside Circle */}
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="font-mono text-5xl sm:text-6xl font-light tracking-tight text-slate-800">
                        {formatTime(timeLeft)}
                      </span>
                      <span className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> 
                        设定限值: {presetDuration}分钟
                      </span>
                    </div>
                  </div>

                  {/* Quick Preset Selector Grid */}
                  <div className="w-full max-w-md z-10">
                    <label className="text-xs text-slate-400 block mb-3 font-medium text-left">推荐常用办公限时时长 (分钟)：</label>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[30, 45, 60, 90].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => handleSetPreset(mins)}
                          className={`py-2 px-1 text-sm rounded-xl font-medium border transition-all ${
                            presetDuration === mins 
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {mins}m
                          <span className="block text-[9px] opacity-75">{mins === 45 ? '推荐' : ''}</span>
                        </button>
                      ))}
                    </div>

                    {/* Slider for precision customization */}
                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                      <span className="text-xs text-slate-500 font-medium whitespace-nowrap">自定义:</span>
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={presetDuration}
                        onChange={handleCustomTimeChange}
                        className="w-full accent-emerald-500 cursor-pointer"
                        aria-label="自定义久坐限值分钟"
                      />
                      <span className="font-mono text-sm text-slate-700 font-bold whitespace-nowrap w-12 text-right">
                        {presetDuration}m
                      </span>
                    </div>
                  </div>

                  {/* Playback Controls Zone */}
                  <div className="flex gap-4 items-center mt-8 z-10">
                    <button
                      onClick={resetTimer}
                      className="p-3.5 border border-slate-200 hover:border-slate-300 rounded-2xl text-slate-500 hover:text-slate-700 shadow-sm transition-all focus:outline-none"
                      title="重置计时"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>

                    <button
                      onClick={toggleTimer}
                      className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-base font-semibold shadow-md transition-all scale-102 ${
                        isRunning
                          ? 'bg-slate-700 text-white hover:bg-slate-800 shadow-slate-300'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200/50'
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <Pause className="w-5 h-5" /> 暂停倒计时
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" /> 开启健康提醒
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleQuickStretch}
                      className="flex items-center gap-1 px-4 py-3.5 border border-emerald-200 hover:bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-medium transition-all"
                      title="立即起立活动"
                    >
                      <span>随时拉伸</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* PHASE 2: ACTIVE STRETCHING GUIDE (Immersive full modal) */}
              {currentPhase === 'stretching' && (
                <motion.div
                  key="stretching_view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-900 text-white border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col relative overflow-hidden"
                >
                  {/* Subtle breathing ambient light behind */}
                  <motion.div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />

                  {/* Upper Exit Row */}
                  <div className="flex justify-between items-center pb-5 border-b border-zinc-800/80 mb-6 z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      <h2 className="text-base font-bold text-amber-400">拉伸能量补给站</h2>
                    </div>
                    <button
                      onClick={handleExitToWork}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors"
                    >
                      跳过休息，回去工作
                    </button>
                  </div>

                  {/* Grid layout for animated avatar and steps */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10">
                    
                    {/* Visualizer Area */}
                    <div className="md:col-span-5 bg-zinc-950/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-zinc-800 relative">
                      <StretchAnimation 
                        category={EXERCISES[activeExerciseIndex].category} 
                        isPlaying={exerciseIsPlaying} 
                      />

                      {/* Display current exercise timing */}
                      <div className="mt-4 flex flex-col items-center">
                        <span className="font-mono text-3xl font-bold text-amber-400">
                          {exerciseTimeLeft}秒
                        </span>
                        <div className="w-40 bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <motion.div 
                            className="bg-amber-400 h-full"
                            style={{ width: `${(exerciseTimeLeft / EXERCISES[activeExerciseIndex].duration) * 100}%` }}
                            transition={{ duration: 1, ease: "linear" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Exercise Instructions */}
                    <div className="md:col-span-7 flex flex-col justify-between h-full">
                      <div>
                        {/* Title and Category */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                            第 {activeExerciseIndex + 1} / {EXERCISES.length} 项 
                          </span>
                          <span className="text-xs text-zinc-400">{EXERCISES[activeExerciseIndex].benefit}</span>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-zinc-100 flex items-center gap-2 mb-4">
                          {EXERCISES[activeExerciseIndex].name}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950 border border-zinc-800 p-4 rounded-xl mb-4">
                          💡 <span className="font-medium text-emerald-400">健康益处：</span>
                          {EXERCISES[activeExerciseIndex].description}
                        </p>

                        {/* Bullet guidelines spotlighting */}
                        <div className="space-y-2.5">
                          {EXERCISES[activeExerciseIndex].steps.map((step, idx) => (
                            <div 
                              key={idx} 
                              className="flex gap-2.5 text-xs text-zinc-300"
                            >
                              <span className="text-amber-400 font-bold shrink-0 mt-0.5">0{idx + 1}.</span>
                              <span className="leading-relaxed">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Inner Play Controllers for stretching */}
                      <div className="flex items-center justify-between mt-8 pt-5 border-t border-zinc-800/60">
                        <div className="flex gap-2">
                          <button
                            onClick={handlePrevExercise}
                            disabled={activeExerciseIndex === 0}
                            className={`p-2.5 rounded-xl border transition-colors ${
                              activeExerciseIndex === 0 
                                ? 'border-zinc-800 text-zinc-650 cursor-not-allowed opacity-30' 
                                : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            <ChevronLeft className="w-4.5 h-4.5" />
                          </button>
                          
                          <button
                            onClick={handleNextExercise}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                          >
                            <span>
                              {activeExerciseIndex === EXERCISES.length - 1 ? '完成拉伸' : '下一项动作'}
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Pause button inside stretch */}
                        <button
                          onClick={() => setExerciseIsPlaying(!exerciseIsPlaying)}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            exerciseIsPlaying 
                              ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-750' 
                              : 'border-emerald-600 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          }`}
                        >
                          {exerciseIsPlaying ? (
                            <>
                              <Pause className="w-4 h-4" /> 暂停动作
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 animate-ping" /> 继续动作
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}

              {/* PHASE 3: COMPLETED CONGRATULATIONS PANEL */}
              {currentPhase === 'completed' && (
                <motion.div
                  key="completed_view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border-2 border-emerald-200/80 rounded-3xl p-8 sm:p-12 text-center shadow-lg shadow-emerald-100 flex flex-col items-center relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-32 h-32 text-emerald-600" />
                  </div>

                  {/* Success Icon Sparks */}
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6 scale-110 shadow-inner">
                    <Check className="w-10 h-10 stroke-[3]" />
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                    太棒了，完成了一组拉伸！
                  </h2>
                  
                  <p className="text-sm text-slate-500 max-w-sm mt-3 leading-relaxed">
                    你的骨骼、脊椎和双眼对您的爱护表达了由衷的感谢。今日能量已回满，重新焕发出发！
                  </p>

                  {/* Achievements and stats unlock */}
                  <div className="grid grid-cols-2 gap-4 w-full max-w-md my-8 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/60">
                    <div className="text-center">
                      <span className="block text-2xl font-black text-emerald-700 font-mono">
                        +{Math.round(EXERCISES.reduce((a, b) => a + b.duration, 0) / 60)}m
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">本次微运动</span>
                    </div>
                    <div className="text-center border-l border-slate-200">
                      <span className="block text-2xl font-black text-emerald-700 font-mono">
                        {stats.completedCount} 次
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">今日累计完成</span>
                    </div>
                  </div>

                  {/* Back to Work trigger */}
                  <button
                    onClick={handleExitToWork}
                    className="flex items-center gap-1.5 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-base font-semibold shadow-md shadow-emerald-200/50 transition-all scale-102"
                  >
                    <span>开启下一轮 45 分钟倒计时</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

            </AnimatePresence>

            {/* LOWER PORTION: Ergonomic Health Advice Column */}
            <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm shadow-slate-200/20 relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                    💡
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      办公人健康科普小课堂
                    </h3>
                    <p className="text-[10px] text-slate-400">每天几点办公规范，避开职业亚健康</p>
                  </div>
                </div>
                
                <button
                  onClick={rotateTip}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 text-xs"
                  title="下一条科普"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>换一个</span>
                </button>
              </div>

              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex gap-4">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    {HEALTH_TIPS[activeTipIndex].title}
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-500">
                    {HEALTH_TIPS[activeTipIndex].content}
                  </p>
                </div>
              </div>
            </section>
          </main>
          
          {/* RIGHT COLUMN: Statistics, Water Intake & Habit Calendaer */}
          <aside className="lg:col-span-4 flex flex-col gap-6 w-full">
            
            {/* COMPONENT 1: TODAY STATS MINI SUMMARY */}
            <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md shadow-slate-200/35 relative">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-500" />
                今日健康仪表盘
              </h3>

              <div className="grid grid-cols-2 gap-3.5">
                
                {/* Break Count */}
                <div className="bg-slate-50/50 border border-slate-100 p-3.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 block font-medium">拉伸次数</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-slate-800 font-mono">
                      {stats.completedCount}
                    </span>
                    <span className="text-xs text-slate-400">/ 3次目标</span>
                  </div>
                  {/* Progress Line */}
                  <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${Math.min((stats.completedCount / 3) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Active Mins */}
                <div className="bg-slate-50/50 border border-slate-100 p-3.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 block font-medium">微运动时长</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-slate-800 font-mono">
                      {stats.totalActiveMinutes}
                    </span>
                    <span className="text-xs text-slate-400">分钟</span>
                  </div>
                  <span className="text-[9px] text-emerald-600 block mt-2">✨ 身体代谢加速中</span>
                </div>

              </div>

              {/* Medals and Badges unlocked dynamically */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                <div className="text-[10px] text-slate-400 block font-medium mb-1">已解锁的健康勋章：</div>
                
                {/* Badge 1: Completed first stretch */}
                <div className="flex items-center gap-2.5 p-1.5 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    stats.completedCount >= 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400 opacity-60'
                  }`}>
                    🏅
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      脊柱守护者
                      {stats.completedCount >= 1 && <span className="text-[9px] bg-amber-50 text-amber-800 px-1 rounded">已解锁</span>}
                    </h5>
                    <p className="text-[9px] text-slate-400">今日完成至少一次微拉伸健康充能</p>
                  </div>
                </div>

                {/* Badge 2: Hydration count >= 4 */}
                <div className="flex items-center gap-2.5 p-1.5 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    stats.hydrationGlassCount >= 4 ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400 opacity-60'
                  }`}>
                    💧
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      水润动力源
                      {stats.hydrationGlassCount >= 4 && <span className="text-[9px] bg-sky-50 text-sky-800 px-1 rounded">已解锁</span>}
                    </h5>
                    <p className="text-[9px] text-slate-400">今日摄水 4 杯以上（累计 1000ml+）</p>
                  </div>
                </div>

                {/* Badge 3: Completed 3 stretch breaks in a single day */}
                <div className="flex items-center gap-2.5 p-1.5 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    stats.completedCount >= 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400 opacity-60'
                  }`}>
                    👑
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      完美自律标兵
                      {stats.completedCount >= 3 && <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1 rounded">已解锁</span>}
                    </h5>
                    <p className="text-[9px] text-slate-400">今日完成 3 组完整久坐拉伸，满分办公姿态</p>
                  </div>
                </div>

              </div>
            </section>

            {/* COMPONENT 2: INTERACTIVE WATER INTAKE TRACKER */}
            <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md shadow-slate-200/35 relative overflow-hidden">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-500 animate-bounce" />
                接水与排毒提醒
              </h3>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400">
                    配合小杯喝水，创造理所当然的起立活动空隙。
                  </p>
                  
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-3xl font-black text-sky-600 font-mono">
                      {stats.hydrationGlassCount * 250}
                    </span>
                    <span className="text-xs text-slate-500">毫升 / 约 {stats.hydrationGlassCount} 杯</span>
                  </div>

                  {stats.hydrationGlassCount > 0 && (
                    <button
                      onClick={handleResetWater}
                      className="text-[10px] text-slate-400 hover:text-red-500 mt-2 block hover:underline"
                    >
                      清零今天记录
                    </button>
                  )}
                </div>

                {/* Interactive glass visually scaling as water goes high */}
                <button
                  onClick={handleDrinkWater}
                  className="w-20 h-24 rounded-2xl bg-sky-50/50 hover:bg-sky-50 border border-sky-100 flex flex-col items-center justify-end p-2 relative shadow-inner overflow-hidden cursor-pointer group active:scale-95 transition-all"
                  title="我已经喝了 1 杯水"
                >
                  {/* Floating Bubbles */}
                  <div className="absolute top-2 left-4 w-1.5 h-1.5 bg-sky-300 rounded-full animate-bounce" />
                  <div className="absolute top-6 right-5 w-1 h-1 bg-sky-300 rounded-full animate-pulse" />

                  {/* Progressive Water Level Indicator */}
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-450 to-sky-300/80 rounded-b-xl"
                    style={{ 
                      height: `${Math.min(stats.hydrationGlassCount * 12, 100)}%`,
                      backgroundColor: '#38bdf8' 
                    }}
                    layout
                  />

                  {/* Cup outlines */}
                  <span className="relative z-10 text-[10px] text-sky-700 font-extrabold group-hover:scale-110 transition-transform">
                    +250ml
                  </span>
                  <span className="relative z-10 text-[8px] text-sky-600/60 block">
                    点我打卡
                  </span>
                </button>
              </div>
            </section>

            {/* COMPONENT 3: HABIT WEEKLY HEATMAMP CALENDAR */}
            <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md shadow-slate-200/35">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                本周坚持指数 (拉伸打卡圈)
              </h3>
              
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                记录每天起立舒展的频率。绿色越深，代表当天脊柱越轻松！
              </p>

              {/* Heatmap line Grid representation for 7 days */}
              <div className="grid grid-cols-7 gap-2.5">
                {[6, 5, 4, 3, 2, 1, 0].map((offsetIndex) => {
                  const dateStr = getPastDateStr(offsetIndex);
                  // Get counts: today counts look at active stats, past dates look at history
                  const count = offsetIndex === 0 ? stats.completedCount : (history[dateStr] || 0);
                  const isTodayStr = offsetIndex === 0;

                  // Green gradient steps based on breaks completed
                  let bgClass = "bg-slate-100 border-slate-200/70";
                  if (count === 1) bgClass = "bg-emerald-50 border-emerald-100 text-emerald-600";
                  if (count === 2) bgClass = "bg-emerald-100 border-emerald-250 text-emerald-700";
                  if (count >= 3) bgClass = "bg-emerald-500 border-emerald-600 text-white font-extrabold";

                  const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];
                  const dateObj = new Date();
                  dateObj.setDate(dateObj.getDate() - offsetIndex);
                  const cellLabel = weekDayNames[dateObj.getDay()];

                  return (
                    <div 
                      key={offsetIndex} 
                      className="flex flex-col items-center"
                      title={`${dateStr} 完成了 ${count} 次拉伸`}
                    >
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs transition-colors ${bgClass} ${isTodayStr ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}>
                        {count > 0 ? count : '-'}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 font-medium select-none">
                        {isTodayStr ? '今' : cellLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Help Legend for index */}
              <div className="flex items-center gap-2.5 mt-5 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                <span>频次：</span>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
                  <span>未打卡</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-100" />
                  <span>1次</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
                  <span>2次</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600" />
                  <span>3+次</span>
                </div>
              </div>
            </section>

          </aside>

        </div>

        {/* COMPREHENSIVE FOOTER & WATERMARK */}
        <footer className="mt-auto pt-12 pb-4 text-center text-xs text-slate-400 border-t border-slate-200/50">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            <span>健康的身体是你最高效的生产力工具</span>
          </div>
          <p>© 2026 久坐提醒助手 · 专为健康、高效办公而设计。遵循人体工学合理规划休息时段。</p>
        </footer>

      </div>
    </div>
  );
}
