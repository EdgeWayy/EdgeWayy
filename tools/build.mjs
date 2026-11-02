// Generates the receipt SVG segments into ../assets
// Run: node tools/build.mjs
// All colors / texts / project rows live in the CONFIG block below.
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
const SEED_TEXT = 'EDGEWAYY';
/* ───────────── /CONFIG ───────────── */

// Grid: 47 columns x 9px = 423px, centered in 480px.
const W = 480;
const CH = 9; // column advance at base font size
const FS = 14; // base font size
const NCOL = 47;
const X0 = (W - NCOL * CH) / 2; // 28.5
const RIGHT = X0 + NCOL * CH; // 451.5
const TH = 6; // torn edge height
const HALF = 6; // torn edge half-tooth width (45deg)
const FONT = "'Courier New', 'SF Mono', Consolas, monospace";

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = (n) => +n.toFixed(2);

// Text with exact advance (textLength) so layout is identical in every font.
function T(str, { x, y, size = FS, fill = C.ink, bold = false, adv }) {
  adv ??= (CH * size) / FS;
  const ls = adv - 0.6 * size;
  return (
    `<text x="${f(x)}" y="${y}" font-size="${size}" letter-spacing="${f(ls)}" ` +
    `textLength="${f(str.length * adv)}" lengthAdjust="spacing"` +
    `${fill !== C.ink ? ` fill="${fill}"` : ''}${bold ? ' font-weight="700"' : ''}>${esc(str)}</text>`
  );
}
const left = (s, y, o = {}) => T(s, { x: X0, y, ...o });
const right = (s, y, o = {}) => {
  const adv = o.adv ?? (CH * (o.size ?? FS)) / FS;
  return T(s, { x: RIGHT - s.length * adv, y, ...o });
};
const center = (s, y, o = {}) => {
  const adv = o.adv ?? (CH * (o.size ?? FS)) / FS;
  return T(s, { x: (W - s.length * adv) / 2, y, ...o });
};
// "NAME ......... VALUE" with dotted leader made of real dot glyphs on the grid.
function leader(l, r, y, o = {}) {
  const size = o.size ?? FS;
  const adv = o.adv ?? (CH * size) / FS;
  const startX = X0 + (l.length + 1) * adv;
  const endX = RIGHT - r.length * adv - adv;
  const n = Math.max(0, Math.floor((endX - startX) / adv + 1e-6));
  const slack = endX - startX - n * adv;
  return [
    left(l, y, o),
    n ? T('.'.repeat(n), { x: startX + slack, y, size, adv, fill: C.mute }) : '',
    right(r, y, o),
  ].join('\n    ');
}
const dashed = (y) =>
  `<line x1="${X0}" x2="${RIGHT}" y1="${y + 0.5}" y2="${y + 0.5}" stroke="${C.ink}" stroke-width="1" stroke-dasharray="5 4" shape-rendering="crispEdges"/>`;
const solid = (y, w = 1) =>
  `<line x1="${X0}" x2="${RIGHT}" y1="${y}" y2="${y}" stroke="${C.ink}" stroke-width="${w}" shape-rendering="crispEdges"/>`;

function paper(H, { top = false, bottom = false } = {}) {
  const pts = [];
  if (top) for (let i = 0; i <= W / HALF; i++) pts.push([i * HALF, i % 2 ? 0 : TH]);
  else pts.push([0, 0], [W, 0]);
  if (bottom) for (let i = W / HALF; i >= 0; i--) pts.push([i * HALF, i % 2 ? H : H - TH]);
  else pts.push([W, H], [0, H]);
  const d = 'M' + pts.map((p) => p.join(',')).join(' L') + ' Z';
  const y0 = top ? TH : 0;
  const y1 = bottom ? H - TH : H;
  let s = `<path d="${d}" fill="${C.paper}"/>\n  `;
  s += `<path d="M0.5,${y0} V${y1} M${W - 0.5},${y0} V${y1}" stroke="${C.edge}" stroke-width="1" fill="none" shape-rendering="crispEdges"/>`;
  if (top) {
    const z = pts.slice(0, W / HALF + 1);
    s += `\n  <polyline points="${z.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${C.edge}" stroke-width="1"/>`;
  }
  if (bottom) {
    const z = [];
    for (let i = 0; i <= W / HALF; i++) z.push([i * HALF, i % 2 ? H - 0.5 : H - TH]);
    s += `\n  <polyline points="${z.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${C.edge}" stroke-width="1"/>`;
  }
  return s;
}

function svg(H, body, opts = {}, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs ? `<defs>${defs}</defs>\n  ` : ''}${paper(H, opts)}
  <g font-family="${FONT}" fill="${C.ink}">
  ${body}
  </g>
</svg>
`;
}
const write = (name, s) => fs.writeFileSync(path.join(OUT, name), s);

/* ───────────── header ───────────── */
{
  const H = 194;
  const body = `<g clip-path="url(#print)"><g>
    <animateTransform attributeName="transform" type="translate" from="0 -16" to="0 0" dur="0.9s" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.7 0.2 1"/>
    ${center(HEADER.title, 44, { size: 20, bold: true, adv: 12.5 })}
    ${center(HEADER.city, 68, { fill: C.mute })}
    ${left(HEADER.date, 100)}
    ${right(HEADER.time, 100)}
    ${left(HEADER.receipt, 122)}
    ${left(HEADER.cashier, 144)}
    ${dashed(160)}
    ${left('ITEM', 184, { fill: C.mute, size: 12 })}
    ${right('STATUS', 184, { fill: C.mute, size: 12 })}
  </g></g>`;
  const defs = `<clipPath id="print"><rect x="0" y="0" width="${W}" height="${H}"><animate attributeName="height" from="0" to="${H}" dur="0.9s" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.7 0.2 1"/></rect></clipPath>`;
  write('header.svg', svg(H, body, { top: true }, defs));
}

/* ───────────── project rows ───────────── */
for (const p of PROJECTS) {
  write(p.file, svg(30, leader(p.name, p.status, 20, {}), {}));
}

/* ───────────── items (ingredients + services) ───────────── */
{
  const col2 = 24; // second column starts at grid col 24
  const rows = [];
  let y = 62;
  for (let i = 0; i < STACK.length; i += 2) {
    rows.push(T('- ' + STACK[i], { x: X0, y }));
    rows.push(T('- ' + STACK[i + 1], { x: X0 + col2 * CH, y }));
    y += 22;
  }
  const yDash = y - 22 + 18; // after last stack row
  const yServ = yDash + 28;
  const sv = SERVICES.map((s, i) => T('- ' + s, { x: X0, y: yServ + 24 + i * 22 })).join('\n    ');
  const H = yServ + 24 + (SERVICES.length - 1) * 22 + 16;
  const body = `${dashed(12)}
    ${left('INGREDIENTS', 38, { bold: true })}
    ${rows.join('\n    ')}
    ${dashed(yDash)}
    ${left('SERVICES', yServ, { bold: true })}
    ${sv}`;
  write('items.svg', svg(H, body));
}

/* ───────────── total + stamp ───────────── */
{
  const H = 182;
  const rows = TOTALS.map((t, i) => leader(t[0], t[1], 38 + i * 22)).join('\n    ');
  const big = { size: 20, bold: true, adv: 423 / 32 };
  const stamp = `<g transform="translate(338 142) rotate(-8)" opacity="0">
      <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.55;0.62;1" dur="1s"/>
      <g>
        <animateTransform attributeName="transform" type="scale" values="2;2;0.93;1" keyTimes="0;0.55;0.8;1" dur="1s"/>
        <rect x="-84" y="-21" width="168" height="42" rx="4" fill="none" stroke="${C.red}" stroke-width="3"/>
        <rect x="-78" y="-15" width="156" height="30" rx="2" fill="none" stroke="${C.red}" stroke-width="1"/>
        <text x="0" y="7.5" font-size="21" font-weight="700" letter-spacing="3" text-anchor="middle" fill="${C.red}">APPROVED</text>
      </g>
    </g>`;
  const body = `${dashed(12)}
    ${rows}
    ${solid(100, 1)}
    ${solid(103, 1)}
    ${leader('TOTAL', '1 SOLID DEVELOPER', 134, big)}
    ${stamp}`;
  write('total.svg', svg(H, body));
}

/* ───────────── contact (clickable segment) ───────────── */
{
  const H = 86;
  const handle = '@KRIEWOO';
  const line = 'TELEGRAM: ' + handle;
  const x0 = (W - line.length * CH) / 2;
  const hx = x0 + 10 * CH;
  const body = `${dashed(12)}
    ${center('THANK YOU FOR VISITING!', 44, { size: 16, bold: true })}
    ${T(line, { x: x0, y: 68 })}
    <rect x="${f(hx)}" y="73" width="${handle.length * CH - 1}" height="1" fill="${C.red}"/>`;
  write('contact.svg', svg(H, body));
}

/* ───────────── footer: barcode + tagline + cursor + torn bottom ───────────── */
{
  // seeded PRNG (FNV-1a -> mulberry32) so the barcode is stable and unique to the text
  let h = 2166136261;
  for (const ch of SEED_TEXT) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rnd = () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const U = 2;
  const total = 300;
  const x0 = (W - total) / 2;
  const bars = [];
  let x = 0;
  const bar = (w) => {
    w = Math.min(w, total - x);
    if (w > 0) bars.push(`<rect x="${x0 + x}" y="14" width="${w}" height="52"/>`);
    x += w;
  };
  // guard pattern, random body, guard pattern
  [1, 1, 1].forEach((u, i) => (i % 2 === 0 ? bar(u * U) : (x += u * U)));
  while (x < total - 10 * U) {
    bar((1 + Math.floor(rnd() * 3)) * U);
    x += (1 + Math.floor(rnd() * 3)) * U;
  }
  x = total - 5 * U;
  bar(U);
  x += U;
  bar(U);
  const tag = 'NO REFUNDS. ONLY FEATURES.';
  const sz = 12;
  const adv = (CH * sz) / FS;
  const tx = (W - (tag.length + 1) * adv) / 2;
  const H = 112;
  const body = `<g fill="${C.ink}">${bars.join('')}</g>
    ${T(tag, { x: tx, y: 90, size: sz, fill: C.mute })}
    <g>
      <animate attributeName="opacity" values="1;0" calcMode="discrete" dur="1.1s" repeatCount="indefinite"/>
      ${T('_', { x: tx + tag.length * adv, y: 90, size: sz, fill: C.red })}
    </g>`;
  write('footer.svg', svg(H, body, { bottom: true }));
}

console.log('built into', OUT);
