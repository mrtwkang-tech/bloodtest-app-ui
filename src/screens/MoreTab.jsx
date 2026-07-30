import { useState } from "react";
import Pressable from "../components/Pressable";
import { Caret, Card, SectionTitle } from "../components/primitives";
import { C, DIVIDER, DIVIDER_TOP, R, T, fadeUp } from "../tokens";
import {
  APP_BUILD,
  APP_VERSION,
  COMPANY,
  DOCS,
  MEDICAL_NOTICE,
} from "../data/legal";
import { PLANS, PROFILE, pick } from "../data/sessions";
import { LANGS, DICTS } from "../i18n/dict";
import { SESSIONS } from "../data/sessions";
import { useLang } from "../i18n";
import {
  ACCENTS,
  ACCENT_KEYS,
  applyAccent,
  storedAccent,
} from "../theme/accents";

const LEGAL_ORDER = [
  "terms",
  "privacy",
  "sensitive",
  "refund",
  "sample",
  "opensource",
];

export default function MoreTab({ onOpenDoc, onGoStore, onOpenHistory }) {
  const { t, lang, setLang } = useLang();
  const [accent, setAccent] = useState(storedAccent);
  // The notice is written per jurisdiction, not translated.
  const notice = MEDICAL_NOTICE[lang] ?? MEDICAL_NOTICE.en;

  return (
    <div>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          margin: "4px 0 18px",
          ...fadeUp(0),
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: C.chipIdle,
            color: C.body,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...T.title3,
            flex: "none",
          }}
        >
          {PROFILE.initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...T.title3, color: C.ink }}>
            {pick(PROFILE.fullName, lang)}
          </div>
          <div style={{ ...T.micro, color: C.faint, marginTop: 2 }}>
            {PROFILE.age} · D-{PROFILE.nextInDays} · ₩
            {PLANS.quarter.price.toLocaleString()}
          </div>
        </div>
        {/* Language: a visible two-state control, not a buried setting. */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: C.surfaceSunken,
            borderRadius: 999,
            padding: 3,
          }}
        >
          {LANGS.map((code) => (
            <Pressable
              key={code}
              as="button"
              type="button"
              aria-pressed={lang === code}
              onClick={() => setLang(code)}
              pressScale={0.93}
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: 999,
                padding: "6px 11px",
                ...T.micro,
                background: lang === code ? C.surface : "transparent",
                color: lang === code ? C.ink : C.faint,
                boxShadow:
                  lang === code ? "0 1px 3px rgba(11,11,12,.12)" : "none",
              }}
            >
              {DICTS[code].langShort}
            </Pressable>
          ))}
        </div>
      </header>

      {/* The medical disclaimer is a standing notice, not buried in a doc. */}
      <Card variant="group" pad="lg" style={{ background: C.night }} delay={20}>
        <div style={{ ...T.micro, color: "rgba(255,255,255,.55)" }}>
          {notice.title}
        </div>
        <p
          style={{
            ...T.caption,
            color: "rgba(255,255,255,.78)",
            margin: "7px 0 0",
            lineHeight: 1.7,
            textWrap: "pretty",
          }}
        >
          {notice.body}
        </p>
        <p
          style={{
            ...T.micro,
            color: "#F2CF8C",
            margin: "10px 0 0",
            paddingTop: 10,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.12)",
            lineHeight: 1.6,
            textWrap: "pretty",
          }}
        >
          {notice.crisis}
        </p>
        <p
          style={{
            ...T.micro,
            color: "rgba(255,255,255,.5)",
            margin: "9px 0 0",
            lineHeight: 1.65,
            textWrap: "pretty",
          }}
        >
          {notice.privacy}
        </p>
      </Card>

      <SectionTitle>{t("more.account")}</SectionTitle>
      <Card variant="group" style={{ overflow: "hidden", padding: 0 }} delay={40}>
        <MenuRow label={t("more.subscription")} value={t("store.quarter")} />
        <MenuRow label={t("more.address")} />
        <MenuRow label={t("more.notifications")} value={t("more.on")} />
        <MenuRow
          label={t("more.historyRow")}
          value={String(SESSIONS.length)}
          onClick={onOpenHistory}
        />
        <MenuRow label={t("more.export")} />
        <MenuRow label={t("store.title")} onClick={onGoStore} last />
      </Card>

      {/* Accent picker. The rationale for each option is written out in
          theme/accents.js; this is the tweak surface for it. */}
      <SectionTitle>{t("accent.title")}</SectionTitle>
      <Card pad="sm" delay={60}>
        <div style={{ display: "flex", gap: 10 }}>
          {ACCENT_KEYS.map((key) => {
            const a = ACCENTS[key];
            const on = accent === key;
            return (
              <Pressable
                key={key}
                as="button"
                type="button"
                aria-pressed={on}
                onClick={() => setAccent(applyAccent(key))}
                pressScale={0.95}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "10px 8px 9px",
                  borderRadius: R.inner,
                  border: "none",
                  cursor: "pointer",
                  background: on ? C.surfaceSunken : "transparent",
                  boxShadow: on ? "none" : `inset 0 0 0 1px ${C.hairline}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: a.base,
                    boxShadow: on ? `0 0 0 3px ${a.soft}` : "none",
                  }}
                />
                <span
                  style={{ ...T.micro, color: on ? C.ink : C.faint }}
                >
                  {t(a.nameKey)}
                </span>
              </Pressable>
            );
          })}
        </div>
        <div style={{ ...T.micro, color: C.faintest, marginTop: 11 }}>
          {ACCENTS[accent].contrast}
        </div>
      </Card>

      <SectionTitle>{t("more.legal")}</SectionTitle>
      <Card variant="group" style={{ overflow: "hidden", padding: 0 }} delay={80}>
        {LEGAL_ORDER.map((key, i) => {
          const doc = DOCS.find((d) => d.key === key);
          return (
            <MenuRow
              key={key}
              label={doc.title}
              onClick={() => onOpenDoc(key)}
              last={i === LEGAL_ORDER.length - 1}
            />
          );
        })}
      </Card>

      <SectionTitle>{t("more.support")}</SectionTitle>
      <Card variant="group" style={{ overflow: "hidden", padding: 0 }} delay={120}>
        <MenuRow label={t("more.email")} value={COMPANY.supportEmail} />
        <MenuRow label={t("more.phone")} value={COMPANY.supportPhone} />
        <MenuRow label={t("more.hours")} value={t("more.hoursValue")} last />
      </Card>

      {/* Business registration block — the 통신판매업 disclosure. */}
      <Card pad="md" style={{ marginTop: 12 }} delay={160}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...T.label, color: C.ink }}>{t("more.business")}</span>
        </div>
        <dl
          style={{
            margin: "12px 0 0",
            display: "flex",
            flexDirection: "column",
            gap: 7,
          }}
        >
          <InfoRow k={t("biz.name")} v={pick(COMPANY.name, lang)} />
          <InfoRow k={t("biz.ceo")} v={pick(COMPANY.ceo, lang)} />
          <InfoRow k={t("biz.address")} v={pick(COMPANY.address, lang)} />
          <InfoRow k={t("biz.bizNo")} v={COMPANY.bizNo} />
          <InfoRow k={t("biz.mailOrder")} v={pick(COMPANY.mailOrderNo, lang)} />
          <InfoRow
            k={t("biz.privacyOfficer")}
            v={pick(COMPANY.privacyOfficer, lang)}
          />
          <InfoRow k={t("biz.privacyEmail")} v={COMPANY.privacyEmail} />
        </dl>
        <div
          style={{
            ...T.micro,
            color: C.faintest,
            marginTop: 12,
            paddingTop: 10,
            boxShadow: DIVIDER_TOP,
            lineHeight: 1.7,
            textWrap: "pretty",
          }}
        >
          {t("more.notMiddleman")}
        </div>
      </Card>

      <div style={{ textAlign: "center", marginTop: 22, ...fadeUp(200) }}>
        <div style={{ ...T.micro, color: C.faintest }}>
          {t("more.version", { v: APP_VERSION, b: APP_BUILD })}
        </div>
        <Pressable
          as="button"
          type="button"
          pressScale={0.95}
          style={{
            ...T.caption,
            color: C.faint,
            margin: "12px auto 0",
            display: "block",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: "6px 12px",
          }}
        >
          {t("more.signOut")}
        </Pressable>
        <Pressable
          as="button"
          type="button"
          pressScale={0.95}
          style={{
            ...T.micro,
            color: C.disabled,
            margin: "2px auto 0",
            display: "block",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: "6px 12px",
            textDecoration: "underline",
          }}
        >
          {t("more.deleteAccount")}
        </Pressable>
      </div>
    </div>
  );
}

function MenuRow({ label, value, last, onClick }) {
  return (
    <Pressable
      as="button"
      type="button"
      onClick={onClick}
      pressScale={0.99}
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        padding: "14px 17px",
        boxShadow: last ? "none" : DIVIDER,
        cursor: "pointer",
        background: "transparent",
        border: "none",
        textAlign: "left",
      }}
      hoverStyle={{ background: C.surfaceHover }}
    >
      <span style={{ flex: 1, ...T.label, color: C.ink }}>{label}</span>
      {value && (
        <span style={{ ...T.micro, color: C.faint, marginRight: 8 }}>
          {value}
        </span>
      )}
      <Caret />
    </Pressable>
  );
}

function InfoRow({ k, v }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
      <dt style={{ ...T.micro, color: C.faint, width: 110, flex: "none" }}>
        {k}
      </dt>
      <dd
        style={{
          ...T.micro,
          color: C.body,
          margin: 0,
          flex: 1,
          textWrap: "pretty",
        }}
      >
        {v}
      </dd>
    </div>
  );
}
