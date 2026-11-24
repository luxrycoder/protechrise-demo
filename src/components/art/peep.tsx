"use client";

import Image from "next/image";
import { useArtStyle } from "./art-style";
import { FIGURES, type Slot } from "./figures";

type Fill = "mint" | "white" | "sand" | "blue" | "purple" | "orange";
const FILLS: Record<Fill, string> = { mint: "#a7f3d0", white: "#ffffff", sand: "#ffedd5", blue: "#dbeafe", purple: "#ede9fe", orange: "#fdba74" };

type Props = {
  readonly slot: Slot;
  /** Nominal width in px. Full-body figures are drawn taller from it, portraits and peeps square-ish. */
  readonly size?: number;
  readonly fill?: Fill;
  readonly flip?: boolean;
  readonly className?: string;
};

/**
 * One figure of the page's illustration set. Which set is shown comes from the visitor's choice (see art-style.ts), so every
 * place that draws a person goes through here. Portraits sit in an arched frame, Open Peeps on a white tile, and the
 * full-body Humaaans stand free.
 */
export function Peep({ slot, size = 180, fill = "mint", flip, className }: Props) {
  const style = useArtStyle();
  const src = FIGURES[style][slot];
  const flipT = flip ? "scaleX(-1)" : undefined;

  if (style === "humaaans") {
    return (
      <span className={className} aria-hidden="true" style={{ display: "inline-block", height: size * 1.9, transform: flipT, filter: "drop-shadow(3px 4px 0 rgb(17 24 39 / 0.22))" }}>
        <Image src={src} alt="" width={300} height={600} unoptimized style={{ height: "100%", width: "auto" }} />
      </span>
    );
  }
  if (style === "peeps") {
    return (
      <span className={className} aria-hidden="true" style={{ display: "inline-block", width: size, height: size, overflow: "hidden", background: "#fff", border: "2.5px solid #111827", borderRadius: 18, boxShadow: "5px 5px 0 #111827", transform: flipT }}>
        <Image src={src} alt="" width={400} height={400} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </span>
    );
  }
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{ position: "relative", display: "inline-block", width: size, height: size * 1.12, overflow: "hidden", background: FILLS[fill], border: "2.5px solid #111827", borderRadius: `${size / 2}px ${size / 2}px 14px 14px`, boxShadow: "5px 5px 0 #111827", transform: flipT }}
    >
      <Image src={src} alt="" width={400} height={400} unoptimized style={{ position: "absolute", left: "-30%", top: "-33%", width: "160%", height: "auto" }} />
    </span>
  );
}
