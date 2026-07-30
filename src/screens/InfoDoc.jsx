import Sheet from "../components/Sheet";
import { Card } from "../components/primitives";
import { C, T } from "../tokens";

/**
 * One legal document rendered inside the draggable sheet.
 * The documents themselves are Korean statutory text and are not translated —
 * they are the binding copy, not interface chrome.
 */
export default function InfoDoc({ doc, onClose }) {
  return (
    <Sheet title={doc.title} subtitle={doc.updated} onClose={onClose}>
      <Card pad="lg">
        {doc.sections.map((s, i) => (
          <section key={s.h} style={{ marginTop: i === 0 ? 0 : 20 }}>
            <h2 style={{ ...T.label, color: C.ink, margin: 0 }}>{s.h}</h2>
            {s.p && (
              <p
                style={{
                  ...T.caption,
                  color: C.body,
                  margin: "7px 0 0",
                  lineHeight: 1.8,
                  textWrap: "pretty",
                }}
              >
                {s.p}
              </p>
            )}
            {s.list && (
              <ul
                style={{ margin: "8px 0 0", paddingLeft: 0, listStyle: "none" }}
              >
                {s.list.map((item) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      gap: 8,
                      ...T.caption,
                      color: C.body,
                      lineHeight: 1.75,
                      marginTop: 6,
                      textWrap: "pretty",
                    }}
                  >
                    <span style={{ color: C.faintest, flex: "none" }}>·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </Card>
    </Sheet>
  );
}
