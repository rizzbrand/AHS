'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { sessionUsers } from './seed';
import { SessionUser } from './types';

const STORAGE_KEY = 'ahs-demo-user';

type SessionValue = {
  ready: boolean;
  user: SessionUser | null;
  signIn: (userId: string) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && sessionUsers.some((user) => user.id === stored)) setUserId(stored);
    setReady(true);
  }, []);

  const value = useMemo<SessionValue>(() => {
    return {
      ready,
      user: sessionUsers.find((user) => user.id === userId) ?? null,
      signIn: (nextId: string) => {
        window.localStorage.setItem(STORAGE_KEY, nextId);
        setUserId(nextId);
      },
      signOut: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setUserId(null);
      }
    };
  }, [ready, userId]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used within SessionProvider');
  return value;
}
