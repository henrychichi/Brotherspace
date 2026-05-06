import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase.ts';
import { api } from './api.ts';
import { User } from '../types.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  signIn: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const refreshUser = async () => {
      try {
        const currentUser = await api.getCurrentUser();
        if (active) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to load Supabase session:', error);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    refreshUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        if (!active) return;
        if (session?.user) {
          try {
            setUser(await api.getCurrentUser());
          } catch (error) {
            console.error('Failed to refresh Supabase user:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  };

  const signInWithPassword = async (email: string, password: string) => {
    const currentUser = await api.login(email, password);
    setUser(currentUser);
  };

  const signUp = async (email: string, password: string) => {
    const currentUser = await api.signup(email, email, password, 'Brother');
    setUser(currentUser);
  };

  const signOut = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, signIn, signInWithPassword, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
