import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Database,
  Download,
  Edit3,
  FileText,
  Filter,
  Flame,
  Flower2,
  FolderCheck,
  LayoutDashboard,
  Leaf,
  Library,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Target,
  Trash2,
  Upload,
  UserCheck,
  Wifi,
  X,
} from 'lucide-react';
import {
  CHAPTER_BY_ID,
  CHAPTER_TARGET,
  SYLLABUS_CHAPTERS,
  SYLLABUS_META,
  SYLLABUS_MIGRATION,
  VALID_DIFFICULTIES,
  VALID_QUESTION_TYPES,
} from './data/syllabus.js';
import { BANK_MANIFEST, MANIFEST_BY_CHAPTER_ID } from './data/bankManifest.js';
import { loadChapterPack, loadChapterPacks, resolveChapterIdsForSelection } from './data/loader.js';
import { presentQuestionOptions } from './lib/shuffle.js';
import {
  buildBackupPayload,
  computeStudyStreak,
  createDefaultState,
  deletePersonalQuestion,
  deleteStudyNote,
  importBackupPayload,
  loadStudyState,
  persistAnswer,
  persistBookmarkToggle,
  resetAnsweredProgress,
  savePersonalQuestion,
  savePreferences,
  saveStudyNote,
} from './lib/storage.js';
import {
  computeProgressSummary,
  filterQuestions,
  getChapterCompletionMeta,
} from './lib/bankFilter.js';

const PAGE_SIZE = 40;

const QUESTION_TYPE_LABELS = {
  recall: 'Recall',
  concept: 'Concept',
  application: 'Application',
  'statement-analysis': 'Statement analysis',
  'case-based': 'Case-based',
  'data-based': 'Data-based',
};

const STAGE_DISPLAY = {
  'Class 11': 'Class 11 Biology',
  'Class 12': 'Class 12 Biology',
  'NEET practice': 'Original NEET-pattern practice',
};

export default function App() {
  const [study, setStudy] = useState(createDefaultState);
  const [hydrating, setHydrating] = useState(true);
  const [page, setPage] = useState('Overview');
  const [returnPage, setReturnPage] = useState('Question bank');

  // Filter controls
  const [stage, setStage] = useState('All stages');
  const [chapterId, setChapterId] = useState('all');
  const [sectionId, setSectionId] = useState('all');
  const [questionType, setQuestionType] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [search, setSearch] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [syllabusClassFilter, setSyllabusClassFilter] = useState('All');

  // Lazy-loaded verified curriculum bank state
  const [loadedVerified, setLoadedVerified] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');

  // Practice session state
  const [practiceQueue, setPracticeQueue] = useState([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selectedDisplayIdx, setSelectedDisplayIdx] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [shuffleNonce, setShuffleNonce] = useState(1);

  // UI drawers & modals
  const [mobileOpen, setMobileOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [toast, setToast] = useState('');
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Quick note & full notes state
  const [quickNoteText, setQuickNoteText] = useState('');
  const [noteForm, setNoteForm] = useState({ id: null, title: '', text: '', chapterId: 'all' });
  const [noteSearch, setNoteSearch] = useState('');
  const [expandedSyllabusChapter, setExpandedSyllabusChapter] = useState(null);

  const toastTimerRef = useRef(null);
  const notify = useCallback((message) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 3000);
  }, []);

  // Hydrate offline IndexedDB state on startup
  useEffect(() => {
    let active = true;
    loadStudyState()
      .then((loaded) => {
        if (active) {
          setStudy(loaded);
          setHydrating(false);
        }
      })
      .catch(() => {
        if (active) setHydrating(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Track device connectivity for honest offline badge
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Lazy-load only the chapter packs required by the active view/filter
  useEffect(() => {
    const listPages = new Set(['Question bank', 'Bookmarks', 'Completed', 'Wrong answers']);
    if (!listPages.has(page)) return;

    let cancelled = false;
    const neededIds =
      page === 'Question bank'
        ? resolveChapterIdsForSelection({ stage, chapterId })
        : SYLLABUS_CHAPTERS.map((c) => c.chapterId);

    setBankLoading(true);
    setBankError('');
    loadChapterPacks(neededIds)
      .then((items) => {
        if (!cancelled) {
          setLoadedVerified(items);
          setBankLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setBankError(err?.message || 'Unable to load offline chapter pack.');
          setBankLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, stage, chapterId]);

  // Reset section filter when chapter changes
  useEffect(() => {
    setSectionId('all');
    setVisibleLimit(PAGE_SIZE);
  }, [chapterId, stage, questionType, difficulty, search, page]);

  const activeChapter = chapterId !== 'all' ? CHAPTER_BY_ID.get(chapterId) : null;

  // Filtered question list
  const combinedPool = useMemo(() => {
    if (page === 'My questions') return study.customQuestions;
    if (page === 'Question bank') return loadedVerified;
    return [...study.customQuestions, ...loadedVerified];
  }, [page, study.customQuestions, loadedVerified]);

  const filteredQuestions = useMemo(
    () =>
      filterQuestions(combinedPool, {
        page,
        stage,
        chapterId,
        sectionId,
        questionType,
        difficulty,
        search,
        bookmarks: study.bookmarks,
        answered: study.answered,
      }),
    [
      combinedPool,
      page,
      stage,
      chapterId,
      sectionId,
      questionType,
      difficulty,
      search,
      study.bookmarks,
      study.answered,
    ]
  );

  // Study statistics (verified progress + separate personal count)
  const overallProgress = useMemo(
    () => computeProgressSummary(study.answered),
    [study.answered]
  );

  const chapterAnswerStats = useMemo(() => {
    const map = {};
    for (const rec of Object.values(study.answered)) {
      const m = /^([a-z0-9]{3}-\d{2})-q\d+$/.exec(rec.questionId);
      if (!m) continue;
      const cid = m[1];
      if (!map[cid]) map[cid] = { attempted: 0, correct: 0, wrong: 0 };
      map[cid].attempted++;
      if (rec.correct) map[cid].correct++;
      else map[cid].wrong++;
    }
    return map;
  }, [study.answered]);

  const streakDays = useMemo(
    () => computeStudyStreak(study.activityDays),
    [study.activityDays]
  );

  // Active practice question & shuffled option presentation
  const activeQuestion = practiceQueue[practiceIndex] || null;
  const presented = useMemo(() => {
    if (!activeQuestion) return null;
    return presentQuestionOptions(activeQuestion, {
      shuffle: study.preferences.shuffleOptions,
      seed: `s-${shuffleNonce}-${practiceIndex}`,
    });
  }, [activeQuestion, study.preferences.shuffleOptions, shuffleNonce, practiceIndex]);

  const startPracticeSession = useCallback(
    (queue, startIdx = 0, sourcePage = page) => {
      if (!queue || queue.length === 0) {
        notify('No matching questions available for this session.');
        return;
      }
      setPracticeQueue(queue);
      setPracticeIndex(Math.max(0, Math.min(startIdx, queue.length - 1)));
      setSelectedDisplayIdx(null);
      setShowAnswer(false);
      setShuffleNonce((n) => n + 1);
      setReturnPage(sourcePage === 'Practice' ? 'Question bank' : sourcePage);
      setPage('Practice');
      setMobileOpen(false);
    },
    [notify, page]
  );

  const startQuickChapterSession = useCallback(
    async (targetChapterId, sourcePage = 'Overview') => {
      try {
        setBankLoading(true);
        const pack = await loadChapterPack(targetChapterId);
        setBankLoading(false);
        const unansweredFirst = [
          ...pack.filter((q) => !study.answered[q.id]),
          ...pack.filter((q) => Boolean(study.answered[q.id])),
        ];
        startPracticeSession(unansweredFirst, 0, sourcePage);
      } catch {
        setBankLoading(false);
        notify('Could not open chapter pack.');
      }
    },
    [study.answered, startPracticeSession, notify]
  );

  const startWrongAnswerRetry = useCallback(async () => {
    try {
      setBankLoading(true);
      const allVerified = await loadChapterPacks(SYLLABUS_CHAPTERS.map((c) => c.chapterId));
      setBankLoading(false);
      const wrongQueue = [...study.customQuestions, ...allVerified].filter(
        (q) => study.answered[q.id]?.correct === false
      );
      if (!wrongQueue.length) {
        notify('No wrong answers pending review.');
        return;
      }
      startPracticeSession(wrongQueue, 0, 'Wrong answers');
    } catch {
      setBankLoading(false);
      notify('Could not prepare wrong-answer retry queue.');
    }
  }, [study.answered, study.customQuestions, startPracticeSession, notify]);

  const handleSelectAnswer = useCallback(
    async (displayIdx) => {
      if (!activeQuestion || !presented || showAnswer) return;
      const originalChoice = presented.toOriginalIndex(displayIdx);
      const isCorrect = displayIdx === presented.answer;
      setSelectedDisplayIdx(displayIdx);
      setShowAnswer(true);
      try {
        const { record, activityDays } = await persistAnswer(activeQuestion.id, {
          correct: isCorrect,
          choice: originalChoice,
        });
        setStudy((prev) => ({
          ...prev,
          answered: { ...prev.answered, [activeQuestion.id]: record },
          activityDays,
        }));
      } catch {
        // Keep in-session state even if storage write fails
        setStudy((prev) => ({
          ...prev,
          answered: {
            ...prev.answered,
            [activeQuestion.id]: {
              questionId: activeQuestion.id,
              correct: isCorrect,
              choice: originalChoice,
              attempts: (prev.answered[activeQuestion.id]?.attempts || 0) + 1,
              updatedAt: Date.now(),
            },
          },
        }));
      }
    },
    [activeQuestion, presented, showAnswer]
  );

  const handleRetryCurrentQuestion = useCallback(() => {
    setSelectedDisplayIdx(null);
    setShowAnswer(false);
    setShuffleNonce((n) => n + 1);
  }, []);

  const stepPractice = useCallback(
    (delta) => {
      if (!practiceQueue.length) return;
      const nextIdx = (practiceIndex + delta + practiceQueue.length) % practiceQueue.length;
      setPracticeIndex(nextIdx);
      setSelectedDisplayIdx(null);
      setShowAnswer(false);
      setShuffleNonce((n) => n + 1);
    },
    [practiceIndex, practiceQueue.length]
  );

  const handleToggleBookmark = useCallback(
    async (question) => {
      try {
        const nowSaved = await persistBookmarkToggle(question.id);
        setStudy((prev) => ({
          ...prev,
          bookmarks: nowSaved
            ? [...new Set([...prev.bookmarks, question.id])]
            : prev.bookmarks.filter((id) => id !== question.id),
        }));
        notify(nowSaved ? 'Saved to bookmarks' : 'Removed from bookmarks');
      } catch {
        notify('Could not update bookmark.');
      }
    },
    [notify]
  );

  // Keyboard navigation in Practice view
  useEffect(() => {
    if (page !== 'Practice' || !activeQuestion || questionModalOpen || settingsOpen || confirmDialog) {
      return;
    }
    const onKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const k = e.key.toLowerCase();
      if (!showAnswer && ['a', 'b', 'c', 'd', '1', '2', '3', '4'].includes(k)) {
        const idx = k >= '1' && k <= '4' ? Number(k) - 1 : k.charCodeAt(0) - 97;
        e.preventDefault();
        handleSelectAnswer(idx);
      } else if (e.key === 'ArrowRight' || k === 'n') {
        e.preventDefault();
        stepPractice(1);
      } else if (e.key === 'ArrowLeft' || k === 'p') {
        e.preventDefault();
        stepPractice(-1);
      } else if (k === 'r' && showAnswer) {
        e.preventDefault();
        handleRetryCurrentQuestion();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    page,
    activeQuestion,
    showAnswer,
    questionModalOpen,
    settingsOpen,
    confirmDialog,
    handleSelectAnswer,
    stepPractice,
    handleRetryCurrentQuestion,
  ]);

  // Personal Question CRUD
  const handleSavePersonalQuestion = async (form) => {
    try {
      const savedQ = await savePersonalQuestion(form, editingQuestion?.id || null);
      setStudy((prev) => ({
        ...prev,
        customQuestions: editingQuestion?.id
          ? prev.customQuestions.map((q) => (q.id === savedQ.id ? savedQ : q))
          : [savedQ, ...prev.customQuestions],
      }));
      setQuestionModalOpen(false);
      setEditingQuestion(null);
      notify(editingQuestion?.id ? 'Personal question updated' : 'Added to your personal questions');
    } catch (err) {
      notify(err?.message || 'Could not save question.');
    }
  };

  const requestDeletePersonalQuestion = (question) => {
    setConfirmDialog({
      title: 'Delete personal question?',
      message: `Remove "${question.question.slice(0, 90)}${question.question.length > 90 ? '…' : ''}" from your device? Verified curriculum questions are unaffected.`,
      confirmLabel: 'Delete question',
      onConfirm: async () => {
        await deletePersonalQuestion(question.id);
        setStudy((prev) => {
          const nextAnswered = { ...prev.answered };
          delete nextAnswered[question.id];
          return {
            ...prev,
            customQuestions: prev.customQuestions.filter((x) => x.id !== question.id),
            bookmarks: prev.bookmarks.filter((id) => id !== question.id),
            answered: nextAnswered,
          };
        });
        setConfirmDialog(null);
        notify('Personal question deleted');
      },
    });
  };

  // Notes CRUD
  const handleQuickAddNote = async () => {
    if (!quickNoteText.trim()) return;
    try {
      const saved = await saveStudyNote({ text: quickNoteText.trim(), chapterId: 'all' });
      setStudy((prev) => ({ ...prev, notes: [saved, ...prev.notes] }));
      setQuickNoteText('');
      notify('Note saved locally in IndexedDB');
    } catch (err) {
      notify(err?.message || 'Could not save note.');
    }
  };

  const handleSaveFullNote = async (e) => {
    e.preventDefault();
    if (!noteForm.text.trim()) return;
    try {
      const saved = await saveStudyNote(noteForm, noteForm.id);
      setStudy((prev) => ({
        ...prev,
        notes: noteForm.id
          ? prev.notes.map((n) => (n.id === saved.id ? saved : n))
          : [saved, ...prev.notes],
      }));
      setNoteForm({ id: null, title: '', text: '', chapterId: 'all' });
      notify(noteForm.id ? 'Note updated' : 'Study note saved');
    } catch (err) {
      notify(err?.message || 'Could not save note.');
    }
  };

  const requestDeleteNote = (note) => {
    setConfirmDialog({
      title: 'Delete study note?',
      message: `Delete "${(note.title || note.text).slice(0, 80)}" from this device?`,
      confirmLabel: 'Delete note',
      onConfirm: async () => {
        await deleteStudyNote(note.id);
        setStudy((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== note.id) }));
        if (noteForm.id === note.id) {
          setNoteForm({ id: null, title: '', text: '', chapterId: 'all' });
        }
        setConfirmDialog(null);
        notify('Note deleted');
      },
    });
  };

  // Preferences & backup handlers
  const handleToggleShufflePref = async () => {
    const next = { ...study.preferences, shuffleOptions: !study.preferences.shuffleOptions };
    setStudy((prev) => ({ ...prev, preferences: next }));
    try {
      await savePreferences(next);
      notify(next.shuffleOptions ? 'Option shuffling enabled' : 'Option shuffling turned off');
    } catch {
      // Preference already updated in UI state
    }
  };

  const handleExportBackup = () => {
    const payload = buildBackupPayload(study);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoneet-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify('Backup JSON downloaded');
  };

  const handleImportBackup = async (file, mode) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const updated = await importBackupPayload(parsed, { mode });
      setStudy(updated);
      notify(`Backup imported (${mode === 'replace' ? 'replaced' : 'merged'})`);
    } catch (err) {
      notify(err?.message || 'Invalid backup JSON file.');
    }
  };

  const handleWarmAllPacksOffline = async () => {
    try {
      setBankLoading(true);
      await loadChapterPacks(SYLLABUS_CHAPTERS.map((c) => c.chapterId));
      setBankLoading(false);
      notify(`All ${SYLLABUS_CHAPTERS.length} chapter packs ready offline`);
    } catch {
      setBankLoading(false);
      notify('Could not preload all chapter packs.');
    }
  };

  const clearAllFilters = () => {
    setStage('All stages');
    setChapterId('all');
    setSectionId('all');
    setQuestionType('all');
    setDifficulty('all');
    setSearch('');
  };

  const navigatePage = (nextPage) => {
    setPage(nextPage);
    setMobileOpen(false);
  };

  const openStage = (targetStage) => {
    setStage(targetStage);
    setChapterId('all');
    setSectionId('all');
    setPage('Question bank');
    setMobileOpen(false);
  };

  const openChapterInBank = (targetChapterId) => {
    setStage('All stages');
    setChapterId(targetChapterId);
    setSectionId('all');
    setPage('Question bank');
    setMobileOpen(false);
  };

  const filteredNotes = useMemo(() => {
    const q = noteSearch.trim().toLowerCase();
    if (!q) return study.notes;
    return study.notes.filter((n) => {
      const chTitle = n.chapterId !== 'all' ? CHAPTER_BY_ID.get(n.chapterId)?.title || '' : '';
      return `${n.title} ${n.text} ${chTitle}`.toLowerCase().includes(q);
    });
  }, [study.notes, noteSearch]);

  const visibleSyllabusChapters = useMemo(
    () =>
      SYLLABUS_CHAPTERS.filter(
        (ch) => syllabusClassFilter === 'All' || ch.classStage === syllabusClassFilter
      ),
    [syllabusClassFilter]
  );

  const isListView = [
    'Question bank',
    'Bookmarks',
    'Completed',
    'Wrong answers',
    'My questions',
  ].includes(page);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Leaf size={20} />
          </div>
          <div>
            <b>MemoNeet</b>
            <span>OFFLINE BIO STUDIO</span>
          </div>
          <button
            type="button"
            className="mobile-close icon-btn"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="nav-label">STUDY SPACE</div>
        <nav aria-label="Study views">
          <NavItem
            icon={LayoutDashboard}
            label="Overview"
            active={page === 'Overview'}
            onClick={() => navigatePage('Overview')}
          />
          <NavItem
            icon={FolderCheck}
            label="Syllabus & status"
            active={page === 'Syllabus'}
            badge={`${BANK_MANIFEST.completeChapters}/${BANK_MANIFEST.totalChapters}`}
            onClick={() => navigatePage('Syllabus')}
          />
          <NavItem
            icon={Library}
            label="Question bank"
            active={page === 'Question bank'}
            badge={String(BANK_MANIFEST.totalValid)}
            onClick={() => {
              clearAllFilters();
              navigatePage('Question bank');
            }}
          />
          <NavItem
            icon={Bookmark}
            label="Bookmarks"
            active={page === 'Bookmarks'}
            badge={study.bookmarks.length ? String(study.bookmarks.length) : undefined}
            onClick={() => navigatePage('Bookmarks')}
          />
          <NavItem
            icon={RotateCcw}
            label="Wrong answers"
            active={page === 'Wrong answers'}
            badge={overallProgress.wrong ? String(overallProgress.wrong) : undefined}
            onClick={() => navigatePage('Wrong answers')}
          />
          <NavItem
            icon={CheckCircle2}
            label="Completed"
            active={page === 'Completed'}
            badge={overallProgress.attempted ? String(overallProgress.attempted) : undefined}
            onClick={() => navigatePage('Completed')}
          />
          <NavItem
            icon={UserCheck}
            label="My questions"
            active={page === 'My questions'}
            badge={study.customQuestions.length ? String(study.customQuestions.length) : undefined}
            onClick={() => {
              clearAllFilters();
              navigatePage('My questions');
            }}
          />
          <NavItem
            icon={FileText}
            label="Study notes"
            active={page === 'Notes'}
            badge={study.notes.length ? String(study.notes.length) : undefined}
            onClick={() => navigatePage('Notes')}
          />
        </nav>

        <div className="nav-label stage-label">THREE STUDY STAGES</div>
        <nav className="stage-nav" aria-label="Study stages">
          <NavItem
            icon={Flower2}
            label="Class 11 Biology"
            active={page === 'Question bank' && stage === 'Class 11'}
            badge={String(BANK_MANIFEST.stageTotals['Class 11'])}
            onClick={() => openStage('Class 11')}
          />
          <NavItem
            icon={Leaf}
            label="Class 12 Biology"
            active={page === 'Question bank' && stage === 'Class 12'}
            badge={String(BANK_MANIFEST.stageTotals['Class 12'])}
            onClick={() => openStage('Class 12')}
          />
          <NavItem
            icon={Target}
            label="NEET practice"
            active={page === 'Question bank' && stage === 'NEET practice'}
            badge={String(BANK_MANIFEST.stageTotals['NEET practice'])}
            onClick={() => openStage('NEET practice')}
          />
        </nav>

        <div className="side-spacer" />

        <div className="offline-card" role="status">
          <div className="offline-icon" aria-hidden="true">
            {isOnline ? <Wifi size={15} /> : <CloudOff size={15} />}
          </div>
          <div>
            <b>{isOnline ? 'Offline-ready pack' : 'Airplane / offline mode'}</b>
            <span>IndexedDB · no account needed</span>
          </div>
          <span className="online-dot" aria-hidden="true" />
        </div>

        <button
          type="button"
          className="profile-row"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open backup and study settings"
        >
          <div className="avatar" aria-hidden="true">
            M
          </div>
          <div className="profile-copy">
            <b>Backup & settings</b>
            <span>Private on this device</span>
          </div>
          <Settings size={17} />
        </button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="hamburger icon-btn"
            aria-label="Open navigation menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="crumb">
            <span>MemoNeet</span>
            <span className="crumb-slash" aria-hidden="true">
              /
            </span>
            <b>{page === 'Syllabus' ? 'Syllabus & status' : page}</b>
          </div>
          <div className="top-actions">
            {!BANK_MANIFEST.bankComplete && (
              <button
                type="button"
                className="status-pill status-progress"
                onClick={() => navigatePage('Syllabus')}
                title="View chapter-by-chapter 400-question completion status"
              >
                Bank in progress · {BANK_MANIFEST.totalValid.toLocaleString()}/
                {BANK_MANIFEST.totalRequired.toLocaleString()}
              </button>
            )}
            <button
              type="button"
              className="soft-btn top-backup-btn"
              onClick={() => setSettingsOpen(true)}
            >
              <Database size={14} /> Backup
            </button>
          </div>
        </header>

        <div className="content">
          {hydrating && (
            <div className="loading-banner" role="status">
              Loading your on-device study progress…
            </div>
          )}

          {page === 'Overview' && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <Sparkles size={14} /> PRIVATE OFFLINE NEET BIOLOGY STUDIO
                  </div>
                  <h1>
                    Make every study session <em>count.</em>
                  </h1>
                  <p className="subhead">
                    Original NCERT-aligned and NEET-pattern MCQs — stored locally, no login required.
                  </p>
                </div>
                <div className="date-chip">
                  <span className="date-dot" aria-hidden="true" />
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>

              <section className="hero-card" aria-label="Start practicing">
                <div className="hero-copy">
                  <div className="hero-kicker">
                    <span className="hero-spark" aria-hidden="true">
                      <Sparkles size={13} />
                    </span>
                    IN-PROGRESS CHAPTER HIGHLIGHT
                  </div>
                  <h2>
                    Practice The Living World, reviewed by the project owner.
                  </h2>
                  <p>
                    Practice across all 6 chapter sections with shuffled options and misconception-aware
                    explanations, or explore starter packs across the remaining in-progress
                    chapters.
                  </p>
                  <div className="hero-buttons">
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => startQuickChapterSession('c11-01', 'Overview')}
                    >
                      Practice The Living World <ArrowRight size={16} />
                    </button>
                    {overallProgress.wrong > 0 && (
                      <button
                        type="button"
                        className="hero-secondary-btn"
                        onClick={startWrongAnswerRetry}
                      >
                        <RotateCcw size={15} /> Retry {overallProgress.wrong} wrong
                      </button>
                    )}
                  </div>
                  <div className="hero-foot">
                    <ShieldCheck size={14} /> Original practice only · Not endorsed by NCERT/NMC ·
                    Works in airplane mode
                  </div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="art-orbit orbit-a" />
                  <div className="art-orbit orbit-b" />
                  <div className="art-leaf">
                    <Leaf size={98} strokeWidth={1.15} />
                  </div>
                  <div className="art-dot dot-a" />
                  <div className="art-dot dot-b" />
                </div>
              </section>

              <div className="stats-grid">
                <StatCard
                  icon={BookOpen}
                  label="Question bank (in progress)"
                  value={`${BANK_MANIFEST.totalValid.toLocaleString()} / ${BANK_MANIFEST.totalRequired.toLocaleString()}`}
                  hint={`${BANK_MANIFEST.completeChapters} of ${BANK_MANIFEST.totalChapters} chapters at 400/400`}
                  tone="sage"
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Questions answered"
                  value={String(overallProgress.attempted)}
                  hint={
                    study.customQuestions.length
                      ? `+ ${study.customQuestions.length} personal item(s) separate`
                      : 'Saved in device IndexedDB'
                  }
                  tone="blue"
                />
                <StatCard
                  icon={Activity}
                  label="Current accuracy"
                  value={`${overallProgress.accuracy}%`}
                  hint={
                    overallProgress.attempted
                      ? `${overallProgress.correct} right · ${overallProgress.wrong} to review`
                      : 'Answer a question to track'
                  }
                  tone="peach"
                />
                <StatCard
                  icon={Flame}
                  label="Study streak"
                  value={`${streakDays} ${streakDays === 1 ? 'day' : 'days'}`}
                  hint={streakDays ? 'Active study rhythm' : 'Practice today to start'}
                  tone="gold"
                />
              </div>

              <div className="section-heading">
                <div>
                  <h3>Choose your study stage</h3>
                  <p>Three clearly separated study tracks across the 32-chapter NCERT Biology syllabus.</p>
                </div>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => navigatePage('Syllabus')}
                >
                  Full 32-chapter progress table <ArrowRight size={15} />
                </button>
              </div>

              <div className="stage-cards">
                <StageCard
                  tone="mint"
                  number="01"
                  label="CLASS 11 BIOLOGY · 19 CHAPTERS"
                  title="Build your foundation"
                  count={BANK_MANIFEST.stageTotals['Class 11']}
                  statusNote={`${BANK_MANIFEST.chapters.filter((c) => c.classStage === 'Class 11' && c.status === 'complete').length} complete · ${BANK_MANIFEST.chapters.filter((c) => c.classStage === 'Class 11' && c.status !== 'complete').length} in progress`}
                  desc="Diversity, structural organisation, cell biology, plant & human physiology (incl. Locomotion & Chemical Coordination)."
                  onClick={() => openStage('Class 11')}
                />
                <StageCard
                  tone="lavender"
                  number="02"
                  label="CLASS 12 BIOLOGY · 13 CHAPTERS"
                  title="Master core mechanisms"
                  count={BANK_MANIFEST.stageTotals['Class 12']}
                  statusNote="13 chapters in progress"
                  desc="Reproduction, Mendelian & molecular genetics, evolution, human health, microbes, biotechnology & ecology."
                  onClick={() => openStage('Class 12')}
                />
                <StageCard
                  tone="peach"
                  number="03"
                  label="ORIGINAL NEET-PATTERN PRACTICE"
                  title="Train analytical reasoning"
                  count={BANK_MANIFEST.stageTotals['NEET practice']}
                  statusNote="Not official PYQs · multi-concept items"
                  desc="Statement-analysis, assertion-reason, case-based, and quantitative data-based items shaped around NEET concepts."
                  onClick={() => openStage('NEET practice')}
                />
              </div>

              <div className="lower-grid">
                <section className="panel continue-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Chapter completion snapshot</h3>
                      <p>Target is exactly {CHAPTER_TARGET} validated original MCQs per chapter</p>
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => navigatePage('Syllabus')}
                    >
                      All 32 <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="topic-list">
                    {BANK_MANIFEST.chapters.slice(0, 6).map((c, idx) => {
                      const meta = getChapterCompletionMeta(c);
                      const userDone = chapterAnswerStats[c.chapterId]?.attempted || 0;
                      return (
                        <button
                          type="button"
                          className="topic-row"
                          key={c.chapterId}
                          onClick={() => openChapterInBank(c.chapterId)}
                        >
                          <span className={`topic-index t${idx % 4}`}>
                            {String(c.order).padStart(2, '0')}
                          </span>
                          <span className="topic-title">
                            <b>{c.title}</b>
                            <small>
                              {c.classStage} · {userDone} answered by you
                            </small>
                          </span>
                          <span
                            className={`chapter-pill ${meta.isComplete ? 'pill-complete' : 'pill-progress'}`}
                          >
                            {meta.badgeText}
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="panel notes-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Quick study notes</h3>
                      <p>Saved privately on your device</p>
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => navigatePage('Notes')}
                    >
                      Manage ({study.notes.length})
                    </button>
                  </div>
                  <div className="note-input">
                    <label htmlFor="quick-note-box" className="sr-only">
                      Write a quick study note
                    </label>
                    <textarea
                      id="quick-note-box"
                      placeholder="Jot down an exception, formula, or concept to revisit…"
                      value={quickNoteText}
                      onChange={(e) => setQuickNoteText(e.target.value)}
                      rows={2}
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddNote}
                      aria-label="Save quick note"
                      disabled={!quickNoteText.trim()}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="note-items">
                    {study.notes.length > 0 ? (
                      study.notes.slice(0, 3).map((n) => (
                        <div key={n.id} className="saved-note">
                          <span className="note-pin" aria-hidden="true" />
                          <span>{n.title ? `${n.title}: ${n.text}` : n.text}</span>
                          <button
                            type="button"
                            aria-label="Delete note"
                            onClick={() => requestDeleteNote(n)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="empty-note">
                        <span aria-hidden="true">✦</span> Notes stay private in IndexedDB and export
                        with your backup.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="disclaimer" role="note">
                <ShieldCheck size={18} />
                <span>
                  <b>Honest content &amp; study notice:</b> This build is{' '}
                  <b>in progress ({BANK_MANIFEST.totalValid.toLocaleString()} / {BANK_MANIFEST.totalRequired.toLocaleString()} automatically checked records)</b>.
                  Automated checks do not establish content quality or replace independent human review;
                  no chapter is complete until its review and all completion gates pass. These are practice
                  items, not official PYQs, and are not endorsed by NCERT/NMC/NTA. Regular practice cannot
                  guarantee any exam score, rank, or admission—always study alongside official NCERT
                  textbooks.
                </span>
              </div>
            </>
          )}

          {page === 'Syllabus' && (
            <section className="syllabus-page">
              <div className="library-head">
                <div>
                  <div className="eyebrow">
                    <FolderCheck size={14} /> {SYLLABUS_META.editionLabel.toUpperCase()}
                  </div>
                  <h1>32-chapter syllabus &amp; 400-question gate</h1>
                  <p className="subhead">
                    Overall bank complete: <b>{BANK_MANIFEST.bankComplete ? 'Yes' : 'No (In progress)'}</b>{' '}
                    · {BANK_MANIFEST.totalValid.toLocaleString()} of{' '}
                    {BANK_MANIFEST.totalRequired.toLocaleString()} automatically checked records (
                    {BANK_MANIFEST.completeChapters}/32 chapters at 400/400).
                  </p>
                </div>
                <div className="seg-tabs" role="tablist" aria-label="Filter syllabus by class">
                  {['All', 'Class 11', 'Class 12'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={syllabusClassFilter === tab}
                      className={syllabusClassFilter === tab ? 'active' : ''}
                      onClick={() => setSyllabusClassFilter(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel migration-panel">
                <h3>Syllabus audit &amp; NCERT rationalisation note ({SYLLABUS_META.examAlignmentLabel})</h3>
                <p>{SYLLABUS_MIGRATION.summary}</p>
                <div className="migration-cols">
                  <div>
                    <b>Added omitted required chapters (2):</b>
                    <ul>
                      {SYLLABUS_MIGRATION.addedRequiredChapters.map((item) => (
                        <li key={item.chapterId}>
                          <b>{item.title}</b> ({item.classStage}, Ch. {item.ncertChapterNumber}) —{' '}
                          {item.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <b>Retired rationalised-out chapters (documented):</b>
                    <ul>
                      {SYLLABUS_MIGRATION.retiredChapters.slice(0, 2).map((item) => (
                        <li key={item.title}>
                          <b>{item.title}</b> (former {item.formerClassStage} Ch.{' '}
                          {item.formerNcertNumber}) — {item.reason}
                        </li>
                      ))}
                      <li>
                        Also confirmed excluded per rationalised NCERT &amp; NMC NEET (UG):{' '}
                        <i>
                          Transport in Plants, Mineral Nutrition, Reproduction in Organisms, Strategies
                          for Enhancement in Food Production
                        </i>
                        .
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="syllabus-list">
                {visibleSyllabusChapters.map((ch) => {
                  const man = MANIFEST_BY_CHAPTER_ID.get(ch.chapterId);
                  const meta = getChapterCompletionMeta(man);
                  const uStat = chapterAnswerStats[ch.chapterId] || { attempted: 0, correct: 0 };
                  const uAcc = uStat.attempted
                    ? Math.round((uStat.correct / uStat.attempted) * 100)
                    : null;
                  const expanded = expandedSyllabusChapter === ch.chapterId;

                  return (
                    <article key={ch.chapterId} className="syllabus-card">
                      <div className="syllabus-card-main">
                        <div className="syllabus-title-block">
                          <div className="q-tags">
                            <span className="chapter-tag mono">{ch.chapterId}</span>
                            <span
                              className={`stage-tag ${ch.classStage === 'Class 11' ? 'tag-green' : 'tag-purple'}`}
                            >
                              {ch.classStage} · Ch. {ch.ncertChapterNumber}
                            </span>
                            <span className="chapter-tag">Unit {ch.unitNumber}: {ch.unitTitle}</span>
                          </div>
                          <h3>{ch.title}</h3>
                          <div className="syllabus-bar-row">
                            <div className="syllabus-bar" aria-hidden="true">
                              <span
                                className={meta.isComplete ? 'bar-complete' : 'bar-progress'}
                                style={{ width: `${Math.max(2, meta.percent)}%` }}
                              />
                            </div>
                            <span className="syllabus-count-text">
                              {meta.validCount}/{meta.target} automatically checked
                              {uAcc !== null
                                ? ` · Your progress: ${uStat.attempted} answered (${uAcc}% acc)`
                                : ''}
                            </span>
                          </div>
                        </div>
                        <div className="syllabus-actions">
                          <span
                            className={`chapter-pill ${meta.isComplete ? 'pill-complete' : 'pill-progress'}`}
                          >
                            {meta.badgeText}
                          </span>
                          <div className="syllabus-btn-row">
                            <button
                              type="button"
                              className="soft-btn"
                              aria-expanded={expanded}
                              onClick={() =>
                                setExpandedSyllabusChapter(expanded ? null : ch.chapterId)
                              }
                            >
                              Sections ({ch.sections.length})
                            </button>
                            <button
                              type="button"
                              className="soft-btn"
                              onClick={() => openChapterInBank(ch.chapterId)}
                            >
                              Browse
                            </button>
                            <button
                              type="button"
                              className="primary-btn dark-btn"
                              onClick={() => startQuickChapterSession(ch.chapterId, 'Syllabus')}
                            >
                              Practice <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      {expanded && (
                        <div className="section-breakdown">
                          {ch.sections.map((sec) => {
                            const actual = man?.sectionCounts?.[sec.sectionId] || 0;
                            return (
                              <div key={sec.sectionId} className="section-row">
                                <span className="mono">{sec.sectionId}</span>
                                <span>{sec.title}</span>
                                <b>
                                  {actual} / {sec.plannedCount} planned
                                </b>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {isListView && (
            <>
              <div className="library-head">
                <div>
                  <div className="eyebrow">
                    <Library size={14} />{' '}
                    {page === 'My questions'
                      ? 'PERSONAL DEVICE LIBRARY (SEPARATE FROM CURRICULUM BANK)'
                      : 'ORIGINAL NCERT-ALIGNED & NEET-PATTERN PRACTICE'}
                  </div>
                  <h1>{page === 'Question bank' ? 'Biology question bank' : page}</h1>
                  <p className="subhead">
                    {page === 'My questions'
                      ? 'Create, edit, and practice your own questions. Personal items never inflate chapter counts.'
                      : page === 'Wrong answers'
                        ? 'Revisit missed concepts with full explanations and freshly shuffled options.'
                        : activeChapter
                          ? `${activeChapter.title} — ${getChapterCompletionMeta(MANIFEST_BY_CHAPTER_ID.get(activeChapter.chapterId)).badgeText}`
                          : `Verified bank in progress: ${BANK_MANIFEST.totalValid.toLocaleString()} of ${BANK_MANIFEST.totalRequired.toLocaleString()} target questions authored.`}
                  </p>
                </div>
                <div className="head-btn-group">
                  {page === 'Wrong answers' && filteredQuestions.length > 0 && (
                    <button
                      type="button"
                      className="primary-btn dark-btn"
                      onClick={() => startPracticeSession(filteredQuestions, 0, 'Wrong answers')}
                    >
                      <RotateCcw size={15} /> Retry all ({filteredQuestions.length})
                    </button>
                  )}
                  {page !== 'Wrong answers' && filteredQuestions.length > 0 && (
                    <button
                      type="button"
                      className="soft-btn"
                      onClick={() => startPracticeSession(filteredQuestions, 0, page)}
                    >
                      Practice filtered ({filteredQuestions.length})
                    </button>
                  )}
                  <button
                    type="button"
                    className="primary-btn create-btn"
                    onClick={() => {
                      setEditingQuestion(null);
                      setQuestionModalOpen(true);
                    }}
                  >
                    <Plus size={16} /> Create question
                  </button>
                </div>
              </div>

              <div className="library-summary">
                <div>
                  <b>{filteredQuestions.length}</b>
                  <span>matching items</span>
                </div>
                <div className="summary-line" />
                <div>
                  <b>{study.bookmarks.length}</b>
                  <span>bookmarked</span>
                </div>
                <div className="summary-line" />
                <div>
                  <b>{overallProgress.attempted}</b>
                  <span>answered ({overallProgress.accuracy}%)</span>
                </div>
                <div className="summary-line" />
                <div>
                  <b>{study.customQuestions.length}</b>
                  <span>personal (separate)</span>
                </div>
              </div>

              <div className="filterbar" role="search" aria-label="Filter questions">
                <div className="searchbox">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Search questions, topics, and chapters"
                    placeholder="Search stems, topics, explanations…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button type="button" aria-label="Clear search" onClick={() => setSearch('')}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                <label className="select-wrap">
                  <Filter size={14} aria-hidden="true" />
                  <span className="sr-only">Study stage</span>
                  <select value={stage} onChange={(e) => setStage(e.target.value)}>
                    <option value="All stages">All stages</option>
                    <option value="Class 11">Class 11 Biology</option>
                    <option value="Class 12">Class 12 Biology</option>
                    <option value="NEET practice">NEET-pattern practice</option>
                  </select>
                  <ChevronDown size={14} aria-hidden="true" />
                </label>

                <label className="select-wrap chapter-select">
                  <span className="sr-only">Chapter</span>
                  <select value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
                    <option value="all">All 32 chapters</option>
                    {SYLLABUS_CHAPTERS.map((c) => {
                      const man = MANIFEST_BY_CHAPTER_ID.get(c.chapterId);
                      return (
                        <option key={c.chapterId} value={c.chapterId}>
                          {c.title} ({man?.validCount || 0}/400)
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown size={14} aria-hidden="true" />
                </label>

                {activeChapter && (
                  <label className="select-wrap chapter-select">
                    <span className="sr-only">Chapter section</span>
                    <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                      <option value="all">All sections</option>
                      {activeChapter.sections.map((s) => (
                        <option key={s.sectionId} value={s.sectionId}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} aria-hidden="true" />
                  </label>
                )}

                <label className="select-wrap">
                  <span className="sr-only">Question type</span>
                  <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
                    <option value="all">All types</option>
                    {VALID_QUESTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {QUESTION_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} aria-hidden="true" />
                </label>

                <label className="select-wrap">
                  <span className="sr-only">Difficulty</span>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="all">All difficulties</option>
                    {VALID_DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d[0].toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} aria-hidden="true" />
                </label>
              </div>

              {bankError && (
                <div className="error-state" role="alert">
                  <AlertCircle size={18} />
                  <span>{bankError}</span>
                  <button
                    type="button"
                    className="soft-btn"
                    onClick={() => setChapterId((c) => c)}
                  >
                    Retry
                  </button>
                </div>
              )}

              {bankLoading ? (
                <div className="empty-state" role="status">
                  <h3>Loading offline chapter pack…</h3>
                  <p>Reading locally bundled questions for your selected syllabus filter.</p>
                </div>
              ) : (
                <div className="question-list">
                  {filteredQuestions.slice(0, visibleLimit).map((q, idx) => {
                    const ansRec = study.answered[q.id];
                    const isBookmarked = study.bookmarks.includes(q.id);
                    return (
                      <article className="question-card" key={q.id}>
                        <div className="q-card-top">
                          <div className="q-tags">
                            <span
                              className={`stage-tag ${
                                q.stage === 'Class 11'
                                  ? 'tag-green'
                                  : q.stage === 'Class 12'
                                    ? 'tag-purple'
                                    : 'tag-orange'
                              }`}
                            >
                              {STAGE_DISPLAY[q.stage] || q.stage}
                            </span>
                            <span className="chapter-tag">{q.chapter}</span>
                            <span className={`diff-tag diff-${q.difficulty}`}>{q.difficulty}</span>
                            {q.custom && <span className="personal-tag">My question</span>}
                            {ansRec && (
                              <span
                                className={`ans-tag ${ansRec.correct ? 'ans-right' : 'ans-wrong'}`}
                              >
                                {ansRec.correct ? 'Solved' : 'Needs review'}
                              </span>
                            )}
                          </div>
                          <div className="q-actions">
                            {q.custom && (
                              <>
                                <button
                                  type="button"
                                  aria-label="Edit personal question"
                                  title="Edit personal question"
                                  onClick={() => {
                                    setEditingQuestion(q);
                                    setQuestionModalOpen(true);
                                  }}
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  type="button"
                                  aria-label="Delete personal question"
                                  title="Delete personal question"
                                  onClick={() => requestDeletePersonalQuestion(q)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                              aria-pressed={isBookmarked}
                              className={isBookmarked ? 'is-fav' : ''}
                              onClick={() => handleToggleBookmark(q)}
                            >
                              <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </div>

                        <div className="q-title-row">
                          <div className="q-number">{String(idx + 1).padStart(2, '0')}</div>
                          <h3>{q.question}</h3>
                        </div>

                        <div className="q-card-bottom">
                          <span className="topic-label">
                            <span aria-hidden="true" /> {q.topic} ·{' '}
                            {QUESTION_TYPE_LABELS[q.questionType] || q.questionType}
                          </span>
                          <button
                            type="button"
                            className="solve-btn"
                            onClick={() => startPracticeSession(filteredQuestions, idx, page)}
                          >
                            {ansRec ? 'Practice again' : 'Solve question'} <ArrowRight size={15} />
                          </button>
                        </div>
                      </article>
                    );
                  })}

                  {filteredQuestions.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-icon" aria-hidden="true">
                        <Search size={22} />
                      </div>
                      <h3>
                        {page === 'Bookmarks'
                          ? 'No bookmarked questions yet'
                          : page === 'Wrong answers'
                            ? 'No wrong answers waiting'
                            : page === 'My questions'
                              ? 'Your personal question library is empty'
                              : 'No questions match those filters'}
                      </h3>
                      <p>
                        {page === 'Bookmarks'
                          ? 'Bookmark any question while browsing or practicing to revisit it here.'
                          : page === 'Wrong answers'
                            ? 'Questions you miss during practice automatically collect here for focused retry.'
                            : page === 'My questions'
                              ? 'Add your own revision MCQs—kept completely separate from the curriculum bank.'
                              : 'Reset one or more filters to broaden your practice set.'}
                      </p>
                      <div className="empty-actions">
                        {(search ||
                          stage !== 'All stages' ||
                          chapterId !== 'all' ||
                          sectionId !== 'all' ||
                          questionType !== 'all' ||
                          difficulty !== 'all') && (
                          <button type="button" className="soft-btn" onClick={clearAllFilters}>
                            Clear all filters
                          </button>
                        )}
                        {page === 'My questions' && (
                          <button
                            type="button"
                            className="primary-btn create-btn"
                            onClick={() => {
                              setEditingQuestion(null);
                              setQuestionModalOpen(true);
                            }}
                          >
                            <Plus size={15} /> Create your first question
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {filteredQuestions.length > visibleLimit && (
                    <div className="load-more-row">
                      <button
                        type="button"
                        className="soft-btn"
                        onClick={() => setVisibleLimit((v) => v + PAGE_SIZE)}
                      >
                        Show more ({visibleLimit} of {filteredQuestions.length} shown)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {page === 'Notes' && (
            <section className="notes-page">
              <div className="library-head">
                <div>
                  <div className="eyebrow">
                    <FileText size={14} /> PRIVATE ON-DEVICE NOTES
                  </div>
                  <h1>Study notes</h1>
                  <p className="subhead">
                    Create, edit, tag by NCERT chapter, and delete personal revision notes stored in
                    IndexedDB.
                  </p>
                </div>
              </div>

              <div className="notes-layout">
                <form className="panel note-editor-form" onSubmit={handleSaveFullNote}>
                  <h3>{noteForm.id ? 'Edit study note' : 'New study note'}</h3>
                  <label>
                    Title (optional)
                    <input
                      value={noteForm.title}
                      onChange={(e) => setNoteForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Table 1.1 order vs family suffixes"
                    />
                  </label>
                  <label>
                    Linked chapter
                    <select
                      value={noteForm.chapterId}
                      onChange={(e) => setNoteForm((f) => ({ ...f, chapterId: e.target.value }))}
                    >
                      <option value="all">General note (all chapters)</option>
                      {SYLLABUS_CHAPTERS.map((c) => (
                        <option key={c.chapterId} value={c.chapterId}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Note content
                    <textarea
                      rows={5}
                      required
                      value={noteForm.text}
                      onChange={(e) => setNoteForm((f) => ({ ...f, text: e.target.value }))}
                      placeholder="Summarise key distinctions, exceptions, or formulas in your own words…"
                    />
                  </label>
                  <div className="form-btn-row">
                    {noteForm.id && (
                      <button
                        type="button"
                        className="soft-btn"
                        onClick={() =>
                          setNoteForm({ id: null, title: '', text: '', chapterId: 'all' })
                        }
                      >
                        Cancel edit
                      </button>
                    )}
                    <button
                      type="submit"
                      className="primary-btn create-btn"
                      disabled={!noteForm.text.trim()}
                    >
                      {noteForm.id ? 'Update note' : 'Save note'}
                    </button>
                  </div>
                </form>

                <div className="notes-column">
                  <div className="searchbox">
                    <Search size={16} aria-hidden="true" />
                    <input
                      type="search"
                      aria-label="Search study notes"
                      placeholder="Filter saved notes…"
                      value={noteSearch}
                      onChange={(e) => setNoteSearch(e.target.value)}
                    />
                  </div>
                  {filteredNotes.length === 0 ? (
                    <div className="empty-state">
                      <h3>{study.notes.length ? 'No notes match your search' : 'No notes yet'}</h3>
                      <p>Write a note on the left—everything stays locally in IndexedDB.</p>
                    </div>
                  ) : (
                    filteredNotes.map((n) => {
                      const ch = n.chapterId !== 'all' ? CHAPTER_BY_ID.get(n.chapterId) : null;
                      return (
                        <article key={n.id} className="question-card note-card">
                          <div className="q-card-top">
                            <div className="q-tags">
                              <span className="chapter-tag">{ch ? ch.title : 'General Biology'}</span>
                              <span className="chapter-tag">
                                {new Date(n.updatedAt).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                            <div className="q-actions">
                              <button
                                type="button"
                                aria-label="Edit note"
                                onClick={() =>
                                  setNoteForm({
                                    id: n.id,
                                    title: n.title || '',
                                    text: n.text,
                                    chapterId: n.chapterId || 'all',
                                  })
                                }
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                aria-label="Delete note"
                                onClick={() => requestDeleteNote(n)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                          {n.title && <h3 className="note-card-title">{n.title}</h3>}
                          <p className="note-card-body">{n.text}</p>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          )}

          {page === 'Practice' && activeQuestion && presented && (
            <section className="practice-page" aria-label="Focused question practice">
              <button
                type="button"
                className="back-link"
                onClick={() => setPage(returnPage || 'Question bank')}
              >
                <ChevronLeft size={17} /> Back to {returnPage || 'Question bank'}
              </button>

              <div className="practice-topline">
                <div className="eyebrow">
                  <Target size={14} /> FOCUSED PRACTICE · KEYS A–D / ← →
                </div>
                <div className="practice-utilities">
                  <button
                    type="button"
                    className="shuffle-chip"
                    onClick={handleToggleShufflePref}
                    aria-pressed={study.preferences.shuffleOptions}
                    title="Toggle option shuffling"
                  >
                    <Shuffle size={14} />{' '}
                    {study.preferences.shuffleOptions ? 'Options shuffled' : 'Fixed order'}
                  </button>
                  <button
                    type="button"
                    aria-label={
                      study.bookmarks.includes(activeQuestion.id)
                        ? 'Remove bookmark'
                        : 'Bookmark question'
                    }
                    aria-pressed={study.bookmarks.includes(activeQuestion.id)}
                    className={study.bookmarks.includes(activeQuestion.id) ? 'is-fav' : ''}
                    onClick={() => handleToggleBookmark(activeQuestion)}
                  >
                    <Bookmark
                      size={17}
                      fill={study.bookmarks.includes(activeQuestion.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>
              </div>

              <div className="practice-progress" aria-hidden="true">
                <span
                  style={{
                    width: `${Math.round(((practiceIndex + 1) / practiceQueue.length) * 100)}%`,
                  }}
                />
              </div>

              <div className="practice-meta">
                <span className="meta-strong">
                  {STAGE_DISPLAY[activeQuestion.stage] || activeQuestion.stage}
                </span>
                <span>·</span>
                <span>{activeQuestion.chapter}</span>
                <span>·</span>
                <span>{activeQuestion.topic}</span>
                <span>·</span>
                <span>{QUESTION_TYPE_LABELS[activeQuestion.questionType]}</span>
                <span>·</span>
                <span className={`diff-tag diff-${activeQuestion.difficulty}`}>
                  {activeQuestion.difficulty}
                </span>
                {activeQuestion.custom && <span className="personal-tag">Personal item</span>}
              </div>

              <div className="practice-card">
                <div className="practice-label">
                  <span>SINGLE BEST ANSWER ({activeQuestion.id})</span>
                  <span>
                    {practiceIndex + 1} / {practiceQueue.length}
                  </span>
                </div>
                <h1>{activeQuestion.question}</h1>
                {!activeQuestion.custom &&
                  MANIFEST_BY_CHAPTER_ID.get(activeQuestion.chapterId)?.reviewSnapshotCurrent === false && (
                    <p role="note">This chapter contains content changed since the project owner's review and requires renewed human review.</p>
                  )}

                <div className="answer-options" role="group" aria-label="Answer choices">
                  {presented.options.map((optText, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    let cls = 'answer-option';
                    if (showAnswer && idx === presented.answer) cls += ' correct';
                    else if (showAnswer && idx === selectedDisplayIdx) cls += ' incorrect';
                    return (
                      <button
                        type="button"
                        className={cls}
                        key={`${activeQuestion.id}-${idx}-${shuffleNonce}`}
                        disabled={showAnswer}
                        aria-label={`Option ${letter}: ${optText}`}
                        onClick={() => handleSelectAnswer(idx)}
                      >
                        <span className="option-letter">{letter}</span>
                        <span>{optText}</span>
                        {showAnswer && idx === presented.answer && (
                          <CheckCircle2 size={19} aria-hidden="true" />
                        )}
                        {showAnswer && idx === selectedDisplayIdx && idx !== presented.answer && (
                          <X size={18} aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div aria-live="polite">
                  {showAnswer ? (
                    <div
                      className={`explanation ${
                        selectedDisplayIdx === presented.answer ? 'explain-good' : 'explain-revisit'
                      }`}
                    >
                      <div className="explain-title">
                        {selectedDisplayIdx === presented.answer ? (
                          <>
                            <CheckCircle2 size={18} /> Correct — well reasoned!
                          </>
                        ) : (
                          <>
                            <RotateCcw size={17} /> Not quite — review the concept below
                          </>
                        )}
                        <span>CORRECT OPTION: {String.fromCharCode(65 + presented.answer)}</span>
                      </div>
                      <p>{activeQuestion.explanation}</p>
                      <small>
                        {activeQuestion.sourceNote}
                        {!activeQuestion.custom &&
                          ' · Original practice item (not a verified official PYQ)'}
                      </small>
                    </div>
                  ) : (
                    <p className="choose-hint">
                      Select one option (or press A, B, C, or D) to check your answer and reveal the
                      explanation.
                    </p>
                  )}
                </div>
              </div>

              <div className="practice-footer">
                <button
                  type="button"
                  className="soft-btn"
                  disabled={practiceQueue.length <= 1}
                  onClick={() => stepPractice(-1)}
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <div className="practice-footer-right">
                  {showAnswer && (
                    <button
                      type="button"
                      className="soft-btn"
                      onClick={handleRetryCurrentQuestion}
                    >
                      <RotateCcw size={14} /> Try again
                    </button>
                  )}
                  <button
                    type="button"
                    className="primary-btn dark-btn"
                    onClick={() => stepPractice(1)}
                  >
                    {showAnswer ? 'Next question' : 'Skip for now'} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {mobileOpen && (
        <div className="scrim" aria-hidden="true" onClick={() => setMobileOpen(false)} />
      )}

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <Check size={16} aria-hidden="true" />
          {toast}
        </div>
      )}

      {questionModalOpen && (
        <QuestionModal
          initial={editingQuestion}
          onClose={() => {
            setQuestionModalOpen(false);
            setEditingQuestion(null);
          }}
          onSave={handleSavePersonalQuestion}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          study={study}
          onClose={() => setSettingsOpen(false)}
          onToggleShuffle={handleToggleShufflePref}
          onExport={handleExportBackup}
          onImport={handleImportBackup}
          onWarmOffline={handleWarmAllPacksOffline}
          onRequestReset={() => {
            setSettingsOpen(false);
            setConfirmDialog({
              title: 'Reset answered progress?',
              message:
                'This clears your answered question history and streak on this device. Your personal questions, bookmarks, and notes will be preserved.',
              confirmLabel: 'Reset progress',
              onConfirm: async () => {
                await resetAnsweredProgress();
                setStudy((prev) => ({ ...prev, answered: {}, activityDays: [] }));
                setConfirmDialog(null);
                notify('Answered progress cleared');
              },
            });
          }}
        />
      )}

      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
        />
      )}
    </div>
  );
}

function NavItem({ icon: Icon, label, active, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`nav-item ${active ? 'active' : ''}`}
    >
      <Icon size={17} strokeWidth={1.85} aria-hidden="true" />
      <span>{label}</span>
      {badge && <small>{badge}</small>}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`} aria-hidden="true">
        <Icon size={18} />
      </div>
      <div className="stat-label">{label}</div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-hint">{hint}</span>
    </div>
  );
}

function StageCard({ tone, number, label, title, count, statusNote, desc, onClick }) {
  return (
    <button type="button" className={`stage-card ${tone}`} onClick={onClick}>
      <div className="stage-card-top">
        <span>{label}</span>
        <span className="stage-number">{number}</span>
      </div>
      <h4>{title}</h4>
      <p>{desc}</p>
      <div className="stage-card-bottom">
        <span>
          <b>{count}</b> available · {statusNote}
        </span>
        <span className="circle-arrow" aria-hidden="true">
          <ArrowUpRight size={16} />
        </span>
      </div>
    </button>
  );
}

function QuestionModal({ initial, onClose, onSave }) {
  const defaultChapter = SYLLABUS_CHAPTERS[0];
  const [form, setForm] = useState(() =>
    initial
      ? {
          chapterId: initial.chapterId || defaultChapter.chapterId,
          stage: initial.stage || defaultChapter.classStage,
          topic: initial.topic || '',
          questionType: initial.questionType || 'concept',
          difficulty: initial.difficulty || 'medium',
          question: initial.question || '',
          options: Array.isArray(initial.options) ? [...initial.options] : ['', '', '', ''],
          answer: Number.isInteger(initial.answer) ? initial.answer : 0,
          explanation: initial.explanation || '',
        }
      : {
          chapterId: defaultChapter.chapterId,
          stage: defaultChapter.classStage,
          topic: '',
          questionType: 'concept',
          difficulty: 'medium',
          question: '',
          options: ['', '', '', ''],
          answer: 0,
          explanation: '',
        }
  );

  const change = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const trimmedOpts = form.options.map((o) => o.trim());
  const distinctOptions = new Set(trimmedOpts.map((o) => o.toLowerCase())).size === 4;
  const isValid =
    form.question.trim().length >= 8 &&
    trimmedOpts.every(Boolean) &&
    distinctOptions &&
    form.explanation.trim().length >= 10;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="q-modal-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        className="question-modal"
        onSubmit={(e) => {
          e.preventDefault();
          if (isValid) onSave(form);
        }}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              <Edit3 size={13} /> PERSONAL STUDY QUESTION (EXCLUDED FROM CHAPTER COUNT)
            </span>
            <h2 id="q-modal-title">{initial ? 'Edit personal question' : 'Create a question'}</h2>
          </div>
          <button type="button" className="icon-btn" aria-label="Close modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <label>
            Question stem
            <textarea
              autoFocus
              rows={3}
              required
              value={form.question}
              onChange={(e) => change('question', e.target.value)}
              placeholder="Write a clear single-best-answer Biology question…"
            />
          </label>

          <div className="form-grid">
            <label>
              Chapter
              <select
                value={form.chapterId}
                onChange={(e) => {
                  const ch = CHAPTER_BY_ID.get(e.target.value);
                  setForm((f) => ({
                    ...f,
                    chapterId: e.target.value,
                    stage: f.stage === 'NEET practice' ? 'NEET practice' : ch?.classStage || 'Class 11',
                  }));
                }}
              >
                {SYLLABUS_CHAPTERS.map((c) => (
                  <option key={c.chapterId} value={c.chapterId}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Study stage
              <select value={form.stage} onChange={(e) => change('stage', e.target.value)}>
                <option value={CHAPTER_BY_ID.get(form.chapterId)?.classStage || 'Class 11'}>
                  {CHAPTER_BY_ID.get(form.chapterId)?.classStage || 'Class 11'} Biology
                </option>
                <option value="NEET practice">NEET-pattern practice</option>
              </select>
            </label>
          </div>

          <div className="form-grid form-grid-3">
            <label>
              Topic
              <input
                value={form.topic}
                onChange={(e) => change('topic', e.target.value)}
                placeholder="e.g. Meiosis I"
              />
            </label>
            <label>
              Question type
              <select
                value={form.questionType}
                onChange={(e) => change('questionType', e.target.value)}
              >
                {VALID_QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {QUESTION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Difficulty
              <select
                value={form.difficulty}
                onChange={(e) => change('difficulty', e.target.value)}
              >
                {VALID_DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d[0].toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="answer-editor">
            <div className="answer-editor-title">
              <span>Four distinct options</span>
              <small>Click letter A–D to mark the single correct option</small>
            </div>
            {form.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isSelected = Number(form.answer) === i;
              return (
                <div className={`edit-option ${isSelected ? 'selected' : ''}`} key={letter}>
                  <button
                    type="button"
                    className="radio-choice"
                    aria-label={`Mark option ${letter} as correct`}
                    aria-pressed={isSelected}
                    onClick={() => change('answer', i)}
                  >
                    {letter}
                  </button>
                  <input
                    required
                    aria-label={`Option ${letter} text`}
                    value={opt}
                    onChange={(e) =>
                      change(
                        'options',
                        form.options.map((prev, j) => (j === i ? e.target.value : prev))
                      )
                    }
                    placeholder={`Option ${letter}`}
                  />
                  {isSelected && <Check size={16} aria-hidden="true" />}
                </div>
              );
            })}
            {trimmedOpts.every(Boolean) && !distinctOptions && (
              <small className="field-error">All four options must be distinct.</small>
            )}
          </div>

          <label>
            Explanation (min 10 chars)
            <textarea
              rows={3}
              required
              value={form.explanation}
              onChange={(e) => change('explanation', e.target.value)}
              placeholder="Explain why the correct answer is right and clarify key distractors…"
            />
          </label>
        </div>

        <div className="modal-footer">
          <span>Saved privately in IndexedDB</span>
          <button type="button" className="soft-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={!isValid} className="primary-btn dark-btn">
            {initial ? 'Save changes' : 'Save question'} <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}

function SettingsModal({
  study,
  onClose,
  onToggleShuffle,
  onExport,
  onImport,
  onWarmOffline,
  onRequestReset,
}) {
  const [importMode, setImportMode] = useState('merge');
  const fileRef = useRef(null);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="question-modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              <Database size={13} /> ON-DEVICE PRIVACY &amp; BACKUP
            </span>
            <h2 id="settings-title">Study settings &amp; data backup</h2>
          </div>
          <button type="button" className="icon-btn" aria-label="Close settings" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body settings-body">
          <div className="setting-block">
            <div>
              <b>Practice option shuffling</b>
              <p>Randomise option positions (A–D) in practice while keeping answer grading exact.</p>
            </div>
            <button
              type="button"
              className={`soft-btn ${study.preferences.shuffleOptions ? 'btn-active' : ''}`}
              aria-pressed={study.preferences.shuffleOptions}
              onClick={onToggleShuffle}
            >
              {study.preferences.shuffleOptions ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="setting-block">
            <div>
              <b>Export local study backup</b>
              <p>
                Download a JSON file containing your {Object.keys(study.answered).length} answers,{' '}
                {study.bookmarks.length} bookmarks, {study.customQuestions.length} personal
                questions, and {study.notes.length} notes.
              </p>
            </div>
            <button type="button" className="primary-btn dark-btn" onClick={onExport}>
              <Download size={15} /> Export JSON
            </button>
          </div>

          <div className="setting-block">
            <div>
              <b>Import study backup</b>
              <p>Restore a MemoNeet backup JSON file onto this phone or browser.</p>
              <label className="inline-select">
                Import mode:{' '}
                <select value={importMode} onChange={(e) => setImportMode(e.target.value)}>
                  <option value="merge">Merge with existing data</option>
                  <option value="replace">Replace existing data</option>
                </select>
              </label>
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImport(file, importMode);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                className="soft-btn"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={15} /> Choose JSON
              </button>
            </div>
          </div>

          <div className="setting-block">
            <div>
              <b>Offline chapter pack verification</b>
              <p>
                Storage backend: <b>{study.storageBackend}</b>. Preload all 32 bundled chapter packs
                now for instant airplane-mode switching.
              </p>
            </div>
            <button type="button" className="soft-btn" onClick={onWarmOffline}>
              Verify offline packs
            </button>
          </div>

          <div className="setting-block danger-block">
            <div>
              <b>Reset answered history</b>
              <p>Clears solved/wrong answer records while keeping personal questions &amp; notes.</p>
            </div>
            <button type="button" className="soft-btn danger-btn" onClick={onRequestReset}>
              Reset progress
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <span>{SYLLABUS_META.editionLabel}</span>
          <button type="button" className="soft-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, onCancel, onConfirm }) {
  return (
    <div
      className="modal-backdrop"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="question-modal confirm-modal">
        <div className="modal-head">
          <h2 id="confirm-title">{title}</h2>
        </div>
        <div className="modal-body">
          <p className="confirm-text">{message}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="soft-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="primary-btn danger-solid-btn" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
