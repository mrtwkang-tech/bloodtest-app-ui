import InBodyPanel from "../components/InBodyPanel";
import { Card, DataRow } from "../components/primitives";
import { C } from "../tokens";
import {
  SESSIONS,
  bodySummary,
  healthScore,
  mindSummary,
  pick,
} from "../data/sessions";
import { useLang } from "../i18n";

/**
 * The second layer of Home.
 *
 * What is left after the cross-panel material moved to its own tab: the body
 * composition panel in full, and the archive of previous rounds. Both are
 * reference rather than reading — you go looking for them.
 */
export default function HomeDetail({ view, roundIndex, onOpenSession }) {
  const { t, lang } = useLang();

  if (view === "composition") {
    return <InBodyPanel roundIndex={roundIndex} show="panel" />;
  }

  if (view === "history") {
    return (
      <Card variant="group" style={{ overflow: "hidden", padding: 0 }}>
        {SESSIONS.map((s, i) => {
          const m = mindSummary(s);
          const b = bodySummary(s);
          const flagged = m.warn + b.flagged.length;
          return (
            <DataRow
              key={s.round}
              rank={SESSIONS.length - i}
              name={t("home.roundTest", {
                round: t("round.n", { n: s.round }),
              })}
              sub={pick(s.fullDate, lang)}
              value={healthScore(s)}
              color={flagged ? C.watchLamp : C.optimalLamp}
              last={i === SESSIONS.length - 1}
              onClick={() => onOpenSession(i)}
            />
          );
        })}
      </Card>
    );
  }

  return null;
}
