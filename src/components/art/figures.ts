import type { ArtStyle } from "./art-style";

/** Where each figure appears on the page. Every style fills every slot, so switching style never leaves a gap. */
export type Slot =
  | "walker"
  | "cta"
  | `station-${0 | 1 | 2 | 3}`
  | `persona-${0 | 1 | 2 | 3 | 4}`
  | `crowd-${0 | 1 | 2 | 3 | 4 | 5}`
  | `line-${"build" | "infra" | "data" | "product" | "biz"}`;

const peeps = (n: number) => `/images/peeps/p${String(n).padStart(2, "0")}.svg`;
const person = (n: string) => `/images/people/${n}.svg`;
const hum = (n: string) => `/images/humaaans/${n}.svg`;

export const FIGURES: Record<ArtStyle, Record<Slot, string>> = {
  peeps: {
    walker: peeps(2), cta: peeps(12),
    "station-0": peeps(1), "station-1": peeps(2), "station-2": peeps(3), "station-3": peeps(4),
    "persona-0": peeps(5), "persona-1": peeps(6), "persona-2": peeps(7), "persona-3": peeps(8), "persona-4": peeps(9),
    "crowd-0": peeps(7), "crowd-1": peeps(8), "crowd-2": peeps(9), "crowd-3": peeps(10), "crowd-4": peeps(11), "crowd-5": peeps(12),
    "line-build": peeps(1), "line-infra": peeps(3), "line-data": peeps(5), "line-product": peeps(7), "line-biz": peeps(9),
  },
  portraits: {
    walker: person("kelechi"), cta: person("amara"),
    "station-0": person("ada"), "station-1": person("yusuf"), "station-2": person("amara"), "station-3": person("obinna"),
    "persona-0": person("tunde"), "persona-1": person("ngozi"), "persona-2": person("folake"), "persona-3": person("zainab"), "persona-4": person("emeka"),
    "crowd-0": person("ada"), "crowd-1": person("tunde"), "crowd-2": person("ngozi"), "crowd-3": person("emeka"), "crowd-4": person("zainab"), "crowd-5": person("obinna"),
    "line-build": person("tunde"), "line-infra": person("ngozi"), "line-data": person("zainab"), "line-product": person("emeka"), "line-biz": person("folake"),
  },
  humaaans: {
    walker: hum("standing-16"), cta: hum("standing-18"),
    "station-0": hum("standing-15"), "station-1": hum("sitting-4"), "station-2": hum("standing-3"), "station-3": hum("standing-24"),
    "persona-0": hum("standing-12"), "persona-1": hum("sitting-2"), "persona-2": hum("standing-17"), "persona-3": hum("standing-5"), "persona-4": hum("standing-9"),
    "crowd-0": hum("standing-1"), "crowd-1": hum("standing-11"), "crowd-2": hum("standing-14"), "crowd-3": hum("standing-21"), "crowd-4": hum("standing-8"), "crowd-5": hum("standing-19"),
    "line-build": hum("standing-2"), "line-infra": hum("standing-6"), "line-data": hum("standing-10"), "line-product": hum("standing-13"), "line-biz": hum("standing-20"),
  },
};
