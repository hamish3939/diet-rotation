import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import retailerData from "../data/retailer-products.json";

/* ──────────────────────────────────────────────────────────
   ONE DAY. Swappable proteins.
   Snack bowl: tuna | chicken      Main: steak | salmon | gyg
   Shake + yoghurt bowl are fixed.
   Macros from the diet-rotation app + verified product panels.
   Fibre (g) and sodium (mg) added — sodium especially is a
   brand-variable estimate; treat as a guide, not gospel.

   UI: blobitecture style — pure-monochrome white neumorphism.
   No hue anywhere; depth comes from light + shadow only.
   Helvetica Light for human text, Courier for // micro-labels.
   ────────────────────────────────────────────────────────── */

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'Courier New', Courier, monospace";
const BG = "#e9ebf1"; // literal for <meta theme-color>

// semantic tokens (resolve to the :root custom properties in STYLES)
const c = {
  bg: "var(--bg)", ink: "var(--ink)",
  tx: "var(--tx)", tx2: "var(--tx-2)", tx3: "var(--tx-3)",
  line: "var(--line)", onInk: "var(--on-ink)",
};
// neumorphic shadow recipes (the signature)
const SH = {
  out: "var(--shadow-out)", outSm: "var(--shadow-out-sm)", hero: "var(--shadow-hero)",
  in: "var(--shadow-in)", inSm: "var(--shadow-in-sm)", ink: "var(--shadow-ink)",
};
const card = { background: c.bg, borderRadius: 18, boxShadow: SH.out, padding: 20, marginBottom: 18 };

const STYLES = `
  :root{
    --bg:#e9ebf1;--hi:#ffffff;--lo:#c2c6d4;--lo2:#cccfdc;
    --ink:#0d0d0c;--tx:#5c5b66;--tx-2:#8b8a96;--tx-3:#a9a8b4;
    --line:#d4d7e0;--on-ink:#ffffff;--focus-ring:rgba(13,13,12,.32);
    --ease:cubic-bezier(.2,.7,.2,1);
    --shadow-out:-7px -7px 16px var(--hi),7px 7px 16px var(--lo);
    --shadow-out-sm:-4px -4px 9px var(--hi),4px 4px 9px var(--lo2);
    --shadow-out-hover:-9px -9px 22px var(--hi),9px 9px 22px var(--lo);
    --shadow-hero:-12px -12px 30px var(--hi),14px 14px 34px var(--lo);
    --shadow-ink:6px 6px 14px var(--lo),-6px -6px 14px var(--hi);
    --shadow-ink-hover:9px 9px 22px var(--lo),-9px -9px 22px var(--hi);
    --shadow-in:inset 5px 5px 11px var(--lo),inset -5px -5px 11px var(--hi);
    --shadow-in-sm:inset 3px 3px 6px var(--lo),inset -3px -3px 6px var(--hi);
  }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  html,body{margin:0;padding:0;background:var(--bg);-webkit-font-smoothing:antialiased;}
  .b-btn{transition:transform .25s var(--ease),box-shadow .25s var(--ease);}
  .b-btn[data-v="primary"]:hover:not(:disabled){transform:translateY(-3px);box-shadow:var(--shadow-ink-hover);}
  .b-btn[data-v="ghost"]:hover:not(:disabled){transform:translateY(-2px);box-shadow:var(--shadow-out-hover);}
  .b-btn[data-v="ghost"]:active:not(:disabled){transform:none;box-shadow:var(--shadow-in-sm);}
  .b-step{transition:transform .18s var(--ease),box-shadow .18s var(--ease),color .18s var(--ease);}
  .b-step:hover{transform:translateY(-1px);box-shadow:var(--shadow-out-hover);}
  .b-step:active{transform:none;box-shadow:var(--shadow-in-sm)!important;color:var(--ink)!important;}
  .b-row{transition:transform .25s var(--ease),box-shadow .25s var(--ease);}
  .b-row:hover{transform:translateY(-2px);box-shadow:var(--shadow-out-hover);}
  .b-row:active{transform:none;box-shadow:var(--shadow-in-sm);}
  .b-seg{transition:color .2s var(--ease),box-shadow .2s var(--ease);}
  .b-x{transition:color .18s var(--ease);}
  .b-x:hover{color:var(--ink);}
  button:focus-visible{outline:3px solid var(--focus-ring);outline-offset:3px;}
  @media (prefers-reduced-motion:reduce){
    .b-btn,.b-row,.b-step{transition:none!important;}
    .b-btn:hover,.b-row:hover,.b-step:hover{transform:none!important;}
    *{transition-duration:.001s!important;}
  }
`;

// per-serving: p/c/f grams, cal kcal, fib grams, sug = ADDED sugar grams, sod mg, veg = vegetable grams
const sum = (items) =>
  items.reduce((a, i) => ({
    p: a.p + i.p, c: a.c + i.c, f: a.f + i.f, cal: a.cal + i.cal,
    fib: a.fib + (i.fib || 0), sug: a.sug + (i.sug || 0), sod: a.sod + (i.sod || 0), veg: a.veg + (i.veg || 0),
  }), { p: 0, c: 0, f: 0, cal: 0, fib: 0, sug: 0, sod: 0, veg: 0 });

// ── Fixed blocks ────────────────────────────────────────────
// shake almond milk scales with powder dose: 2 tbsp powder → 333ml, otherwise 500ml
const ALMOND_500 = { name: "So Good HP almond milk", note: "500 ml", p: 20, c: 2, f: 11, cal: 194, fib: 2, sug: 1, sod: 240 };
const ALMOND_333 = { name: "So Good HP almond milk", note: "333 ml", p: 13, c: 1, f: 7, cal: 129, fib: 1, sug: 1, sod: 160 };
const almondMilk = (tbsp) => (tbsp === 2 ? ALMOND_333 : ALMOND_500);
const SHAKE_EXTRAS = [
  { name: "Banana", note: "1 medium", p: 1, c: 27, f: 0, cal: 105, fib: 3, sug: 0, sod: 1 },
  { name: "Frozen baby spinach", note: "1 portion · 100g", p: 3, c: 1, f: 0.5, cal: 25, fib: 2, sug: 0, sod: 65, veg: 100 },
  { name: "Creatine", note: "5 g", p: 0, c: 0, f: 0, cal: 0, fib: 0, sug: 0, sod: 0 },
];
// Nature's Way Instant Natural Protein per tbsp (~17.5g; label serve = 35g / 2 tbsp)
const POWDER_TBSP = { p: 13.2, c: 2.3, f: 0.7, cal: 68, fib: 0.25, sug: 1.7, sod: 122 };
const powderItem = (n) => ({
  name: "Nature's Way protein (choc)", note: `${n} tbsp · ${Math.round(n * 17.5)}g · auto`,
  p: Math.round(POWDER_TBSP.p * n), c: Math.round(POWDER_TBSP.c * n), f: +(POWDER_TBSP.f * n).toFixed(1),
  cal: Math.round(POWDER_TBSP.cal * n), fib: Math.round(POWDER_TBSP.fib * n), sug: Math.round(POWDER_TBSP.sug * n), sod: Math.round(POWDER_TBSP.sod * n),
});
const YOG_BASE = [
  { name: "Cocobella coconut yoghurt", note: "½ tub · 250g · rotating flavours", p: 3, c: 20, f: 25, cal: 338, fib: 2, sug: 13, sod: 30 },
];
// oat clusters flex 1–2 cups when extra carbs are needed to reach ~3k
const clustersItem = (n) => ({ name: "Oat clusters (any brand)", note: `${n} cup${n > 1 ? "s" : ""} · ${50 * n}g`, p: 4 * n, c: 32 * n, f: 6 * n, cal: 210 * n, fib: 4 * n, sug: 7 * n, sod: 45 * n });
// banana count in the yoghurt bowl flexes with the carb choice (potato day = 1, rice day = 2)
const bananaItem = (n) => ({ name: "Banana", note: `${n} medium`, p: 1 * n, c: 27 * n, f: 0, cal: 105 * n, fib: 3 * n, sug: 0, sod: 1 * n });
const RICE = { name: "Macro brown rice & lentils", note: "1 pouch · 250g", p: 12, c: 56, f: 7, cal: 350, fib: 10, sug: 0, sod: 520 };
const VEG = { name: "Frozen mixed vegetables", note: "250 g", p: 5, c: 12, f: 1, cal: 100, fib: 6, sug: 0, sod: 35, veg: 250 };
const POTATO_500 = { p: 10, c: 75, f: 1, cal: 360, fib: 10, sug: 0, sod: 25 }; // plain baby potatoes per 500g
const NUTTELEX = { f: 5.5, cal: 50, sod: 40 };                                 // ½ tbsp buttery spread (always with potato)
const RICE_POUCH = { p: 10, c: 75, f: 6, cal: 410, fib: 7, sug: 0, sod: 25 };  // Macro microwave rice per 250g pouch
const CARB = { potato: { label: "Potato" }, rice: { label: "Rice" } };
// carb side auto-sized in whole increments (rice = pouches, potato = 500g steps). Potato always carries ½ tbsp Nuttelex.
function carbItem(carb, n) {
  if (carb === "potato") return {
    name: "Baby potatoes + Nuttelex", note: `${500 * n}g · ½ tbsp Nuttelex`,
    p: POTATO_500.p * n, c: POTATO_500.c * n, f: POTATO_500.f * n + NUTTELEX.f,
    cal: POTATO_500.cal * n + NUTTELEX.cal, fib: POTATO_500.fib * n, sug: 0, sod: POTATO_500.sod * n + NUTTELEX.sod,
  };
  return {
    name: "Macro microwave rice", note: `${n} pouch${n > 1 ? "es" : ""} · ${n}×250g`,
    p: RICE_POUCH.p * n, c: RICE_POUCH.c * n, f: RICE_POUCH.f * n, cal: RICE_POUCH.cal * n,
    fib: RICE_POUCH.fib * n, sug: 0, sod: RICE_POUCH.sod * n,
  };
}
const sidesFor = (mainKey, carb, n) => (MAIN[mainKey].hasSides ? [VEG, carbItem(carb, n)] : []);

// ── Swappable ───────────────────────────────────────────────
const SNACK = {
  tuna: { label: "Tuna", item: { name: "Sirena Lite tuna", note: "1 can drained · 70g", p: 18, c: 0, f: 2, cal: 88, fib: 0, sug: 0, sod: 250 } },
  chicken: { label: "Chicken", item: { name: "Shredded chicken", note: "1 pack · 150g", p: 32, c: 0, f: 4, cal: 170, fib: 0, sug: 0, sod: 450 } },
};
const MAIN = {
  steak: { label: "Steak", hasSides: true, item: { name: "Porterhouse steak", note: "180g · Herbamare", p: 46, c: 0, f: 22, cal: 400, fib: 0, sug: 0, sod: 450 } },
  salmon: { label: "Salmon", hasSides: true, item: { name: "Tasmanian salmon", note: "skin off · 280g · Herbamare", p: 54, c: 2, f: 36, cal: 580, fib: 0, sug: 0, sod: 490 } },
  gyg: { label: "GYG bowl", hasSides: false, item: { name: "Guzman bowl", note: "dual protein · chimi mayo, no cheese/sour cream", p: 44, c: 74, f: 30, cal: 760, fib: 9, sug: 3, sod: 1700, veg: 80 } },
};
// $3 GYG beef & cheese taco — added to the GYG bowl to bring the day in line with the steak/salmon mains
const TACO = { name: "Beef & cheese taco", note: "$3 each", p: 12, c: 15, f: 12, cal: 210, fib: 2, sug: 1, sod: 380, veg: 5 };
const GYG_TACOS = 1;
const extrasFor = (mainKey) => (mainKey === "gyg" ? Array(GYG_TACOS).fill(TACO) : []);

const TARGETS = { cal: 3050, p: 170, c: 400, f: 85, fib: 38, sug: 30, sod: 2000, veg: 375 };

// ── Body comp ───────────────────────────────────────────────
const GOAL = { w: 85, bf: 20 };   // 85kg @ 20% → 68kg lean / 17kg fat
const START_W = 81;                // journey start if no log yet

const APP_STATE_KEY = "diet-rotation:state:v2";
const DEFAULT_STATE = {
  tab: "day",
  snack: "tuna",
  main: "steak",
  carb: "potato",
  shopRetailer: "woolworths",
  shopDays: 7,
  checked: {},
  bw: 81,
  bf: 20,
  rate: 0.3,
  log: [],
};

const validKey = (obj, key, fallback) => (Object.prototype.hasOwnProperty.call(obj, key) ? key : fallback);
const readSavedState = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(APP_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      tab: validKey({ day: true, body: true, shopping: true }, parsed.tab, DEFAULT_STATE.tab),
      snack: validKey(SNACK, parsed.snack, DEFAULT_STATE.snack),
      main: validKey(MAIN, parsed.main, DEFAULT_STATE.main),
      carb: validKey(CARB, parsed.carb, DEFAULT_STATE.carb),
      shopRetailer: validKey(retailerData.retailers, parsed.shopRetailer, DEFAULT_STATE.shopRetailer),
      shopDays: Number.isInteger(parsed.shopDays) && parsed.shopDays > 0 ? parsed.shopDays : DEFAULT_STATE.shopDays,
      checked: parsed.checked && typeof parsed.checked === "object" ? parsed.checked : DEFAULT_STATE.checked,
      bw: Number.isFinite(parsed.bw) ? parsed.bw : DEFAULT_STATE.bw,
      bf: Number.isFinite(parsed.bf) ? parsed.bf : DEFAULT_STATE.bf,
      rate: Number.isFinite(parsed.rate) ? parsed.rate : DEFAULT_STATE.rate,
      log: Array.isArray(parsed.log) ? parsed.log : DEFAULT_STATE.log,
    };
  } catch (e) {
    return null;
  }
};
const writeSavedState = (state) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
  } catch (e) {}
};

const RETAILER_LABELS = { woolworths: "Woolies", coles: "Coles" };
const RETAILER_ORDER = ["woolworths", "coles"];
const groupShoppingRows = (rows) =>
  rows.reduce((groups, row) => {
    const sec = row.section || "Other";
    if (!groups.some((group) => group.sec === sec)) groups.push({ sec, rows: [] });
    groups.find((group) => group.sec === sec).rows.push(row);
    return groups;
  }, []);
const shoppingKey = (retailer, row) => `${retailer}:${row.id}`;

// ── Shopping quantity model ──────────────────────────────────
// Diet consumption (app logic) drives how much to buy; product name, price and
// pack come from the spreadsheet. 1 in 3 dinners is Guzman, eaten out, so the
// home-dinner ingredients (steak/salmon, carb side, dinner veg) scale down.
//   pool  "all"  every day · "home" only home-cooked dinner days · "gyg" eaten out
//   share rotation split key — two options share a pool's days evenly
//   count discrete units (cans/pouches/cuts) · each loose produce · else g/ml by weight
const SHOP_GYG_RATIO = 3;
const BUY_MODEL = {
  "Nature's Way protein (choc)": { pool: "all", perDay: 70, keep: true },
  "So Good HP almond milk":      { pool: "all", perDay: 500 },
  "Banana":                      { pool: "all", each: true, perDay: 3, packEach: 6, word: "banana" },
  "Frozen baby spinach":         { pool: "all", perDay: 100, packG: 250 },
  "Creatine":                    { staple: true, keep: true },
  "Macro brown rice & lentils":  { pool: "all", count: true, perDay: 1, word: "pouch" },
  "Sirena Lite tuna":            { pool: "all", share: "snackTuna", count: true, perDay: 1, word: "can" },
  "Shredded chicken":            { pool: "all", share: "snackChicken", count: true, perDay: 1, word: "pack" },
  "Frozen mixed vegetables":     { pools: [["all", 250], ["home", 250]] },
  "Porterhouse steak":           { pool: "home", share: "mainSteak", count: true, perDay: 1, word: "cut" },
  "Tasmanian salmon":            { pool: "home", share: "mainSalmon", count: true, perDay: 1, word: "fillet" },
  "Baby potatoes + Nuttelex":    { pool: "home", share: "carbPotato", perDay: 500, packG: 1000 },
  "Nuttelex buttery spread":     { staple: true, keep: true },
  "Macro microwave rice":        { pool: "home", share: "carbRice", count: true, perDay: 2, word: "pouch" },
  "A.Vogel Herbamare Original":  { staple: true, keep: true },
  "Cocobella coconut yoghurt":   { pool: "all", perDay: 250 },
  "Oat clusters / granola":      { pool: "all", perDay: 100 },
  "Guzman bowl":                 { gyg: true },
  "Beef & cheese taco":          { gyg: true },
};
const packSizeFromText = (pack) => {
  const m = String(pack).match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml)\b/i);
  if (!m) return null;
  const u = m[2].toLowerCase();
  return parseFloat(m[1]) * (u === "kg" || u === "l" ? 1000 : 1);
};
const plural = (word, n) => (n === 1 ? word : word + (/(ch|sh|s|x)$/.test(word) ? "es" : "s"));
const shopDayCtx = (rawDays) => {
  const days = Math.max(1, Math.round(rawDays) || 1);
  const gygDays = Math.round(days / SHOP_GYG_RATIO);
  const homeDays = days - gygDays;
  return {
    days, gygDays, homeDays,
    splits: {
      snackTuna: Math.ceil(days / 2), snackChicken: Math.floor(days / 2),
      mainSteak: Math.ceil(homeDays / 2), mainSalmon: Math.floor(homeDays / 2),
      carbPotato: Math.ceil(homeDays / 2), carbRice: Math.floor(homeDays / 2),
    },
  };
};
const poolDays = (pool, ctx) => (pool === "all" ? ctx.days : pool === "home" ? ctx.homeDays : pool === "gyg" ? ctx.gygDays : 0);
const computeBuy = (row, ctx) => {
  const m = BUY_MODEL[row.appIngredient];
  const price = Number.isFinite(row.price) ? row.price : null;
  const buy = (packs, label) =>
    packs > 0 ? { kind: "buy", packs, label, lineTotal: price != null ? +(price * packs).toFixed(2) : null }
              : { kind: "skip", packs: 0, label: `Not needed for this shop`, lineTotal: null };
  if (!m) return { kind: "info", label: row.quantity || "", lineTotal: null };
  if (m.gyg) return { kind: "gyg", label: `Eaten out · ${ctx.gygDays} ${plural("day", ctx.gygDays)}`, lineTotal: null };
  if (m.staple) return { kind: "staple", packs: 1, label: `1 × ${row.pack}`, lineTotal: price };
  if (m.pools) {
    const totalG = m.pools.reduce((a, [pool, g]) => a + g * poolDays(pool, ctx), 0);
    const packG = packSizeFromText(row.pack) || 500;
    return buy(Math.ceil(totalG / packG), `${Math.ceil(totalG / packG)} × ${row.pack}`);
  }
  const sdays = m.share ? ctx.splits[m.share] : poolDays(m.pool, ctx);
  if (m.count) {
    const packs = sdays * m.perDay;
    return buy(packs, `${packs} ${plural(m.word, packs)}`);
  }
  if (m.each) {
    const totalEach = sdays * m.perDay;
    return buy(Math.ceil(totalEach / m.packEach), `≈ ${totalEach} ${plural(m.word, totalEach)}`);
  }
  const packG = m.packG || packSizeFromText(row.pack) || 1;
  const packs = Math.ceil((sdays * m.perDay) / packG);
  return buy(packs, `${packs} × ${row.pack}`);
};

// ── UI bits ─────────────────────────────────────────────────
// Courier "//" micro-label — the architect's annotation. Always lowercase.
function Micro({ children, style }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: ".14em", color: c.tx2, ...style }}>
      <span style={{ color: c.tx3 }}>{"// "}</span>{children}
    </span>
  );
}

function MacroTile({ label, val, target, unit, isLimit }) {
  const pct = Math.round((val / target) * 100);
  const over = isLimit && val > target;
  return (
    <div style={{ background: c.bg, borderRadius: 16, boxShadow: SH.out, padding: "15px 17px", flex: "1 1 140px", minWidth: 0 }}>
      <Micro>{label}</Micro>
      <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 30, color: c.ink, lineHeight: 1.05, letterSpacing: "-0.03em", marginTop: 9 }}>
        {val}<span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 400, letterSpacing: 0, color: c.tx3 }}>{unit}</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: over ? c.ink : c.tx2, margin: "5px 0 11px" }}>
        {isLimit ? `limit ${target}${unit} · ${over ? `+${val - target} over` : `${pct}%`}` : `/ ${target}${unit} · ${pct}%`}
      </div>
      <div style={{ height: 8, borderRadius: 999, background: c.bg, boxShadow: SH.inSm, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: c.ink, borderRadius: 999, transition: "width .3s var(--ease)" }} />
      </div>
    </div>
  );
}

function MealCard({ title, time, items, totals, children }) {
  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, gap: 10 }}>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 400, color: c.ink, letterSpacing: "-0.02em" }}>{title}</div>
          {time && <div style={{ marginTop: 5 }}><Micro style={{ fontWeight: 400, letterSpacing: ".1em" }}>{time}</Micro></div>}
        </div>
        {totals && (
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: c.tx2, textAlign: "right", lineHeight: 1.55 }}>
            {Math.round(totals.p)}p · {Math.round(totals.c)}c · {Math.round(totals.f)}f<br />
            <span style={{ color: c.tx3 }}>{Math.round(totals.cal)} kcal · {totals.sod}mg na</span>
          </div>
        )}
      </div>
      {children}
      {items && (
        <div style={{ marginTop: 4 }}>
          {items.map((it, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderTop: idx ? `1px solid ${c.line}` : "none" }}>
              <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 400, color: c.tx }}>
                {it.name} <span style={{ fontFamily: MONO, fontSize: 11, color: c.tx3 }}>· {it.note}</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11.5, color: c.tx2, whiteSpace: "nowrap", paddingLeft: 10 }}>{it.cal}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// recessed-well segmented control; the active segment is raised with ink text
function Segmented({ options, value, onChange, full = false, style }) {
  return (
    <div style={{ display: full ? "flex" : "inline-flex", gap: 4, padding: 4, borderRadius: 999, background: c.bg, boxShadow: SH.inSm, ...style }}>
      {options.map((o) => {
        const on = value === o.key;
        return (
          <button key={o.key} className="b-seg" onClick={() => onChange(o.key)} style={{
            flex: full ? 1 : "0 0 auto",
            fontFamily: SANS, fontSize: 13, fontWeight: on ? 500 : 400, cursor: "pointer",
            padding: "8px 16px", borderRadius: 999, border: "none", whiteSpace: "nowrap",
            color: on ? c.ink : c.tx2,
            background: on ? c.bg : "transparent",
            boxShadow: on ? SH.outSm : "none",
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

const stepBtn = {
  fontFamily: MONO, fontSize: 20, lineHeight: 1, cursor: "pointer", flex: "none",
  width: 44, height: 44, borderRadius: 12, color: c.tx,
  background: c.bg, border: "none", boxShadow: SH.outSm,
};
function NumStepper({ label, value, set, step, unit }) {
  return (
    <div style={{ background: c.bg, borderRadius: 16, boxShadow: SH.out, padding: "15px 16px", flex: "1 1 150px" }}>
      <div style={{ marginBottom: 11 }}><Micro>{label}</Micro></div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="b-step" aria-label={`decrease ${label}`} onClick={() => set(+(Math.max(0, value - step)).toFixed(2))} style={stepBtn}>–</button>
        <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 26, color: c.ink, flex: 1, textAlign: "center", letterSpacing: "-0.02em" }}>{value}<span style={{ fontFamily: MONO, fontSize: 12, color: c.tx3 }}>{unit}</span></div>
        <button className="b-step" aria-label={`increase ${label}`} onClick={() => set(+(value + step).toFixed(2))} style={stepBtn}>+</button>
      </div>
    </div>
  );
}
function BodyStat({ label, val, unit, goal }) {
  return (
    <div style={{ background: c.bg, borderRadius: 16, boxShadow: SH.out, padding: "15px 16px", flex: "1 1 120px" }}>
      <Micro>{label}</Micro>
      <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 26, color: c.ink, marginTop: 9, letterSpacing: "-0.02em" }}>{val}<span style={{ fontFamily: MONO, fontSize: 12, color: c.tx3 }}>{unit}</span></div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: c.tx3, marginTop: 3 }}>goal {goal}{unit}</div>
    </div>
  );
}
function ProgressLine({ label, from, to, val }) {
  const pct = to === from ? 100 : Math.max(0, Math.min(100, ((val - from) / (to - from)) * 100));
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 11.5, color: c.tx2, marginBottom: 6 }}>
        <span>{label}</span><span>{val.toFixed(1)} / {to} <span style={{ color: c.tx3 }}>({pct.toFixed(0)}%)</span></span>
      </div>
      <div style={{ height: 8, background: c.bg, borderRadius: 999, boxShadow: SH.inSm, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: c.ink, borderRadius: 999, transition: "width .3s var(--ease)" }} />
      </div>
    </div>
  );
}

export default function DietDashboard() {
  const [tab, setTab] = useState(DEFAULT_STATE.tab);
  const [snack, setSnack] = useState(DEFAULT_STATE.snack);
  const [main, setMain] = useState(DEFAULT_STATE.main);
  const [carb, setCarb] = useState(DEFAULT_STATE.carb);
  const [shopRetailer, setShopRetailer] = useState(DEFAULT_STATE.shopRetailer);
  const [shopDays, setShopDays] = useState(DEFAULT_STATE.shopDays);
  const [checked, setChecked] = useState(DEFAULT_STATE.checked);

  // body comp
  const [bw, setBw] = useState(DEFAULT_STATE.bw);
  const [bf, setBf] = useState(DEFAULT_STATE.bf);
  const [rate, setRate] = useState(DEFAULT_STATE.rate);
  const [log, setLog] = useState(DEFAULT_STATE.log);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const s = readSavedState();
    if (s) {
      setTab(s.tab);
      setSnack(s.snack);
      setMain(s.main);
      setCarb(s.carb);
      setShopRetailer(s.shopRetailer);
      setShopDays(s.shopDays);
      setChecked(s.checked);
      setBw(s.bw);
      setBf(s.bf);
      setRate(s.rate);
      setLog(s.log);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) writeSavedState({ tab, snack, main, carb, shopRetailer, shopDays, checked, bw, bf, rate, log });
  }, [tab, snack, main, carb, shopRetailer, shopDays, checked, bw, bf, rate, log, loaded]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
      if (document.readyState === "complete") register();
      else window.addEventListener("load", register, { once: true });
    }
  }, []);

  const lean = bw * (1 - bf / 100);
  const fat = bw * (bf / 100);
  const goalLean = GOAL.w * (1 - GOAL.bf / 100);
  const goalFat = GOAL.w * (GOAL.bf / 100);
  const startW = log.length ? log[0].w : START_W;
  const startLean = log.length ? log[0].w * (1 - log[0].bf / 100) : lean;
  const wToGo = Math.max(0, GOAL.w - bw);
  const weeks = rate > 0 ? wToGo / rate : 0;
  const eta = new Date(Date.now() + weeks * 7 * 864e5);
  const logToday = () => {
    const d = new Date().toISOString().slice(0, 10);
    setLog((prev) => [...prev.filter((e) => e.date !== d), { date: d, w: bw, bf }].sort((a, b) => a.date.localeCompare(b.date)));
  };
  const deleteEntry = (d) => setLog((prev) => prev.filter((e) => e.date !== d));

  // Eaten in order: snack (10:30) → shake (1pm) → dinner+carb (6pm) → yoghurt (6:30pm).
  // Snack is "locked" first; the later meals auto-size to bring the day toward 3000 kcal.
  const snackItems = [RICE, SNACK[snack].item, VEG];
  const mainConf = MAIN[main];
  const extras = extrasFor(main);

  // lowest powder dose (2/3/4 tbsp) that still keeps the day's protein over 170; almond milk shrinks to 333ml at 2 tbsp
  const chooseTbsp = (n, clusters, bananas) => {
    for (const t of [2, 3, 4]) {
      const items = [powderItem(t), almondMilk(t), ...SHAKE_EXTRAS, ...YOG_BASE, clustersItem(clusters), bananaItem(bananas), ...snackItems, MAIN[main].item, ...sidesFor(main, carb, n), ...extras];
      if (sum(items).p > 170) return t;
    }
    return 4;
  };

  // build the full day for a given rice count + cluster cups + banana count
  const buildDay = (n, clusters, bananas) => {
    const tbsp = chooseTbsp(n, clusters, bananas);
    const shakeItems = [powderItem(tbsp), almondMilk(tbsp), ...SHAKE_EXTRAS];
    const mainItems = [mainConf.item, ...sidesFor(main, carb, n), ...extras];
    const yoghurtItems = [...YOG_BASE, clustersItem(clusters), bananaItem(bananas)];
    const total = sum([...shakeItems, ...yoghurtItems, ...snackItems, ...mainItems]);
    return { mainItems, yoghurtItems, shakeItems, tbsp, total };
  };

  // potato is always 500g; rice auto-sizes to 1 or 2 packets toward 3000 (baseline yoghurt)
  let carbCount = 1;
  if (mainConf.hasSides && carb === "rice") {
    carbCount = Math.abs(buildDay(2, 1, 1).total.cal - 3000) < Math.abs(buildDay(1, 1, 1).total.cal - 3000) ? 2 : 1;
  }
  // yoghurt fillers (last meal): 2 cups of clusters first, then a 2nd banana, while the day still lands sub-2900
  let clusters = 1, bananas = 1;
  if (buildDay(carbCount, 1, 1).total.cal < 2900) clusters = 2;
  if (buildDay(carbCount, clusters, 1).total.cal < 2900) bananas = 2;

  const D = buildDay(carbCount, clusters, bananas);
  const { mainItems, yoghurtItems, shakeItems } = D;

  const shakeT = sum(shakeItems);
  const yogT = sum(yoghurtItems);
  const snackT = sum(snackItems);
  const mainT = sum(mainItems);

  const day = sum([shakeT, yogT, snackT, mainT]);

  const shoppingRows = retailerData.retailers[shopRetailer] || [];
  const isKeep = (r) => !!BUY_MODEL[r.appIngredient]?.keep;
  const isGyg = (r) => !!BUY_MODEL[r.appIngredient]?.gyg; // eaten out — never on the shopping list
  const mainRows = useMemo(() => shoppingRows.filter((r) => !isKeep(r) && !isGyg(r)), [shoppingRows]);
  const keepRows = useMemo(() => shoppingRows.filter((r) => isKeep(r)), [shoppingRows]);
  const shoppingGroups = useMemo(() => groupShoppingRows(mainRows), [mainRows]);
  const shopCtx = useMemo(() => shopDayCtx(shopDays), [shopDays]);
  const buys = useMemo(
    () => Object.fromEntries(shoppingRows.map((r) => [r.id, computeBuy(r, shopCtx)])),
    [shoppingRows, shopCtx]
  );
  const shopTotal = useMemo(() => mainRows.reduce((a, r) => a + (buys[r.id]?.lineTotal || 0), 0), [mainRows, buys]);
  const keepTotal = useMemo(() => keepRows.reduce((a, r) => a + (buys[r.id]?.lineTotal || 0), 0), [keepRows, buys]);
  const buyableIds = useMemo(
    () => shoppingRows.filter((r) => buys[r.id]?.kind === "buy" || buys[r.id]?.kind === "staple").map((r) => r.id),
    [shoppingRows, buys]
  );
  const shoppingCount = buyableIds.length;
  const checkedCount = useMemo(
    () => buyableIds.filter((id) => checked[`${shopRetailer}:${id}`]).length,
    [checked, shopRetailer, buyableIds]
  );
  const clearShopping = () =>
    setChecked((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(`${shopRetailer}:`))));

  const renderShopRow = (r) => {
    const key = shoppingKey(shopRetailer, r);
    const on = checked[key];
    const buy = buys[r.id] || { kind: "info", label: r.quantity || "", lineTotal: null };
    const muted = buy.kind === "skip" || buy.kind === "gyg" || buy.kind === "info";
    const priceLabel = buy.lineTotal != null ? `$${buy.lineTotal.toFixed(2)}` : "—";
    return (
      <button key={key} className={on ? "" : "b-row"} onClick={() => setChecked((p) => ({ ...p, [key]: !p[key] }))} style={{
        display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", textAlign: "left", gap: 10,
        background: c.bg, borderRadius: 14, boxShadow: on ? SH.inSm : SH.outSm, padding: "13px 15px", marginBottom: 9,
        cursor: "pointer", border: "none", opacity: muted ? 0.6 : 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
          <span style={{
            position: "relative", width: 24, height: 24, borderRadius: 7, flexShrink: 0,
            background: c.bg, boxShadow: on ? SH.outSm : SH.inSm,
          }}>
            {on && <span style={{ position: "absolute", left: 8.5, top: 4, width: 5, height: 10, border: "solid var(--ink)", borderWidth: "0 2.6px 2.6px 0", transform: "rotate(43deg)" }} />}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 400, color: on ? c.tx3 : c.ink, textDecoration: on ? "line-through" : "none" }}>{r.name}</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: muted ? c.tx3 : c.tx2, marginTop: 2 }}>{(buy.label || "").toLowerCase()}</div>
          </div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 12.5, color: c.tx2, paddingLeft: 10, whiteSpace: "nowrap" }}>{priceLabel}</div>
      </button>
    );
  };

  return (
    <>
    <Head>
      <title>Diet</title>
      <meta name="description" content="Saved diet rotation, macro targets, body comp check-ins, and shopping list." />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <meta name="theme-color" content={BG} />
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icon-192.png" />
    </Head>
    <style>{STYLES}</style>
    <div style={{ background: c.bg, minHeight: "100vh", padding: "28px 18px 56px", fontFamily: SANS, color: c.tx }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

      {/* header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ marginBottom: 7 }}><Micro style={{ fontWeight: 400, letterSpacing: ".12em" }}>one day · swappable</Micro></div>
          <div style={{ fontFamily: SANS, fontSize: 34, fontWeight: 400, color: c.ink, letterSpacing: "-0.03em", lineHeight: 1 }}>Diet</div>
        </div>
        <Segmented value={tab} onChange={setTab} options={[
          { key: "day", label: "Day" }, { key: "body", label: "Body comp" }, { key: "shopping", label: "Shopping list" },
        ]} />
      </header>

      {tab === "day" && (
        <>
          {/* totals */}
          <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
            <MacroTile label="calories" val={Math.round(day.cal)} target={TARGETS.cal} unit="" />
            <MacroTile label="protein" val={Math.round(day.p)} target={TARGETS.p} unit="g" />
            <MacroTile label="carbs" val={Math.round(day.c)} target={TARGETS.c} unit="g" />
            <MacroTile label="fat" val={Math.round(day.f)} target={TARGETS.f} unit="g" />
            <MacroTile label="fibre" val={Math.round(day.fib)} target={TARGETS.fib} unit="g" />
            <MacroTile label="veg (rdi)" val={Math.round(day.veg)} target={TARGETS.veg} unit="g" />
            <MacroTile label="added sugar" val={Math.round(day.sug)} target={TARGETS.sug} unit="g" />
            <MacroTile label="sodium" val={Math.round(day.sod)} target={TARGETS.sod} unit="mg" isLimit />
          </div>

          {/* meals — in eating order */}
          <MealCard title="Snack bowl" time="10:30am" items={snackItems} totals={snackT}>
            <Segmented value={snack} onChange={setSnack} style={{ marginBottom: 14 }}
              options={Object.entries(SNACK).map(([k, v]) => ({ key: k, label: v.label }))} />
          </MealCard>

          <MealCard title="Post-gym shake" time="1:00pm" items={shakeItems} totals={shakeT} />

          <MealCard title="Dinner" time="6:00pm" items={mainItems} totals={mainT}>
            <Segmented value={main} onChange={setMain} style={{ marginBottom: 14 }}
              options={Object.entries(MAIN).map(([k, v]) => ({ key: k, label: v.label }))} />
            {mainConf.hasSides && (
              <div>
                <div style={{ marginBottom: 8 }}><Micro style={{ fontWeight: 400, letterSpacing: ".1em" }}>carb side</Micro></div>
                <Segmented value={carb} onChange={setCarb}
                  options={Object.entries(CARB).map(([k, v]) => ({ key: k, label: v.label }))} />
              </div>
            )}
          </MealCard>

          <MealCard title="Yoghurt bowl" time="6:30pm" items={yoghurtItems} totals={yogT} />
        </>
      )}

      {tab === "body" && (
        <>
          {/* current inputs */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <NumStepper label="weight" value={bw} set={setBw} step={0.1} unit="kg" />
            <NumStepper label="body fat" value={bf} set={setBf} step={0.1} unit="%" />
          </div>

          {/* current vs goal */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <BodyStat label="weight" val={bw.toFixed(1)} unit="kg" goal={GOAL.w} />
            <BodyStat label="body fat" val={bf.toFixed(1)} unit="%" goal={GOAL.bf} />
            <BodyStat label="lean mass" val={lean.toFixed(1)} unit="kg" goal={goalLean.toFixed(0)} />
            <BodyStat label="fat mass" val={fat.toFixed(1)} unit="kg" goal={goalFat.toFixed(0)} />
          </div>

          {/* composition */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 400, color: c.ink }}>Composition</span>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: c.tx2 }}>{lean.toFixed(1)} lean · {fat.toFixed(1)} fat</span>
            </div>
            <div style={{ height: 22, background: c.bg, borderRadius: 999, boxShadow: SH.inSm, overflow: "hidden" }}>
              <div style={{ display: "flex", height: "100%", width: `${Math.min(100, (bw / GOAL.w) * 100)}%` }}>
                <div style={{ width: `${(lean / bw) * 100}%`, background: c.ink }} />
                <div style={{ width: `${(fat / bw) * 100}%`, background: c.tx3 }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10.5, color: c.tx3, marginTop: 8 }}>
              <span><span style={{ color: c.ink }}>■</span> lean&nbsp;&nbsp;<span style={{ color: c.tx3 }}>■</span> fat</span>
              <span>scale → {GOAL.w}kg</span>
            </div>
          </div>

          {/* progress + projection */}
          <div style={card}>
            <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 400, color: c.ink, marginBottom: 14 }}>Progress to {GOAL.w}kg @ {GOAL.bf}%</div>
            <ProgressLine label="weight" from={startW} to={GOAL.w} val={bw} />
            <ProgressLine label="lean mass" from={startLean} to={goalLean} val={lean} />
            <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "stretch", flexWrap: "wrap" }}>
              <NumStepper label="gain rate / wk" value={rate} set={setRate} step={0.05} unit="kg" />
              <div style={{ flex: "1 1 160px", background: c.bg, borderRadius: 16, boxShadow: SH.inSm, padding: "15px 16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                {wToGo > 0 ? (
                  <>
                    <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 24, color: c.ink, letterSpacing: "-0.02em" }}>~{Math.ceil(weeks)} wks</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: c.tx3, marginTop: 3 }}>{(GOAL.w - bw).toFixed(1)}kg to go · {eta.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</div>
                  </>
                ) : (
                  <div style={{ fontFamily: MONO, fontSize: 13, color: c.ink }}>goal weight reached ✓</div>
                )}
              </div>
            </div>
          </div>

          {/* log */}
          <button className="b-btn" data-v="primary" onClick={logToday} style={{
            width: "100%", fontFamily: SANS, fontSize: 15, fontWeight: 700, cursor: "pointer",
            padding: "15px", borderRadius: 999, color: c.onInk, background: c.ink, border: "none",
            boxShadow: SH.ink, marginBottom: 18,
          }}>Log today ({bw.toFixed(1)}kg · {bf.toFixed(1)}%)</button>

          {log.length >= 2 && (() => {
            const ws = log.map((e) => e.w);
            const min = Math.min(...ws), max = Math.max(...ws), rng = max - min || 1;
            const W = 320, H = 50, pad = 5;
            const pts = log.map((e, i) => {
              const x = pad + (i / (log.length - 1)) * (W - 2 * pad);
              const y = H - pad - ((e.w - min) / rng) * (H - 2 * pad);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(" ");
            return (
              <div style={card}>
                <div style={{ marginBottom: 10 }}><Micro>weight trend</Micro></div>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} preserveAspectRatio="none">
                  <polyline points={pts} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10.5, color: c.tx3, marginTop: 4 }}>
                  <span>{min.toFixed(1)}kg</span><span>{max.toFixed(1)}kg</span>
                </div>
              </div>
            );
          })()}

          {/* history */}
          <div style={{ background: c.bg, borderRadius: 18, boxShadow: SH.out, padding: "6px 20px 16px" }}>
            <div style={{ margin: "14px 0 4px" }}><Micro>check-ins</Micro></div>
            {log.length === 0 && (
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 400, color: c.tx2, padding: "8px 0" }}>No check-ins yet.</div>
            )}
            {[...log].reverse().map((e) => {
              const l = e.w * (1 - e.bf / 100);
              return (
                <div key={e.date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${c.line}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: c.tx2 }}>{e.date}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: c.ink }}>{e.w}kg · {e.bf}% · <span style={{ color: c.tx2 }}>{l.toFixed(1)} lean</span></span>
                  <button className="b-x" aria-label={`delete ${e.date}`} onClick={() => deleteEntry(e.date)} style={{ background: "none", border: "none", color: c.tx3, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 4px" }}>✕</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "shopping" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap" }}>
            <div>
              <Segmented value={shopRetailer} onChange={setShopRetailer} style={{ marginBottom: 9 }}
                options={RETAILER_ORDER.map((key) => ({ key, label: RETAILER_LABELS[key] }))} />
              <div style={{ fontFamily: MONO, fontSize: 11.5, color: c.tx2 }}>
                {checkedCount}/{shoppingCount} packed
              </div>
            </div>
            <button className="b-btn" data-v="ghost" onClick={clearShopping} disabled={!checkedCount} style={{
              fontFamily: SANS, fontSize: 12.5, fontWeight: 400, cursor: checkedCount ? "pointer" : "not-allowed",
              padding: "10px 16px", borderRadius: 999, color: checkedCount ? c.tx : c.tx3,
              background: c.bg, border: "none", boxShadow: SH.outSm, opacity: checkedCount ? 1 : 0.5,
            }}>Reset ticks</button>
          </div>
          {/* day count → quantities scale to suit */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 400, color: c.ink }}>Shopping for</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button className="b-step" aria-label="fewer days" onClick={() => setShopDays(Math.max(1, shopDays - 1))} style={stepBtn}>–</button>
                <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 26, color: c.ink, minWidth: 96, textAlign: "center", letterSpacing: "-0.02em" }}>
                  {shopDays}<span style={{ fontFamily: MONO, fontSize: 12, color: c.tx3 }}> {plural("day", shopDays)}</span>
                </div>
                <button className="b-step" aria-label="more days" onClick={() => setShopDays(shopDays + 1)} style={stepBtn}>+</button>
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: c.tx3, marginTop: 10 }}>
              {shopCtx.homeDays} home {plural("dinner", shopCtx.homeDays)} · {shopCtx.gygDays} gyg out
            </div>
          </div>
          {shoppingGroups.map((s) => (
            <div key={s.sec} style={{ marginBottom: 22 }}>
              <div style={{ marginBottom: 10 }}><Micro>{s.sec.toLowerCase()}</Micro></div>
              {s.rows.map(renderShopRow)}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px solid ${c.line}`, paddingTop: 16, marginTop: 4 }}>
            <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 400, color: c.ink }}>Fresh shop · {shopDays} {plural("day", shopDays)}</span>
            <span style={{ fontFamily: MONO, fontSize: 16, color: c.ink }}>${shopTotal.toFixed(2)}</span>
          </div>

          {keepRows.length > 0 && (
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${c.line}` }}>
              <div style={{ marginBottom: 12 }}><Micro>keep on hand</Micro></div>
              {keepRows.map(renderShopRow)}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }}>
                <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 400, color: c.tx }}>Restock total</span>
                <span style={{ fontFamily: MONO, fontSize: 13.5, color: c.tx2 }}>${keepTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
    </>
  );
}
