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
import ZoneDetail from "./screens/ZoneDetail";
import PredictionDetail from "./screens/PredictionDetail";
import PanelEntry from "./screens/PanelEntry";
import { SYSTEMS } from "./data/body";
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
  // Bumped whenever a plate is entered. The derivation reads mutable series,
  // so React needs telling that numbers it already rendered have moved.
  const [panelVersion, setPanelVersion] = useState(0);
  // The entry screen is unguarded until auth lands; until then it is behind a
  // flag so it cannot be stumbled into.
  const isAdmin =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("admin");
  const [plan, setPlan] = useState("monthly");
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
  // A body system opens the same way a mind scale does.
  const zoneKey = sheet?.startsWith("zone:") ? sheet.slice(5) : null;
  const zone = SYSTEMS.find((z) => z.key === zoneKey);
  // Each of Home's second-layer views is a sheet with its own title.
  // Home no longer owns these; the tabs whose subject they are do.
  const HOME_TITLES = {
    composition: "body.compositionRow",
    history: "more.historyRow",
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
                  key={`home-${panelVersion}`}
                  onGoTab={goTab}
                  onGoStore={() => setSheet("store")}
                  onOpenPrediction={() => setSheet("predict")}
                />
              )}
              {tab === "mind" && (
                <MindTab
                  key={`mind-${sel}-${panelVersion}`}
                  sel={sel}
                  onPickSession={setSel}
                  onOpenScale={(k) => setSheet(`scale:${k}`)}
                />
              )}
              {tab === "body" && (
                <BodyTab
                  key={`body-${sel}-${panelVersion}`}
                  sel={sel}
                  onPickSession={setSel}
                  onOpenComposition={() => setSheet("home:composition")}
                  onOpenZone={(k) => setSheet(`zone:${k}`)}
                />
              )}
              {tab === "signal" && (
                <SignalTab
                  key={`signal-${sel}-${panelVersion}`}
                  sel={sel}
                  onPickSession={setSel}
                />
              )}
              {tab === "more" && (
                <MoreTab
                  key="more"
                  onOpenDoc={(k) => setSheet(`doc:${k}`)}
                  onGoStore={() => setSheet("store")}
                  onOpenHistory={() => setSheet("home:history")}
                  isAdmin={isAdmin}
                  onOpenPanel={() => setSheet("panel")}
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

          {zone && (
            <Sheet
              title={t(zone.nameKey)}
              subtitle={t("body.systems")}
              onClose={() => setSheet(null)}
            >
              <ZoneDetail zoneKey={zoneKey} sel={sel} />
            </Sheet>
          )}

          {sheet === "predict" && (
            <Sheet
              title={t("predict.title")}
              subtitle={t("predict.subtitle")}
              onClose={() => setSheet(null)}
            >
              <PredictionDetail sel={sel} />
            </Sheet>
          )}

          {sheet === "panel" && (
            <Sheet
              title={t("panel.title")}
              subtitle={t("panel.subtitle")}
              onClose={() => setSheet(null)}
            >
              <PanelEntry
                sel={sel}
                onChanged={() => setPanelVersion((v) => v + 1)}
              />
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
