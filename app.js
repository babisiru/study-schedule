/**
 * StudySync - Smart Study Schedule & Planner
 * 100% Client-Side Pure Frontend Application
 */

// ========================================================
// 1. DEFAULT DATA & STORAGE INITIALIZATION
// ========================================================

const STORAGE_KEY = 'studySync_v1_data';

// Supabase Cloud Configuration
const SUPABASE_URL = 'https://enpbtfrsjtqwzcgwikey.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_C-j3YzwqdBPYQN958alB-A_gVn4ZlTy';

let supabaseClient = null;

function initSupabase() {
  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      console.log('Supabase client initialized successfully');
    }
  } catch (err) {
    console.warn('Could not initialize Supabase:', err);
  }
}

function updateCloudStatus(status, text) {
  const pill = document.getElementById('cloudStatusPill');
  const indicator = pill ? pill.querySelector('.cloud-indicator') : null;
  const label = document.getElementById('cloudStatusText');
  if (!indicator || !label) return;

  indicator.className = 'cloud-indicator ' + status; // 'online' | 'syncing' | 'offline'
  label.textContent = text;
}

async function syncFromCloud() {
  if (!supabaseClient) {
    updateCloudStatus('offline', 'Local Only');
    return;
  }

  updateCloudStatus('syncing', 'Syncing Cloud...');

  try {
    const [subjRes, schedRes, tasksRes, logsRes] = await Promise.all([
      supabaseClient.from('subjects').select('*'),
      supabaseClient.from('schedule').select('*'),
      supabaseClient.from('tasks').select('*'),
      supabaseClient.from('study_logs').select('*')
    ]);

    if (subjRes.error || schedRes.error || tasksRes.error || logsRes.error) {
      const err = subjRes.error || schedRes.error || tasksRes.error || logsRes.error;
      console.warn('Supabase query note (tables might need initial SQL setup):', err);
      updateCloudStatus('offline', 'Run SQL in Supabase');
      return;
    }

    const remoteSubjects = subjRes.data || [];
    const remoteSchedule = schedRes.data || [];
    const remoteTasks = tasksRes.data || [];
    const remoteLogs = logsRes.data || [];

    // If cloud is brand new and empty, seed it with the default timetable
    if (remoteSubjects.length === 0 && remoteSchedule.length === 0) {
      console.log('Cloud database is empty, uploading initial schedule...');
      await seedCloudDatabase();
      updateCloudStatus('online', 'Cloud Initialized');
    } else {
      // Cloud has existing data -> sync into local state
      state.subjects = remoteSubjects;
      state.schedule = remoteSchedule;
      state.tasks = remoteTasks;
      state.studyLogs = remoteLogs;
      saveState();
      refreshAllViews();
      updateCloudStatus('online', 'Cloud Synced');
    }
  } catch (err) {
    console.error('Cloud sync error:', err);
    updateCloudStatus('offline', 'Offline Mode');
  }
}

async function seedCloudDatabase() {
  if (!supabaseClient) return;
  try {
    if (state.subjects.length) {
      await supabaseClient.from('subjects').upsert(state.subjects);
    }
    if (state.schedule.length) {
      await supabaseClient.from('schedule').upsert(state.schedule);
    }
    if (state.tasks.length) {
      await supabaseClient.from('tasks').upsert(state.tasks);
    }
    if (state.studyLogs.length) {
      await supabaseClient.from('study_logs').upsert(state.studyLogs);
    }
  } catch (e) {
    console.warn('Error seeding cloud database:', e);
  }
}

async function syncToCloud(table, action, recordOrId) {
  if (!supabaseClient) return;

  try {
    updateCloudStatus('syncing', 'Saving...');
    if (action === 'upsert' || action === 'insert') {
      const { error } = await supabaseClient.from(table).upsert(recordOrId);
      if (error) throw error;
    } else if (action === 'delete') {
      const { error } = await supabaseClient.from(table).delete().eq('id', recordOrId);
      if (error) throw error;
    }
    updateCloudStatus('online', 'Cloud Synced');
  } catch (err) {
    console.warn(`Failed to sync ${table} to cloud:`, err);
    updateCloudStatus('offline', 'Sync Issue');
  }
}

const DEFAULT_SUBJECTS = [
  { id: 'subj-1', name: 'Data Structures & Algorithms', color: '#3b82f6', goalHoursWeek: 8 },
  { id: 'subj-2', name: 'Linear Algebra & Calculus', color: '#10b981', goalHoursWeek: 6 },
  { id: 'subj-3', name: 'Operating Systems', color: '#8b5cf6', goalHoursWeek: 6 },
  { id: 'subj-4', name: 'Full-Stack Web Engineering', color: '#f59e0b', goalHoursWeek: 5 },
  { id: 'subj-5', name: 'Electromagnetism & Physics', color: '#ec4899', goalHoursWeek: 4 },
];

function generateSampleSchedule() {
  return [
    // Monday
    { id: 'sch-1', title: 'Trees & Graph Traversal Review', subjectId: 'subj-1', dayOfWeek: 1, startTime: '09:00', endTime: '10:30', notes: 'Solve 3 LeetCode problems on BFS/DFS' },
    { id: 'sch-2', title: 'Eigenvalues & Vector Spaces', subjectId: 'subj-2', dayOfWeek: 1, startTime: '11:00', endTime: '12:30', notes: 'Chapter 5 review exercises' },
    { id: 'sch-3', title: 'Process Scheduling & Threads', subjectId: 'subj-3', dayOfWeek: 1, startTime: '14:30', endTime: '16:00', notes: 'Read lecture slides on mutexes' },

    // Tuesday
    { id: 'sch-4', title: 'CSS Architecture & Flex/Grid', subjectId: 'subj-4', dayOfWeek: 2, startTime: '09:30', endTime: '11:30', notes: 'Build responsive landing page' },
    { id: 'sch-5', title: 'Gauss Law & Electric Flux', subjectId: 'subj-5', dayOfWeek: 2, startTime: '13:00', endTime: '14:30', notes: 'Review problem sheet 2' },
    { id: 'sch-6', title: 'Dynamic Programming Practice', subjectId: 'subj-1', dayOfWeek: 2, startTime: '16:00', endTime: '17:30', notes: 'Knapsack variations' },

    // Wednesday
    { id: 'sch-7', title: 'Linear Algebra Matrix Operations', subjectId: 'subj-2', dayOfWeek: 3, startTime: '09:00', endTime: '11:00', notes: 'Prepare for midterm quiz' },
    { id: 'sch-8', title: 'Virtual Memory & Page Tables', subjectId: 'subj-3', dayOfWeek: 3, startTime: '13:30', endTime: '15:30', notes: 'Lab 3 submission prep' },

    // Thursday
    { id: 'sch-9', title: 'REST APIs & Client State', subjectId: 'subj-4', dayOfWeek: 4, startTime: '10:00', endTime: '12:00', notes: 'Fetch API and async/await' },
    { id: 'sch-10', title: 'Magnetic Fields & Biot-Savart', subjectId: 'subj-5', dayOfWeek: 4, startTime: '14:00', endTime: '15:30', notes: 'Derivations & formulas' },

    // Friday
    { id: 'sch-11', title: 'Algorithm Complexity & Big-O', subjectId: 'subj-1', dayOfWeek: 5, startTime: '09:30', endTime: '11:00', notes: 'Review sorting proofs' },
    { id: 'sch-12', title: 'Weekly Recap & Lab Coding', subjectId: 'subj-3', dayOfWeek: 5, startTime: '13:00', endTime: '15:00', notes: 'Review memory leaks & pointers' },

    // Saturday
    { id: 'sch-13', title: 'Full Mock Test & Review', subjectId: 'subj-2', dayOfWeek: 6, startTime: '10:00', endTime: '12:30', notes: 'Timed exam practice' },
    { id: 'sch-14', title: 'Web Project Development', subjectId: 'subj-4', dayOfWeek: 6, startTime: '14:00', endTime: '16:30', notes: 'Final project milestone 1' },

    // Sunday
    { id: 'sch-15', title: 'Physics Problem Set Review', subjectId: 'subj-5', dayOfWeek: 0, startTime: '11:00', endTime: '12:30', notes: 'Self test and formula sheet creation' },
    { id: 'sch-16', title: 'Next Week Planning & Spaced Repetition', subjectId: 'subj-1', dayOfWeek: 0, startTime: '15:00', endTime: '16:30', notes: 'Flashcards and active recall' },
  ];
}

function generateSampleTasks() {
  const today = new Date();
  
  const formatDateOffset = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  return [
    { id: 'task-1', title: 'Calculus Midterm Examination', subjectId: 'subj-2', dueDate: formatDateOffset(2), priority: 'high', type: 'exam', completed: false },
    { id: 'task-2', title: 'OS Lab 2: Multi-threading with Pthreads', subjectId: 'subj-3', dueDate: formatDateOffset(4), priority: 'high', type: 'assignment', completed: false },
    { id: 'task-3', title: 'LeetCode 5 Problems on Binary Search', subjectId: 'subj-1', dueDate: formatDateOffset(1), priority: 'medium', type: 'assignment', completed: false },
    { id: 'task-4', title: 'Physics Quiz on Gauss & Coulomb Law', subjectId: 'subj-5', dueDate: formatDateOffset(6), priority: 'medium', type: 'exam', completed: false },
    { id: 'task-5', title: 'Read Frontend State Management Chapter', subjectId: 'subj-4', dueDate: formatDateOffset(8), priority: 'low', type: 'reading', completed: false },
  ];
}

function generateSampleLogs() {
  const logs = [];
  const today = new Date();

  // Add a few historical logs over the past 3 days
  for (let i = 0; i < 4; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    logs.push({
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      subjectId: 'subj-1',
      durationMinutes: 50,
      timestamp: d.getTime() - 7200000,
      dateStr: dateStr
    });
    logs.push({
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      subjectId: 'subj-2',
      durationMinutes: 45,
      timestamp: d.getTime() - 3600000,
      dateStr: dateStr
    });
  }
  return logs;
}

// Global App State
let state = {
  subjects: [],
  schedule: [],
  tasks: [],
  studyLogs: [],
  completedBlockIdsToday: [], // Set of block IDs marked done today
  completedBlockDate: new Date().toISOString().split('T')[0],
  settings: {
    theme: 'dark',
    dailyTargetHours: 4.5
  }
};

// Load or Seed Data
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = JSON.parse(saved);
      // Ensure daily reset of completed blocks if date rolled over
      const todayStr = new Date().toISOString().split('T')[0];
      if (state.completedBlockDate !== todayStr) {
        state.completedBlockIdsToday = [];
        state.completedBlockDate = todayStr;
      }
    } else {
      seedDefaultData();
    }
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    seedDefaultData();
  }
}

function seedDefaultData() {
  state = {
    subjects: DEFAULT_SUBJECTS,
    schedule: generateSampleSchedule(),
    tasks: generateSampleTasks(),
    studyLogs: generateSampleLogs(),
    completedBlockIdsToday: [],
    completedBlockDate: new Date().toISOString().split('T')[0],
    settings: {
      theme: 'dark',
      dailyTargetHours: 4.5
    }
  };
  saveState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
}

// ========================================================
// 2. AUDIO SYNTHESIS ENGINE (NO EXTERNAL AUDIO FILES NEEDED)
// ========================================================
let audioCtx = null;

function playChime(type = 'success') {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
      // Pleasant harmonic chime: C5 -> G5
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18); // G5
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.start(now);
      osc.stop(now + 1.2);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (e) {
    console.log('Audio synthesis unavailable or not permitted yet:', e);
  }
}

// ========================================================
// 3. POMODORO TIMER ENGINE
// ========================================================
let timerInterval = null;
let timerRemainingSeconds = 25 * 60;
let timerTotalSeconds = 25 * 60;
let isTimerRunning = false;
let currentTimerMode = 'pomodoro'; // 'pomodoro' | 'deep' | 'short-break' | 'long-break'

const ringCircumference = 2 * Math.PI * 140; // r=140 => 879.64

function initTimer() {
  updateTimerDisplay();
  populateTimerSubjectPicker();

  // Mode selectors
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const durationMinutes = parseInt(btn.dataset.duration, 10);
      currentTimerMode = btn.dataset.mode;
      resetTimerTo(durationMinutes);

      const modeTitles = {
        'pomodoro': 'Focus Session',
        'deep': 'Deep Work Sprint',
        'short-break': 'Short Recharge',
        'long-break': 'Extended Break'
      };
      document.getElementById('timerModeTag').textContent = modeTitles[currentTimerMode] || 'Focus Session';
    });
  });

  // Controls
  const toggleBtn = document.getElementById('timerToggleBtn');
  const resetBtn = document.getElementById('timerResetBtn');
  const skipBtn = document.getElementById('timerSkipBtn');

  toggleBtn.addEventListener('click', toggleTimer);
  resetBtn.addEventListener('click', () => {
    pauseTimer();
    const activeModeBtn = document.querySelector('.mode-btn.active');
    const mins = activeModeBtn ? parseInt(activeModeBtn.dataset.duration, 10) : 25;
    resetTimerTo(mins);
  });
  skipBtn.addEventListener('click', () => {
    if (confirm('Complete and log this focus session now?')) {
      finishTimerSession();
    }
  });

  // Quick focus button from Today's dashboard card
  const quickTimerBtn = document.getElementById('quickTimerBtn');
  if (quickTimerBtn) {
    quickTimerBtn.addEventListener('click', () => {
      switchTab('pomodoro');
      if (!isTimerRunning) {
        toggleTimer();
      }
    });
  }

  // Update timer subject label when user selects from dropdown
  const subjectSelect = document.getElementById('timerSubjectSelect');
  if (subjectSelect) {
    subjectSelect.addEventListener('change', (e) => {
      const subj = state.subjects.find(s => s.id === e.target.value);
      const pill = document.getElementById('timerCurrentSubjectPill');
      if (subj && pill) {
        pill.textContent = subj.name;
        pill.style.borderColor = subj.color;
        pill.style.color = subj.color;
      }
    });
  }
}

function resetTimerTo(minutes) {
  pauseTimer();
  timerTotalSeconds = minutes * 60;
  timerRemainingSeconds = timerTotalSeconds;
  updateTimerDisplay();
}

function toggleTimer() {
  if (isTimerRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;
  document.getElementById('timerPlayIcon').classList.add('hidden');
  document.getElementById('timerPauseIcon').classList.remove('hidden');
  document.getElementById('timerActionText').textContent = 'Pause';
  playChime('click');

  timerInterval = setInterval(() => {
    if (timerRemainingSeconds > 0) {
      timerRemainingSeconds--;
      updateTimerDisplay();
    } else {
      finishTimerSession();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isTimerRunning) return;
  isTimerRunning = false;
  clearInterval(timerInterval);
  document.getElementById('timerPlayIcon').classList.remove('hidden');
  document.getElementById('timerPauseIcon').classList.add('hidden');
  document.getElementById('timerActionText').textContent = 'Resume';
}

function finishTimerSession() {
  pauseTimer();
  playChime('success');

  const isFocusSession = currentTimerMode === 'pomodoro' || currentTimerMode === 'deep';
  const durationCompletedMinutes = Math.round((timerTotalSeconds - timerRemainingSeconds) / 60) || Math.round(timerTotalSeconds / 60);

  if (isFocusSession && durationCompletedMinutes >= 1) {
    const subjectSelect = document.getElementById('timerSubjectSelect');
    const selectedSubjId = subjectSelect ? subjectSelect.value : state.subjects[0]?.id;

    // Log study time
    const newLog = {
      id: 'log-' + Date.now(),
      subjectId: selectedSubjId,
      durationMinutes: durationCompletedMinutes,
      timestamp: Date.now(),
      dateStr: new Date().toISOString().split('T')[0]
    };
    state.studyLogs.unshift(newLog);
    saveState();
    syncToCloud('study_logs', 'insert', newLog);

    showToast(`🎉 Focus session logged: +${durationCompletedMinutes} mins!`);
  } else {
    showToast(`Break time completed! Ready for the next session.`);
  }

  // Reset to current mode duration
  const activeModeBtn = document.querySelector('.mode-btn.active');
  const mins = activeModeBtn ? parseInt(activeModeBtn.dataset.duration, 10) : 25;
  resetTimerTo(mins);

  renderDashboard();
  renderAnalytics();
}

function updateTimerDisplay() {
  const mins = Math.floor(timerRemainingSeconds / 60);
  const secs = timerRemainingSeconds % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  
  const timerDigits = document.getElementById('timerDigits');
  if (timerDigits) timerDigits.textContent = timeFormatted;

  // Ring progress
  const progressCircle = document.getElementById('timerRingProgress');
  if (progressCircle) {
    const fraction = timerRemainingSeconds / timerTotalSeconds;
    const offset = ringCircumference * (1 - fraction);
    progressCircle.style.strokeDashoffset = offset;
  }

  // Update stats hint
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = state.studyLogs.filter(l => l.dateStr === todayStr);
  const totalMins = todayLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  const completedTodayEl = document.getElementById('timerSessionsCompletedToday');
  const minsTodayEl = document.getElementById('timerMinutesFocusedToday');
  if (completedTodayEl) completedTodayEl.textContent = todayLogs.length;
  if (minsTodayEl) minsTodayEl.textContent = `${totalMins}m`;
}

function populateTimerSubjectPicker() {
  const select = document.getElementById('timerSubjectSelect');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '';

  state.subjects.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    select.appendChild(opt);
  });

  if (currentVal && state.subjects.some(s => s.id === currentVal)) {
    select.value = currentVal;
  }

  const selectedSubj = state.subjects.find(s => s.id === select.value) || state.subjects[0];
  const pill = document.getElementById('timerCurrentSubjectPill');
  if (selectedSubj && pill) {
    pill.textContent = selectedSubj.name;
    pill.style.borderColor = selectedSubj.color;
    pill.style.color = selectedSubj.color;
  }
}

// ========================================================
// 4. REAL-TIME CLOCK & DASHBOARD MONITOR
// ========================================================
function startLiveEngine() {
  const clockEl = document.getElementById('liveClockDisplay');
  const dateEl = document.getElementById('currentLiveDate');
  const dayOfWeekLabel = document.getElementById('currentDayOfWeekLabel');

  function tick() {
    const now = new Date();
    
    // Format Clock HH:MM:SS
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    if (clockEl) clockEl.textContent = `${hours}:${mins}:${secs}`;

    // Format Date: e.g. "Wednesday, November 4, 2026"
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    if (dateEl) dateEl.textContent = now.toLocaleDateString(undefined, options);

    if (dayOfWeekLabel) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      dayOfWeekLabel.textContent = days[now.getDay()];
    }

    checkActiveSession(now);
  }

  tick();
  setInterval(tick, 1000);
}

function timeStringToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function checkActiveSession(now) {
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayBlocks = state.schedule.filter(b => b.dayOfWeek === currentDay);
  
  let activeBlock = null;
  let nextBlock = null;

  for (const block of todayBlocks) {
    const startMins = timeStringToMinutes(block.startTime);
    const endMins = timeStringToMinutes(block.endTime);

    if (currentMinutes >= startMins && currentMinutes <= endMins) {
      activeBlock = block;
      break;
    } else if (currentMinutes < startMins) {
      if (!nextBlock || startMins < timeStringToMinutes(nextBlock.startTime)) {
        nextBlock = block;
      }
    }
  }

  const titleEl = document.getElementById('currentSessionTitle');
  const timeEl = document.getElementById('currentSessionTime');
  const card = document.getElementById('currentSessionCard');

  if (activeBlock) {
    const subj = state.subjects.find(s => s.id === activeBlock.subjectId);
    if (titleEl) titleEl.textContent = activeBlock.title;
    if (timeEl) timeEl.textContent = `${activeBlock.startTime} - ${activeBlock.endTime} (${subj ? subj.name : 'Study'})`;
    if (card && subj) card.style.borderLeftColor = subj.color;
  } else if (nextBlock) {
    const subj = state.subjects.find(s => s.id === nextBlock.subjectId);
    if (titleEl) titleEl.textContent = `Up Next: ${nextBlock.title}`;
    if (timeEl) timeEl.textContent = `Starts at ${nextBlock.startTime} (${subj ? subj.name : 'Study'})`;
    if (card) card.style.borderLeftColor = 'var(--border-color)';
  } else {
    if (titleEl) titleEl.textContent = 'All Done For Today! 🎉';
    if (timeEl) timeEl.textContent = 'No more scheduled study sessions today';
    if (card) card.style.borderLeftColor = 'var(--border-color)';
  }
}

// ========================================================
// 5. DASHBOARD (TODAY VIEW) RENDERING
// ========================================================
function renderDashboard() {
  const today = new Date();
  const currentDay = today.getDay();
  const todayStr = today.toISOString().split('T')[0];

  const todayBlocks = state.schedule
    .filter(b => b.dayOfWeek === currentDay)
    .sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));

  // 1. Metric: Hours studied today
  const todayLogs = state.studyLogs.filter(l => l.dateStr === todayStr);
  const totalMinsToday = todayLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalHoursToday = (totalMinsToday / 60).toFixed(1);
  const targetHours = state.settings.dailyTargetHours || 4.5;
  const percentDone = Math.min(100, Math.round((totalHoursToday / targetHours) * 100));

  document.getElementById('todayStudiedHours').textContent = totalHoursToday;
  document.getElementById('todayTargetHours').textContent = targetHours.toFixed(1);
  document.getElementById('goalPercentTag').textContent = `${percentDone}%`;
  document.getElementById('dailyGoalProgressBar').style.width = `${percentDone}%`;

  // 2. Metric: Sessions Completed
  const completedCount = state.completedBlockIdsToday.length;
  document.getElementById('completedSessionsCount').textContent = completedCount;
  document.getElementById('sessionsStatusSub').textContent = `${todayBlocks.length} planned today`;

  // Dots
  const dotsContainer = document.getElementById('sessionDotsContainer');
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    todayBlocks.forEach(b => {
      const dot = document.createElement('div');
      dot.className = 'session-dot';
      if (state.completedBlockIdsToday.includes(b.id)) {
        dot.classList.add('done');
      } else {
        dot.classList.add('pending');
      }
      dotsContainer.appendChild(dot);
    });
  }

  // 3. Today Timeline List
  const timelineEl = document.getElementById('todayTimelineList');
  const countBadge = document.getElementById('todayBlocksCount');
  if (countBadge) countBadge.textContent = `${todayBlocks.length} blocks`;

  if (!todayBlocks.length) {
    timelineEl.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path></svg>
        <p>No study blocks scheduled for today!</p>
        <button class="secondary-btn" style="margin-top:0.8rem" onclick="openAddBlockModal(null, ${currentDay})">+ Add a session for today</button>
      </div>
    `;
  } else {
    const currentMins = today.getHours() * 60 + today.getMinutes();
    
    timelineEl.innerHTML = todayBlocks.map(block => {
      const subj = state.subjects.find(s => s.id === block.subjectId) || { name: 'Subject', color: '#6366f1' };
      const startMins = timeStringToMinutes(block.startTime);
      const endMins = timeStringToMinutes(block.endTime);
      const duration = endMins - startMins;

      const isActive = currentMins >= startMins && currentMins <= endMins;
      const isCompleted = state.completedBlockIdsToday.includes(block.id);

      return `
        <div class="timeline-card ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}" style="--card-color: ${subj.color}">
          <div class="card-time-col">
            <span class="time-slot">${block.startTime} - ${block.endTime}</span>
            <span class="time-duration">${duration} mins</span>
          </div>
          <div class="card-info-col">
            <div class="card-title">${escapeHtml(block.title)}</div>
            <div class="card-tags">
              <span class="subject-pill" style="background-color: ${subj.color}">${escapeHtml(subj.name)}</span>
              ${block.notes ? `<span class="notes-preview">"${escapeHtml(block.notes)}"</span>` : ''}
            </div>
          </div>
          <div class="card-actions">
            <button class="icon-action-btn check-btn ${isCompleted ? 'checked' : ''}" title="${isCompleted ? 'Mark Pending' : 'Mark Completed'}" onclick="toggleBlockCompleted('${block.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            <button class="icon-action-btn" title="Edit Session" onclick="openAddBlockModal('${block.id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Mini Deadlines List
  renderMiniDeadlines();

  // Badges in sidebar
  document.getElementById('todayCountBadge').textContent = todayBlocks.length;
}

function toggleBlockCompleted(blockId) {
  const idx = state.completedBlockIdsToday.indexOf(blockId);
  if (idx >= 0) {
    state.completedBlockIdsToday.splice(idx, 1);
  } else {
    state.completedBlockIdsToday.push(blockId);
    playChime('success');
  }
  saveState();
  renderDashboard();
  renderWeeklyTimetable();
}

function renderMiniDeadlines() {
  const container = document.getElementById('miniDeadlinesList');
  if (!container) return;

  const pendingTasks = state.tasks
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  if (!pendingTasks.length) {
    container.innerHTML = `<p class="text-secondary text-sm" style="text-align:center; padding:1.5rem 0;">No upcoming deadlines! Great job.</p>`;
    return;
  }

  container.innerHTML = pendingTasks.map(task => {
    const subj = state.subjects.find(s => s.id === task.subjectId);
    const deadlineMeta = getDaysRemainingMeta(task.dueDate);

    return `
      <div class="deadline-mini-item">
        <div class="deadline-left">
          <div class="custom-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskStatus('${task.id}')">
            ${task.completed ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
          </div>
          <div>
            <div class="deadline-title">${escapeHtml(task.title)}</div>
            <span class="text-muted text-sm">${subj ? subj.name : 'General'}</span>
          </div>
        </div>
        <span class="deadline-days-badge ${deadlineMeta.badgeClass}">${deadlineMeta.text}</span>
      </div>
    `;
  }).join('');
}

function getDaysRemainingMeta(dueDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr + 'T00:00:00');
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)}d overdue`, badgeClass: 'badge-urgent' };
  } else if (diffDays === 0) {
    return { text: 'Today!', badgeClass: 'badge-urgent' };
  } else if (diffDays === 1) {
    return { text: 'Tomorrow', badgeClass: 'badge-soon' };
  } else if (diffDays <= 3) {
    return { text: `${diffDays} days left`, badgeClass: 'badge-soon' };
  } else {
    return { text: `${diffDays} days`, badgeClass: 'badge-future' };
  }
}

// Quick Add Task from Today's view
function setupQuickTask() {
  const input = document.getElementById('quickTaskInput');
  const btn = document.getElementById('quickTaskAddBtn');

  function handleAdd() {
    const val = input.value.trim();
    if (!val) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newTask = {
      id: 'task-' + Date.now(),
      title: val,
      subjectId: state.subjects[0]?.id || 'subj-1',
      dueDate: todayStr,
      priority: 'medium',
      type: 'assignment',
      completed: false
    };

    state.tasks.push(newTask);
    saveState();
    syncToCloud('tasks', 'insert', newTask);
    input.value = '';
    renderDashboard();
    renderTasksList();
    showToast('Task added to today!');
  }

  btn.addEventListener('click', handleAdd);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAdd();
  });
}

// ========================================================
// 6. WEEKLY TIMETABLE RENDERING
// ========================================================
let currentDayFilter = 'all';
let currentSubjectFilter = 'all';

function initTimetable() {
  // Day filter pills
  document.querySelectorAll('.day-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.day-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDayFilter = btn.dataset.day;
      renderWeeklyTimetable();
    });
  });

  // Subject filter
  const subjFilterSelect = document.getElementById('filterSubjectSelect');
  subjFilterSelect.addEventListener('change', (e) => {
    currentSubjectFilter = e.target.value;
    renderWeeklyTimetable();
  });
}

function populateTimetableFilters() {
  const select = document.getElementById('filterSubjectSelect');
  if (!select) return;

  const current = select.value;
  select.innerHTML = '<option value="all">All Subjects</option>';
  state.subjects.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    select.appendChild(opt);
  });
  if (current) select.value = current;
}

function renderWeeklyTimetable() {
  const container = document.getElementById('weeklyGridContainer');
  if (!container) return;

  const today = new Date();
  const currentDayOfWeek = today.getDay();

  // Day metadata (Monday = 1, Sunday = 0)
  const days = [
    { dayIndex: 1, name: 'Monday' },
    { dayIndex: 2, name: 'Tuesday' },
    { dayIndex: 3, name: 'Wednesday' },
    { dayIndex: 4, name: 'Thursday' },
    { dayIndex: 5, name: 'Friday' },
    { dayIndex: 6, name: 'Saturday' },
    { dayIndex: 0, name: 'Sunday' }
  ];

  const visibleDays = currentDayFilter === 'all' 
    ? days 
    : days.filter(d => d.dayIndex === parseInt(currentDayFilter, 10));

  container.style.gridTemplateColumns = `repeat(${visibleDays.length}, 1fr)`;

  container.innerHTML = visibleDays.map(d => {
    const isToday = d.dayIndex === currentDayOfWeek;
    
    // Filter sessions for this day
    const daySessions = state.schedule
      .filter(s => s.dayOfWeek === d.dayIndex)
      .filter(s => currentSubjectFilter === 'all' || s.subjectId === currentSubjectFilter)
      .sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));

    return `
      <div class="weekly-day-col ${isToday ? 'is-today' : ''}">
        <div class="day-col-header">
          <div class="day-col-name">${d.name} ${isToday ? '• Today' : ''}</div>
          <div class="day-col-date">${daySessions.length} session${daySessions.length !== 1 ? 's' : ''}</div>
        </div>

        <div class="day-col-sessions">
          ${daySessions.map(session => {
            const subj = state.subjects.find(s => s.id === session.subjectId) || { name: 'Subject', color: '#6366f1' };
            const isCompletedToday = isToday && state.completedBlockIdsToday.includes(session.id);

            return `
              <div class="timetable-block ${isCompletedToday ? 'is-completed' : ''}" 
                   style="--block-color: ${subj.color}" 
                   onclick="openAddBlockModal('${session.id}')"
                   title="${escapeHtml(session.notes || '')}">
                <div class="block-time">${session.startTime} - ${session.endTime}</div>
                <div class="block-name">${escapeHtml(session.title)}</div>
                <span class="subject-pill" style="background-color: ${subj.color}; margin-top: 0.35rem; display:inline-block;">${escapeHtml(subj.name)}</span>
              </div>
            `;
          }).join('')}

          <div class="add-block-placeholder" onclick="openAddBlockModal(null, ${d.dayIndex})">
            + Add Session
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ========================================================
// 7. TASKS & DEADLINES VIEW
// ========================================================
let taskStatusFilter = 'all';
let taskSubjectFilter = 'all';

function initTasks() {
  document.querySelectorAll('#taskStatusFilter .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#taskStatusFilter .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      taskStatusFilter = btn.dataset.filter;
      renderTasksList();
    });
  });

  const subjSelect = document.getElementById('taskSubjectFilterSelect');
  if (subjSelect) {
    subjSelect.addEventListener('change', (e) => {
      taskSubjectFilter = e.target.value;
      renderTasksList();
    });
  }

  // Open modal button
  document.getElementById('openAddTaskModalBtn').addEventListener('click', () => {
    openAddTaskModal();
  });

  // Link button from today view
  const viewAllBtn = document.getElementById('goToDeadlinesTabBtn');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => switchTab('deadlines'));
  }
}

function populateTaskFilterDropdown() {
  const select = document.getElementById('taskSubjectFilterSelect');
  if (!select) return;

  const cur = select.value;
  select.innerHTML = '<option value="all">All Subjects</option>';
  state.subjects.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    select.appendChild(opt);
  });
  if (cur) select.value = cur;
}

function renderTasksList() {
  const container = document.getElementById('tasksListContainer');
  if (!container) return;

  const filteredTasks = state.tasks
    .filter(t => {
      if (taskStatusFilter === 'pending') return !t.completed;
      if (taskStatusFilter === 'completed') return t.completed;
      return true;
    })
    .filter(t => taskSubjectFilter === 'all' || t.subjectId === taskSubjectFilter)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Update pending badge in sidebar
  const pendingCount = state.tasks.filter(t => !t.completed).length;
  document.getElementById('pendingTasksBadge').textContent = pendingCount;

  if (!filteredTasks.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
        <p>No tasks found in this view.</p>
        <button class="primary-btn" style="margin-top:0.8rem" onclick="openAddTaskModal()">Create Task</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredTasks.map(task => {
    const subj = state.subjects.find(s => s.id === task.subjectId) || { name: 'General', color: '#6366f1' };
    const deadlineMeta = getDaysRemainingMeta(task.dueDate);

    return `
      <div class="task-card ${task.completed ? 'is-completed' : ''}">
        <div class="task-card-header">
          <div class="custom-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskStatus('${task.id}')">
            ${task.completed ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
          </div>
          <div class="task-card-title">${escapeHtml(task.title)}</div>
          <button class="icon-action-btn" title="Edit Task" onclick="openAddTaskModal('${task.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
        </div>

        <div style="display:flex; gap:0.5rem; align-items:center;">
          <span class="subject-pill" style="background-color: ${subj.color}">${escapeHtml(subj.name)}</span>
          <span class="task-priority-pill priority-${task.priority || 'medium'}">${task.priority ? task.priority.toUpperCase() : 'MEDIUM'}</span>
        </div>

        <div class="task-card-meta">
          <span>📅 Due: ${task.dueDate}</span>
          <span class="deadline-days-badge ${deadlineMeta.badgeClass}">${deadlineMeta.text}</span>
        </div>
      </div>
    `;
  }).join('');
}

function toggleTaskStatus(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    if (task.completed) playChime('success');
    saveState();
    syncToCloud('tasks', 'upsert', task);
    renderTasksList();
    renderDashboard();
  }
}

// ========================================================
// 8. SUBJECTS & ANALYTICS
// ========================================================
function renderAnalytics() {
  renderSubjectsList();
  renderDistributionChart();
  renderRecentLogs();
}

function renderSubjectsList() {
  const container = document.getElementById('subjectsListContainer');
  if (!container) return;

  container.innerHTML = state.subjects.map(s => {
    // Calculate total hours logged for this subject
    const subjectLogs = state.studyLogs.filter(l => l.subjectId === s.id);
    const totalMinutes = subjectLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    return `
      <div class="subject-item-card">
        <div class="subject-meta-left">
          <span class="subject-color-badge" style="background-color: ${s.color};"></span>
          <span class="subject-name-text">${escapeHtml(s.name)}</span>
        </div>
        <div class="subject-stats-right">
          <span>${totalHours} hrs studied</span>
          <span>Goal: ${s.goalHoursWeek}h/wk</span>
          <button class="icon-action-btn" title="Edit Subject" onclick="openSubjectModal('${s.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderDistributionChart() {
  const container = document.getElementById('studyDistributionChart');
  if (!container) return;

  // Calculate study time in last 7 days per subject
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentLogs = state.studyLogs.filter(l => l.timestamp >= sevenDaysAgo);

  const totalMins = recentLogs.reduce((acc, l) => acc + l.durationMinutes, 0);

  if (totalMins === 0) {
    container.innerHTML = `<p class="text-secondary text-sm">No study sessions logged in the last 7 days. Start the timer to track progress!</p>`;
    return;
  }

  container.innerHTML = state.subjects.map(subj => {
    const subjLogs = recentLogs.filter(l => l.subjectId === subj.id);
    const subjMins = subjLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
    const percentage = Math.round((subjMins / totalMins) * 100) || 0;
    const hours = (subjMins / 60).toFixed(1);

    return `
      <div class="subject-bar-row">
        <div class="subject-bar-label">
          <span>${escapeHtml(subj.name)}</span>
          <span>${hours} hrs (${percentage}%)</span>
        </div>
        <div class="subject-progress-bg">
          <div class="subject-progress-bar" style="width: ${percentage}%; background-color: ${subj.color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRecentLogs() {
  const container = document.getElementById('recentStudyLogsList');
  if (!container) return;

  const recent = state.studyLogs.slice(0, 8);
  if (!recent.length) {
    container.innerHTML = `<p class="text-secondary text-sm">No logs yet.</p>`;
    return;
  }

  container.innerHTML = recent.map(log => {
    const subj = state.subjects.find(s => s.id === log.subjectId) || { name: 'Subject', color: '#6366f1' };
    const dateFormatted = new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return `
      <div class="history-item">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span class="subject-color-badge" style="background-color: ${subj.color}"></span>
          <strong>${escapeHtml(subj.name)}</strong>
        </div>
        <div style="display:flex; align-items:center; gap:1rem;">
          <span class="text-muted text-sm">${dateFormatted}</span>
          <span class="badge" style="background:var(--accent-glow); color:var(--accent-primary)">+${log.durationMinutes} min</span>
        </div>
      </div>
    `;
  }).join('');
}

// ========================================================
// 9. MODALS & FORMS HANDLERS
// ========================================================
function initModals() {
  // Close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close;
      closeModal(modalId);
    });
  });

  // Close when clicking background
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Open Study Block Modal Button
  document.getElementById('openAddBlockModalBtn').addEventListener('click', () => {
    openAddBlockModal();
  });

  // Open Subject Modal Button
  document.getElementById('openAddSubjectModalBtn').addEventListener('click', () => {
    openSubjectModal();
  });

  // Forms
  document.getElementById('blockForm').addEventListener('submit', handleBlockFormSubmit);
  document.getElementById('deleteBlockBtn').addEventListener('click', handleBlockDelete);

  document.getElementById('subjectForm').addEventListener('submit', handleSubjectFormSubmit);
  document.getElementById('deleteSubjectBtn').addEventListener('click', handleSubjectDelete);

  document.getElementById('taskForm').addEventListener('submit', handleTaskFormSubmit);
  document.getElementById('deleteTaskBtn').addEventListener('click', handleTaskDelete);

  // Subject color input display sync
  const colorInput = document.getElementById('subjectColor');
  const hexDisplay = document.getElementById('colorHexDisplay');
  colorInput.addEventListener('input', (e) => {
    hexDisplay.textContent = e.target.value;
  });

  // Backup & Import
  document.getElementById('backupDataBtn').addEventListener('click', () => {
    openModal('backupModal');
  });

  document.getElementById('resetDemoBtn').addEventListener('click', () => {
    if (confirm('Load sample study schedule and subjects? (This will restore default demo data)')) {
      seedDefaultData();
      refreshAllViews();
      showToast('Loaded sample study schedule!');
    }
  });

  document.getElementById('confirmResetBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset everything back to the sample demo data?')) {
      seedDefaultData();
      closeModal('backupModal');
      refreshAllViews();
      showToast('Reset back to sample data.');
    }
  });

  document.getElementById('exportJsonBtn').addEventListener('click', exportDataAsJson);
  document.getElementById('importJsonInput').addEventListener('change', importDataFromJson);
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// ------------------------------------
// Block Modal
// ------------------------------------
function openAddBlockModal(blockId = null, defaultDay = null) {
  const modal = document.getElementById('blockModal');
  const title = document.getElementById('blockModalTitle');
  const idInput = document.getElementById('blockId');
  const titleInput = document.getElementById('blockTitle');
  const subjectSelect = document.getElementById('blockSubject');
  const daySelect = document.getElementById('blockDay');
  const startInput = document.getElementById('blockStartTime');
  const endInput = document.getElementById('blockEndTime');
  const notesInput = document.getElementById('blockNotes');
  const deleteBtn = document.getElementById('deleteBlockBtn');

  // Populate subjects dropdown
  subjectSelect.innerHTML = state.subjects.map(s => `
    <option value="${s.id}">${escapeHtml(s.name)}</option>
  `).join('');

  if (blockId) {
    const b = state.schedule.find(item => item.id === blockId);
    if (!b) return;

    title.textContent = 'Edit Study Session';
    idInput.value = b.id;
    titleInput.value = b.title;
    subjectSelect.value = b.subjectId;
    daySelect.value = b.dayOfWeek;
    startInput.value = b.startTime;
    endInput.value = b.endTime;
    notesInput.value = b.notes || '';
    deleteBtn.classList.remove('hidden');
  } else {
    title.textContent = 'Add Study Session';
    idInput.value = '';
    titleInput.value = '';
    daySelect.value = defaultDay !== null ? defaultDay : new Date().getDay();
    startInput.value = '10:00';
    endInput.value = '11:30';
    notesInput.value = '';
    deleteBtn.classList.add('hidden');
  }

  openModal('blockModal');
}

function handleBlockFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('blockId').value;
  const title = document.getElementById('blockTitle').value.trim();
  const subjectId = document.getElementById('blockSubject').value;
  const dayOfWeek = parseInt(document.getElementById('blockDay').value, 10);
  const startTime = document.getElementById('blockStartTime').value;
  const endTime = document.getElementById('blockEndTime').value;
  const notes = document.getElementById('blockNotes').value.trim();

  if (timeStringToMinutes(startTime) >= timeStringToMinutes(endTime)) {
    alert('End time must be after start time.');
    return;
  }

  if (id) {
    // Edit
    const block = state.schedule.find(b => b.id === id);
    if (block) {
      block.title = title;
      block.subjectId = subjectId;
      block.dayOfWeek = dayOfWeek;
      block.startTime = startTime;
      block.endTime = endTime;
      block.notes = notes;
      syncToCloud('schedule', 'upsert', block);
    }
    showToast('Session updated successfully!');
  } else {
    // Add
    const newBlock = {
      id: 'sch-' + Date.now(),
      title,
      subjectId,
      dayOfWeek,
      startTime,
      endTime,
      notes
    };
    state.schedule.push(newBlock);
    syncToCloud('schedule', 'upsert', newBlock);
    showToast('Study session created!');
  }

  saveState();
  closeModal('blockModal');
  refreshAllViews();
}

function handleBlockDelete() {
  const id = document.getElementById('blockId').value;
  if (!id) return;

  if (confirm('Are you sure you want to delete this study block?')) {
    state.schedule = state.schedule.filter(b => b.id !== id);
    state.completedBlockIdsToday = state.completedBlockIdsToday.filter(bId => bId !== id);
    saveState();
    syncToCloud('schedule', 'delete', id);
    closeModal('blockModal');
    refreshAllViews();
    showToast('Session deleted.');
  }
}

// ------------------------------------
// Subject Modal
// ------------------------------------
function openSubjectModal(subjectId = null) {
  const title = document.getElementById('subjectModalTitle');
  const idInput = document.getElementById('subjectId');
  const nameInput = document.getElementById('subjectName');
  const goalInput = document.getElementById('subjectGoalHours');
  const colorInput = document.getElementById('subjectColor');
  const hexDisplay = document.getElementById('colorHexDisplay');
  const deleteBtn = document.getElementById('deleteSubjectBtn');

  if (subjectId) {
    const s = state.subjects.find(sub => sub.id === subjectId);
    if (!s) return;

    title.textContent = 'Edit Subject';
    idInput.value = s.id;
    nameInput.value = s.name;
    goalInput.value = s.goalHoursWeek;
    colorInput.value = s.color;
    hexDisplay.textContent = s.color;
    deleteBtn.classList.remove('hidden');
  } else {
    title.textContent = 'Add Course / Subject';
    idInput.value = '';
    nameInput.value = '';
    goalInput.value = '6.0';
    colorInput.value = '#6366f1';
    hexDisplay.textContent = '#6366f1';
    deleteBtn.classList.add('hidden');
  }

  openModal('subjectModal');
}

function handleSubjectFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('subjectId').value;
  const name = document.getElementById('subjectName').value.trim();
  const goalHoursWeek = parseFloat(document.getElementById('subjectGoalHours').value) || 6;
  const color = document.getElementById('subjectColor').value;

  if (id) {
    const s = state.subjects.find(sub => sub.id === id);
    if (s) {
      s.name = name;
      s.goalHoursWeek = goalHoursWeek;
      s.color = color;
      syncToCloud('subjects', 'upsert', s);
    }
    showToast('Subject updated!');
  } else {
    const newSubject = {
      id: 'subj-' + Date.now(),
      name,
      color,
      goalHoursWeek
    };
    state.subjects.push(newSubject);
    syncToCloud('subjects', 'upsert', newSubject);
    showToast('New subject added!');
  }

  saveState();
  closeModal('subjectModal');
  refreshAllViews();
}

function handleSubjectDelete() {
  const id = document.getElementById('subjectId').value;
  if (!id) return;

  if (state.subjects.length <= 1) {
    alert('You must keep at least one subject in your study schedule.');
    return;
  }

  if (confirm('Delete this subject? Scheduled sessions for this subject will also be affected.')) {
    state.subjects = state.subjects.filter(s => s.id !== id);
    saveState();
    syncToCloud('subjects', 'delete', id);
    closeModal('subjectModal');
    refreshAllViews();
    showToast('Subject deleted.');
  }
}

// ------------------------------------
// Task Modal
// ------------------------------------
function openAddTaskModal(taskId = null) {
  const title = document.getElementById('taskModalTitle');
  const idInput = document.getElementById('taskId');
  const titleInput = document.getElementById('taskTitle');
  const subjectSelect = document.getElementById('taskSubject');
  const prioritySelect = document.getElementById('taskPriority');
  const dueInput = document.getElementById('taskDueDate');
  const typeSelect = document.getElementById('taskType');
  const deleteBtn = document.getElementById('deleteTaskBtn');

  subjectSelect.innerHTML = state.subjects.map(s => `
    <option value="${s.id}">${escapeHtml(s.name)}</option>
  `).join('');

  if (taskId) {
    const t = state.tasks.find(item => item.id === taskId);
    if (!t) return;

    title.textContent = 'Edit Task / Deadline';
    idInput.value = t.id;
    titleInput.value = t.title;
    subjectSelect.value = t.subjectId;
    prioritySelect.value = t.priority || 'medium';
    dueInput.value = t.dueDate;
    typeSelect.value = t.type || 'assignment';
    deleteBtn.classList.remove('hidden');
  } else {
    title.textContent = 'Add Task / Deadline';
    idInput.value = '';
    titleInput.value = '';
    prioritySelect.value = 'medium';
    
    // Default due tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    dueInput.value = d.toISOString().split('T')[0];
    
    typeSelect.value = 'assignment';
    deleteBtn.classList.add('hidden');
  }

  openModal('taskModal');
}

function handleTaskFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('taskId').value;
  const title = document.getElementById('taskTitle').value.trim();
  const subjectId = document.getElementById('taskSubject').value;
  const priority = document.getElementById('taskPriority').value;
  const dueDate = document.getElementById('taskDueDate').value;
  const type = document.getElementById('taskType').value;

  if (id) {
    const t = state.tasks.find(item => item.id === id);
    if (t) {
      t.title = title;
      t.subjectId = subjectId;
      t.priority = priority;
      t.dueDate = dueDate;
      t.type = type;
      syncToCloud('tasks', 'upsert', t);
    }
    showToast('Task updated!');
  } else {
    const newTask = {
      id: 'task-' + Date.now(),
      title,
      subjectId,
      priority,
      dueDate,
      type,
      completed: false
    };
    state.tasks.push(newTask);
    syncToCloud('tasks', 'upsert', newTask);
    showToast('New deadline saved!');
  }

  saveState();
  closeModal('taskModal');
  refreshAllViews();
}

function handleTaskDelete() {
  const id = document.getElementById('taskId').value;
  if (!id) return;

  if (confirm('Delete this task or deadline?')) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveState();
    syncToCloud('tasks', 'delete', id);
    closeModal('taskModal');
    refreshAllViews();
    showToast('Task deleted.');
  }
}

// ------------------------------------
// Export / Import
// ------------------------------------
function exportDataAsJson() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `study_schedule_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importDataFromJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (imported.subjects && imported.schedule) {
        state = imported;
        saveState();
        closeModal('backupModal');
        refreshAllViews();
        showToast('Schedule restored from JSON!');
      } else {
        alert('Invalid file format. Please upload a valid StudySync JSON backup.');
      }
    } catch (err) {
      alert('Error parsing JSON backup file.');
    }
  };
  reader.readAsText(file);
}

// ========================================================
// 10. NAVIGATION, TOASTS & THEMES
// ========================================================
function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });

  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === `tab-${tabId}`);
  });

  const tabTitles = {
    'today': "Today's Schedule",
    'timetable': 'Weekly Timetable',
    'pomodoro': 'Focus Timer',
    'deadlines': 'Tasks & Deadlines',
    'analytics': 'Subjects & Analytics'
  };
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) pageTitle.textContent = tabTitles[tabId] || 'Schedule';

  // Trigger re-render of relevant tab components
  if (tabId === 'today') renderDashboard();
  if (tabId === 'timetable') renderWeeklyTimetable();
  if (tabId === 'deadlines') renderTasksList();
  if (tabId === 'analytics') renderAnalytics();
}

function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const moonIcon = document.getElementById('themeMoon');
  const sunIcon = document.getElementById('themeSun');

  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      moonIcon.classList.add('hidden');
      sunIcon.classList.remove('hidden');
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      moonIcon.classList.remove('hidden');
      sunIcon.classList.add('hidden');
    }
  }

  applyTheme(state.settings?.theme || 'dark');

  themeToggleBtn.addEventListener('click', () => {
    const isCurrentlyLight = document.body.classList.contains('theme-light');
    const newTheme = isCurrentlyLight ? 'dark' : 'light';
    state.settings.theme = newTheme;
    saveState();
    applyTheme(newTheme);
  });
}

let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove('hidden');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2800);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function refreshAllViews() {
  populateTimerSubjectPicker();
  populateTimetableFilters();
  populateTaskFilterDropdown();
  renderDashboard();
  renderWeeklyTimetable();
  renderTasksList();
  renderAnalytics();
}

// Global references for HTML inline event handlers
window.openAddBlockModal = openAddBlockModal;
window.toggleBlockCompleted = toggleBlockCompleted;
window.toggleTaskStatus = toggleTaskStatus;
window.openAddTaskModal = openAddTaskModal;
window.openSubjectModal = openSubjectModal;

// ========================================================
// 11. INITIALIZATION ON DOM READY
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTheme();
  initNavigation();
  initModals();
  initTimer();
  initTimetable();
  initTasks();
  setupQuickTask();
  startLiveEngine();
  refreshAllViews();
  initSupabase();
  syncFromCloud();
});

