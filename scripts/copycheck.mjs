#!/usr/bin/env node
/**
 * The checks that can be made without rendering.
 *
 * The defect this pass fixed was invisible to every tool the repo had: each
 * string was fine, each was defended by a comment, and the damage was only
 * countable across a whole scroll surface. Most of that still needs a browser
 * — the prose-per-surface count is measured by driving the app. What CAN be
 * checked statically is checked here, because these four failures are how the
 * duplication got in.
 *
 *   node scripts/copycheck.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath, not `.pathname` — this repo lives under a Korean directory
// name and `.pathname` hands back the percent-encoded form.
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, "src");

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".js") || p.endsWith(".jsx") ? [p] : [];
  });

const files = walk(SRC).filter((f) => !f.endsWith("i18n/dict.js"));
const code = files.map((f) => readFileSync(f, "utf8")).join("\n");

const dict = readFileSync(join(SRC, "i18n/dict.js"), "utf8");
const enAt = dict.indexOf("export const en = {");
const koAt = dict.indexOf("export const ko = {");
if (enAt < 0 || koAt < 0) {
  console.error("could not find the two locale objects — the parser is stale");
  process.exit(2);
}
const en = dict.slice(enAt, koAt);
const ko = dict.slice(koAt);
const entries = (t) => [...t.matchAll(/^ {2}"([^"]+)":\s*(.*)$/gm)].map((m) => [m[1], m[2]]);
const EN = entries(en);
const KO = entries(ko);

let fails = 0;
const fail = (msg, detail) => {
  fails++;
  console.log(`✗ ${msg}`);
  if (detail?.length) detail.slice(0, 12).forEach((d) => console.log(`    ${d}`));
  if (detail?.length > 12) console.log(`    …and ${detail.length - 12} more`);
};
const pass = (msg) => console.log(`✓ ${msg}`);

// 1. ko/en symmetry. A missing ko key does not error — i18n falls back to the
//    English value — so a deleted Korean crisis line would silently serve an
//    English one and drop the Korean number.
const enKeys = new Set(EN.map(([k]) => k));
const koKeys = new Set(KO.map(([k]) => k));
const onlyEn = [...enKeys].filter((k) => !koKeys.has(k));
const onlyKo = [...koKeys].filter((k) => !enKeys.has(k));
if (onlyEn.length || onlyKo.length) {
  fail("locales are not symmetric", [...onlyEn.map((k) => `en only: ${k}`), ...onlyKo.map((k) => `ko only: ${k}`)]);
} else pass(`locales symmetric (${enKeys.size} keys)`);
// A check that passes because it parsed nothing is worse than no check.
if (enKeys.size < 100) {
  console.error(`\nonly ${enKeys.size} keys parsed — the entry regex is stale`);
  process.exit(2);
}

// 2. Dead keys. Ten percent of the dictionary was unreachable, including the
//    one string that fully explained the 0/50/100 scale while three live
//    strings each explained a third of it.
const dead = [...enKeys].filter((k) => {
  if (code.includes(`"${k}"`) || code.includes(`'${k}'`) || code.includes(`\`${k}\``)) return false;
  // Keys reached by template, e.g. t(`mind.view.${v}`) or t(`status.${s}`).
  const prefix = k.slice(0, k.lastIndexOf(".") + 1);
  return prefix ? !code.includes(`${prefix}$\{`) : true;
});
// Reported, not enforced. 76 is a backlog, not a regression, and a check that
// fails on every run stops being read. Fail this one when the count RISES.
if (dead.length) console.log(`· ${dead.length} dictionary keys unreachable from src/ (backlog, not enforced)`);
else pass("no dead keys");

// 3. Two different keys with the identical Korean string. Every instance found
//    was one fact wearing two names, and both rendered.
const byValue = new Map();
for (const [k, v] of KO) {
  const s = v.trim();
  if (!s.startsWith('"') || s.length < 14) continue;
  (byValue.get(s) ?? byValue.set(s, []).get(s)).push(k);
}
const dupes = [...byValue.entries()].filter(([, ks]) => ks.length > 1);
if (dupes.length) fail(`${dupes.length} Korean strings used by more than one key`, dupes.map(([v, ks]) => `${ks.join(" = ")}  ${v.slice(0, 40)}…`));
else pass("no duplicated Korean strings");

// 4. status.line must not compare to peers. It was derived from the load index
//    while the percentile beside it was derived from the score, so the two
//    disagreed in 39 of 60 scale-rounds — including a scale at the 95th
//    percentile carrying "또래 평균보다 낮아".
const peerLeak = [...EN, ...KO].filter(([k, v]) => k.startsWith("status.line") && /또래|peer/.test(v));
if (peerLeak.length) fail("status.line makes a peer claim; that is the percentile's job", peerLeak.map(([k]) => k));
else pass("status.line makes no peer claim");

console.log(
  fails
    ? `\n${fails} check(s) failed`
    : "\nall checks passed — the per-surface prose count still needs a browser",
);
process.exit(fails ? 1 : 0);
