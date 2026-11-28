# #237 Price Check

A price-guessing game on real records (generic name; original design — the brief: guess real
prices with descriptions, images, characteristics, verified prices and historical context, from
properly licensed data).

| File                          | Role                                                                |
| ----------------------------- | ------------------------------------------------------------------- |
| `engine.ts`                   | Pure rules: items, pools, scales, scoring (two rules), sessions     |
| `PriceGame.tsx`               | Menu, record, play (item card, price box), reveal, results          |
| `CategoryArt.tsx`             | Original illustrations for the eight categories                     |
| `ai-adapter.ts`               | `GameEnvironment` and agents                                        |
| `items.json`                  | Items, prices and inflation price levels (generated)                |
| `images/`, `credits.json`     | 277 Wikimedia Commons thumbnails with author, licence and file page |
| `tools/fetch-prices.ts`       | Wikidata download (P2284 in 14 currencies)                          |
| `tools/generate-prices.ts`    | Validation, inflation levels, `items.json`                          |
| `tools/fetch-price-images.ts` | Commons thumbnails + credits (shrunk to 240 px JPEG; prunes stale)  |

## Specification

### Data

- **Prices**: Wikidata P2284 (CC0), downloaded 2026-11-28, in USD, EUR, GBP, JPY, CAD, AUD, CHF,
  SEK, INR, CNY, KRW, RUB, PLN, CZK. Only items of allow-listed classes, grouped as video games
  (games, DLC, bundles), consoles (and controllers), computers & parts, phones, cameras & audio,
  art & collectibles (paintings, sculptures, Fabergé eggs), aircraft, software and books.
  Checks: no part-qualified statements; preferred rank wins; the earliest dated price is the
  launch price (its point in time, else publication, else inception year — undated prices are
  dropped); same-year statements must agree within 5 %; plausible range per category (scaled per
  currency); categories other than books and games need at least one Wikipedia article (this
  removed self-promotional entries). Result: **1,149 items**. Tests check iPhone 12 (US$799, 2020) and Ouya (US$99).
- **No second-hand prices**: there is no open, verifiable dataset of used-item prices, so the
  game uses launch and sale prices only (stated in the rules).
- **Pictures**: 277 items have a Wikimedia Commons image (all freely licensed: public domain,
  CC0, CC BY, CC BY-SA); each is shipped as a 240 px JPEG and credited (author, licence, file page)
  on the reveal. Others show an original category illustration.
- **Today's money**: price levels chained from World Bank consumer-price inflation
  (FP.CPI.TOTL.ZG, CC BY 4.0) of each currency's country (EU for the euro); e.g. US$100 in 1980 ≈
  US$379 in 2024 (official CPI ratio ≈ 3.81).

### Ruleset (`price-check-wikidata`)

- Scale per category and currency: its price extent widened ×10 each way (log slider).
- **Closest**: `100 · e^(−1.5 · |ln(guess / price)|)`, exact (100) within 2 %: 10 % → 87, 25 % →
  72, 50 % → 54, ×2 or ½ → 35.
- **Don't go over**: same, but any guess above the price by more than 0.5 % scores 0.
- Difficulty: Easy — pictured items from 1990 on with ≥ 10 sitelinks; Normal — pictured or ≥ 5
  sitelinks; Hard — all. Category drawn first (no category twice in a row).
- Daily: six Normal items, Closest rule, seeded by date; Endless: rule × difficulty × category,
  the last 800 items avoided.

### Interface and controls

Item card (photo or illustration, category, name, description, year, currency, the rule), price
box (value in the item's currency via `Intl`, ÷/×1.5 buttons, log slider, type-in field with
validation), keys ← → ×1.05 (Shift ×1.5), Enter. Reveal: score (or “Over the price!”), price, ratio,
today's money, Wikidata link and photo credit.

### Saves, statistics, achievements

Versioned slot (session, daily totals, seen items, rule, difficulty, category, record).
Achievements: Window Shopper, Price Is Right (within 2 %), Auctioneer (≥ 70 on art), Just Under
(≥ 90 under don't-go-over), Regular Shopper (7-day streak).

### AI interface

Action k guesses 10^(scale start + 0.02 k). Observation: rule, item id, category, currency, year,
name, scale — never the price. Agents: Random; Typical for its kind (category & currency median,
item left out); Similar products (median of up to five same-category items sharing name words,
else the category). Tried and rejected for doing worse: a year-weighted median and carrying
prices through consumer inflation (technology gets cheaper). `npm run evaluate -- price-check <a>
<a> 200 7`, mean total out of 600: Random 75.3, Typical 191.9, **Similar products 219.3**.

### Tests

`tests/engine.test.ts` (bank integrity, launch-price spot checks, every credited picture present
with author and licence, inflation levels, both rules' scoring, pools, daily determinism,
illegal guesses, validation, agent ordering, estimates never read the item's price, adapter
contract); `tests/ui.test.tsx`; `tests/e2e/games/price-check.spec.ts` (desktop + Pixel 7).
