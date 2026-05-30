// =============================================================
// King's Running AI Analytics — Supabase Auth Hook
// Replaces Manus OAuth useAuth.ts with Supabase Auth
// =============================================================
import { useCallback, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export function useSupabaseAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState(s => ({ ...s, loading: false, error: error.message }));
        return;
      }
      setState({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
        error: null,
        isAuthenticated: !!session?.user,
      });
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          user: session?.user ?? null,
          session: session ?? null,
          loading: false,
          error: null,
          isAuthenticated: !!session?.user,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refresh = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      setState(s => ({ ...s, error: error.message }));
      return;
    }
    setState({
      user: session?.user ?? null,
      session: session ?? null,
      loading: false,
      error: null,
      isAuthenticated: !!session?.user,
    });
  }, []);

  return {
    ...state,
    logout,
    refresh,
  };
}
