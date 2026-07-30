import Pressable from "../components/Pressable";
import { Card, Badge, SectionTitle } from "../components/primitives";
import { C, DIVIDER, DIVIDER_TOP, T, fadeUp } from "../tokens";
import {
  APP_BUILD,
  APP_VERSION,
  COMPANY,
  DOCS,
  MEDICAL_NOTICE,
} from "../data/legal";
import { PLANS, PROFILE, pick } from "../data/sessions";
import { LANGS, DICTS } from "../i18n/dict";
import { useLang } from "../i18n";

const LEGAL_ORDER = [
  "terms",
  "privacy",
  "sensitive",
  "refund",
  "sample",
  "opensource",
];

export default function MoreTab({ onOpenDoc, onGoStore }) {
  const { t, lang, setLang } = useLang();

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
      <Card style={{ padding: "16px 18px", background: C.night }} delay={20}>
        <div style={{ ...T.micro, color: "rgba(255,255,255,.55)" }}>
          {t("more.medicalTitle")}
        </div>
        <p
          style={{
            ...T.monoSm,
            color: "rgba(255,255,255,.78)",
            margin: "7px 0 0",
            lineHeight: 1.7,
            textWrap: "pretty",
          }}
        >
          {MEDICAL_NOTICE.body}
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
          {MEDICAL_NOTICE.crisis}
        </p>
      </Card>

      <SectionTitle>{t("more.account")}</SectionTitle>
      <Card style={{ overflow: "hidden" }} delay={40}>
        <MenuRow label={t("more.subscription")} value={t("store.quarter")} />
        <MenuRow label={t("more.address")} />
        <MenuRow label={t("more.notifications")} value={t("more.on")} />
        <MenuRow label={t("more.export")} />
        <MenuRow label={t("store.title")} onClick={onGoStore} last />
      </Card>

      <SectionTitle>{t("more.legal")}</SectionTitle>
      <Card style={{ overflow: "hidden" }} delay={80}>
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
      <Card style={{ overflow: "hidden" }} delay={120}>
        <MenuRow label={t("more.email")} value={COMPANY.supportEmail} />
        <MenuRow label={t("more.phone")} value={COMPANY.supportPhone} />
        <MenuRow label={t("more.hours")} value={t("more.hoursValue")} last />
      </Card>

      {/* Business registration block — the 통신판매업 disclosure. */}
      <Card style={{ padding: "16px 18px", marginTop: 22 }} delay={160}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...T.label, color: C.ink }}>
            {t("more.business")}
          </span>
          {COMPANY.placeholder && (
            <Badge color={C.watch} tint={C.watchTint}>
              {t("more.needsReview")}
            </Badge>
          )}
        </div>
        {COMPANY.placeholder && (
          <p
            style={{
              ...T.micro,
              color: C.watch,
              margin: "8px 0 0",
              lineHeight: 1.6,
              textWrap: "pretty",
            }}
          >
            {t("more.businessWarning")}
          </p>
        )}
        <dl
          style={{
            margin: "12px 0 0",
            display: "flex",
            flexDirection: "column",
            gap: 7,
          }}
        >
          <InfoRow k={t("biz.name")} v={COMPANY.name} />
          <InfoRow k={t("biz.ceo")} v={COMPANY.ceo} />
          <InfoRow k={t("biz.address")} v={COMPANY.address} />
          <InfoRow k={t("biz.bizNo")} v={COMPANY.bizNo} />
          <InfoRow k={t("biz.mailOrder")} v={COMPANY.mailOrderNo} />
          <InfoRow k={t("biz.privacyOfficer")} v={COMPANY.privacyOfficer} />
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
            ...T.monoSm,
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
      <span style={{ fontSize: 15, color: C.faintest }}>›</span>
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
