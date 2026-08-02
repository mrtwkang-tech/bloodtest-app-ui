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
import PredictionDetail from "./screens/PredictionDetail";
import PanelEntry from "./screens/PanelEntry";
import SignIn from "./screens/SignIn";
import { useAuth } from "./auth/AuthProvider";
import { SYSTEMS } from "./data/body";
import InfoDoc from "./screens/InfoDoc";
import { C, LEVEL_LAMP, STATUS_LAMP } from "./tokens";
import { SESSIONS, bodySummary, mindSummary } from "./data/sessions";
import { docByKey } from "./data/legal";
import { useT } from "./i18n";

export default function App() {
  const t = useT();
  const [tab, setTab] = useState("home");
  const [sheet, setSheet] = useState(null); // null | 'store' | `doc:<key>`
  // Bumped whenever a plate is entered. The derivation reads mutable series,
  // so React needs telling that numbers it already rendered have moved.
  const [panelVersion, setPanelVersion] = useState(0);
  // The operator door, now a real gate rather than a URL flag.
  const { ready: authReady, user, isAdmin, signOut } = useAuth();
  const [plan, setPlan] = useState("monthly");
  // The round lives here so switching between mind and body keeps the visit.
  const [sel, setSel] = useState(0);

  // A tab is a place, not a scroll position.
  const scrollerRef = useRef(null);

  // Scroll → `--foil-shift`, which offsets the gold sweep's phase.
  //
  // This is the difference between an animation playing and a surface catching
  // the light. A sticker does not shimmer on its own; it shimmers because YOU
  // moved. One rAF-throttled handler writing one custom property gets that for
  // free, and React never re-renders for it.
  useEffect(() => {
    let raf = 0;
    const write = () => {
      raf = 0;
      const top = scrollerRef.current?.scrollTop ?? 0;
      document.documentElement.style.setProperty(
        "--foil-shift",
        (top * 0.006).toFixed(3),
      );
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(write);
    };
    // Capture on window rather than a listener bound to the scroller. Scroll
    // does not bubble, but it does capture, so this catches whichever element
    // actually moved — the page, a sheet, or the scroller — without depending
    // on a ref being populated at the moment the effect first runs.
    window.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    write();
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
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
  // A mind scale used to open over the page in a sheet. It opens inside its
  // own row now, for the reason the body systems do: there is a picture above
  // the list and a sheet would cover it. See MindTab.
  // Each of Home's second-layer views is a sheet with its own title.
  // Home no longer owns these; the tabs whose subject they are do.
  const HOME_TITLES = {
    composition: "body.compositionRow",
    history: "more.historyRow",
  };

  // Nobody is admitted, and nothing is refused, until the first session check
  // returns — flashing the sign-in screen at someone who is already signed in
  // is worse than a beat of nothing.
  const signedIn = Boolean(user) || isAdmin;
  if (!authReady || !signedIn) {
    return (
      <div className="stage">
        <div className="phone">
          <div className="screen">
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: C.bg,
                overflowY: "auto",
                padding:
                  "calc(28px + var(--safe-top)) 22px calc(28px + var(--safe-bottom))",
              }}
            >
              {authReady && <SignIn />}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                />
              )}
              {tab === "body" && (
                <BodyTab
                  key={`body-${sel}-${panelVersion}`}
                  sel={sel}
                  onPickSession={setSel}
                  onOpenComposition={() => setSheet("home:composition")}
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
                  onSignOut={signOut}
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
