// ─── useAnonUser Hook ────────────────────────────────────────────────────────
// Manages the anonymous session.
// Uses localStorage so the same identity is shared across tabs in the same
// browser — required for cross-tab dashboard stats to work.
// Identity is cleared on window close via beforeunload.
import { useState, useEffect } from 'react';
import { generateLocalAnonId } from '../utils/constants';

export const useAnonUser = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Use localStorage so all tabs in the same browser share the same userId
    let id = localStorage.getItem('mb_anon_id');
    if (!id) {
      id = generateLocalAnonId();
      localStorage.setItem('mb_anon_id', id);
    }
    setUserId(id);

    // Clean up on tab close so identity doesn't persist forever
    const onUnload = () => {
      // Only remove if this is the last tab (check heartbeat count)
      try {
        const raw = localStorage.getItem('mb_active_tabs');
        const tabs = raw ? JSON.parse(raw) : {};
        const alive = Object.values(tabs).filter(t => Date.now() - t.ts < 10000);
        if (alive.length <= 1) {
          localStorage.removeItem('mb_anon_id');
        }
      } catch (_) {}
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  const resetIdentity = () => {
    const id = generateLocalAnonId();
    localStorage.setItem('mb_anon_id', id);
    setUserId(id);
  };

  return { userId, resetIdentity };
};