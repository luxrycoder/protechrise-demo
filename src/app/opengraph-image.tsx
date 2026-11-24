import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site-config";

export const alt = `${SITE_NAME}: scholarship-first tech training for Africa`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colours mirror the tokens in globals.css (this renderer cannot read CSS variables).
const BRAND_DEEP = "#047857";
const BRAND_MINT = "#34d399";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: BRAND_DEEP,
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3 }}>
            Build skills that shape your future.
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 34, color: "#d1fae5" }}>
            Scholarship-first tech training for Africa
          </div>
        </div>
        <div style={{ display: "flex", height: 10, width: 220, background: BRAND_MINT, borderRadius: 5 }} />
      </div>
    ),
    size,
  );
}
