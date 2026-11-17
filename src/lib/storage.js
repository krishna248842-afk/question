// Offline-first IndexedDB persistence for MemoNeet progress, bookmarks, notes, and personal questions.
// Keeps user study data 100% on-device with no login/cloud account, migrates legacy localStorage once,
// isolates personal questions from the verified curriculum bank, and provides JSON export/import backup.

import { CHAPTER_BY_ID, CHAPTER_BY_TITLE, VALID_DIFFICULTIES, VALID_QUESTION_TYPES, VALID_STAGES } from '../data/syllabus.js';

export const DB_NAME = 'memoneet-study-db';
export const DB_VERSION = 1;
export const LEGACY_LOCALSTORAGE_KEY = 'memoneet-v1';
export const BACKUP_SCHEMA_VERSION = 1;

const STORES = ['meta', 'answered', 'bookmarks', 'customQuestions', 'notes'];

export function createDefaultState() {
  return {
    answered: {},        // { [questionId]: { questionId, correct, choice, attempts, updatedAt } }
    bookmarks: [],       // string[]
    customQuestions: [], // personal user-authored MCQs (always custom: true, excluded from verified count)
    notes: [],           // { id, title, text, chapterId, createdAt, updatedAt }[]
    activityDays: [],    // ISO YYYY-MM-DD strings (local date)
    preferences: {
      shuffleOptions: true,
    },
    storageBackend: 'indexeddb',
  };
}

export function toDateKey(timestamp = Date.now()) {
  const d = new Date(timestamp);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeStudyStreak(activityDays = [], referenceTimestamp = Date.now()) {
  if (!Array.isArray(activityDays) || activityDays.length === 0) return 0;
  const daySet = new Set(activityDays);
  const oneDay = 86400000;
  const todayKey = toDateKey(referenceTimestamp);
  const yesterdayKey = toDateKey(referenceTimestamp - oneDay);

  let cursor = null;
  if (daySet.has(todayKey)) cursor = referenceTimestamp;
  else if (daySet.has(yesterdayKey)) cursor = referenceTimestamp - oneDay;
  else return 0;

  let streak = 0;
  while (daySet.has(toDateKey(cursor))) {
    streak++;
    cursor -= oneDay;
  }
  return streak;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('answered')) db.createObjectStore('answered', { keyPath: 'questionId' });
      if (!db.objectStoreNames.contains('bookmarks')) db.createObjectStore('bookmarks', { keyPath: 'questionId' });
      if (!db.objectStoreNames.contains('customQuestions')) db.createObjectStore('customQuestions', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

function readAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function runWriteTx(db, storeNames, work) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, 'readwrite');
    work(tx);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

export function sanitizePersonalQuestion(input, existingId = null) {
  const chById = input.chapterId ? CHAPTER_BY_ID.get(input.chapterId) : null;
  const chByTitle = input.chapter ? CHAPTER_BY_TITLE.get(input.chapter) : null;
  const ch = chById || chByTitle || CHAPTER_BY_ID.get('c11-01');

  const question = String(input.question || '').trim();
  const options = Array.isArray(input.options)
    ? input.options.slice(0, 4).map((o) => String(o || '').trim())
    : [];
  const explanation = String(input.explanation || '').trim();
  const topic = String(input.topic || 'Personal practice').trim() || 'Personal practice';
  const answer = Number(input.answer);

  if (!question) throw new Error('Question text is required.');
  if (options.length !== 4 || options.some((o) => !o)) {
    throw new Error('All four options are required.');
  }
  if (new Set(options.map((o) => o.toLowerCase())).size !== 4) {
    throw new Error('All four options must be distinct.');
  }
  if (!Number.isInteger(answer) || answer < 0 || answer > 3) {
    throw new Error('Answer must be an integer between 0 and 3.');
  }
  if (!explanation) throw new Error('Explanation is required.');

  const stage = VALID_STAGES.includes(input.stage) ? input.stage : ch.classStage;
  const questionType = VALID_QUESTION_TYPES.includes(input.questionType)
    ? input.questionType
    : 'concept';
  const difficulty = VALID_DIFFICULTIES.includes(input.difficulty) ? input.difficulty : 'medium';
  const validSecIds = new Set(ch.sections.map((s) => s.sectionId));
  const sectionId = validSecIds.has(input.sectionId) ? input.sectionId : ch.sections[0].sectionId;
  const now = Date.now();
  const id =
    existingId ||
    (typeof input.id === 'string' && input.id.startsWith('custom-')
      ? input.id
      : `custom-${now}-${Math.random().toString(36).slice(2, 7)}`);

  return {
    id,
    custom: true,
    stage,
    classStage: ch.classStage,
    chapterId: ch.chapterId,
    chapter: ch.title,
    sectionId,
    learningObjectiveId: `${sectionId}-personal`,
    topic: topic.slice(0, 80),
    questionType,
    difficulty,
    question,
    options,
    answer,
    explanation,
    sourceNote: 'Personal study item (saved on this device · excluded from verified bank count)',
    isVerifiedOfficialPYQ: false,
    createdAt: Number(input.createdAt) || now,
    updatedAt: now,
  };
}

export function sanitizeNote(input, existingId = null) {
  const text = String(input.text || '').trim();
  if (!text) throw new Error('Note text is required.');
  const title = String(input.title || '').trim().slice(0, 100);
  const chapterId =
    input.chapterId && CHAPTER_BY_ID.has(input.chapterId) ? input.chapterId : 'all';
  const now = Date.now();
  const id =
    existingId ||
    (typeof input.id === 'string' && input.id.startsWith('note-')
      ? input.id
      : `note-${now}-${Math.random().toString(36).slice(2, 7)}`);
  return {
    id,
    title,
    text,
    chapterId,
    createdAt: Number(input.createdAt) || now,
    updatedAt: now,
  };
}

function readLegacyLocalStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loadStudyState() {
  try {
    const db = await openDatabase();
    const [metaRows, answeredRows, bookmarkRows, customRows, noteRows] = await Promise.all(
      STORES.map((name) => readAllFromStore(db, name))
    );
    const meta = Object.fromEntries(metaRows.map((r) => [r.key, r.value]));

    // One-time seamless migration if legacy localStorage had user items
    if (!meta.migratedLegacyV1) {
      const legacy = readLegacyLocalStorage();
      if (legacy && typeof legacy === 'object') {
        const migratedCustom = [];
        for (const c of Array.isArray(legacy.custom) ? legacy.custom : []) {
          try {
            migratedCustom.push(sanitizePersonalQuestion(c));
          } catch {
            // Skip malformed legacy entry
          }
        }
        const migratedNotes = [];
        for (const n of Array.isArray(legacy.notes) ? legacy.notes : []) {
          try {
            migratedNotes.push(sanitizeNote({ text: n.text }));
          } catch {
            // Skip empty legacy note
          }
        }
        const migratedBookmarks = Array.isArray(legacy.favorites)
          ? legacy.favorites.filter((id) => typeof id === 'string')
          : [];
        const migratedAnswered = [];
        const migratedDays = new Set();
        if (legacy.answered && typeof legacy.answered === 'object') {
          for (const [qId, rec] of Object.entries(legacy.answered)) {
            if (rec && typeof rec === 'object' && Number.isInteger(rec.choice)) {
              const ts = Number(rec.date) || Date.now();
              migratedAnswered.push({
                questionId: qId,
                correct: Boolean(rec.correct),
                choice: rec.choice,
                attempts: 1,
                updatedAt: ts,
              });
              migratedDays.add(toDateKey(ts));
            }
          }
        }
        await runWriteTx(db, STORES, (tx) => {
          tx.objectStore('meta').put({ key: 'migratedLegacyV1', value: true });
          tx.objectStore('meta').put({ key: 'activityDays', value: [...migratedDays].sort() });
          tx.objectStore('meta').put({ key: 'preferences', value: { shuffleOptions: true } });
          for (const a of migratedAnswered) tx.objectStore('answered').put(a);
          for (const b of migratedBookmarks) tx.objectStore('bookmarks').put({ questionId: b, addedAt: Date.now() });
          for (const c of migratedCustom) tx.objectStore('customQuestions').put(c);
          for (const n of migratedNotes) tx.objectStore('notes').put(n);
        });
        db.close();
        return loadStudyState();
      } else {
        await runWriteTx(db, ['meta'], (tx) => {
          tx.objectStore('meta').put({ key: 'migratedLegacyV1', value: true });
        });
      }
    }

    db.close();

    const answered = {};
    for (const row of answeredRows) {
      answered[row.questionId] = row;
    }
    const bookmarks = bookmarkRows.map((r) => r.questionId);
    const customQuestions = [...customRows].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const notes = [...noteRows].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const activityDays = Array.isArray(meta.activityDays) ? meta.activityDays : [];
    const preferences = {
      shuffleOptions: true,
      ...(meta.preferences && typeof meta.preferences === 'object' ? meta.preferences : {}),
    };

    return {
      answered,
      bookmarks,
      customQuestions,
      notes,
      activityDays,
      preferences,
      storageBackend: 'indexeddb',
    };
  } catch {
    return { ...createDefaultState(), storageBackend: 'memory' };
  }
}

export async function persistAnswer(questionId, { correct, choice, timestamp = Date.now() }) {
  const db = await openDatabase();
  const [metaRows, existing] = await Promise.all([
    readAllFromStore(db, 'meta'),
    new Promise((resolve, reject) => {
      const tx = db.transaction('answered', 'readonly');
      const req = tx.objectStore('answered').get(questionId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    }),
  ]);
  const meta = Object.fromEntries(metaRows.map((r) => [r.key, r.value]));
  const daySet = new Set(Array.isArray(meta.activityDays) ? meta.activityDays : []);
  daySet.add(toDateKey(timestamp));
  const activityDays = [...daySet].sort();

  const record = {
    questionId,
    correct: Boolean(correct),
    choice: Number(choice),
    attempts: (existing?.attempts || 0) + 1,
    updatedAt: timestamp,
  };

  await runWriteTx(db, ['answered', 'meta'], (tx) => {
    tx.objectStore('answered').put(record);
    tx.objectStore('meta').put({ key: 'activityDays', value: activityDays });
  });
  db.close();
  return { record, activityDays };
}

export async function persistBookmarkToggle(questionId) {
  const db = await openDatabase();
  const existing = await new Promise((resolve, reject) => {
    const tx = db.transaction('bookmarks', 'readonly');
    const req = tx.objectStore('bookmarks').get(questionId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  const bookmarked = !existing;
  await runWriteTx(db, ['bookmarks'], (tx) => {
    const store = tx.objectStore('bookmarks');
    if (bookmarked) store.put({ questionId, addedAt: Date.now() });
    else store.delete(questionId);
  });
  db.close();
  return bookmarked;
}

export async function savePersonalQuestion(input, existingId = null) {
  const record = sanitizePersonalQuestion(input, existingId);
  const db = await openDatabase();
  await runWriteTx(db, ['customQuestions'], (tx) => {
    tx.objectStore('customQuestions').put(record);
  });
  db.close();
  return record;
}

export async function deletePersonalQuestion(questionId) {
  const db = await openDatabase();
  await runWriteTx(db, ['customQuestions', 'bookmarks', 'answered'], (tx) => {
    tx.objectStore('customQuestions').delete(questionId);
    tx.objectStore('bookmarks').delete(questionId);
    tx.objectStore('answered').delete(questionId);
  });
  db.close();
}

export async function saveStudyNote(input, existingId = null) {
  const note = sanitizeNote(input, existingId);
  const db = await openDatabase();
  await runWriteTx(db, ['notes'], (tx) => {
    tx.objectStore('notes').put(note);
  });
  db.close();
  return note;
}

export async function deleteStudyNote(noteId) {
  const db = await openDatabase();
  await runWriteTx(db, ['notes'], (tx) => {
    tx.objectStore('notes').delete(noteId);
  });
  db.close();
}

export async function savePreferences(preferences) {
  const clean = { shuffleOptions: Boolean(preferences?.shuffleOptions) };
  const db = await openDatabase();
  await runWriteTx(db, ['meta'], (tx) => {
    tx.objectStore('meta').put({ key: 'preferences', value: clean });
  });
  db.close();
  return clean;
}

export async function resetAnsweredProgress() {
  const db = await openDatabase();
  await runWriteTx(db, ['answered', 'meta'], (tx) => {
    tx.objectStore('answered').clear();
    tx.objectStore('meta').put({ key: 'activityDays', value: [] });
  });
  db.close();
}

export function buildBackupPayload(state) {
  return {
    app: 'MemoNeet',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      answered: state.answered || {},
      bookmarks: Array.isArray(state.bookmarks) ? state.bookmarks : [],
      customQuestions: Array.isArray(state.customQuestions) ? state.customQuestions : [],
      notes: Array.isArray(state.notes) ? state.notes : [],
      activityDays: Array.isArray(state.activityDays) ? state.activityDays : [],
      preferences: state.preferences || { shuffleOptions: true },
    },
  };
}

export async function importBackupPayload(payload, { mode = 'merge' } = {}) {
  if (!payload || typeof payload !== 'object' || payload.app !== 'MemoNeet' || !payload.data) {
    throw new Error('Invalid backup file: expected a MemoNeet JSON backup.');
  }
  const incoming = payload.data;
  const cleanCustom = [];
  for (const item of Array.isArray(incoming.customQuestions) ? incoming.customQuestions : []) {
    cleanCustom.push(sanitizePersonalQuestion(item, item.id?.startsWith('custom-') ? item.id : null));
  }
  const cleanNotes = [];
  for (const n of Array.isArray(incoming.notes) ? incoming.notes : []) {
    cleanNotes.push(sanitizeNote(n, n.id?.startsWith('note-') ? n.id : null));
  }
  const cleanBookmarks = (Array.isArray(incoming.bookmarks) ? incoming.bookmarks : []).filter(
    (id) => typeof id === 'string' && id.trim()
  );
  const cleanAnswered = [];
  if (incoming.answered && typeof incoming.answered === 'object') {
    for (const [qId, rec] of Object.entries(incoming.answered)) {
      if (rec && typeof rec === 'object' && Number.isInteger(rec.choice) && rec.choice >= 0 && rec.choice <= 3) {
        cleanAnswered.push({
          questionId: qId,
          correct: Boolean(rec.correct),
          choice: rec.choice,
          attempts: Math.max(1, Number(rec.attempts) || 1),
          updatedAt: Number(rec.updatedAt) || Date.now(),
        });
      }
    }
  }
  const cleanDays = (Array.isArray(incoming.activityDays) ? incoming.activityDays : []).filter(
    (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)
  );
  const cleanPrefs = {
    shuffleOptions:
      typeof incoming.preferences?.shuffleOptions === 'boolean'
        ? incoming.preferences.shuffleOptions
        : true,
  };

  const db = await openDatabase();
  const metaRows = await readAllFromStore(db, 'meta');
  const existingMeta = Object.fromEntries(metaRows.map((r) => [r.key, r.value]));
  const mergedDays =
    mode === 'replace'
      ? [...new Set(cleanDays)].sort()
      : [...new Set([...(existingMeta.activityDays || []), ...cleanDays])].sort();

  await runWriteTx(db, STORES, (tx) => {
    if (mode === 'replace') {
      tx.objectStore('answered').clear();
      tx.objectStore('bookmarks').clear();
      tx.objectStore('customQuestions').clear();
      tx.objectStore('notes').clear();
    }
    tx.objectStore('meta').put({ key: 'migratedLegacyV1', value: true });
    tx.objectStore('meta').put({ key: 'activityDays', value: mergedDays });
    tx.objectStore('meta').put({ key: 'preferences', value: cleanPrefs });
    for (const a of cleanAnswered) tx.objectStore('answered').put(a);
    for (const b of cleanBookmarks) tx.objectStore('bookmarks').put({ questionId: b, addedAt: Date.now() });
    for (const c of cleanCustom) tx.objectStore('customQuestions').put(c);
    for (const n of cleanNotes) tx.objectStore('notes').put(n);
  });
  db.close();
  return loadStudyState();
}
