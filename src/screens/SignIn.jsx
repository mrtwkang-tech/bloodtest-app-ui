import { useState } from "react";
import Pressable from "../components/Pressable";
import Wordmark from "../components/Wordmark";
import { ProviderMark } from "../components/ProviderMark";
import { C, DIVIDER_TOP, R, T, backlight, fadeUp } from "../tokens";
import { PROVIDERS, signInWithProvider } from "../auth/client";
import { useAuth } from "../auth/AuthProvider";
import { useT } from "../i18n";

/**
 * The door.
 *
 * Email and password are real: they create a Supabase account with a profile
 * row behind row level security. The provider buttons are the real calls too —
 * `signInWithOAuth` with the provider id — but Google and Apple each need a
 * client ID configured in the project before they can succeed, so until that
 * happens the button says so instead of failing with a stack trace. A tester
 * should learn "a step is outstanding", not "this is broken".
 *
 * InBody sits under a different heading for a reason given in auth/client.js:
 * it is a data connection, not an identity provider, and calling it a login
 * would misdescribe the integration.
 */
export default function SignIn() {
  const t = useT();
  const { signUp, signIn, signInAdmin } = useAuth();
  const [mode, setMode] = useState("in"); // 'in' | 'up' | 'admin'
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [adminId, setAdminId] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === "admin") {
      if (!signInAdmin(adminId, adminKey)) setError(t("auth.adminWrong"));
      return;
    }

    setBusy(true);
    const { error: err } =
      mode === "up"
        ? await signUp(email, password, name)
        : await signIn(email, password);
    setBusy(false);

    if (err) {
      setError(err.message);
      return;
    }
    if (mode === "up") setNotice(t("auth.checkMail"));
  };

  const provider = async (id) => {
    setError(null);
    const p = PROVIDERS.find((x) => x.id === id);
    if (!p.ready) {
      setError(t(p.kind === "link" ? "auth.inbodyNote" : "auth.providerTodo"));
      return;
    }
    const { error: err } = await signInWithProvider(id);
    if (err) setError(err.message ?? String(err.code));
  };

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 4px",
      }}
    >
      <div style={fadeUp(0)}>
        <Wordmark size={26} />
        <p
          style={{
            ...T.bodyText,
            color: C.faint,
            margin: "14px 0 0",
            textWrap: "pretty",
          }}
        >
          {t("auth.tagline")}
        </p>
      </div>

      <form onSubmit={submit} style={{ marginTop: 26, ...fadeUp(40) }}>
        {mode === "admin" ? (
          <>
            <Input
              label={t("auth.adminId")}
              value={adminId}
              onChange={setAdminId}
              autoComplete="username"
            />
            <Input
              label={t("auth.adminKey")}
              value={adminKey}
              onChange={setAdminKey}
              type="password"
              autoComplete="current-password"
            />
          </>
        ) : (
          <>
            {mode === "up" && (
              <Input
                label={t("auth.name")}
                value={name}
                onChange={setName}
                autoComplete="name"
              />
            )}
            <Input
              label={t("auth.email")}
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="email"
            />
            <Input
              label={t("auth.password")}
              value={password}
              onChange={setPassword}
              type="password"
              autoComplete={mode === "up" ? "new-password" : "current-password"}
            />
          </>
        )}

        {error && (
          <div
            style={{
              ...T.caption,
              color: C.alert,
              marginTop: 10,
              textWrap: "pretty",
            }}
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            style={{
              ...T.caption,
              color: C.optimal,
              marginTop: 10,
              textWrap: "pretty",
            }}
          >
            {notice}
          </div>
        )}

        <Pressable
          as="button"
          type="submit"
          disabled={busy}
          pressScale={0.98}
          style={{
            width: "100%",
            marginTop: 16,
            padding: "14px 15px",
            borderRadius: R.card,
            border: "none",
            cursor: busy ? "default" : "pointer",
            background: C.accent,
            boxShadow: backlight(C.accent),
            color: C.onAccent,
            ...T.title3,
          }}
        >
          {busy
            ? t("auth.working")
            : t(
                mode === "admin"
                  ? "auth.adminEnter"
                  : mode === "up"
                    ? "auth.createAccount"
                    : "auth.signIn",
              )}
        </Pressable>
      </form>

      {mode !== "admin" && (
        <>
          <div
            style={{
              ...T.caption,
              color: C.faintest,
              textAlign: "center",
              margin: "22px 0 12px",
              ...fadeUp(80),
            }}
          >
            {t("auth.or")}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              ...fadeUp(100),
            }}
          >
            {PROVIDERS.filter((p) => p.kind !== "link").map((p) => (
              <ProviderButton
                key={p.id}
                id={p.id}
                label={t(p.labelKey)}
                ready={p.ready}
                onClick={() => provider(p.id)}
                t={t}
              />
            ))}
          </div>

          {/* Separated on purpose: connecting a data account is not signing in. */}
          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              boxShadow: DIVIDER_TOP,
              ...fadeUp(120),
            }}
          >
            <div style={{ ...T.caption, color: C.faint, marginBottom: 8 }}>
              {t("auth.connectData")}
            </div>
            {PROVIDERS.filter((p) => p.kind === "link").map((p) => (
              <ProviderButton
                key={p.id}
                id={p.id}
                label={t(p.labelKey)}
                ready={p.ready}
                onClick={() => provider(p.id)}
                t={t}
              />
            ))}
          </div>
        </>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 14,
          marginTop: 22,
          ...fadeUp(140),
        }}
      >
        <Link
          onClick={() => {
            setMode(mode === "up" ? "in" : "up");
            setError(null);
            setNotice(null);
          }}
        >
          {t(mode === "up" ? "auth.haveAccount" : "auth.noAccount")}
        </Link>
        <Link
          onClick={() => {
            setMode(mode === "admin" ? "in" : "admin");
            setError(null);
          }}
        >
          {t(mode === "admin" ? "auth.backToUser" : "auth.adminEntry")}
        </Link>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", autoComplete }) {
  return (
    <label style={{ display: "block", marginBottom: 10 }}>
      <span
        style={{
          ...T.caption,
          color: C.faint,
          display: "block",
          marginBottom: 5,
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          ...T.bodyText,
          color: C.ink,
          background: C.surface,
          border: "none",
          borderRadius: R.control,
          padding: "12px 13px",
          outline: "none",
          boxShadow: `inset 0 0 0 1px ${C.hairline}`,
        }}
      />
    </label>
  );
}

function ProviderButton({ id, label, ready, onClick, t }) {
  return (
    <Pressable
      as="button"
      type="button"
      onClick={onClick}
      pressScale={0.985}
      hoverStyle={{ background: C.surfaceHover }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "12px 14px",
        borderRadius: R.control,
        border: "none",
        cursor: "pointer",
        background: C.surfaceRaised,
        boxShadow: `inset 0 0 0 1px ${C.hairlineStrong}`,
        textAlign: "left",
      }}
    >
      <ProviderMark id={id} size={18} />
      <span style={{ ...T.label, color: C.ink, flex: 1 }}>{label}</span>
      {!ready && (
        <span style={{ ...T.micro, color: C.faintest }}>
          {t("auth.notConfigured")}
        </span>
      )}
    </Pressable>
  );
}

function Link({ children, onClick }) {
  return (
    <Pressable
      as="button"
      type="button"
      onClick={onClick}
      pressScale={0.96}
      style={{
        ...T.caption,
        color: C.faint,
        background: "none",
        border: "none",
        padding: 4,
        cursor: "pointer",
        textDecoration: "underline",
        textUnderlineOffset: 3,
      }}
    >
      {children}
    </Pressable>
  );
}
