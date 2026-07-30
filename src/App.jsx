import { useEffect, useRef, useState } from "react";
import TabBar from "./components/TabBar";
import Sheet from "./components/Sheet";
import HomeTab from "./screens/HomeTab";
import MindTab from "./screens/MindTab";
import BodyTab from "./screens/BodyTab";
import MoreTab from "./screens/MoreTab";
import StoreTab from "./screens/StoreTab";
import InfoDoc from "./screens/InfoDoc";
import ScanFlow from "./screens/ScanFlow";
import AnalyzingFlow from "./screens/AnalyzingFlow";
import { C, LEVEL_LAMP, STATUS_LAMP } from "./tokens";
import { SESSIONS, bodySummary, mindSummary } from "./data/sessions";
import { docByKey } from "./data/legal";
import { useT } from "./i18n";

/** How long the simulated lab analysis runs before the report lands. */
const ANALYSIS_MS = 10000;

export default function App() {
  const t = useT();
  const [tab, setTab] = useState("home");
  const [flow, setFlow] = useState(null); // null | 'scan' | 'analyzing'
  const [sheet, setSheet] = useState(null); // null | 'store' | `doc:<key>`
  const [plan, setPlan] = useState("quarter");
  // The round lives here so switching between mind and body keeps the visit.
  const [sel, setSel] = useState(0);
  const [showNew, setShowNew] = useState(false);

  // A tab is a place, not a scroll position.
  const scrollerRef = useRef(null);
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [tab, sel]);

  // Analysis finishes on its own and drops the user into the new report.
  useEffect(() => {
    if (flow !== "analyzing") return undefined;
    const id = setTimeout(() => {
      setFlow(null);
      setTab("mind");
      setSel(0);
      setShowNew(true);
    }, ANALYSIS_MS);
    return () => clearTimeout(id);
  }, [flow]);

  const latest = SESSIONS[0];
  const mind = mindSummary(latest);
  const body = bodySummary(latest);

  const goTab = (next) => {
    setFlow(null);
    setSheet(null);
    setTab(next);
  };

  const openSession = (i) => {
    setFlow(null);
    setSheet(null);
    setSel(i);
    setTab("mind");
  };

  const docKey = sheet?.startsWith("doc:") ? sheet.slice(4) : null;

  return (
    <div className="stage">
      <div className="phone">
        <div className="screen">
          {flow === "scan" && (
            <ScanFlow
              onClose={() => goTab("home")}
              onRecognized={() => setFlow("analyzing")}
            />
          )}
          {flow === "analyzing" && (
            <AnalyzingFlow onBackground={() => goTab("home")} />
          )}

          {!flow && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                background: C.bg,
              }}
            >
              {/* Keying on the tab replays the staggered card entrance.
                  Bottom padding clears the floating glass bar — content keeps
                  scrolling underneath it, which is what the material blurs. */}
              <main
                ref={scrollerRef}
                className="scroller scroll-mask"
                style={{
                  padding:
                    "calc(20px + var(--safe-top)) 18px calc(122px + var(--safe-bottom))",
                }}
              >
                {tab === "home" && (
                  <HomeTab
                    key="home"
                    onOpenSession={openSession}
                    onGoTab={goTab}
                    onGoStore={() => setSheet("store")}
                  />
                )}
                {tab === "mind" && (
                  <MindTab
                    key={`mind-${sel}`}
                    sel={sel}
                    onPickSession={setSel}
                    showNew={showNew && sel === 0}
                  />
                )}
                {tab === "body" && (
                  <BodyTab
                    key={`body-${sel}`}
                    sel={sel}
                    onPickSession={setSel}
                  />
                )}
                {tab === "more" && (
                  <MoreTab
                    key="more"
                    onOpenDoc={(k) => setSheet(`doc:${k}`)}
                    onGoStore={() => setSheet("store")}
                  />
                )}
              </main>

              <TabBar
                tab={tab}
                onSelect={goTab}
                onScan={() => setFlow("scan")}
                mindDot={mind.warn ? STATUS_LAMP[mind.worst] : null}
                bodyDot={body.flagged.length ? LEVEL_LAMP[body.worst] : null}
                scrollerRef={scrollerRef}
              />
            </div>
          )}

          {sheet === "store" && (
            <Sheet
              title={t("store.title")}
              subtitle={t("store.subtitle")}
              onClose={() => setSheet(null)}
            >
              <StoreTab plan={plan} onPickPlan={setPlan} />
            </Sheet>
          )}

          {docKey && (
            <InfoDoc doc={docByKey(docKey)} onClose={() => setSheet(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
