// ─── useAnonUser Hook ────────────────────────────────────────────────────────
// Manages the anonymous session.
// Uses sessionStorage (NOT localStorage) so the identity disappears
// when the browser tab is closed — true anonymity.
import { useState, useEffect } from 'react';
import { generateLocalAnonId } from '../utils/constants';

export const useAnonUser = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let id = sessionStorage.getItem('mb_anon_id');
    if (!id) {
      id = generateLocalAnonId();
      sessionStorage.setItem('mb_anon_id', id);
    }
    setUserId(id);
  }, []);

  /** Get a brand-new anonymous identity */
  const resetIdentity = () => {
    const id = generateLocalAnonId();
    sessionStorage.setItem('mb_anon_id', id);
    setUserId(id);
  };

  return { userId, resetIdentity };
};
