import type { ElementType } from "react";
import { assertSafeInlineHtml } from "@/lib/inline-html";

type Props = {
  readonly html: string;
  readonly as?: ElementType;
  readonly className?: string;
};

/** Renders repo-owned inline markup (links, code, emphasis). Throws on anything outside the allowed set. */
export function InlineHtml({ html, as: Tag = "span", className }: Props) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: assertSafeInlineHtml(html) }} />;
}
