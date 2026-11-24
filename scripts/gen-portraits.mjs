// Builds the site's portrait illustrations (Lorelei by Lisa Wischofsky, CC0, via DiceBear) as static SVG files.
// Usage: node scripts/gen-portraits.mjs   -> public/images/people/<name>.svg (transparent background)
import { createAvatar } from "@dicebear/core";
import * as lorelei from "@dicebear/lorelei";
import { mkdirSync, writeFileSync } from "node:fs";

const PEOPLE = {
  ada: { hair: "variant35", skin: "8d5524", mouth: "happy05", earrings: "variant02" },
  tunde: { hair: "variant25", skin: "6b3f1d", mouth: "happy02" },
  ngozi: { hair: "variant26", skin: "a0693a", mouth: "happy09", earrings: "variant01" },
  emeka: { hair: "variant47", skin: "5c3a21", mouth: "happy04", glasses: "variant03" },
  zainab: { hair: "variant24", skin: "8d5524", mouth: "happy11", earrings: "variant03" },
  kelechi: { hair: "variant39", skin: "6b3f1d", mouth: "happy01" },
  folake: { hair: "variant18", skin: "a0693a", mouth: "happy06", glasses: "variant01" },
  yusuf: { hair: "variant28", skin: "5c3a21", mouth: "happy03" },
  amara: { hair: "variant05", skin: "8d5524", mouth: "happy08", earrings: "variant02" },
  obinna: { hair: "variant01", skin: "6b3f1d", mouth: "happy07" },
};

mkdirSync("public/images/people", { recursive: true });
for (const [name, p] of Object.entries(PEOPLE)) {
  const svg = createAvatar(lorelei, {
    seed: name,
    size: 400,
    hair: [p.hair],
    hairColor: ["141414"],
    skinColor: [p.skin],
    mouth: [p.mouth],
    eyebrows: ["variant05"],
    glasses: p.glasses ? [p.glasses] : undefined,
    glassesProbability: p.glasses ? 100 : 0,
    earrings: p.earrings ? [p.earrings] : undefined,
    earringsProbability: p.earrings ? 100 : 0,
    beard: p.beard ? [p.beard] : undefined,
    beardProbability: p.beard ? 100 : 0,
    freckles: undefined,
    frecklesProbability: 0,
    hairAccessoriesProbability: 0,
  }).toString();
  writeFileSync(`public/images/people/${name}.svg`, svg);
}
console.log(`wrote ${Object.keys(PEOPLE).length} portraits`);
