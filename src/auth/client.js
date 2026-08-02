import { createClient } from "@supabase/supabase-js";

/**
 * The Supabase connection.
 *
 * ON THE KEY BEING IN THE SOURCE. The publishable key is not a secret and is
 * not treated as one by Supabase: it identifies the project and carries no
 * privileges of its own. Every request made with it is evaluated against row
 * level security, which is what actually protects the data — `profiles` is
 * readable only by the row's owner, and nothing else is exposed. It also ends
 * up in the built bundle regardless, because this is a static SPA, so hiding
 * it in an env var would buy secrecy that the deployment cannot deliver while
 * costing a broken build the first time someone forgets to set it.
 *
 * The key that IS a secret is `service_role`. It bypasses RLS entirely. It
 * must never appear in this directory, in the bundle, or in the repository —
 * it belongs in a server the client cannot read.
 *
 * Env vars still win if set, so a fork can point at its own project without
 * editing code.
 */
const URL =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://oijcqqrmayufrptskdrv.supabase.co";

const PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_UFevAHfTm_TUEd5Oa7DtMQ_uA4H1v_O";

export const supabase = createClient(URL, PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Providers the sign-in screen offers, and what is true about each right now.
 *
 * `ready` is not decoration. Google and Apple are genuine Supabase providers
 * and the call below is the real one — but a provider that has not been given
 * a client ID in the project dashboard returns an opaque error, and a button
 * that fails with "Unsupported provider" teaches a tester that the app is
 * broken rather than that a step is outstanding. So the state is declared and
 * the screen says which it is.
 *
 * InBody is a different thing altogether and the label reflects it. Its OAuth
 * exists — kroauthserver.lookinbody.com/OAuth/Authorize, scope
 * `InBodyDataAccess` — but it is an approval-gated, paid B2B data API, not a
 * consumer identity provider. You do not sign in to a third-party app "with
 * InBody"; you connect an InBody account so the app can read body composition.
 * Calling it a login would misdescribe both the integration and the contract.
 */
export const PROVIDERS = [
  { id: "google", labelKey: "auth.google", ready: false },
  { id: "apple", labelKey: "auth.apple", ready: false },
  { id: "inbody", labelKey: "auth.inbody", ready: false, kind: "link" },
];

export async function signInWithProvider(id) {
  if (id === "inbody") {
    // Not an identity provider — see PROVIDERS above.
    return { error: { code: "inbody_is_a_data_link" } };
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: id,
    options: { redirectTo: window.location.origin },
  });
  return { error };
}
