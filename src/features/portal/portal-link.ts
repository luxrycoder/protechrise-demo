import type { ApiResult } from "@/lib/api/result";
import type { PortalGate } from "@/lib/api/schemas/portal";

/**
 * Whether the status page offers a link to the portal. Asked of `GET /api/portal/state`: a 404 means the portal is
 * switched off, a 401 or any other failure means we cannot tell. In every such case the link stays hidden: it is
 * never shown "just in case". A learner whose seat is still being confirmed, or whose confirmation is stuck, is
 * sent to the portal too, because that is where those screens live.
 */
export const PORTAL_PATH = "/portal";
export const PORTAL_LINK_LABEL = "Open your portal";

const OPEN_STATES: ReadonlySet<string> = new Set(["eligible", "confirming", "stuck"]);

export function portalLinkVisible(result: ApiResult<PortalGate>): boolean {
  return result.ok && OPEN_STATES.has(result.data.state);
}
