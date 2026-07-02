// ════════════════════════════════════════════════
//  supabase-client.js  ·  Monta Python 課程
// ════════════════════════════════════════════════
const SUPABASE_URL = 'https://rrsfyfnsxgzcovrswurf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyc2Z5Zm5zeGd6Y292cnN3dXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5Mjc3NTUsImV4cCI6MjA5NzUwMzc1NX0.IETsrUhExCsH6dACFC3GTlPuos4JSlIcQwkd7LV3Lrw';

// 把初始化包在 try-catch，避免任何錯誤影響到其他頁面功能
let db = null;
try {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
  console.error('[Supabase] 初始化失敗，請確認 CDN 是否正確載入：', e);
}

// 目前登入的學生 ID（從 localStorage 恢復）
let _studentId = localStorage.getItem('monta_student_id') || null;

// 目前這堂課已作答的題目，供 QuizQuestion / FillQuestion 讀取初始值
window.__quizAnswers__ = {};

// 目前這堂課最新的程式碼，供 PyRunner 讀取初始值
// key = exercise_name（例如 'bmi.py'），value = code 字串
window.__codeSubmissions__ = {};

// ──────────────────────────────────────────────
//  登入：只有老師預先建立的學生才能登入
//  回傳 true（成功）或 false（找不到）
// ──────────────────────────────────────────────
async function sbLogin(name) {
  if (!db) return false;
  try {
    const { data, error } = await db
      .from('students')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (error) { console.error('[Supabase] sbLogin error:', error); return false; }
    if (!data) return false;  // 找不到這個學生

    _studentId = data.id;
    localStorage.setItem('monta_student_id', _studentId);

    // 更新最後登入時間
    await db.from('students')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', _studentId);

    return true;
  } catch (err) {
    console.error('[Supabase] sbLogin error:', err);
    return false;
  }
}

// ──────────────────────────────────────────────
//  登入後從 Supabase 載入這個學生的課程進度
//  回傳 { 1: true/false, 2: true/false, ... }
// ──────────────────────────────────────────────
async function sbLoadLessonProgress() {
  if (!db || !_studentId) return null;
  try {
    const { data } = await db
      .from('lesson_progress')
      .select('lesson_no, status')
      .eq('student_id', _studentId);

    const doneMap = { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };
    if (data) {
      data.forEach(row => {
        if (row.status === 'completed') doneMap[row.lesson_no] = true;
      });
    }
    return doneMap;
  } catch (err) {
    console.error('[Supabase] sbLoadLessonProgress error:', err);
    return null;
  }
}

// ──────────────────────────────────────────────
//  頁面載入時讀取這堂課的作答紀錄
//  存進 window.__quizAnswers__[questionNo] = { answer, is_correct }
// ──────────────────────────────────────────────
async function sbLoadQuizAnswers(lessonNo) {
  if (!db || !_studentId) return;
  try {
    const { data } = await db
      .from('quiz_answers')
      .select('question_no, answer, is_correct')
      .eq('student_id', _studentId)
      .eq('lesson_no', lessonNo);

    window.__quizAnswers__ = {};
    if (data) {
      data.forEach(row => {
        window.__quizAnswers__[row.question_no] = {
          answer:     row.answer,
          is_correct: row.is_correct
        };
      });
    }
    window.dispatchEvent(new CustomEvent('sb:quiz-loaded'));
  } catch (err) {
    console.error('[Supabase] sbLoadQuizAnswers error:', err);
  }
}

// ──────────────────────────────────────────────
//  結束課程：標記完成 + 解鎖下一堂
// ──────────────────────────────────────────────
async function sbEndLesson(lessonNo) {
  if (!db || !_studentId) return;
  try {
    // 目前這堂 → completed
    await db.from('lesson_progress')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('student_id', _studentId)
      .eq('lesson_no', lessonNo);

    // 下一堂 → unlocked（最後一堂不需要）
    if (lessonNo < 6) {
      await db.from('lesson_progress')
        .update({ status: 'unlocked', unlocked_at: new Date().toISOString() })
        .eq('student_id', _studentId)
        .eq('lesson_no', lessonNo + 1);
    }
  } catch (err) {
    console.error('[Supabase] sbEndLesson error:', err);
  }
}

// ──────────────────────────────────────────────
//  小考作答：每題只保留最新一次
//    questionType: 'choice' | 'fill'
//    answer: 選擇題傳 '0'/'1'/'2'/'3'，填充題傳學生打的字
// ──────────────────────────────────────────────
async function sbSaveQuizAnswer(lessonNo, questionNo, questionType, answer, isCorrect) {
  if (!db || !_studentId) return;
  try {
    await db.from('quiz_answers')
      .upsert({
        student_id:    _studentId,
        lesson_no:     lessonNo,
        question_no:   questionNo,
        question_type: questionType,
        answer:        String(answer),
        is_correct:    isCorrect,
        answered_at:   new Date().toISOString()
      }, { onConflict: 'student_id,lesson_no,question_no' });
  } catch (err) {
    console.error('[Supabase] sbSaveQuizAnswer error:', err);
  }
}

// ──────────────────────────────────────────────
//  頁面載入時讀取這堂課每個練習的最新程式碼
// ──────────────────────────────────────────────
async function sbLoadCodeSubmissions(lessonNo) {
  if (!db || !_studentId) return;
  try {
    const { data } = await db
      .from('code_submissions')
      .select('exercise_name, code, submitted_at')
      .eq('student_id', _studentId)
      .eq('lesson_no', lessonNo)
      .order('submitted_at', { ascending: false });

    window.__codeSubmissions__ = {};
    if (data) {
      data.forEach(row => {
        if (!window.__codeSubmissions__[row.exercise_name]) {
          window.__codeSubmissions__[row.exercise_name] = row.code;
        }
      });
    }
    window.dispatchEvent(new CustomEvent('sb:code-loaded'));
  } catch (err) {
    console.error('[Supabase] sbLoadCodeSubmissions error:', err);
  }
}

// ──────────────────────────────────────────────
//  程式練習提交：每次按執行都存一筆
//    exerciseName: 例如 'bmi.py' / 'intro.py'
// ──────────────────────────────────────────────
async function sbSaveCode(lessonNo, exerciseName, code) {
  if (!db || !_studentId) return;
  try {
    await db.from('code_submissions')
      .insert({
        student_id:    _studentId,
        lesson_no:     lessonNo,
        exercise_name: exerciseName,
        code:          code,
        submitted_at:  new Date().toISOString()
      });
  } catch (err) {
    console.error('[Supabase] sbSaveCode error:', err);
  }
}
