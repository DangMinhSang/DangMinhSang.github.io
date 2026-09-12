/**
 * app.js — English Vocabulary: Translate & Learn
 * ================================================
 * Pure vanilla JavaScript. No frameworks, no external dependencies.
 *
 * ARCHITECTURE OVERVIEW
 * ─────────────────────
 *  State       → single source of truth for runtime data
 *  Storage     → localStorage read/write helpers
 *  DataService → loads & filters sentences from data.json
 *  Scorer      → compares user answer to expected (similarity algorithm)
 *  UI          → renders DOM from state
 *  Router      → switches pages & nav
 *  App         → orchestrates everything
 */

"use strict";

/* ══════════════════════════════════════════════════════════════════════════
   CONFIGURATION
══════════════════════════════════════════════════════════════════════════ */
const CONFIG = {
  dataUrl: "data.json",
  storageKeys: {
    history:    "ev_history",
    stats:      "ev_stats",
    theme:      "ev_theme",
    filterDiff: "ev_filter_diff",
    filterTopic:"ev_filter_topic",
    mode:       "ev_mode",
    progress:   "ev_progress",   // { sentenceId, filterDiff, filterTopic }
  },
  /** Similarity thresholds (0.0 – 1.0) */
  thresholds: {
    correct: 0.85,
    almost:  0.60,
  },
  /** Max history items kept in localStorage */
  maxHistory: 500,
};

/* ══════════════════════════════════════════════════════════════════════════
   STORAGE HELPERS
══════════════════════════════════════════════════════════════════════════ */
const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════════════════════════ */
const state = {
  /** All sentences loaded from data.json */
  allSentences: [],
  /** Currently active (filtered + possibly shuffled) sentence list */
  queue: [],
  /** Index in queue */
  queueIndex: 0,
  /** Whether the current sentence has been checked */
  checked: false,
  /** Result of last check: "correct" | "almost" | "incorrect" | null */
  lastResult: null,
  /** "sequential" | "random" */
  mode: Storage.get(CONFIG.storageKeys.mode, "sequential"),
  /** Active filters */
  filterDiff:  Storage.get(CONFIG.storageKeys.filterDiff,  "all"),
  filterTopic: Storage.get(CONFIG.storageKeys.filterTopic, "all"),
  /** Current page */
  currentPage: "practice",
  /** History filter ("all" | "correct" | "almost" | "incorrect") */
  historyFilter: "all",
};

/* ══════════════════════════════════════════════════════════════════════════
   SCORER — String similarity (Levenshtein-based Jaro–Winkler variant)
══════════════════════════════════════════════════════════════════════════ */
const Scorer = (() => {
  /**
   * Normalize a string for comparison.
   * - lowercase
   * - remove punctuation (keep Vietnamese diacritic letters & spaces)
   * - collapse whitespace
   */
  function normalize(str) {
    return str
      .toLowerCase()
      .replace(/[.,!?;:"'()[\]{}<>…–—\/\\]/g, " ") // strip common punctuation
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Levenshtein edit distance between two strings.
   * Operates on characters (works for Vietnamese).
   */
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    // Use two rows to save memory
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    let curr = new Array(n + 1);

    for (let i = 1; i <= m; i++) {
      curr[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1,       // deletion
          curr[j - 1] + 1,   // insertion
          prev[j - 1] + cost // substitution
        );
      }
      [prev, curr] = [curr, prev];
    }
    return prev[n];
  }

  /**
   * Return a similarity score in [0, 1].
   * 1.0 = identical, 0.0 = completely different.
   *
   * Formula: 1 - (editDistance / maxLen)
   * with a fallback of 0 for empty strings.
   */
  function similarity(a, b) {
    const na = normalize(a);
    const nb = normalize(b);
    if (na === nb) return 1.0;
    if (!na || !nb) return 0.0;

    const dist = levenshtein(na, nb);
    const maxLen = Math.max(na.length, nb.length);
    return Math.max(0, 1 - dist / maxLen);
  }

  /**
   * Grade a user answer against the expected answer.
   * Returns: "correct" | "almost" | "incorrect"
   */
  function grade(userAnswer, expected) {
    const score = similarity(userAnswer, expected);
    if (score >= CONFIG.thresholds.correct) return "correct";
    if (score >= CONFIG.thresholds.almost)  return "almost";
    return "incorrect";
  }

  return { normalize, similarity, grade };
})();

/* ══════════════════════════════════════════════════════════════════════════
   DATA SERVICE
══════════════════════════════════════════════════════════════════════════ */
const DataService = (() => {
  /** Fisher-Yates in-place shuffle */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async function load() {
    const res = await fetch(CONFIG.dataUrl);
    if (!res.ok) throw new Error(`Failed to load ${CONFIG.dataUrl}: ${res.status}`);
    const data = await res.json();
    state.allSentences = data.sentences || [];
    return data;
  }

  /** Apply current filters and mode, rebuild state.queue */
  /** Save current position to localStorage */
  function saveProgress() {
    const s = state.queue[state.queueIndex];
    if (!s) return;
    Storage.set(CONFIG.storageKeys.progress, {
      sentenceId:  s.id,
      filterDiff:  state.filterDiff,
      filterTopic: state.filterTopic,
    });
  }

  /**
   * Rebuild active queue from filters.
   * @param {boolean} restoreProgress - if true, restore saved position from localStorage
   */
  function rebuildQueue(restoreProgress = false) {
    let filtered = state.allSentences.filter(s => {
      const diffOk  = state.filterDiff  === "all" || s.difficulty === state.filterDiff;
      const topicOk = state.filterTopic === "all" || s.topic === state.filterTopic;
      return diffOk && topicOk;
    });

    if (state.mode === "random") {
      filtered = shuffle([...filtered]);
    }

    state.queue = filtered;
    state.checked = false;
    state.lastResult = null;

    if (restoreProgress) {
      // Try to resume from last saved sentence
      const saved = Storage.get(CONFIG.storageKeys.progress, null);
      if (
        saved &&
        saved.filterDiff  === state.filterDiff &&
        saved.filterTopic === state.filterTopic
      ) {
        const idx = state.queue.findIndex(s => s.id === saved.sentenceId);
        state.queueIndex = idx >= 0 ? idx : 0;
      } else {
        state.queueIndex = 0;
      }
    } else {
      state.queueIndex = 0;
    }
  }

  function currentSentence() {
    return state.queue[state.queueIndex] ?? null;
  }

  /** Move to next sentence and save progress. Returns false if at end. */
  function advance() {
    if (state.queueIndex < state.queue.length - 1) {
      state.queueIndex++;
      state.checked = false;
      state.lastResult = null;
      saveProgress();
      return true;
    }
    return false; // session complete
  }

  /** Move to previous sentence and save progress. Returns false if at start. */
  function goBack() {
    if (state.queueIndex > 0) {
      state.queueIndex--;
      state.checked = false;
      state.lastResult = null;
      saveProgress();
      return true;
    }
    return false;
  }

  function hasCurrent() { return state.queue.length > 0; }

  /** Build filter option lists from allSentences */
  function getDistinctValues(field) {
    return [...new Set(state.allSentences.map(s => s[field]).filter(Boolean))].sort();
  }

  return { load, rebuildQueue, currentSentence, advance, goBack, hasCurrent, getDistinctValues, saveProgress };
})();

/* ══════════════════════════════════════════════════════════════════════════
   HISTORY & STATS — localStorage-backed
══════════════════════════════════════════════════════════════════════════ */
const HistoryStore = (() => {
  function getAll() {
    return Storage.get(CONFIG.storageKeys.history, []);
  }

  function add(entry) {
    const history = getAll();
    history.unshift(entry); // newest first
    if (history.length > CONFIG.maxHistory) history.length = CONFIG.maxHistory;
    Storage.set(CONFIG.storageKeys.history, history);
  }

  function clear() { Storage.remove(CONFIG.storageKeys.history); }

  return { getAll, add, clear };
})();

const StatsStore = (() => {
  const DEFAULT = {
    total: 0,
    correct: 0,
    almost: 0,
    incorrect: 0,
    byDifficulty: {},
    byTopic: {},
    streak: 0,
    bestStreak: 0,
    sessions: 0,
  };

  function get() {
    return Storage.get(CONFIG.storageKeys.stats, { ...DEFAULT });
  }

  function record(result, sentence) {
    const stats = get();
    stats.total++;
    stats[result]++;

    // By difficulty
    const d = sentence.difficulty;
    stats.byDifficulty[d] = stats.byDifficulty[d] || { total: 0, correct: 0, almost: 0, incorrect: 0 };
    stats.byDifficulty[d].total++;
    stats.byDifficulty[d][result]++;

    // By topic
    const t = sentence.topic;
    stats.byTopic[t] = stats.byTopic[t] || { total: 0, correct: 0, almost: 0, incorrect: 0 };
    stats.byTopic[t].total++;
    stats.byTopic[t][result]++;

    // Streak (consecutive correct or almost)
    if (result === "correct") {
      stats.streak++;
    } else {
      stats.streak = 0;
    }
    if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;

    Storage.set(CONFIG.storageKeys.stats, stats);
  }

  function incrementSession() {
    const stats = get();
    stats.sessions++;
    Storage.set(CONFIG.storageKeys.stats, stats);
  }

  function clear() { Storage.remove(CONFIG.storageKeys.stats); }

  return { get, record, incrementSession, clear };
})();

/* ══════════════════════════════════════════════════════════════════════════
   THEME
══════════════════════════════════════════════════════════════════════════ */
const Theme = (() => {
  function current() {
    return Storage.get(CONFIG.storageKeys.theme, "light");
  }

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    Storage.set(CONFIG.storageKeys.theme, theme);
  }

  function toggle() {
    apply(current() === "light" ? "dark" : "light");
  }

  function init() {
    // Prefer system preference if no saved setting
    const saved = localStorage.getItem(CONFIG.storageKeys.theme);
    if (!saved) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      apply(prefersDark ? "dark" : "light");
    } else {
      apply(JSON.parse(saved));
    }
  }

  return { init, toggle, current };
})();

/* ══════════════════════════════════════════════════════════════════════════
   TEXT-TO-SPEECH (Web Speech API)
══════════════════════════════════════════════════════════════════════════ */
const TTS = (() => {
  let utterance = null;

  function isSupported() {
    return "speechSynthesis" in window;
  }

  function speak(text, lang = "en-US", onEnd) {
    if (!isSupported()) return;
    window.speechSynthesis.cancel();
    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    if (isSupported()) window.speechSynthesis.cancel();
  }

  return { isSupported, speak, stop };
})();

/* ══════════════════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
══════════════════════════════════════════════════════════════════════════ */
const Toast = (() => {
  let timer = null;
  const el = () => document.getElementById("toast");

  function show(msg, duration = 2500) {
    const t = el();
    if (!t) return;
    t.textContent = msg;
    t.classList.remove("hidden");
    // Force reflow for animation
    void t.offsetHeight;
    t.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.classList.add("hidden"), 250);
    }, duration);
  }

  return { show };
})();

/* ══════════════════════════════════════════════════════════════════════════
   UI RENDERER
══════════════════════════════════════════════════════════════════════════ */
const UI = (() => {
  /* ── DOM refs ── */
  const dom = {};

  function init() {
    [
      "englishSentence", "answerInput", "checkBtn", "listenBtn",
      "progressFill", "currentNum", "totalNum", "progressFilters",
      "badgeDifficulty", "badgeTopic", "badgeMode",
      "inputArea", "resultArea", "resultVerdict",
      "userAnswerDisplay", "expectedAnswerDisplay",
      "resultNote", "resultNoteText",
      "nextBtn", "skipBtn", "tryAgainBtn", "backBtn", "backBtn2",
      "sessionComplete", "sessionSummary",
      "practiceCard", "noResults",
      "filterDifficulty", "filterTopic",
      "modeSequential", "modeRandom",
      "showKeywordsBtn", "keywordsContainer", "keywordsList",
      "historyList", "historyEmpty",
      "clearHistoryBtn", "clearStatsBtn", "resetSession",
      "statTotal", "statCorrect", "statAlmost", "statIncorrect",
      "accuracyBar", "accCorrectBar", "accAlmostBar", "accIncorrectBar",
      "accuracyLabel",
      "statsByDifficulty", "statsByTopic",
      "statStreak", "statBestStreak", "statSessions",
      "themeToggle",
      "restartFilteredBtn", "viewStatsBtn",
    ].forEach(id => { dom[id] = document.getElementById(id); });
  }

  /* ── Filters ── */
  function populateFilters(data) {
    const diffEl  = dom.filterDifficulty;
    const topicEl = dom.filterTopic;

    // Keep "All" option, remove rest
    while (diffEl.options.length > 1)  diffEl.remove(1);
    while (topicEl.options.length > 1) topicEl.remove(1);

    const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const difficulties = (data.meta?.difficulties || DataService.getDistinctValues("difficulty"))
      .sort((a, b) => CEFR_ORDER.indexOf(a) - CEFR_ORDER.indexOf(b));
    const topics = data.meta?.topics || DataService.getDistinctValues("topic");

    difficulties.forEach(d => {
      const opt = new Option(d, d);
      diffEl.add(opt);
    });
    topics.forEach(t => {
      const opt = new Option(t, t);
      topicEl.add(opt);
    });

    // Restore saved filter values
    diffEl.value  = state.filterDiff;
    topicEl.value = state.filterTopic;
  }

  /* ── Practice card ── */
  function renderQuestion() {
    const s = DataService.currentSentence();
    const total = state.queue.length;

    if (!s || total === 0) {
      dom.noResults.classList.remove("hidden");
      dom.practiceCard.classList.add("hidden");
      return;
    }

    dom.noResults.classList.add("hidden");
    dom.practiceCard.classList.remove("hidden");
    dom.sessionComplete.classList.add("hidden");
    dom.inputArea.classList.remove("hidden");
    dom.resultArea.classList.add("hidden");
    dom.keywordsContainer.classList.add("hidden");

    // Progress
    const idx = state.queueIndex + 1;
    dom.currentNum.textContent = idx;
    dom.totalNum.textContent   = total;
    const pct = Math.round(((idx - 1) / total) * 100);
    dom.progressFill.style.width = pct + "%";
    dom.progressFill.parentElement.setAttribute("aria-valuenow", pct);

    // Filters label
    const parts = [];
    if (state.filterDiff  !== "all") parts.push(state.filterDiff);
    if (state.filterTopic !== "all") parts.push(state.filterTopic);
    dom.progressFilters.textContent = parts.length ? `• ${parts.join(" · ")}` : "";

    // Badges
    dom.badgeDifficulty.textContent = s.difficulty;
    dom.badgeTopic.textContent = s.topic;
    dom.badgeMode.classList.toggle("hidden", state.mode !== "random");

    // Sentence (show Vietnamese, user translates to English)
    dom.englishSentence.textContent = s.vietnamese;
    dom.answerInput.value = "";
    dom.answerInput.focus();

    // Back button: disable at first sentence
    const atStart = state.queueIndex === 0;
    dom.backBtn.disabled = atStart;
    dom.backBtn.style.opacity = atStart ? "0.35" : "1";

    // Reset try-again / next button state
    dom.tryAgainBtn.classList.add("hidden");
    dom.nextBtn.classList.remove("hidden");

    // Hide listen if TTS not supported
    dom.listenBtn.style.display = TTS.isSupported() ? "" : "none";
    dom.listenBtn.classList.remove("speaking");
    TTS.stop();
  }

  function renderResult(userAnswer, result, sentence) {
    dom.inputArea.classList.add("hidden");
    dom.resultArea.classList.remove("hidden");

    // Verdict
    const verdicts = {
      correct:   { icon: "✓", label: "Correct!",                        cls: "result-verdict--correct" },
      almost:    { icon: "~", label: "Almost correct! You may continue.", cls: "result-verdict--almost" },
      incorrect: { icon: "✗", label: "Incorrect — try again!",           cls: "result-verdict--incorrect" },
    };
    const v = verdicts[result];
    dom.resultVerdict.className = `result-verdict ${v.cls}`;
    dom.resultVerdict.innerHTML = `<span style="font-size:1.3em">${v.icon}</span> ${v.label}`;

    // Answers
    dom.userAnswerDisplay.textContent     = userAnswer || "(no answer)";
    dom.expectedAnswerDisplay.textContent = sentence.english;

    // Note
    if (sentence.note) {
      dom.resultNote.classList.remove("hidden");
      dom.resultNoteText.textContent = sentence.note;
    } else {
      dom.resultNote.classList.add("hidden");
    }

    // If incorrect → show Try Again, hide Next
    if (result === "incorrect") {
      dom.nextBtn.classList.add("hidden");
      dom.tryAgainBtn.classList.remove("hidden");
    } else {
      dom.nextBtn.classList.remove("hidden");
      dom.tryAgainBtn.classList.add("hidden");
    }

    // Back button in result area
    const atStart = state.queueIndex === 0;
    dom.backBtn2.disabled = atStart;
    dom.backBtn2.style.opacity = atStart ? "0.35" : "1";

    // Update progress bar
    const total = state.queue.length;
    const pct = Math.round((state.queueIndex + 1) / total * 100);
    dom.progressFill.style.width = pct + "%";
  }

  function renderSessionComplete() {
    dom.inputArea.classList.add("hidden");
    dom.resultArea.classList.add("hidden");
    dom.sessionComplete.classList.remove("hidden");

    const stats = StatsStore.get();
    const total = state.queue.length;
    const correct  = stats.correct;
    const almost   = stats.almost;
    dom.sessionSummary.textContent =
      `You completed ${total} sentence${total !== 1 ? "s" : ""}. ` +
      `Correct: ${correct}, Almost: ${almost}, Total: ${stats.total}`;
  }

  /* ── Keywords ── */
  function toggleKeywords() {
    const s = DataService.currentSentence();
    if (!s || !s.keywords?.length) {
      Toast.show("No keywords available for this sentence.");
      return;
    }
    const hidden = dom.keywordsContainer.classList.toggle("hidden");
    if (!hidden) {
      dom.keywordsList.innerHTML = s.keywords
        .map(k => `<span>${k}</span>`)
        .join(" ");
    }
  }

  /* ── History Page ── */
  function renderHistory() {
    const all     = HistoryStore.getAll();
    const filter  = state.historyFilter;
    const entries = filter === "all" ? all : all.filter(e => e.result === filter);

    dom.historyList.innerHTML = "";

    if (entries.length === 0) {
      dom.historyEmpty.classList.remove("hidden");
      dom.historyList.appendChild(dom.historyEmpty);
      return;
    }

    dom.historyEmpty.classList.add("hidden");

    const LABELS = { correct: "✓ Correct", almost: "~ Almost", incorrect: "✗ Incorrect" };
    const BADGE  = { correct: "result-badge--correct", almost: "result-badge--almost", incorrect: "result-badge--incorrect" };

    entries.forEach(e => {
      const item = document.createElement("div");
      item.className = `history-item history-item--${e.result}`;
      const date = new Date(e.timestamp).toLocaleString("vi-VN");
      item.innerHTML = `
        <div class="history-item__header">
          <div class="history-item__english">${escHtml(e.vietnamese || e.english)}</div>
          <span class="history-item__result ${BADGE[e.result]}">${LABELS[e.result]}</span>
        </div>
        <div class="history-item__answers">
          <div>
            <div class="history-answer__label">Your answer (EN)</div>
            <div>${escHtml(e.userAnswer || "(no answer)")}</div>
          </div>
          <div>
            <div class="history-answer__label">Expected (EN)</div>
            <div>${escHtml(e.correctAnswer)}</div>
          </div>
        </div>
        <div class="history-item__footer">
          <span>ID #${e.sentenceId}</span>
          <span>${date}</span>
        </div>`;
      dom.historyList.appendChild(item);
    });
  }

  /* ── Statistics Page ── */
  function renderStats() {
    const s = StatsStore.get();

    dom.statTotal.textContent    = s.total;
    dom.statCorrect.textContent  = s.correct;
    dom.statAlmost.textContent   = s.almost;
    dom.statIncorrect.textContent= s.incorrect;
    dom.statStreak.textContent   = s.streak;
    dom.statBestStreak.textContent = s.bestStreak;
    dom.statSessions.textContent = s.sessions;

    // Accuracy bar
    const total = s.total || 1;
    const cPct = (s.correct  / total * 100).toFixed(1);
    const aPct = (s.almost   / total * 100).toFixed(1);
    const iPct = (s.incorrect/ total * 100).toFixed(1);
    dom.accCorrectBar.style.width   = cPct + "%";
    dom.accAlmostBar.style.width    = aPct + "%";
    dom.accIncorrectBar.style.width = iPct + "%";

    if (s.total > 0) {
      const accPct = (((s.correct + s.almost) / s.total) * 100).toFixed(0);
      dom.accuracyLabel.textContent =
        `${accPct}% accuracy (${s.correct} correct + ${s.almost} almost out of ${s.total})`;
    } else {
      dom.accuracyLabel.textContent = "No data yet";
    }

    // By difficulty
    renderBreakdown(dom.statsByDifficulty, s.byDifficulty);
    // By topic
    renderBreakdown(dom.statsByTopic, s.byTopic);
  }

  function renderBreakdown(container, map) {
    container.innerHTML = "";
    if (!map || Object.keys(map).length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);font-size:.85rem">No data yet.</p>`;
      return;
    }
    const maxTotal = Math.max(...Object.values(map).map(v => v.total), 1);
    Object.entries(map).sort((a, b) => b[1].total - a[1].total).forEach(([label, v]) => {
      const row = document.createElement("div");
      row.className = "breakdown-row";
      const pct = (v.total / maxTotal * 100).toFixed(0);
      row.innerHTML = `
        <div class="breakdown-label">${escHtml(label)}</div>
        <div class="breakdown-bar-track">
          <div class="breakdown-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="breakdown-count">${v.total}</div>`;
      container.appendChild(row);
    });
  }

  /* ── Nav / Router ── */
  function navigateTo(page) {
    state.currentPage = page;
    document.querySelectorAll(".page").forEach(p => {
      const show = p.id === `page-${page}`;
      p.classList.toggle("hidden", !show);
      p.classList.toggle("active", show);
    });
    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.page === page);
      btn.setAttribute("aria-current", btn.dataset.page === page ? "page" : "false");
    });

    if (page === "history")    renderHistory();
    if (page === "statistics") renderStats();
  }

  /* ── Utility ── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  return {
    init,
    dom,
    populateFilters,
    renderQuestion,
    renderResult,
    renderSessionComplete,
    toggleKeywords,
    renderHistory,
    renderStats,
    navigateTo,
  };
})();

/* ══════════════════════════════════════════════════════════════════════════
   APP — Main Orchestration
══════════════════════════════════════════════════════════════════════════ */
const App = (() => {
  let sessionStarted = false;

  /* ── Check Answer ── */
  function checkAnswer() {
    if (state.checked) return;
    const sentence = DataService.currentSentence();
    if (!sentence) return;

    const userAnswer = UI.dom.answerInput.value.trim();
    const result     = Scorer.grade(userAnswer, sentence.english);

    state.checked    = true;
    state.lastResult = result;

    // Only record in history/stats on the first attempt (correct or almost)
    // For incorrect retries, we don't record until they get it right
    if (result !== "incorrect") {
      const entry = {
        sentenceId:    sentence.id,
        english:       sentence.english,
        vietnamese:    sentence.vietnamese,
        timestamp:     Date.now(),
        userAnswer:    userAnswer,
        correctAnswer: sentence.english,
        result:        result,
        difficulty:    sentence.difficulty,
        topic:         sentence.topic,
      };
      HistoryStore.add(entry);
      StatsStore.record(result, sentence);
    }

    UI.renderResult(userAnswer, result, sentence);
  }

  /* ── Try Again — reset to input mode without advancing ── */
  function tryAgain() {
    state.checked    = false;
    state.lastResult = null;
    UI.dom.resultArea.classList.add("hidden");
    UI.dom.inputArea.classList.remove("hidden");
    UI.dom.answerInput.value = "";
    UI.dom.answerInput.focus();
    // Keep the same sentence (don't advance)
  }

  /* ── Next ── */
  function next() {
    // Blocked if last result was incorrect (must try again)
    if (state.lastResult === "incorrect") return;
    TTS.stop();
    const hasNext = DataService.advance();
    if (hasNext) {
      UI.renderQuestion();
    } else {
      UI.renderSessionComplete();
    }
  }

  /* ── Back — go to previous sentence ── */
  function back() {
    TTS.stop();
    const wentBack = DataService.goBack();
    if (wentBack) {
      UI.renderQuestion();
    }
  }

  /* ── Skip ── */
  function skip() {
    TTS.stop();
    // Just advance without recording a result
    const hasNext = DataService.advance();
    if (hasNext) {
      UI.renderQuestion();
    } else {
      UI.renderSessionComplete();
    }
  }

  /* ── Filter / Mode change ── */
  function applyFilters() {
    state.filterDiff  = UI.dom.filterDifficulty.value;
    state.filterTopic = UI.dom.filterTopic.value;
    Storage.set(CONFIG.storageKeys.filterDiff,  state.filterDiff);
    Storage.set(CONFIG.storageKeys.filterTopic, state.filterTopic);
    DataService.rebuildQueue();
    UI.renderQuestion();
  }

  function setMode(mode) {
    state.mode = mode;
    Storage.set(CONFIG.storageKeys.mode, mode);
    UI.dom.modeSequential.classList.toggle("active", mode === "sequential");
    UI.dom.modeRandom.classList.toggle("active", mode === "random");
    DataService.rebuildQueue();
    UI.renderQuestion();
  }

  /* ── Reset Session ── */
  function resetSession() {
    TTS.stop();
    DataService.rebuildQueue();
    UI.renderQuestion();
    Toast.show("Session reset.");
  }

  /* ── Listen (TTS) — reads the Vietnamese question sentence ── */
  function listen() {
    const s = DataService.currentSentence();
    if (!s) return;
    const btn = UI.dom.listenBtn;
    if (btn.classList.contains("speaking")) {
      TTS.stop();
      btn.classList.remove("speaking");
      return;
    }
    btn.classList.add("speaking");
    TTS.speak(s.vietnamese, "vi-VN", () => btn.classList.remove("speaking"));
  }

  /* ── Event Binding ── */
  function bindEvents() {
    const d = UI.dom;

    d.nextBtn.addEventListener("click", next);
    d.skipBtn.addEventListener("click", skip);
    d.tryAgainBtn.addEventListener("click", tryAgain);
    d.backBtn.addEventListener("click", back);
    d.backBtn2.addEventListener("click", back);
    d.listenBtn.addEventListener("click", listen);
    d.showKeywordsBtn.addEventListener("click", UI.toggleKeywords);

    // Check on button click or Enter in textarea (Shift+Enter = newline)
    d.checkBtn.addEventListener("click", checkAnswer);
    d.answerInput.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (state.checked && state.lastResult === "incorrect") {
          tryAgain(); // Enter on incorrect → go back to input
        } else if (state.checked) {
          next();     // Enter on correct/almost → next sentence
        } else {
          checkAnswer();
        }
      }
    });

    // Filters
    d.filterDifficulty.addEventListener("change", applyFilters);
    d.filterTopic.addEventListener("change", applyFilters);

    // Mode
    d.modeSequential.addEventListener("click", () => setMode("sequential"));
    d.modeRandom.addEventListener("click",     () => setMode("random"));

    // Reset
    d.resetSession.addEventListener("click", resetSession);

    // Theme
    d.themeToggle.addEventListener("click", Theme.toggle);

    // Nav
    document.querySelectorAll("[data-page]").forEach(el => {
      el.addEventListener("click", () => UI.navigateTo(el.dataset.page));
    });

    // History filters (chips)
    document.querySelectorAll(".filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        state.historyFilter = chip.dataset.result;
        UI.renderHistory();
      });
    });

    // Clear history
    d.clearHistoryBtn.addEventListener("click", () => {
      if (confirm("Clear all history? This cannot be undone.")) {
        HistoryStore.clear();
        UI.renderHistory();
        Toast.show("History cleared.");
      }
    });

    // Clear stats
    d.clearStatsBtn.addEventListener("click", () => {
      if (confirm("Reset all statistics? This cannot be undone.")) {
        StatsStore.clear();
        UI.renderStats();
        Toast.show("Statistics reset.");
      }
    });

    // Session complete buttons
    d.restartFilteredBtn.addEventListener("click", resetSession);

    // Keyboard shortcuts
    document.addEventListener("keydown", e => {
      // Only when on practice page and no modifiers
      if (state.currentPage !== "practice" || e.ctrlKey || e.metaKey || e.altKey) return;

      // Arrow Right → next sentence (only if checked and not incorrect)
      if (e.key === "ArrowRight") {
        if (state.checked && state.lastResult !== "incorrect") {
          e.preventDefault();
          next();
        }
        return;
      }

      // Arrow Left → previous sentence (when not typing in textarea)
      if (e.key === "ArrowLeft") {
        if (document.activeElement !== d.answerInput) {
          e.preventDefault();
          back();
        }
        return;
      }

      // L = listen (when not in textarea)
      if (e.key === "l" || e.key === "L") {
        if (document.activeElement !== d.answerInput) {
          e.preventDefault();
          listen();
        }
      }
    });
  }

  /* ── Init ── */
  async function init() {
    Theme.init();
    UI.init();
    bindEvents();

    // Load data
    try {
      const data = await DataService.load();
      UI.populateFilters(data);
      DataService.rebuildQueue(true); // restore saved progress on startup
      UI.renderQuestion();

      if (!sessionStarted) {
        StatsStore.incrementSession();
        sessionStarted = true;
      }

      // Sync mode UI
      const mode = state.mode;
      UI.dom.modeSequential.classList.toggle("active", mode === "sequential");
      UI.dom.modeRandom.classList.toggle("active", mode === "random");

    } catch (err) {
      console.error("Failed to load data:", err);
      const card = document.getElementById("practiceCard");
      if (card) {
        card.innerHTML = `
          <div style="padding:3rem;text-align:center;color:var(--incorrect)">
            <div style="font-size:2rem;margin-bottom:1rem">⚠️</div>
            <strong>Failed to load data.json</strong>
            <p style="margin-top:.5rem;color:var(--text-secondary);font-size:.9rem">
              Make sure data.json exists. Run: <code>python3 generate.py</code>
            </p>
          </div>`;
      }
    }
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════════════════════
   BOOTSTRAP
══════════════════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", App.init);
