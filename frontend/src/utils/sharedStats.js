// ─── sharedStats.js ──────────────────────────────────────────────────────────
// Cross-tab stats store using localStorage.
// ChatPage writes here whenever a message is sent/received.
// DashboardPage reads from here every 2s.

const STATS_KEY = 'mb_stats';

const defaultStats = () => ({
  messages: [],
  blockedCount: 0,
  sessionStart: Date.now(),
});

export const readStats = () => {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : defaultStats();
  } catch (_) {
    return defaultStats();
  }
};

export const writeStats = (updater) => {
  try {
    const current = readStats();
    const updated = typeof updater === 'function' ? updater(current) : updater;
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  } catch (_) {}
};

export const pushMessage = (msg, roomId) => {
  writeStats(s => ({
    ...s,
    messages: [
      ...( s.messages || []),
      { ...msg, room: roomId, _ts: Date.now() }
    ].slice(-500), // keep last 500 messages max
  }));
};

export const incrementBlocked = () => {
  writeStats(s => ({ ...s, blockedCount: (s.blockedCount || 0) + 1 }));
};

// ── Cross-tab presence via localStorage ─────────────────────────────────────
const HEARTBEAT_KEY = 'mb_active_tabs';
const HEARTBEAT_TTL = 8000;

const getTabId = () => {
  if (!window._mbTabId) {
    window._mbTabId = `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
  return window._mbTabId;
};

export const writeHeartbeat = (userId) => {
  try {
    const raw = localStorage.getItem(HEARTBEAT_KEY);
    const tabs = raw ? JSON.parse(raw) : {};
    tabs[getTabId()] = { userId, ts: Date.now() };
    localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(tabs));
  } catch (_) {}
};

export const removeHeartbeat = () => {
  try {
    const raw = localStorage.getItem(HEARTBEAT_KEY);
    const tabs = raw ? JSON.parse(raw) : {};
    delete tabs[getTabId()];
    localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(tabs));
  } catch (_) {}
};

export const countActiveUsers = () => {
  try {
    const raw = localStorage.getItem(HEARTBEAT_KEY);
    if (!raw) return 1;
    const tabs = JSON.parse(raw);
    const now = Date.now();
    const aliveUsers = new Set();
    Object.values(tabs).forEach(t => {
      if (now - t.ts < HEARTBEAT_TTL) aliveUsers.add(t.userId);
    });
    return Math.max(aliveUsers.size, 1);
  } catch (_) { return 1; }
};