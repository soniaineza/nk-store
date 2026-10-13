/* NK Store — application
   Router, page templates, shop filters, bag, search, chrome.
   Loads after data.js and i18n.js and reads their globals. */

/* ══════════════════════════════════════════════════════════════════════
   NK STORE
   Single source of truth for products is CATALOG below. Replace it with
   the store's live stock and nothing else in this file needs to change.
   ═══════════════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FREE = 50000;
const nfm = new Intl.NumberFormat('fr-FR');
const frw = n => nfm.format(n) + ' Frw';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── drawn vessels (replace with real photography) ──────────────────── */
function vessel(shape, tint, deep, label){
  const cap = '#241A17', gl = 'rgba(255,255,255,.52)';
  const B = {
    pump:`<rect x="28" y="56" width="64" height="88" rx="15" fill="${tint}"/><rect x="28" y="102" width="64" height="42" rx="15" fill="${deep}"/>
          <rect x="50" y="30" width="20" height="28" rx="5" fill="${cap}"/><path d="M50 30H36a5 5 0 0 0-5 5v4h19z" fill="${cap}"/><rect x="44" y="22" width="32" height="10" rx="5" fill="${cap}"/>`,
    bottle:`<rect x="26" y="50" width="68" height="94" rx="12" fill="${tint}"/><rect x="26" y="100" width="68" height="44" rx="12" fill="${deep}"/>
            <rect x="48" y="18" width="24" height="34" rx="4" fill="${cap}"/><rect x="42" y="10" width="36" height="12" rx="6" fill="${cap}"/>`,
    dropper:`<rect x="34" y="54" width="52" height="90" rx="11" fill="${tint}"/><rect x="34" y="100" width="52" height="44" rx="11" fill="${deep}"/>
             <rect x="52" y="22" width="16" height="32" rx="5" fill="${cap}"/><rect x="44" y="12" width="32" height="13" rx="6.5" fill="${cap}"/>`,
    tube:`<path d="M34 58h52v72a14 14 0 0 1-14 14H48a14 14 0 0 1-14-14z" fill="${tint}"/><path d="M34 104h52v26a14 14 0 0 1-14 14H48a14 14 0 0 1-14-14z" fill="${deep}"/>
          <path d="M34 58l6-22h40l6 22z" fill="${tint}" opacity=".85"/><rect x="48" y="24" width="24" height="13" rx="4" fill="${cap}"/>`,
    jar:`<rect x="22" y="76" width="76" height="66" rx="17" fill="${tint}"/><rect x="22" y="108" width="76" height="34" rx="17" fill="${deep}"/><rect x="18" y="54" width="84" height="25" rx="10" fill="${cap}"/>`,
    sachet:`<path d="M26 44h68v88a10 10 0 0 1-10 10H36a10 10 0 0 1-10-10z" fill="${tint}"/><path d="M26 104h68v28a10 10 0 0 1-10 10H36a10 10 0 0 1-10-10z" fill="${deep}"/>
            <path d="M26 44h68v-8H26z" fill="${cap}"/><path d="M31 36v-6M43 36v-6M55 36v-6M67 36v-6M79 36v-6M89 36v-6" stroke="${cap}" stroke-width="2.2"/>`
  }[shape] || '';
  return `<svg class="v" viewBox="0 0 120 160" role="img" aria-label="${esc(label||'')}">${B}
    <rect x="${shape==='jar'?34:40}" y="${shape==='jar'?80:60}" width="6" height="${shape==='jar'?20:26}" rx="3" fill="${gl}"/>
    ${label ? `<rect x="26" y="${shape==='jar'?94:100}" width="68" height="22" rx="4" fill="#FFFDFB" opacity=".95"/>
    <text x="60" y="${shape==='jar'?109:114}" text-anchor="middle" font-family="Jost,Helvetica,Arial,sans-serif" font-size="9" letter-spacing="1.5" fill="#241A17">${esc(label)}</text>` : ''}</svg>`;
}

/* soft editorial backdrop used where photography will go */
function plate(hue, seed){
  const r = (n) => ((Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  const circles = [0,1,2,3].map(i =>
    `<circle cx="${12 + r(i)*76}" cy="${14 + r(i+9)*72}" r="${9 + r(i+4)*22}" fill="#FFFDFB" opacity="${.14 + r(i+2)*.2}"/>`).join('');
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${hue}"/><stop offset="1" stop-color="#FFFDFB"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#g${seed})"/>${circles}
    <path d="M-5 78C20 62 38 70 58 56 78 42 92 48 106 36" fill="none" stroke="#241A17" stroke-width=".5" opacity=".16"/>
    <path d="M-5 88C22 74 42 82 62 68 82 54 94 60 106 48" fill="none" stroke="#241A17" stroke-width=".4" opacity=".1"/></svg>`;
}

/* photo fallbacks: if a photo URL dies, swap in the drawn vessel / backdrop */
window.vesselSwap = img => {
  const svg = vessel(img.dataset.shape || 'bottle', img.dataset.tint || '#EAE0D5', img.dataset.deep || '#D8CCBE', img.dataset.label || '');
  img.outerHTML = '<span class="vessel-fallback">' + svg + '</span>';
};
window.plateSwap = img => {
  img.outerHTML = plate(img.dataset.hue || '#EFE4EA', +img.dataset.seed || 7);
};

/* ── state ──────────────────────────────────────────────────────── */
let bag = {}, saved = {};
try { bag = JSON.parse(localStorage.getItem('nk.bag') || '{}') || {}; } catch {}
try { saved = JSON.parse(localStorage.getItem('nk.saved') || '{}') || {}; } catch {}
const persist = () => { try {
  localStorage.setItem('nk.bag', JSON.stringify(bag));
  localStorage.setItem('nk.saved', JSON.stringify(saved));
} catch {} };

const bagCount = () => Object.values(bag).reduce((a,b)=>a+b,0);
const bagSum = () => Object.entries(bag).reduce((s,[id,q]) => s + (byId(id) ? byId(id).price*q : 0), 0);

function addToBag(id, n = 1){
  const p = byId(id); if (!p || p.stock === 'out') return;
  bag[id] = (bag[id] || 0) + n; persist(); paintBag();
  $('openBag').animate(
    [{transform:'scale(1)'},{transform:'scale(1.18)'},{transform:'scale(1)'}],
    { duration: REDUCED ? 1 : 460, easing:'cubic-bezier(.3,1.4,.5,1)' });
}

let toastT = 0;
function toast(msg){
  $('toastMsg').textContent = msg; $('toast').classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => $('toast').classList.remove('on'), 2400);
}

/* ── shared fragments ───────────────────────────────────────────────── */
const ICON = {
  arrow:'<svg viewBox="0 0 24 24"><path d="M5 12h13M12 5l7 7-7 7"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.6-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7C19 15.4 12 20 12 20z"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="m5 13 4.5 4.5L19 7"/></svg>',
  leaf:'<svg viewBox="0 0 24 24"><path d="M20 4C11 5 5 9 5 16c0 2 1 4 1 4s3-1 6-1c7 0 8-6 8-15z"/><path d="M6 20 17 7"/></svg>',
  truck:'<svg viewBox="0 0 24 24"><path d="M2 7h11v9H2zM13 11h5l3 3v2h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  chat:'<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 1 1-3.3-6.4"/><path d="M4 20l1.4-3.6"/><path d="M9 11h.01M12.5 11h.01M16 11h.01"/></svg>',
  seal:'<svg viewBox="0 0 24 24"><path d="m12 3 2.3 1.7 2.8-.3 1 2.7 2.4 1.5-1 2.7 1 2.7-2.4 1.5-1 2.7-2.8-.3L12 21l-2.3-1.7-2.8.3-1-2.7L3.5 15l1-2.7-1-2.7 2.4-1.5 1-2.7 2.8.3z"/><path d="m9.5 12 2 2 3.5-3.6"/></svg>'
};

function pcard(p){
  const n = el('article','pcard');
  const out = p.stock === 'out';
  n.innerHTML = `
    <div class="frame" data-go="product-${p.id}" role="link" tabindex="0" aria-label="${esc(title(p))}">
      <span class="glow"></span>
      <div class="flags">
        ${p.new ? `<span class="flag rose">${t('nNew')}</span>` : ''}
        ${out ? `<span class="flag out">${t('soldOut')}</span>` : (p.stock==='low' ? `<span class="flag">${t('lowStock')}</span>` : '')}
        <span class="flag">${p.origin}</span>
      </div>
      <button class="heart" type="button" data-heart="${p.id}" aria-pressed="${!!saved[p.id]}" aria-label="Save">${ICON.heart}</button>
      <img src="${p.image}" alt="${esc(p.brand + ' ' + p.name)}" class="pcard-img" data-shape="${p.shape}" data-tint="${p.tint}" data-deep="${p.deep}" data-label="${esc(p.brand)}" onerror="vesselSwap(this)"/>
      <div class="quick"><button class="btn btn-wide btn-sm" type="button" data-add="${p.id}" ${out?'disabled':''}>${out?t('soldOut'):t('quick')}</button></div>
    </div>
    <div class="brandline">${esc(p.brand)}</div>
    <div class="pname">${esc(p.name)}</div>
    <div class="prow"><span class="small">${esc(p.kind[lang])} · ${esc(p.size)}</span><span class="price">${frw(p.price)}</span></div>`;
  return n;
}

function sectionHead(k, h, extra){
  return `<div class="stack rev"><p class="kicker">${t(k)}</p>
    <div class="row" style="justify-content:space-between;align-items:flex-end">
      <h2 style="max-width:18ch">${t(h)}</h2>${extra || ''}</div></div>`;
}

function journalProducts(a){
  return a.products.map(p => `<img src="${p.image}" alt="${esc(p.name)}" loading="lazy"/>`).join('');
}

/* ══════════════════════════════════════════════════════════════════════
   PAGES
   ═══════════════════════════════════════════════════════════════════ */
function pageHome(){
  const best = CATALOG.filter(p => p.best);
  return `
  <section class="hero">
    <div class="col hero-in">
      <div class="stack">
        <p class="kicker fade">${t('heroK')}</p>
        <h1><span class="ln"><span>${t('heroA')}</span></span><span class="ln"><span class="it">${t('heroB')}</span></span></h1>
        <p class="lede fade d1">${t('heroP')}</p>
        <div class="row fade d2">
          <a class="btn" href="#shop">${t('heroCta')}<span class="arrow">${ICON.arrow}</span></a>
          <a class="link-u" href="#builder">${t('heroCta2')}</a>
        </div>
        <div class="hero-marks fade d3">
          <span><i></i>${t('hm1')}</span><span><i></i>${t('hm2')}</span><span><i></i>${t('hm3')}</span>
        </div>
      </div>
      <div class="stage">
        <canvas id="heroGL"></canvas>
        <div class="stage-still" id="heroStill"><img src="https://images.pexels.com/photos/16008945/pexels-photo-16008945.jpeg?auto=compress&cs=tinysrgb&w=900&h=940&fit=crop" alt="Japanese skincare creams on a bright vanity" class="hero-still-img" data-shape="bottle" data-tint="#E3EDF3" data-deep="#C2D8E2" data-label="NK Store" onerror="vesselSwap(this)"/></div>
        <p class="stage-note" id="glNote" hidden>${t('glNote')}</p>
      </div>
    </div>
  </section>

  <section class="band col">
    ${sectionHead('concernK','concernH')}
    <div class="concerns rev rev-2" style="margin-top:26px">
      ${CONCERNS.map((c,i) => {
        const n = CATALOG.filter(p => p.concerns.includes(c.id)).length;
        const key = 'c' + c.id.charAt(0).toUpperCase() + c.id.slice(1);
        return `<a class="concern" href="#shop" data-concern="${c.id}">
          <span class="img"><img src="${c.img}" alt="${esc(t(key))}" class="concern-img" data-hue="${c.hue}" data-seed="${i+31}" onerror="plateSwap(this)"/></span>
          <span class="cap"><span><b>${t(key)}</b><br><span class="n">${n} ${t('results')}</span></span>
          <span class="go">${ICON.arrow}</span></span></a>`;
      }).join('')}
    </div>
  </section>

  <section class="band col" style="padding-top:0">
    ${sectionHead('bestK','bestH', `<a class="link-u" href="#shop">${t('viewAll')}</a>`)}
    <div class="pgrid rev rev-2" id="bestGrid" style="margin-top:26px"></div>
  </section>

  <section class="band" style="background:var(--cream)">
    <div class="col split">
      <div class="plate rev"><img src="https://images.pexels.com/photos/5269662/pexels-photo-5269662.jpeg?auto=compress&cs=tinysrgb&w=760&h=950&fit=crop" alt="Woman applying skincare by the pool" class="product-img" onerror="this.style.display='none'"/></div>
      <div class="stack rev rev-2">
        <p class="kicker">${t('edK')}</p>
        <h2>${t('edH')}</h2>
        <p class="lede">${t('edP')}</p>
        <ul class="steps-ed">
          ${[1,2,3,4].map(i => `<li><span class="no">0${i}</span><span><b>${t('ed'+i)}</b><p>${t('ed'+i+'p')}</p></span></li>`).join('')}
        </ul>
        <div class="row"><a class="btn btn-line" href="#journal">${t('edCta')}<span class="arrow">${ICON.arrow}</span></a></div>
      </div>
    </div>
  </section>

  <section class="band col" id="builder">
    <div class="builder rev">
      <div class="stack">
        <p class="kicker">${t('bK')}</p>
        <h2 style="max-width:16ch">${t('bH')}</h2>
        <div class="bsteps" id="bSteps"></div>
        <div id="bStage" style="margin-top:6px"></div>
      </div>
    </div>
  </section>

  <section class="band col" style="padding-top:0">
    ${sectionHead('jK','jH', `<a class="link-u" href="#journal">${t('viewAll')}</a>`)}
    <div class="jgrid rev rev-2" style="margin-top:26px">
      ${JOURNAL.map(a => `<a class="jcard" href="#article-${a.id}">
        <span class="cover product-cover" style="--product-bg:${a.hue}">${journalProducts(a)}</span>
        <span class="meta">${t('jK')}</span>
        <h3>${esc(a.t[lang])}</h3>
        <p class="small">${esc(a.s[lang])}</p></a>`).join('')}
    </div>
  </section>

  <section class="band col" style="padding-top:0">
    ${sectionHead('sK','sH', `<a class="link-u" href="https://www.tiktok.com/@nk.store_kgl" target="_blank" rel="noopener">${t('sFollow')}</a>`)}
    <div class="social rev rev-2" style="margin-top:26px">
      ${CATALOG.slice(0,6).map((p,i) => `<a class="tile" href="https://www.tiktok.com/@nk.store_kgl" target="_blank" rel="noopener">
        <img src="${p.image}" alt="${esc(p.brand + ' ' + p.name)}" class="tile-img" data-shape="${p.shape}" data-tint="${p.tint}" data-deep="${p.deep}" data-label="${esc(p.brand)}" onerror="vesselSwap(this)"/>
        <span class="tag">${esc(p.brand)}</span>
        <span class="pl"><span>${t('sOpen')}</span></span></a>`).join('')}
    </div>
  </section>

  <section class="band col" style="padding-top:0">
    ${sectionHead('tK','tH')}
    <div class="trust rev rev-2" style="margin-top:26px">
      ${[['seal','t1'],['leaf','t2'],['truck','t3'],['chat','t4']].map(([ic,k]) =>
        `<div>${ICON[ic]}<b>${t(k)}</b><p>${t(k+'p')}</p></div>`).join('')}
    </div>
  </section>`;
}

function pageShop(){
  return `
  <section class="band col">
    <div class="stack rev">
      <p class="kicker">${t('nShop')}</p>
      <h2>${t('shopH')}</h2>
      <p class="lede">${t('shopP')}</p>
    </div>
    <hr class="hair" style="margin-block:30px">
    <div class="stack" style="gap:20px">
      <div class="filtergroup"><span>${t('fCat')}</span><div class="chips" id="fCat"></div></div>
      <div class="filtergroup"><span>${t('fConcern')}</span><div class="chips" id="fCon"></div></div>
      <div class="filtergroup"><span>${t('fBrand')}</span><div class="chips" id="fBrand"></div></div>
      <div class="shopbar">
        <div class="filtergroup" style="flex:1;min-width:210px">
          <span>${t('fPrice')} · <b id="fPriceVal"></b></span>
          <div class="rangewrap"><input type="range" id="fPrice" min="12000" max="30000" step="1000"></div>
        </div>
        <div class="filtergroup"><span>${t('fAvail')}</span><div class="row">
          <button class="chip" id="fStock" type="button" aria-pressed="false">${t('fIn')}</button>
          <select class="sel" id="fSort" aria-label="${t('sortBy')}">
            <option value="featured">${t('sFeatured')}</option><option value="new">${t('sNew')}</option>
            <option value="low">${t('sLow')}</option><option value="high">${t('sHigh')}</option>
          </select>
        </div></div>
      </div>
      <div class="row" style="justify-content:space-between">
        <p class="small" id="count"></p>
        <button class="link-u" id="clearF" type="button" style="background:none;border:0;border-bottom:1px solid var(--line-2);cursor:pointer">${t('clearF')}</button>
      </div>
    </div>
    <div class="pgrid" id="shopGrid" style="margin-top:22px"></div>
  </section>`;
}

function pageProduct(id){
  const p = byId(id);
  if (!p) return page404();
  const rel = CATALOG.filter(x => x.id !== p.id && x.concerns.some(c => p.concerns.includes(c))).slice(0,4);
  const stockKey = p.stock === 'in' ? 'inStock' : p.stock === 'low' ? 'lowStock' : 'outStock';
  return `
  <section class="band col">
    <p class="small rev"><a class="link-u" href="#shop" style="border:0;padding:0">${t('backShop')}</a></p>
    <div class="pdp rev rev-2" style="margin-top:22px">
      <div class="gallery">
        <div class="gmain" id="gMain"><img src="${p.image}" alt="${esc(p.brand + ' ' + p.name)}" class="gmain-img" data-shape="${p.shape}" data-tint="${p.tint}" data-deep="${p.deep}" data-label="${esc(p.brand)}" onerror="vesselSwap(this)"/><span class="glow"></span></div>
        <div class="gthumbs" id="gThumbs">
          ${['front','side','open'].map((v,i) => `<button class="gthumb" type="button" data-g="${i}" aria-pressed="${i===0}">
            ${'<img src="' + p.image + '" alt="' + esc(p.brand + ' ' + p.name) + '" class="gthumb-img" data-shape="' + p.shape + '" data-tint="' + p.tint + '" data-deep="' + p.deep + '" data-label="' + esc(p.brand) + '" onerror="vesselSwap(this)"/>'}</button>`).join('')}
        </div>
      </div>
      <div class="stack">
        <p class="kicker">${esc(p.brand)} · ${p.origin}</p>
        <h2 style="font-size:clamp(1.9rem,4.4vw,3.1rem)">${esc(p.name)}</h2>
        <p class="small">${esc(p.kind[lang])} · ${esc(p.size)}</p>
        <div class="row" style="gap:20px">
          <span class="price" style="font-size:1.4rem">${frw(p.price)}</span>
          <span class="stockdot" data-s="${p.stock}"><i></i>${t(stockKey)}</span>
        </div>
        <p class="lede">${esc(p.desc[lang])}</p>
        <p class="kicker kicker-ink" style="margin-top:6px">${t('benefits')}</p>
        <ul class="benefits">${p.ben[lang].map(b => `<li>${esc(b)}</li>`).join('')}</ul>
        <div class="row" style="margin-top:6px">
          <div class="qtybox"><button type="button" id="qMinus" aria-label="minus">−</button><b id="qVal">1</b><button type="button" id="qPlus" aria-label="plus">+</button></div>
          <button class="btn" id="pdpAdd" type="button" data-pdp="${p.id}" ${p.stock==='out'?'disabled':''} style="flex:1;min-width:180px">
            ${p.stock==='out' ? t('soldOut') : t('add')}</button>
          <button class="ico heart" type="button" data-heart="${p.id}" aria-pressed="${!!saved[p.id]}" aria-label="Save"
            style="position:static;background:var(--card);border:1px solid var(--line)">${ICON.heart}</button>
        </div>
        <div style="margin-top:14px">
          <details class="acc"><summary>${t('howTo')}<span class="pm">+</span></summary><div class="body">${esc(p.how[lang])}</div></details>
          <details class="acc"><summary>${t('ingredients')}<span class="pm">+</span></summary><div class="body">${esc(p.ing[lang])}</div></details>
          <details class="acc"><summary>${t('shipping')}<span class="pm">+</span></summary><div class="body">${t('shipB')}</div></details>
          <details class="acc"><summary>${t('faq')}<span class="pm">+</span></summary><div class="body">${t('faqB')}</div></details>
        </div>
      </div>
    </div>
    ${rel.length ? `<div class="stack rev" style="margin-top:70px"><p class="kicker">${t('related')}</p>
      <div class="pgrid" id="relGrid" style="margin-top:18px"></div></div>` : ''}
  </section>`;
}

function pageJournal(){
  return `<section class="band col">
    <div class="stack rev"><p class="kicker">${t('jK')}</p><h2>${t('jH')}</h2></div>
    <div class="jgrid rev rev-2" style="margin-top:34px">
      ${JOURNAL.map(a => `<a class="jcard" href="#article-${a.id}">
        <span class="cover product-cover" style="--product-bg:${a.hue}">${journalProducts(a)}</span>
        <span class="meta">${t('jK')}</span><h3>${esc(a.t[lang])}</h3>
        <p class="small">${esc(a.s[lang])}</p>
        <span class="link-u" style="align-self:flex-start;margin-top:4px">${t('jRead')}</span></a>`).join('')}
    </div></section>`;
}

function pageArticle(id){
  const a = JOURNAL.find(x => x.id === id);
  if (!a) return page404();
  return `<section class="band col">
    <p class="small rev"><a class="link-u" href="#journal" style="border:0;padding:0">${t('jK')}</a></p>
    <div class="article stack rev rev-2" style="margin-top:26px">
      <p class="kicker">${t('jK')}</p>
      <h2>${esc(a.t[lang])}</h2>
      <p class="lede it">${esc(a.s[lang])}</p>
      <div class="article-visual product-cover" style="--product-bg:${a.hue}">${journalProducts(a)}</div>
      ${a.b[lang].map((para,i) => `<p${i===0?' class="drop"':''}>${esc(para)}</p>`).join('')}
      <hr class="hair" style="margin-top:20px">
      <div class="row"><a class="btn btn-line" href="#shop">${t('heroCta')}<span class="arrow">${ICON.arrow}</span></a></div>
    </div></section>`;
}

function pageAbout(){
  return `<section class="band col">
    <div class="stack rev" style="max-width:62ch">
      <p class="kicker">${t('aboutK')}</p>
      <h2>${t('aboutH')}</h2>
      <p class="lede">${t('aboutP1')}</p>
      <p class="lede">${t('aboutP2')}</p>
    </div>
    <hr class="hair" style="margin-block:46px">
    <div class="stack rev rev-2">
      <p class="kicker">${t('nameK')}</p>
      <div class="split" style="margin-top:14px">
        <div class="stack">
          <h3 style="font-family:var(--sans);font-weight:200;font-size:clamp(1.6rem,5vw,2.4rem);letter-spacing:.24em;text-transform:uppercase;border-bottom:1px solid var(--line-2);padding-bottom:9px;align-self:flex-start">Nadeshiko</h3>
          <p class="lede">${t('nadeK')}</p>
        </div>
        <div class="stack">
          <h3 style="font-family:var(--sans);font-weight:200;font-size:clamp(1.6rem,5vw,2.4rem);letter-spacing:.24em;text-transform:uppercase;border-bottom:1px solid var(--line-2);padding-bottom:9px;align-self:flex-start">Keza</h3>
          <p class="lede">${t('kezaK')}</p>
        </div>
      </div>
    </div>
    <div class="stack rev" style="margin-top:60px;text-align:center;align-items:center">
      <p class="serif it" style="font-size:clamp(1.5rem,4vw,2.5rem);max-width:24ch;line-height:1.26">“${t('quote')}”</p>
      <p class="kicker kicker-ink">${t('quoteBy')}</p>
    </div>
  </section>`;
}

function page404(){
  return `<section class="band col"><div class="empty" style="padding-block:90px">
    ${'<img src="https://images.pexels.com/photos/16770366/pexels-photo-16770366.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop" alt="" class="empty-img" onerror="this.style.display=\'none\'"/>'}
    <b>${t('e404')}</b><p>${t('e404p')}</p>
    <a class="btn" href="#shop">${t('e404cta')}</a></div></section>`;
}

/* ══════════════════════════════════════════════════════════════════════
   ROUTER
   ═══════════════════════════════════════════════════════════════════ */
let currentRoute = '';
function render(){
  const raw = (location.hash || '#home').slice(1) || 'home';
  currentRoute = raw;
  const view = $('view');

  $('prog').classList.add('on'); $('prog').style.width = '72%';

  const paint = () => {
    let html;
    if (raw.startsWith('product-')) html = pageProduct(raw.slice(8));
    else if (raw.startsWith('article-')) html = pageArticle(raw.slice(8));
    else html = ({ home:pageHome, shop:pageShop, journal:pageJournal, about:pageAbout }[raw] || page404)();
    view.innerHTML = html;
    view.style.opacity = '';
    scrollTo({ top:0, behavior: REDUCED ? 'auto' : 'instant' });

    if (raw === 'home'){ mountBest(); mountBuilder(); window.mountHero?.(); }
    else window.disposeHero?.();
    if (raw === 'shop') mountShop();
    if (raw.startsWith('product-')) mountPDP(raw.slice(8));

    observe();
    markNav();
    $('prog').style.width = '100%';
    setTimeout(() => { $('prog').classList.remove('on'); $('prog').style.width = '0'; }, 320);
  };

  if (REDUCED){ paint(); return; }
  view.style.transition = 'opacity .18s ease';
  view.style.opacity = '0';
  setTimeout(paint, 170);
}
addEventListener('hashchange', render);

function markNav(){
  const base = currentRoute.split('-')[0];
  document.querySelectorAll('#navLinks a').forEach(a => {
    const h = a.getAttribute('href').slice(1);
    const only = a.dataset.only || '';
    const hit = h === base && (base !== 'shop' || (only || 'all') === F.only);
    if (hit || (h === 'journal' && base === 'article')) a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  });
}

let io;
function observe(){
  io?.disconnect();
  io = new IntersectionObserver(es => {
    for (const e of es) if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  }, { threshold:.06, rootMargin:'0px 0px -40px' });
  document.querySelectorAll('.rev:not(.in)').forEach(n => io.observe(n));
}

/* ── home mounts ────────────────────────────────────────────────────── */
function mountBest(){
  const g = $('bestGrid'); if (!g) return;
  CATALOG.filter(p => p.best).forEach(p => g.appendChild(pcard(p)));
}

let bStep = 0, bConcern = null, bKind = null;
function mountBuilder(){
  const steps = $('bSteps'); if (!steps) return;
  bStep = 0; bConcern = null; bKind = null;
  paintBuilder();
}
function paintBuilder(){
  const steps = $('bSteps'), stage = $('bStage');
  if (!steps || !stage) return;
  steps.innerHTML = [1,2].map(i =>
    `<span class="bstep" data-on="${bStep >= i-1 ? 1 : 0}"><i>${i}</i>${t('bStep')} ${i}</span>`).join('');

  if (bStep === 0){
    stage.innerHTML = `<div class="stack"><h3 style="font-family:var(--serif);font-size:1.5rem">${t('bQ1')}</h3>
      <div class="opts">${CONCERNS.map(c => {
        const k = 'c' + c.id.charAt(0).toUpperCase() + c.id.slice(1);
        return `<button class="opt" type="button" data-bc="${c.id}"><b>${t(k)}</b>
          <span>${CATALOG.filter(p => p.concerns.includes(c.id)).length} ${t('results')}</span></button>`;
      }).join('')}</div></div>`;
  } else if (bStep === 1){
    stage.innerHTML = `<div class="stack"><h3 style="font-family:var(--serif);font-size:1.5rem">${t('bQ2')}</h3>
      <div class="opts">${[['simple','bSimple'],['complete','bComplete'],['glow','bGlow']].map(([k,label]) =>
        `<button class="opt" type="button" data-bk="${k}"><b>${t(label)}</b><span>${t(label+'D')}</span></button>`).join('')}</div>
      <button class="chip" type="button" id="bBack" style="align-self:flex-start">${t('bBack')}</button></div>`;
  } else {
    const picks = recommend(bConcern, bKind);
    const total = picks.reduce((s,p) => s + p.price, 0);
    stage.innerHTML = `<div class="stack">
      <p class="kicker">${t('bResult')}</p>
      <ul class="steps-ed">${picks.map((p,i) => `<li><span class="no">0${i+1}</span>
        <span><b>${esc(title(p))}</b><p>${esc(p.kind[lang])} · ${frw(p.price)}</p></span></li>`).join('')}</ul>
      <div class="row" style="justify-content:space-between">
        <span class="price" style="font-size:1.3rem">${frw(total)}</span>
        <div class="row">
          <button class="btn" type="button" id="bAddAll">${t('bAddAll')}</button>
          <button class="chip" type="button" id="bRestart">${t('bRestart')}</button>
        </div>
      </div></div>`;
    $('bAddAll').addEventListener('click', () => {
      picks.forEach(p => addToBag(p.id)); toast(t('toastAdd')); openBag();
    });
    $('bRestart').addEventListener('click', () => { bStep = 0; bConcern = bKind = null; paintBuilder(); });
    return;
  }

  stage.querySelectorAll('[data-bc]').forEach(b => b.addEventListener('click', () => { bConcern = b.dataset.bc; bStep = 1; paintBuilder(); }));
  stage.querySelectorAll('[data-bk]').forEach(b => b.addEventListener('click', () => { bKind = b.dataset.bk; bStep = 2; paintBuilder(); }));
  $('bBack')?.addEventListener('click', () => { bStep = 0; paintBuilder(); });
}

/* deterministic: cleanse → hydrate → treat → protect, filtered by concern */
function recommend(concern, kind){
  const order = ['cleanse','hydrate','treat','protect'];
  const pick = cat => {
    const onConcern = CATALOG.filter(p => p.cat === cat && p.concerns.includes(concern) && p.stock !== 'out');
    const any = CATALOG.filter(p => p.cat === cat && p.stock !== 'out');
    const pool = onConcern.length ? onConcern : any;
    if (!pool.length) return null;
    if (kind === 'glow'){
      const bright = pool.find(p => p.concerns.includes('brightening'));
      if (bright) return bright;
    }
    return pool.sort((a,b) => (b.best||0)-(a.best||0) || a.price-b.price)[0];
  };
  let cats = kind === 'simple' ? ['cleanse','hydrate','protect'] : order;
  if (kind === 'glow') cats = ['cleanse','hydrate','treat','protect'];
  const out = cats.map(pick).filter(Boolean);
  if (kind === 'complete'){
    const extra = CATALOG.find(p => p.cat === 'treat' && !out.includes(p) && p.concerns.includes(concern) && p.stock !== 'out');
    if (extra) out.splice(3, 0, extra);
  }
  return out;
}

/* ── shop mounts ────────────────────────────────────────────────────── */
const F = { cat:'all', concern:'all', brand:'all', price:30000, inStock:false, sort:'featured', only:'all' };
function paintChips(){
  const cats = ['all','cleanse','hydrate','treat','protect'];
  $('fCat').innerHTML = cats.map(c => `<button class="chip" type="button" data-f="cat" data-v="${c}"
    aria-pressed="${F.cat===c}">${c==='all'?t('fAll'):t('cat'+c.charAt(0).toUpperCase()+c.slice(1))}</button>`).join('');
  $('fCon').innerHTML = ['all',...CONCERNS.map(c=>c.id)].map(c => `<button class="chip" type="button" data-f="concern" data-v="${c}"
    aria-pressed="${F.concern===c}">${c==='all'?t('fAll'):t('c'+c.charAt(0).toUpperCase()+c.slice(1))}</button>`).join('');
  const brands = ['all',...new Set(CATALOG.map(p => p.brand))];
  $('fBrand').innerHTML = brands.map(b => `<button class="chip" type="button" data-f="brand" data-v="${esc(b)}"
    aria-pressed="${F.brand===b}">${b==='all'?t('fAll'):esc(b)}</button>`).join('');
  $('fPrice').value = F.price;
  $('fPriceVal').textContent = frw(F.price);
  $('fStock').setAttribute('aria-pressed', F.inStock);
  $('fSort').value = F.sort;
}
function mountShop(){
  paintChips();
  // the chip rows are rebuilt on every change, so listen on the containers instead
  ['fCat','fCon','fBrand'].forEach(cid => $(cid).addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    F[b.dataset.f] = b.dataset.v; paintChips(); paintShop(); markNav();
  }));
  $('fPrice').addEventListener('input', e => { F.price = +e.target.value; $('fPriceVal').textContent = frw(F.price); paintShop(); });
  $('fStock').addEventListener('click', () => { F.inStock = !F.inStock; $('fStock').setAttribute('aria-pressed', F.inStock); paintShop(); });
  $('fSort').addEventListener('change', e => { F.sort = e.target.value; paintShop(); });
  $('clearF').addEventListener('click', () => {
    Object.assign(F, { cat:'all', concern:'all', brand:'all', price:30000, inStock:false, sort:'featured', only:'all' });
    paintChips(); paintShop(); markNav();
  });
  paintShop();
}
function paintShop(){
  const g = $('shopGrid'); if (!g) return;
  let list = CATALOG.filter(p =>
    (F.cat === 'all' || p.cat === F.cat) &&
    (F.concern === 'all' || p.concerns.includes(F.concern)) &&
    (F.brand === 'all' || p.brand === F.brand) &&
    (F.only === 'all' || (F.only === 'new' && p.new) || (F.only === 'best' && p.best)) &&
    p.price <= F.price &&
    (!F.inStock || p.stock !== 'out'));
  const S = { featured:(a,b)=>(b.best||0)-(a.best||0), new:(a,b)=>(b.new||0)-(a.new||0),
              low:(a,b)=>a.price-b.price, high:(a,b)=>b.price-a.price };
  list = list.slice().sort(S[F.sort]);
  $('count').textContent = list.length + ' ' + t('results');
  g.innerHTML = '';
  if (!list.length){
    g.style.display = 'block';
    g.innerHTML = `<div class="empty"><img src="https://images.pexels.com/photos/5202460/pexels-photo-5202460.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop" alt="" class="empty-img" onerror="this.style.display='none'"/><b>${t('noneH')}</b><p>${t('noneP')}</p></div>`;
    return;
  }
  g.style.display = '';
  list.forEach(p => g.appendChild(pcard(p)));
}

/* ── pdp mounts ─────────────────────────────────────────────────────── */
let pdpQty = 1;
function mountPDP(id){
  const p = byId(id); if (!p) return;
  pdpQty = 1;
  const rel = CATALOG.filter(x => x.id !== p.id && x.concerns.some(c => p.concerns.includes(c))).slice(0,4);
  const rg = $('relGrid'); if (rg) rel.forEach(x => rg.appendChild(pcard(x)));

  $('qMinus')?.addEventListener('click', () => { pdpQty = Math.max(1, pdpQty-1); $('qVal').textContent = pdpQty; });
  $('qPlus')?.addEventListener('click', () => { pdpQty = Math.min(9, pdpQty+1); $('qVal').textContent = pdpQty; });
  $('pdpAdd')?.addEventListener('click', () => { addToBag(p.id, pdpQty); toast(t('toastAdd')); openBag(); });

  $('gThumbs')?.addEventListener('click', e => {
    const b = e.target.closest('[data-g]'); if (!b) return;
    const i = +b.dataset.g;
    $('gThumbs').querySelectorAll('.gthumb').forEach(x => x.setAttribute('aria-pressed', x === b));
    $('gMain').innerHTML = `<img src="${p.image}" alt="${esc(p.brand + ' ' + p.name)}" class="gmain-img"/><span class="glow"></span>`;
  });
}

/* ── bag ────────────────────────────────────────────────────────────── */
function paintBag(){
  const n = bagCount();
  $('bagCount').textContent = n; $('bagCount').dataset.n = n;
  const body = $('bagBody'), foot = $('bagFoot');
  const ids = Object.keys(bag).filter(id => bag[id] > 0 && byId(id));
  body.innerHTML = '';
  if (!ids.length){
    foot.hidden = true;
    body.appendChild(el('div','empty',
      `${'<img src="https://images.pexels.com/photos/5202453/pexels-photo-5202453.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop" alt="" class="empty-img" onerror="this.style.display=\'none\'"/>'}<b>${t('emptyB')}</b><p>${t('emptyBp')}</p>
       <button class="btn btn-sm" type="button" id="emptyCta">${t('emptyCta')}</button>`));
    $('emptyCta').addEventListener('click', () => {
      closeBag(); location.hash = '#home';
      setTimeout(() => $('builder')?.scrollIntoView({ behavior:'smooth' }), 420);
    });
    return;
  }
  foot.hidden = false;
  for (const id of ids){
    const p = byId(id);
    body.appendChild(el('div','bline',
      `<div class="thumb"><img src="${p.image}" alt="${esc(p.brand + ' ' + p.name)}" class="bag-thumb-img" data-shape="${p.shape}" data-tint="${p.tint}" data-deep="${p.deep}" data-label="${esc(p.brand)}" onerror="vesselSwap(this)"/>
       <div class="mid"><b>${esc(title(p))}</b><span>${esc(p.size)}</span><span>${frw(p.price)}</span></div>
       <div class="mini"><button type="button" data-q="-" data-id="${id}" aria-label="minus">−</button>
       <b>${bag[id]}</b><button type="button" data-q="+" data-id="${id}" aria-label="plus">+</button></div>`));
  }
  const s = bagSum();
  $('subVal').textContent = frw(s);
  $('freeBar').style.width = Math.min(100, Math.round(s/FREE*100)) + '%';
  $('freeMsg').innerHTML = s >= FREE ? t('freeYes') : t('freeGo').replace('{x}', '<b>'+frw(FREE-s)+'</b>');
  $('orderBox').hidden = true;
}
$('bagBody').addEventListener('click', e => {
  const b = e.target.closest('[data-q]'); if (!b) return;
  const id = b.dataset.id;
  bag[id] += b.dataset.q === '+' ? 1 : -1;
  if (bag[id] <= 0) delete bag[id];
  persist(); paintBag();
});
const openBag = () => { $('bag').classList.add('on'); $('scrim').classList.add('on'); };
const closeBag = () => { $('bag').classList.remove('on'); $('scrim').classList.remove('on'); };
$('openBag').addEventListener('click', openBag);
$('closeBag').addEventListener('click', closeBag);
$('scrim').addEventListener('click', () => { closeBag(); closeSearch(); });
$('keepShopping').addEventListener('click', () => { closeBag(); if (currentRoute !== 'shop') location.hash = '#shop'; });

$('checkout').addEventListener('click', () => {
  const s = bagSum();
  const lines = Object.entries(bag).filter(([id]) => byId(id)).map(([id,q]) => {
    const p = byId(id); return `• ${q} × ${title(p)} (${p.size}) — ${frw(p.price*q)}`;
  });
  $('orderText').value = `NK Store — ${t('bagT')}\n\n${lines.join('\n')}\n\n${t('sub')}: ${frw(s)}\n` +
    `${t('fDelivery')}: ${s >= FREE ? 'Kigali — 0 Frw' : '—'}\n@nk.store_kgl`;
  $('orderBox').hidden = false;
  $('orderText').scrollIntoView({ block:'nearest', behavior:'smooth' });
});
$('copyOrder').addEventListener('click', async () => {
  const ta = $('orderText');
  try { await navigator.clipboard.writeText(ta.value); toast(t('toastCopy')); }
  catch { ta.removeAttribute('readonly'); ta.select(); ta.setAttribute('readonly',''); }
});

/* ── global delegation ──────────────────────────────────────────────── */
document.addEventListener('click', e => {
  const h = e.target.closest('[data-heart]');
  if (h){
    e.preventDefault(); e.stopPropagation();
    const id = h.dataset.heart;
    if (saved[id]) delete saved[id]; else saved[id] = 1;
    persist();
    document.querySelectorAll(`[data-heart="${id}"]`).forEach(x => x.setAttribute('aria-pressed', !!saved[id]));
    toast(saved[id] ? t('toastHeart') : t('toastUnheart'));
    return;
  }
  const a = e.target.closest('[data-add]');
  if (a && !a.disabled){
    e.preventDefault(); e.stopPropagation();
    addToBag(a.dataset.add);
    const was = a.textContent; a.textContent = t('added');
    setTimeout(() => { a.textContent = was; }, 1200);
    toast(t('toastAdd'));
    return;
  }
  const c = e.target.closest('[data-concern]');
  if (c){ F.concern = c.dataset.concern; }
  const g = e.target.closest('[data-go]');
  if (g){ location.hash = '#' + g.dataset.go; }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter'){
    const g = e.target.closest?.('[data-go]');
    if (g){ e.preventDefault(); location.hash = '#' + g.dataset.go; }
  }
  if (e.key === 'Escape'){ closeBag(); closeSearch(); }
});

/* ── search ─────────────────────────────────────────────────────────── */
const openSearch = () => { $('search').classList.add('on'); $('sInput').focus(); };
const closeSearch = () => { $('search').classList.remove('on'); };
$('openSearch').addEventListener('click', openSearch);
$('closeSearch').addEventListener('click', closeSearch);
$('sInput').addEventListener('input', () => {
  const q = $('sInput').value.trim().toLowerCase();
  const box = $('sResults');
  if (!q){ box.innerHTML = ''; return; }
  const hits = CATALOG.filter(p =>
    (title(p) + ' ' + p.kind[lang] + ' ' + p.concerns.join(' ') + ' ' + p.cat).toLowerCase().includes(q));
  if (!hits.length){ box.innerHTML = `<p class="lede">${t('searchNone')}</p>`; return; }
  box.innerHTML = '<div class="pgrid"></div>';
  const g = box.querySelector('.pgrid');
  hits.forEach(p => g.appendChild(pcard(p)));
});
$('search').addEventListener('click', e => {
  if (e.target.closest('[data-go]')) closeSearch();
});

$('openAcct').addEventListener('click', () => alertPanel(t('acctT'), t('acctP')));
function alertPanel(h, p){
  openBag();
  $('bagFoot').hidden = true;
  $('bagBody').innerHTML = `<div class="empty"><b>${esc(h)}</b><p>${esc(p)}</p>
    <a class="btn btn-sm" href="https://www.tiktok.com/@nk.store_kgl" target="_blank" rel="noopener">${t('sFollow')}</a>
    <button class="chip" type="button" id="backBag">${t('bagT')}</button></div>`;
  $('backBag').addEventListener('click', paintBag);
}

$('burger').addEventListener('click', () => { $('nav').classList.toggle('menu-open'); });
$('navLinks').addEventListener('click', e => {
  const a = e.target.closest('a'); if (!a) return;
  F.only = a.dataset.only || 'all';
  $('nav').classList.remove('menu-open');
  if (currentRoute === 'shop' && a.getAttribute('href') === '#shop'){ paintChips(); paintShop(); markNav(); }
});

/* ── chrome ─────────────────────────────────────────────────────────── */
function paintChrome(){
  document.documentElement.lang = lang;
  document.querySelectorAll('.langsw button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));

  $('navLinks').innerHTML = [['#shop','nShop','all'],['#shop','nNew','new'],['#shop','nBest','best'],
    ['#journal','nJournal',''],['#about','nAbout','']]
    .map(([h,k,only]) => `<a href="${h}"${only?` data-only="${only}"`:''}>${t(k)}</a>`).join('');

  $('announce').innerHTML = '';
  const msgs = [t('ann1'), t('ann2'), t('ann3'), t('ann4')];
  for (let i=0;i<2;i++) msgs.forEach(m => { const s = el('span', null, '✦&nbsp;&nbsp;' + m); $('announce').appendChild(s); });

  $('bagTitle').textContent = t('bagT');
  $('subLabel').textContent = t('sub');
  $('checkout').textContent = t('checkout');
  $('keepShopping').textContent = t('keep');
  $('copyOrder').textContent = t('copy');
  $('waNote').textContent = t('waN');
  $('sInput').placeholder = t('searchPh');
  $('fdemo').textContent = t('fdemo');

  $('fgrid').innerHTML = `
    <div><h4>${t('fShopT')}</h4><ul>
      <li><a href="#shop">${t('nShop')}</a></li><li><a href="#shop">${t('nBest')}</a></li>
      <li><a href="#journal">${t('nJournal')}</a></li><li><a href="#about">${t('nAbout')}</a></li></ul></div>
    <div><h4>${t('fCare')}</h4><ul>
      <li>${t('fDelivery')}</li><li>${t('fReturns')}</li><li>${t('fTrack')}</li></ul></div>
    <div><h4>${t('fFind')}</h4><ul>
      <li><a href="https://www.tiktok.com/@nk.store_kgl" target="_blank" rel="noopener">TikTok · @nk.store_kgl</a></li>
      <li><a href="https://www.instagram.com/nk.store_kgl" target="_blank" rel="noopener">Instagram</a></li>
      <li><span style="user-select:all">+250 7XX XXX XXX</span></li>
      <li>Kigali, Rwanda</li></ul></div>
    <div><h4>${t('fNews')}</h4>
      <form class="news" id="newsForm"><input id="newsEmail" type="email" placeholder="${t('fNewsPh')}" aria-label="${t('fNewsPh')}">
      <button type="submit">${t('fJoin')}</button></form>
      <p class="small" style="margin-top:9px;opacity:.6" id="newsHint"></p></div>`;

  $('newsForm').addEventListener('submit', e => { e.preventDefault(); $('newsHint').textContent = t('fNewsOk'); });

  paintBag();
  if (currentRoute) render();
  try { localStorage.setItem('nk.lang', lang); } catch {}
}
document.querySelectorAll('.langsw button').forEach(b =>
  b.addEventListener('click', () => { lang = b.dataset.lang; paintChrome(); }));

addEventListener('scroll', () => {
  $('nav').classList.toggle('solid', scrollY > 24);
}, { passive:true });

/* cursor follower, desktop only */
if (!REDUCED && matchMedia('(pointer:fine)').matches){
  const cur = $('cursor');
  addEventListener('pointermove', e => {
    cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px';
    cur.classList.add('on');
    cur.classList.toggle('big', !!e.target.closest('.pcard,.concern,.jcard,.tile,.opt'));
  }, { passive:true });
  addEventListener('pointerleave', () => cur.classList.remove('on'));
}

/* magnetic primary buttons, desktop only */
if (!REDUCED && matchMedia('(pointer:fine)').matches){
  document.addEventListener('pointermove', e => {
    const b = e.target.closest('.btn'); if (!b) return;
    const r = b.getBoundingClientRect();
    b.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.12}px,${(e.clientY-r.top-r.height/2)*.18}px)`;
  }, { passive:true });
  document.addEventListener('pointerout', e => {
    const b = e.target.closest('.btn'); if (b) b.style.transform = '';
  }, { passive:true });
}

try { const l = localStorage.getItem('nk.lang'); if (T[l]) lang = l; } catch {}
paintChrome();
render();
