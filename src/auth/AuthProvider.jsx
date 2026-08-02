import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./client";

/**
 * Who is signed in, and whether they are the operator.
 *
 * TWO KINDS OF ACCOUNT, deliberately not the same mechanism.
 *
 * A user is a real Supabase account: email and password, or an OAuth provider,
 * with a session that survives a reload and a `profiles` row protected by row
 * level security.
 *
 * The ADMIN is a local gate — `pedia` / `0000` — and is not a Supabase user at
 * all. Two reasons, and the first is decisive:
 *
 *   1. Supabase enforces a minimum password length. A four-character password
 *      cannot be created there, so "pedia 0000" could not have been that
 *      account even if we wanted it to be.
 *   2. This repository is public. A credential committed to it is a credential
 *      everyone has. That is harmless while it opens nothing but a fixture,
 *      and unacceptable the moment it opens a backend holding anyone's blood
 *      results.
 *
 * So the demo operator key stays a client-side door onto the sample data, and
 * the real one, when it is wanted, is a Supabase account with `is_admin` set
 * by an operator holding the service role. The two never share a code path,
 * which is the only way the first can never grow into the second by accident.
 */

const ADMIN_ID = "pedia";
const ADMIN_KEY = "0000";
const ADMIN_FLAG = "pedia.admin.demo";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  // Resolved once the first session check returns. Rendering the sign-in
  // screen before then would flash it at someone who is already signed in.
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(
    () => localStorage.getItem(ADMIN_FLAG) === "1",
  );

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
      setReady(true);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // The profile row, which is also where a real admin flag would come from.
  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    let alive = true;
    supabase
      .from("profiles")
      .select("id, email, display_name, is_admin")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setProfile(data ?? null);
      });
    return () => {
      alive = false;
    };
  }, [session]);

  const value = useMemo(
    () => ({
      ready,
      session,
      profile,
      user: session?.user ?? null,
      // Either the demo door or a real flag on the profile row.
      isAdmin: isAdmin || profile?.is_admin === true,
      isDemoAdmin: isAdmin,

      async signUp(email, password, name) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        return { error };
      },

      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error };
      },

      /** The operator door. Returns false rather than throwing on a wrong key. */
      signInAdmin(id, key) {
        if (id.trim().toLowerCase() !== ADMIN_ID || key !== ADMIN_KEY) {
          return false;
        }
        localStorage.setItem(ADMIN_FLAG, "1");
        setIsAdmin(true);
        return true;
      },

      async signOut() {
        localStorage.removeItem(ADMIN_FLAG);
        setIsAdmin(false);
        await supabase.auth.signOut();
      },
    }),
    [ready, session, profile, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
