import { useEffect, useRef, useState } from "react";
import TabBar from "./components/TabBar";
import Sheet from "./components/Sheet";
import HomeTab from "./screens/HomeTab";
import MindTab from "./screens/MindTab";
import BodyTab from "./screens/BodyTab";
import SignalTab from "./screens/SignalTab";
import MoreTab from "./screens/MoreTab";
import StoreTab from "./screens/StoreTab";
import HomeDetail from "./screens/HomeDetail";
import ScaleDetail from "./screens/ScaleDetail";
import InfoDoc from "./screens/InfoDoc";
import { C, LEVEL_LAMP, STATUS_LAMP } from "./tokens";
import { SESSIONS, bodySummary, mindSummary } from "./data/sessions";
import { SCALE_META } from "./data/scales";
import { docByKey } from "./data/legal";
import { useT } from "./i18n";

export default function App() {
  const t = useT();
  const [tab, setTab] = useState("home");
  const [sheet, setSheet] = useState(null); // null | 'store' | `doc:<key>`
  const [plan, setPlan] = useState("quarter");
  // The round lives here so switching between mind and body keeps the visit.
  const [sel, setSel] = useState(0);

  // A tab is a place, not a scroll position.
  const scrollerRef = useRef(null);
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [tab, sel]);

  const latest = SESSIONS[0];
  const mind = mindSummary(latest);
  const body = bodySummary(latest);

  const goTab = (next) => {
    setSheet(null);
    setTab(next);
  };

  const openSession = (i) => {
    setSheet(null);
    setSel(i);
    setTab("mind");
  };

  const docKey = sheet?.startsWith("doc:") ? sheet.slice(4) : null;
  const homeView = sheet?.startsWith("home:") ? sheet.slice(5) : null;
  // A mind scale opens over the page rather than unfolding inside it.
  const scaleKey = sheet?.startsWith("scale:") ? sheet.slice(6) : null;
  const scaleMeta = SCALE_META.find((m) => m.key === scaleKey);
  // Each of Home's second-layer views is a sheet with its own title.
  const HOME_TITLES = {
    composition: "home.compositionRow",
    history: "home.historyRow",
  };

  return (
    <div className="stage">
      <div className="phone">
        <div className="screen">
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
                // Clears the floating capsule (62 tall, 12 off the bottom)
                // with room to spare, so the last row is never half-glassed.
                padding:
                  "calc(20px + var(--safe-top)) 18px calc(92px + var(--safe-bottom))",
              }}
            >
              {tab === "home" && (
                <HomeTab
                  key="home"
                  onOpen={(v) => setSheet(`home:${v}`)}
                  onGoStore={() => setSheet("store")}
                />
              )}
              {tab === "mind" && (
                <MindTab
                  key={`mind-${sel}`}
                  sel={sel}
                  onPickSession={setSel}
                  onOpenScale={(k) => setSheet(`scale:${k}`)}
                />
              )}
              {tab === "body" && (
                <BodyTab key={`body-${sel}`} sel={sel} onPickSession={setSel} />
              )}
              {tab === "signal" && (
                <SignalTab
                  key={`signal-${sel}`}
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
              mindDot={mind.warn ? STATUS_LAMP[mind.worst] : null}
              bodyDot={body.flagged.length ? LEVEL_LAMP[body.worst] : null}
              scrollerRef={scrollerRef}
            />
          </div>

          {sheet === "store" && (
            <Sheet
              title={t("store.title")}
              subtitle={t("store.subtitle")}
              onClose={() => setSheet(null)}
            >
              <StoreTab plan={plan} onPickPlan={setPlan} />
            </Sheet>
          )}

          {homeView && (
            <Sheet
              title={t(HOME_TITLES[homeView])}
              onClose={() => setSheet(null)}
            >
              <HomeDetail
                view={homeView}
                roundIndex={latest.roundIndex}
                onOpenSession={openSession}
              />
            </Sheet>
          )}

          {scaleMeta && (
            <Sheet
              title={t(scaleMeta.axisKey)}
              subtitle={t("mind.scales")}
              onClose={() => setSheet(null)}
            >
              <ScaleDetail scaleKey={scaleKey} sel={sel} />
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
