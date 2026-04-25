// ─── API Utility — all backend calls in one place ─────────────────────────
// Base URL: in production, set REACT_APP_API_URL in your .env file
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const api = {
  // ── Dashboard ────────────────────────────────────────────────────────────
  getDashboardStats: () =>
    fetch(`${BASE}/api/dashboard/stats/`).then(r => r.json()),

  getFlaggedMessages: () =>
    fetch(`${BASE}/api/dashboard/flags/`).then(r => r.json()),

  resolveAlert: (id) =>
    fetch(`${BASE}/api/dashboard/alerts/${id}/resolve/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }).then(r => r.json()),

  getRoomActivity: () =>
    fetch(`${BASE}/api/dashboard/room-activity/`).then(r => r.json()),

  // ── Chat ─────────────────────────────────────────────────────────────────
  getRoomMessages: (roomSlug) =>
    fetch(`${BASE}/api/chat/rooms/${roomSlug}/messages/`).then(r => r.json()),

  saveAIMessage: (roomSlug, text) =>
    fetch(`${BASE}/api/chat/rooms/${roomSlug}/messages/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, is_ai: true, sender_anon_id: 'MindBridge AI' }),
    }).then(r => r.json()),
};
