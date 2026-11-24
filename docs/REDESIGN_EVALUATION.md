# Redesign evaluation: "Evening Line" (branch redesign/evening-line)

AI-look check after each section. Tells looked for: gradient washes, identical rounded cards in a row, glassmorphism, centred stock hero, emoji icons, generic blob art.

| Section | What it is now | AI-look verdict |
|---|---|---|
| Hero | Collage of die-cut learner photos, ink "Future." label, torn scholarship ticket, route ribbon, rotating Apply stamp, departures-board chip | Low. No gradients; hard offset shadows, mono type and paper cut-outs. The old pill/grid hero is gone. |
| How it works | Night band, scroll-drawn route with a walker, four lit stations, hand-built vignettes plus Open Peeps | Low. Dark flat colour, no cards-in-a-row; layout alternates sides. |
| Tracks | Transit map: category = coloured line, track = station; detail panel with the real 12-week route | Low. Replaces carousel and CourseCard. /tracks and the finder use a timetable list instead of cards. |
| Reach | Departures board with scaled bars; hidden without live data | Low. |
| Community | Illustrated crowd on a platform | Low-medium: pure illustration, no data claims. |
| Stories | Boarding-pass style quote stubs on the existing ticker, real source links | Low-medium: still a row of similar items, but offset shadows and varied colours break the sameness. |
| Who it's for | Persona picker with swapping Open Peeps figure | Low. |
| FAQ / footer | Existing accordion, restyled by tokens | Medium: least changed. Candidate for a later pass. |
| CTA | Night band, "next station", looping progress rail | Low. |

Constraints kept: no gradients except the faded edge masks on tickers, semantic tokens only, one illustration set (Lorelei portraits, CC0, via DiceBear), one icon library (Phosphor), all motion off under prefers-reduced-motion.
