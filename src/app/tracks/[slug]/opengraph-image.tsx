import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site-config";
import { findTrack, loadTracks, trackAccent } from "@/lib/tracks";

export const alt = `${SITE_NAME} track`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The track list is live data, so this image is rendered per request, not at build time.
export const dynamic = "force-dynamic";

type Props = { readonly params: Promise<{ slug: string }> };

export default async function TrackOpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const track = findTrack((await loadTracks())?.tracks ?? [], slug);
  // trackAccent only ever returns a validated hex colour or the brand colour, never raw API text.
  const accent = track ? trackAccent(track.color) : "#059669";

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
          background: "#ffffff",
          borderTop: `22px solid ${accent}`,
          color: "#111827",
        }}
      >
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: "#047857" }}>{SITE_NAME}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {track?.category ? (
            <div style={{ display: "flex", fontSize: 30, letterSpacing: 4, textTransform: "uppercase", color: "#374151" }}>
              {track.category}
            </div>
          ) : null}
          <div style={{ display: "flex", marginTop: 16, fontSize: 96, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3 }}>
            {track?.name ?? "Career track"}
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: "#4b5563" }}>
            3 months · live online · scholarship-funded tuition
          </div>
        </div>
        <div style={{ display: "flex", height: 10, width: 220, background: accent, borderRadius: 5 }} />
      </div>
    ),
    size,
  );
}
