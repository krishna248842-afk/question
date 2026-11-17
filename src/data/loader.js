import { SYLLABUS_CHAPTERS } from './syllabus.js';

// Explicit static dynamic-import table so Vite splits every chapter pack cleanly into a
// lazy-loaded chunk while bundling every chunk locally inside dist/ for offline PWA and Android APK use.
export const CHAPTER_IMPORTERS = {
  'c11-01': () => import('./chapters/c11-01.js'),
  'c11-02': () => import('./chapters/c11-02.js'),
  'c11-03': () => import('./chapters/c11-03.js'),
  'c11-04': () => import('./chapters/c11-04.js'),
  'c11-05': () => import('./chapters/c11-05.js'),
  'c11-06': () => import('./chapters/c11-06.js'),
  'c11-07': () => import('./chapters/c11-07.js'),
  'c11-08': () => import('./chapters/c11-08.js'),
  'c11-09': () => import('./chapters/c11-09.js'),
  'c11-10': () => import('./chapters/c11-10.js'),
  'c11-11': () => import('./chapters/c11-11.js'),
  'c11-12': () => import('./chapters/c11-12.js'),
  'c11-13': () => import('./chapters/c11-13.js'),
  'c11-14': () => import('./chapters/c11-14.js'),
  'c11-15': () => import('./chapters/c11-15.js'),
  'c11-16': () => import('./chapters/c11-16.js'),
  'c11-17': () => import('./chapters/c11-17.js'),
  'c11-18': () => import('./chapters/c11-18.js'),
  'c11-19': () => import('./chapters/c11-19.js'),
};

const packCache = new Map();
const inFlight = new Map();

export async function loadChapterPack(chapterId) {
  if (packCache.has(chapterId)) {
    return packCache.get(chapterId);
  }
  if (inFlight.has(chapterId)) {
    return inFlight.get(chapterId);
  }
  const importer = CHAPTER_IMPORTERS[chapterId];
  if (!importer) {
    throw new Error(`Unknown syllabus chapter ID: ${chapterId}`);
  }
  const promise = importer()
    .then((mod) => {
      const list = Array.isArray(mod.questions) ? mod.questions : [];
      packCache.set(chapterId, list);
      inFlight.delete(chapterId);
      return list;
    })
    .catch((err) => {
      inFlight.delete(chapterId);
      throw err;
    });
  inFlight.set(chapterId, promise);
  return promise;
}

export async function loadChapterPacks(chapterIds) {
  const results = await Promise.all(chapterIds.map((id) => loadChapterPack(id)));
  return results.flat();
}

export function resolveChapterIdsForSelection({ stage = 'All stages', chapterId = 'all' } = {}) {
  if (chapterId && chapterId !== 'all') {
    return SYLLABUS_CHAPTERS.some((ch) => ch.chapterId === chapterId) ? [chapterId] : [];
  }
  if (stage === 'Class 12') return []; // legacy saved selections are out of scope
  if (stage === 'Class 11') {
    return SYLLABUS_CHAPTERS.filter((ch) => ch.classStage === stage).map((ch) => ch.chapterId);
  }
  return SYLLABUS_CHAPTERS.map((ch) => ch.chapterId);
}

export function getCachedChapterCount() {
  return packCache.size;
}

export function clearChapterPackCache() {
  packCache.clear();
  inFlight.clear();
}
