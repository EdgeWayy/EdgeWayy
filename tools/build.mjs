// Generates every receipt/slip SVG into ../assets
// Run: node tools/build.mjs
// Editable texts, colors and numbers live in the CONFIG block below.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets');

/* ───────────── CONFIG ───────────── */
const C = {
  paper: '#F4F1EA',
  ink: '#111111',
  mute: '#6B6B6B',
  red: '#E5322D',
  edge: '#D6D0C0', // subtle 1px paper edge
};
const SHADOW_OPACITY = 0.16; // flat drop shadow (ink color, low opacity)

const PROJECTS = [
  { file: 'row-coffee.svg', name: '1X COFFEE SHOP WEBSITE', status: 'DELIVERED' },
  { file: 'row-profit.svg', name: '1X PROFIT GYM WEBSITE', status: 'DELIVERED' },
  { file: 'row-billz.svg', name: '1X BILLZ STORE WEBSITE', status: 'IN PROGRESS' },
  { file: 'row-mafia.svg', name: '1X TELEGRAM MAFIA MINI APP', status: 'LIVE' },
];

const HEADER = {
  title: 'EDGEWAYY WEB STUDIO',
  city: 'NAVOI, UZBEKISTAN',
  date: '02.11.2026',
  time: '14:32',
  receipt: 'RECEIPT NO. 0001',
  cashier: 'CASHIER: AKBAR',
};

const STACK = ['HTML', 'CSS', 'JAVASCRIPT', 'NODE.JS', 'TELEGRAM BOTS', 'GODOT', 'THREE.JS', 'CLAUDE CODE'];
const SERVICES = ['WEBSITES FOR BUSINESS', 'TELEGRAM BOTS', 'ADMIN PANELS', 'PAYMENTS INTEGRATION (CLICK/PAYME/UZUM)'];
const TOTALS = [
  ['SUBTOTAL', '4 PROJECTS'],
  ['BUGS', '0'],
  ['COFFEE CONSUMED', 'TOO MUCH'],
];

// Left slip
const ORDER = {
  title: 'HOW I WORK',
  sub: 'ORDER TICKET',
  no: 'NO. 0042',
  steps: [
    ['01 BRIEF', 'We talk. You tell me what you need.'],
    ['02 DESIGN', 'I sketch it. You pick the look.'],
    ['03 BUILD', 'Clean code, fast pages, no bloat.'],
    ['04 LAUNCH', 'It goes live. I stay on call.'],
  ],
  footer: 'AVG. DELIVERY: FAST',
};
// Right slip
const STATS = {
  title: 'STATS',
  sub: 'STUDIO COUNTER',
  rows: [
    ['PROJECTS', '4'],
    ['BOTS', '1'],
    ['YEARS CODING', '1'],
    ['COFFEE', '∞'],
  ],
  open: 'OPEN FOR ORDERS',
};
const TG = { label: 'TELEGRAM', handle: '@KRIEWOO' };
/* ───────────── /CONFIG ───────────── */

const FONT = "'Courier New', 'SF Mono', Consolas, monospace";
// Line pitch for every block. Rows are separate <img> segments; GitHub gives inline images a 24px
// line box, so a row image must stay >= 24px after scaling or white gaps appear. Keep this >= 30.
const LINE = 30;
const ROW_M = 80; // height of the mobile row variant
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = (n) => +n.toFixed(2);
const write = (name, s) => fs.writeFileSync(path.join(OUT, name), s);

function prng(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Character grid: every text has an exact advance (textLength), so columns and
// leaders are identical in Courier New, SF Mono and Consolas.
function grid({ width, margin, adv, fs }) {
  const X0 = margin;
  const RIGHT = width - margin;
  const A = (size) => (adv * size) / fs;
  const T = (str, { x, y, size = fs, fill = C.ink, bold = false, adv: a } = {}) => {
    a ??= A(size);
    return (
      `<text x="${f(x)}" y="${y}" font-size="${size}" letter-spacing="${f(a - 0.6 * size)}" ` +
      `textLength="${f(str.length * a)}" lengthAdjust="spacing"` +
      `${fill !== C.ink ? ` fill="${fill}"` : ''}${bold ? ' font-weight="700"' : ''}>${esc(str)}</text>`
    );
  };
  const left = (s, y, o = {}) => T(s, { x: X0, y, ...o });
  const right = (s, y, o = {}) => T(s, { x: (o.edge ?? RIGHT) - s.length * (o.adv ?? A(o.size ?? fs)), y, ...o });
  const center = (s, y, o = {}) => T(s, { x: (width - s.length * (o.adv ?? A(o.size ?? fs))) / 2, y, ...o });
  // "NAME ....... VALUE" with a leader of real dot glyphs sitting on the grid
  const leader = (l, r, y, o = {}) => {
    const a = o.adv ?? A(o.size ?? fs);
    const edge = o.edge ?? RIGHT;
    const startX = X0 + (l.length + 1) * a;
    const endX = edge - r.length * a - a;
    const n = Math.max(0, Math.floor((endX - startX) / a + 1e-6));
    const slack = endX - startX - n * a;
    const { fill: _f, ...rest } = o;
    return [
      left(l, y, o),
      n ? T('.'.repeat(n), { x: startX + slack, y, size: o.size ?? fs, adv: a, fill: C.mute }) : '',
      right(r, y, o),
    ]
      .filter(Boolean)
      .join('\n    ');
  };
  // dashes are spaced so the first dash starts at X0 and the last ends exactly at RIGHT
  const dashed = (y) => {
    const L = RIGHT - X0;
    const d = Math.round(fs * 0.36);
    const n = Math.round((L + d * 0.8) / (d * 1.8));
    const g = (L - n * d) / (n - 1);
    return `<line x1="${X0}" x2="${RIGHT}" y1="${y + 0.5}" y2="${y + 0.5}" stroke="${C.ink}" stroke-width="1" stroke-dasharray="${d} ${f(g)}"/>`;
  };
  const solid = (y) =>
    `<line x1="${X0}" x2="${RIGHT}" y1="${y}" y2="${y}" stroke="${C.ink}" stroke-width="1" shape-rendering="crispEdges"/>`;
  return { X0, RIGHT, A, T, left, right, center, leader, dashed, solid, adv, fs, width };
}

// Torn paper: straight sides, 45deg zigzag top and/or bottom.
function paperParts(Wp, H, { top = false, bottom = false, half, th }) {
  const pts = [];
  const n = Wp / half;
  if (top) for (let i = 0; i <= n; i++) pts.push([i * half, i % 2 ? 0 : th]);
  else pts.push([0, 0], [Wp, 0]);
  if (bottom) for (let i = n; i >= 0; i--) pts.push([i * half, i % 2 ? H : H - th]);
  else pts.push([Wp, H], [0, H]);
  const d = 'M' + pts.map((p) => p.join(',')).join(' L') + ' Z';
  const y0 = top ? th : 0;
  const y1 = bottom ? H - th : H;
  let edges = `<path d="M0.5,${y0} V${y1} M${Wp - 0.5},${y0} V${y1}" stroke="${C.edge}" stroke-width="1" fill="none" shape-rendering="crispEdges"/>`;
  if (top) {
    const z = [];
    for (let i = 0; i <= n; i++) z.push([i * half, i % 2 ? 0.5 : th]);
    edges += `\n  <polyline points="${z.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${C.edge}" stroke-width="1"/>`;
  }
  if (bottom) {
    const z = [];
    for (let i = 0; i <= n; i++) z.push([i * half, i % 2 ? H - 0.5 : H - th]);
    edges += `\n  <polyline points="${z.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${C.edge}" stroke-width="1"/>`;
  }
  return { d, edges };
}

/* ───────────── main receipt segments (paper 480 + 6px shadow = 486 wide) ───────────── */
const W = 480;
const SW = 4; // shadow offset x
const SH = 3; // shadow offset y
const VW = W + SW;
const G = grid({ width: W, margin: 28.5, adv: 9, fs: 14 });
const { X0, RIGHT } = G;
const ARROW_EDGE = RIGHT - 3 * 9; // status column right edge; "->" sits after it

function svg(H, body, opts = {}, defs = '') {
  const { d, edges } = paperParts(W, H, { ...opts, half: 6, th: 6 });
  const vbH = H + (opts.bottom ? SH : 0);
  const shadow =
    `<g fill="${C.ink}" fill-opacity="${SHADOW_OPACITY}">` +
    `<path d="${d}" transform="translate(${SW} ${SH})"/>` +
    (opts.top ? '' : `<rect x="${W}" y="0" width="${SW}" height="${SH}"/>`) +
    `</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${VW}" height="${vbH}" viewBox="0 0 ${VW} ${vbH}">
  ${defs ? `<defs>${defs}</defs>\n  ` : ''}${shadow}
  <path d="${d}" fill="${C.paper}"/>
  ${edges}
  <g font-family="${FONT}" fill="${C.ink}">
  ${body}
  </g>
</svg>
`;
}

/* header: prints in from the top */
{
  const H = 192;
  const body = `<g clip-path="url(#print)"><g>
    <animateTransform attributeName="transform" type="translate" from="0 -16" to="0 0" dur="0.9s" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.7 0.2 1"/>
    ${G.center(HEADER.title, 44, { size: 20, bold: true, adv: 12.5 })}
    ${G.center(HEADER.city, 68, { fill: C.mute })}
    ${G.left(HEADER.date, 100)}
    ${G.right(HEADER.time, 100)}
    ${G.left(HEADER.receipt, 122)}
    ${G.left(HEADER.cashier, 144)}
    ${G.dashed(160)}
    ${G.left('ITEM', 182, { fill: C.mute, size: 12 })}
    ${G.right('STATUS', 182, { fill: C.mute, size: 12, edge: ARROW_EDGE })}
  </g></g>`;
  const defs = `<clipPath id="print"><rect x="0" y="0" width="${VW}" height="${H}"><animate attributeName="height" from="0" to="${H}" dur="0.9s" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.7 0.2 1"/></rect></clipPath>`;
  write('header.svg', svg(H, body, { top: true }, defs));
}

/* project rows: name .... STATUS ->, thin red underline under the name */
for (const p of PROJECTS) {
  const body = `${G.leader(p.name, p.status, 20, { edge: ARROW_EDGE })}
    <rect x="${X0}" y="24" width="${p.name.length * 9 - 1}" height="1" fill="${C.red}"/>
    ${G.T('->', { x: RIGHT - 2 * 9, y: 20, fill: C.red, bold: true })}`;
  write(p.file, svg(LINE, body));
  // Taller twin served to narrow screens via <picture>: keeps the scaled image >= 24px so no gaps open up.
  write(p.file.replace('.svg', '-m.svg'), svg(ROW_M, `<g transform="translate(0 ${(ROW_M - LINE) / 2})">${body}</g>`));
}

/* items: ingredients + services */
{
  const col2 = 24;
  const rows = [];
  let y = 68;
  for (let i = 0; i < STACK.length; i += 2) {
    rows.push(G.T('- ' + STACK[i], { x: X0, y }));
    rows.push(G.T('- ' + STACK[i + 1], { x: X0 + col2 * 9, y }));
    y += LINE;
  }
  const yDash = y - LINE + 20;
  const yServ = yDash + 28;
  const sv = SERVICES.map((s, i) => G.T('- ' + s, { x: X0, y: yServ + LINE + i * LINE })).join('\n    ');
  const H = yServ + LINE + (SERVICES.length - 1) * LINE + 18;
  const body = `${G.dashed(10)}
    ${G.left('INGREDIENTS', 38, { bold: true })}
    ${rows.join('\n    ')}
    ${G.dashed(yDash)}
    ${G.left('SERVICES', yServ, { bold: true })}
    ${sv}`;
  write('items.svg', svg(H, body));
}

/* total + rubber stamp (visible by default; the animation only plays the pop) */
{
  const H = 208;
  const rows = TOTALS.map((t, i) => G.leader(t[0], t[1], 38 + i * LINE)).join('\n    ');
  const big = { size: 20, bold: true, adv: 423 / 32 };
  const stamp = `<g transform="translate(334 166) rotate(-8)">
      <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.55;0.62;1" dur="1s" fill="freeze"/>
      <g>
        <animateTransform attributeName="transform" type="scale" values="2;2;0.93;1" keyTimes="0;0.55;0.8;1" dur="1s" fill="freeze"/>
        <rect x="-84" y="-21" width="168" height="42" rx="4" fill="none" stroke="${C.red}" stroke-width="3"/>
        <rect x="-78" y="-15" width="156" height="30" rx="2" fill="none" stroke="${C.red}" stroke-width="1"/>
        <text x="0" y="7.5" font-size="21" font-weight="700" letter-spacing="3" text-anchor="middle" fill="${C.red}">APPROVED</text>
      </g>
    </g>`;
  const body = `${G.dashed(10)}
    ${rows}
    ${G.solid(118)}
    ${G.solid(121)}
    ${G.leader('TOTAL', '1 SOLID DEVELOPER', 154, big)}
    ${stamp}`;
  write('total.svg', svg(H, body));
}

/* contact (clickable segment) */
{
  const H = 92;
  const handle = '@KRIEWOO';
  const line = 'TELEGRAM: ' + handle;
  const x0 = (W - line.length * 9) / 2;
  const hx = x0 + 10 * 9;
  const body = `${G.dashed(12)}
    ${G.center('THANK YOU FOR VISITING!', 44, { size: 16, bold: true })}
    ${G.T(line, { x: x0, y: 74 })}
    <rect x="${f(hx)}" y="79" width="${handle.length * 9 - 1}" height="1" fill="${C.red}"/>`;
  write('contact.svg', svg(H, body));
}

function barcode(seed, x0, y, total, h, U = 2) {
  const rnd = prng(seed);
  const bars = [];
  let x = 0;
  const bar = (w) => {
    w = Math.min(w, total - x);
    if (w > 0) bars.push(`<rect x="${x0 + x}" y="${y}" width="${w}" height="${h}"/>`);
    x += w;
  };
  bar(U); x += U; bar(U); x += U; bar(U); x += U;
  while (x < total - 10 * U) {
    bar((1 + Math.floor(rnd() * 3)) * U);
    x += (1 + Math.floor(rnd() * 3)) * U;
  }
  x = total - 5 * U;
  bar(U); x += U; bar(U);
  return bars.join('');
}

// QR-like 21x21 pattern: three finder squares, one alignment square, seeded noise
function qr(seed, x0, y0, m = 3) {
  const rnd = prng(seed);
  const N = 21;
  const g = Array.from({ length: N }, () => Array(N).fill(null));
  const finder = (ox, oy) => {
    for (let i = -1; i <= 7; i++)
      for (let j = -1; j <= 7; j++) {
        const yy = oy + i, xx = ox + j;
        if (yy < 0 || yy >= N || xx < 0 || xx >= N) continue;
        const inside = i >= 0 && i <= 6 && j >= 0 && j <= 6;
        const ring = i === 0 || i === 6 || j === 0 || j === 6;
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        g[yy][xx] = inside && (ring || core) ? 1 : 0;
      }
  };
  finder(0, 0); finder(14, 0); finder(0, 14);
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 5; j++)
      g[16 + i][16 + j] = i === 0 || i === 4 || j === 0 || j === 4 || (i === 2 && j === 2) ? 1 : 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (g[i][j] === null) g[i][j] = rnd() < 0.5 ? 1 : 0;
  const rects = [];
  for (let i = 0; i < N; i++) {
    let j = 0;
    while (j < N) {
      if (!g[i][j]) { j++; continue; }
      let k = j;
      while (k < N && g[i][k]) k++;
      rects.push(`<rect x="${x0 + j * m}" y="${y0 + i * m}" width="${(k - j) * m}" height="${m}"/>`);
      j = k;
    }
  }
  return rects.join('');
}

// Hand-drawn style "Akbar" (24-unit box ~ 112 x 44), strokes only
const SIGNATURE =
  'M3,36 C9,28 15,11 20,4 C23,12 25,28 30,36 M11,26 C17,23 23,24 31,23 ' +
  'M37,34 C38,22 39,12 39,3 M39,25 C45,19 50,15 53,12 M43,23 C47,27 51,32 57,34 ' +
  'M61,34 C61,23 62,12 63,3 M62,28 C67,20 75,20 75,28 C75,36 65,38 62,30 ' +
  'M88,24 C81,21 78,31 84,34 C90,35 91,27 91,22 C91,28 91,32 95,34 ' +
  'M99,33 C100,27 101,24 102,22 C102,26 106,22 111,24 ' +
  'M1,40 C30,45 72,41 113,37';

/* footer: signature, barcode + QR, tagline, blinking cursor, torn bottom */
{
  const H = 180;
  const tag = 'NO REFUNDS. ONLY FEATURES.';
  const sz = 12;
  const adv = (9 * sz) / 14;
  const tx = (W - (tag.length + 1) * adv) / 2;
  const bx = 71;
  const body = `${G.T('X', { x: 48, y: 46, fill: C.mute, bold: true })}
    <line x1="64" x2="262" y1="46.5" y2="46.5" stroke="${C.mute}" stroke-width="1" shape-rendering="crispEdges"/>
    <path d="${SIGNATURE}" transform="translate(76 10)" fill="none" stroke="${C.ink}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    <g fill="${C.ink}">${barcode('EDGEWAYY', bx, 74, 250, 63)}${qr('KRIEWOO', bx + 250 + 24, 74)}</g>
    ${G.T(tag, { x: tx, y: 162, size: sz, fill: C.mute })}
    <g>
      <animate attributeName="opacity" values="1;0" calcMode="discrete" dur="1.1s" repeatCount="indefinite"/>
      ${G.T('_', { x: tx + tag.length * adv, y: 162, size: sz, fill: C.red })}
    </g>`;
  write('footer.svg', svg(H, body, { bottom: true }));
}

/* ───────────── side slips (tilted papers lying on the desk) ───────────── */
const SLW = 230; // slip paper width
const PAD = 16; // room for rotation + shadow inside the viewBox
const SG = grid({ width: SLW, margin: 16, adv: 6.6, fs: 11 });

function wrap(text, max) {
  const out = [];
  let cur = '';
  for (const w of text.toUpperCase().split(' ')) {
    if ((cur + ' ' + w).trim().length > max) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) out.push(cur);
  return out;
}

function slip(name, Hs, angle, body, { dy = 0, defs = '' } = {}) {
  const { d, edges } = paperParts(SLW, Hs, { top: true, bottom: true, half: 5, th: 5 });
  const w = SLW + 2 * PAD;
  const h = Hs + 2 * PAD + dy;
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${defs ? `<defs>${defs}</defs>\n  ` : ''}<g transform="translate(${PAD} ${PAD + dy}) rotate(${angle} ${SLW / 2} ${Hs / 2})">
  <path d="${d}" transform="translate(3 3)" fill="${C.ink}" fill-opacity="${SHADOW_OPACITY}"/>
  <path d="${d}" fill="${C.paper}"/>
  ${edges}
  <g font-family="${FONT}" fill="${C.ink}">
  ${body}
  </g>
  </g>
</svg>
`;
  write(name, s);
}

/* left: HOW I WORK order ticket */
{
  let y = 34;
  const parts = [
    SG.center(ORDER.title, y + 4, { size: 16, bold: true, adv: 9.6 }),
    SG.left(ORDER.sub, y + 24, { fill: C.mute, size: 10, adv: 6 }),
    SG.right(ORDER.no, y + 24, { fill: C.mute, size: 10, adv: 6 }),
    SG.dashed(y + 36),
  ];
  y += 36 + 28;
  for (const [t, desc] of ORDER.steps) {
    parts.push(SG.left(t, y, { bold: true }));
    const lines = wrap(desc, 26);
    lines.forEach((l, i) => parts.push(SG.T(l, { x: SG.X0 + 3 * 6.6, y: y + 15 + i * 13, fill: C.mute })));
    y += 15 + lines.length * 13 + 14;
  }
  parts.push(SG.dashed(y - 6));
  parts.push(SG.center(ORDER.footer, y + 22, { bold: true }));
  const Hs = y + 22 + 22;
  slip('slip-order.svg', Hs, -1.5, parts.join('\n    '), { dy: 8 });
}

/* right: STATS slip */
{
  const parts = [
    SG.center(STATS.title, 38, { size: 16, bold: true, adv: 9.6 }),
    SG.center(STATS.sub, 56, { fill: C.mute, size: 10, adv: 6 }),
    SG.dashed(68),
  ];
  STATS.rows.forEach((r, i) => parts.push(SG.leader(r[0], r[1], 94 + i * 22)));
  const yd = 94 + (STATS.rows.length - 1) * 22 + 16;
  parts.push(SG.dashed(yd));
  parts.push(SG.left(STATS.open, yd + 26, { bold: true }));
  parts.push(
    `<circle cx="${SG.RIGHT - 4}" cy="${yd + 22}" r="3.5" fill="${C.red}"><animate attributeName="opacity" values="1;0.15" calcMode="discrete" dur="1.4s" repeatCount="indefinite"/></circle>`
  );
  slip('slip-stats.svg', yd + 26 + 22, 1.5, parts.join('\n    '), { dy: 28 });
}

/* right: telegram ticket (clickable) with mini barcode */
{
  const hAdv = 10.8;
  const hx = (SLW - TG.handle.length * hAdv) / 2;
  const parts = [
    SG.center(TG.label, 32, { fill: C.mute, size: 10, adv: 6 }),
    SG.T(TG.handle, { x: hx, y: 56, size: 18, bold: true, adv: hAdv }),
    `<rect x="${f(hx)}" y="62" width="${TG.handle.length * hAdv - 1}" height="1.5" fill="${C.red}"/>`,
    `<g fill="${C.ink}">${barcode('KRIEWOO', (SLW - 150) / 2, 74, 150, 22, 2)}</g>`,
  ];
  slip('slip-telegram.svg', 112, -1, parts.join('\n    '), { dy: 6 });
}

console.log('built into', OUT);

/* tools/preview.html: README markup + GitHub-like table styling, so you can check layout locally.
   Options: ?bg=dark|light   ?w=888 (container width, 358 = phone) */
{
  const root = path.resolve(OUT, '..');
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8').replaceAll('src="assets/', 'src="../assets/').replaceAll('srcset="assets/', 'srcset="../assets/');
  const html = `<!doctype html>
<meta charset="utf-8">
<title>Receipt preview</title>
<style>
  body { margin: 0; padding: 16px 0; font: 14px/1.5 sans-serif; }
  #root { margin: 0 auto; }
  table { border-collapse: collapse; width: 100%; }
  td { padding: 6px 13px; border: 1px solid #d0d7de; }
  img { max-width: 100%; }
  #m { position: fixed; top: 4px; left: 4px; font: 11px monospace; color: #888; white-space: pre; }
</style>
<div id="m"></div>
<div id="root">
${readme}</div>
<script>
  const q = new URLSearchParams(location.search);
  document.body.style.background = q.get('bg') === 'dark' ? '#0d1117' : '#fff';
  document.getElementById('root').style.width = (q.get('w') || 888) + 'px';
  addEventListener('load', () => {
    const imgs = [...document.querySelectorAll('td:nth-child(2) img')].map(i => i.getBoundingClientRect());
    const gaps = imgs.slice(1).map((r, k) => (r.top - imgs[k].bottom).toFixed(2));
    document.getElementById('m').textContent = q.get('dbg') ? 'cells: ' + [...document.querySelectorAll('td')].map(t => t.getBoundingClientRect().width.toFixed(0)).join('/') + ' table: ' + document.querySelector('table').getBoundingClientRect().width.toFixed(0) + ' main img: ' + imgs[0].width.toFixed(1) + ' row gaps: ' + gaps.slice(0,4).join(',') : '';
  });
</script>
`;
  fs.writeFileSync(path.join(root, 'tools', 'preview.html'), html);
}
