# NK Store

Storefront for **NK Store / Nadeshiko Keza Store** ([@nk.store_kgl](https://www.tiktok.com/@nk.store_kgl)) — Japanese and Korean skincare, Kigali.

Static site. No build step, no framework, no dependencies to install. Open `index.html` and it runs.

---

## Before this goes live

Three things are placeholders and must be replaced:

| What | Where | Why it matters |
|---|---|---|
| **Prices** | `assets/js/data.js` → `price` | Plausible, not the store's. Every one needs confirming. |
| **Product photos** | `assets/js/app.js` → `vessel()` | Products are drawn as SVG. Each card has a slot ready for real photography. |
| **Phone number** | `assets/js/app.js` → footer, `+250 7XX XXX XXX` | Checkout tells people to message this number. |

The footer carries a `preview build` line until those are done. Remove it from `i18n.js` (`fdemo`) when the catalogue is real.

Nothing in the site invents social proof: no reviews, no customer counts, no certifications. The trust section states only what the store can actually stand behind. Keep it that way — add reviews only when they are real ones.

---

## Layout

```
index.html              markup and nothing else
assets/css/site.css     one stylesheet, tokens at the top
assets/js/data.js       ← the catalogue. The only file you edit for stock.
assets/js/i18n.js       all copy, in English, French and Kinyarwanda
assets/js/app.js        router, pages, filters, bag, search
assets/js/hero.js       the WebGL hero (ES module, loads three.js from a CDN)
```

Scripts load in that order and share globals. `data.js` and `i18n.js` are pure data — they depend on nothing.

---

## Changing the catalogue

Everything reads from `CATALOG` in `data.js`. Edit it in one place and the shop grid, search, filters, routine builder, product pages, related products and the bag all follow.

```js
{ id:'senka-whip',          // unique, used in the URL (#product-senka-whip)
  brand:'Senka', name:'Perfect Whip',
  origin:'JP',              // badge on the card
  price:12000,              // RWF, integer
  size:'120 g',
  cat:'cleanse',            // cleanse | hydrate | treat | protect
  concerns:['cleansing','sensitive'],
  shape:'tube',             // tube | bottle | dropper | pump | jar | sachet
  tint:'#F2E5EA', deep:'#DBC3CE',   // drawn-bottle colours
  best:1, new:0,            // flags: bestsellers row, "New in" filter
  stock:'in',               // in | low | out
  kind:{en,fr,rw}, desc:{en,fr,rw}, ben:{en:[],fr:[],rw:[]},
  how:{en,fr,rw}, ing:{en,fr,rw} }
```

Every language field needs all three keys. A missing one falls back to English rather than breaking.

The price slider in the shop is capped at `30000` — raise `max` on `#fPrice` in `app.js` if anything costs more.

## Changing copy

`i18n.js` holds one object per language. Any key present in `en` must exist in `fr` and `rw`. To check after editing:

```bash
node -e "
const fs=require('fs');eval(fs.readFileSync('assets/js/i18n.js','utf8').replace(/^\/\*[\s\S]*?\*\//,''));
const k=Object.keys(T.en);
for(const l of ['fr','rw'])console.log(l, k.filter(x=>!(x in T[l])));"
```

## Routine builder

Deterministic, in `recommend()` in `app.js`. It walks **cleanse → hydrate → treat → protect**, prefers products matching the chosen concern, then in-stock bestsellers, then the cheapest. No AI, no API.

---

## Running it

Any static host. Because it is a single-page app on hash routes (`#shop`, `#product-<id>`), there is no server rewriting to configure.

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

**GitHub Pages:** push to `main`, then Settings → Pages → Deploy from branch → `main` / root.

Opening `index.html` directly from the filesystem works too, except the WebGL hero — ES modules need `http://`, so it falls back to the static bottle. That fallback is the intended mobile experience anyway.

---

## The hero

`hero.js` renders a glass bottle with real refraction, lit by a studio environment painted onto a canvas at runtime. It only loads on desktop pointers, never under `prefers-reduced-motion`, and disposes every geometry, material and texture when you navigate away from the homepage. On phones three.js is never fetched at all — the drawn SVG stays and the page costs nothing extra.

If the CDN is unreachable the import fails silently and the fallback remains. Nothing on the page depends on it.

---

## Browser support

Modern evergreen browsers. Uses hash routing, `IntersectionObserver`, `ResizeObserver`, CSS `aspect-ratio` and `backdrop-filter`. `localStorage` holds the bag, saved items and language choice, and every access is wrapped — the site works with storage blocked.
