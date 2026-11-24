import type { PolicyBlock } from "@/content/types";
import { InlineHtml } from "@/components/inline-html";
import { NO_TERMS, fillTokens, type PublicTerms } from "@/lib/fee";
import styles from "./prose.module.css";

/** Renders a policy document (privacy, refund policy) from typed content blocks. Price tokens are filled from `terms`. */
export function PolicyBlocks({ blocks, terms = NO_TERMS }: { readonly blocks: readonly PolicyBlock[]; readonly terms?: PublicTerms }) {
  const fill = (html: string) => fillTokens(html, terms);
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "eyebrow":
            return <InlineHtml key={key} html={fill(block.html)} className={styles.eyebrow} />;
          case "h1":
            return <InlineHtml key={key} as="h1" html={fill(block.html)} className={styles.title} />;
          case "updated":
            return <InlineHtml key={key} as="p" html={fill(block.html)} className={styles.meta} />;
          case "h2":
            return <InlineHtml key={key} as="h2" html={fill(block.html)} />;
          case "p":
            return <InlineHtml key={key} as="p" html={fill(block.html)} />;
          case "ul":
            return (
              <ul key={key}>
                {block.items.map((item, i) => (
                  <InlineHtml key={`${key}-${i}`} as="li" html={fill(item)} />
                ))}
              </ul>
            );
          case "table":
            return (
              <div key={key} className={styles.tableWrap}>
                <table>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={`${key}-r${r}`}>
                        {row.cells.map((cell, c) => (
                          <InlineHtml key={`${key}-r${r}c${c}`} as={row.header ? "th" : "td"} html={fill(cell)} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </>
  );
}
