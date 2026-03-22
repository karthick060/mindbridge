// ─── API Client ─────────────────────────────────────────────────────────────
// All HTTP calls to the Django backend go through this module.
// The "proxy" in package.json forwards /api/* → http://localhost:8000
import axios from 'axios';

const http = axios.create({ baseURL: 'https://web-production-14b98.up.railway.app/api' });

// ── Users ──────────────────────────────────────────────
/** Ask the backend to generate a new anonymous ID */
export const generateAnonId = () => http.get('/users/generate/').then(r => r.data);

// ── Chat Rooms ──────────────────────────────────────────
/** List all active rooms */
export const getRooms = () => http.get('/chat/rooms/').then(r => r.data);

/** Get the last 60 messages for a room */
export const getMessages = (slug) => http.get(`/chat/rooms/${slug}/messages/`).then(r => r.data);

// ── AI Moderation (HTTP fallback) ────────────────────────
/** Analyze a message (REST fallback when WebSocket unavailable) */
export const analyzeMessage = (text) =>
  http.post('/moderation/analyze/', { text }).then(r => r.data);

// ── Dashboard ────────────────────────────────────────────
export const getDashboardStats  = () => http.get('/dashboard/stats/').then(r => r.data);
export const getFlaggedMessages = () => http.get('/dashboard/flags/').then(r => r.data);
export const resolveAlert       = (id) => http.patch(`/dashboard/alerts/${id}/resolve/`).then(r => r.data);
export const getRoomActivity    = () => http.get('/dashboard/room-activity/').then(r => r.data);

// ── WebSocket factory ────────────────────────────────────
/**
 * Open a WebSocket connection to a chat room.
 * Returns the WebSocket instance (call .close() to disconnect).
 */
export const createChatSocket = (roomSlug, { onMessage, onOpen, onClose, onError } = {}) => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host     = window.location.hostname;
  const ws       = new WebSocket(`${protocol}://${host}:8000/ws/chat/${roomSlug}/`);
  ws.onopen    = onOpen  || (() => {});
  ws.onclose   = onClose || (() => {});
  ws.onerror   = onError || (() => {});
  ws.onmessage = (e) => onMessage && onMessage(JSON.parse(e.data));
  return ws;
};
