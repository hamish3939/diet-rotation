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
   ────────────────────────────────────────────────────────── */

const C = {
  bg: "#0d0d0d", surface: "#151515", surface2: "#1c1c1c", border: "#2a2a2a",
  text: "#f2f2f2", dim: "#8a8a8a", faint: "#565656",
  protein: "#ff5c00", carbs: "#4a90d9", fat: "#e0a93b",
  fibre: "#3fb27f", sodium: "#d97757", sugar: "#cf6a98", veg: "#84b54b", over: "#e5484d",
};
const MONO = "'Space Mono', ui-monospace, 'SFMono-Regular', monospace";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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
  "Nature's Way protein (choc)": { pool: "all", perDay: 70 },
  "So Good HP almond milk":      { pool: "all", perDay: 500 },
  "Banana":                      { pool: "all", each: true, perDay: 3, packEach: 6, word: "banana" },
  "Frozen baby spinach":         { pool: "all", perDay: 100, packG: 250 },
  "Creatine":                    { staple: true },
  "Macro brown rice & lentils":  { pool: "all", count: true, perDay: 1, word: "pouch" },
  "Sirena Lite tuna":            { pool: "all", share: "snackTuna", count: true, perDay: 1, word: "can" },
  "Shredded chicken":            { pool: "all", share: "snackChicken", count: true, perDay: 1, word: "pack" },
  "Frozen mixed vegetables":     { pools: [["all", 250], ["home", 250]] },
  "Porterhouse steak":           { pool: "home", share: "mainSteak", count: true, perDay: 1, word: "cut" },
  "Tasmanian salmon":            { pool: "home", share: "mainSalmon", count: true, perDay: 1, word: "fillet" },
  "Baby potatoes + Nuttelex":    { pool: "home", share: "carbPotato", perDay: 500, packG: 1000 },
  "Nuttelex buttery spread":     { staple: true, needs: "carbPotato" },
  "Macro microwave rice":        { pool: "home", share: "carbRice", count: true, perDay: 2, word: "pouch" },
  "A.Vogel Herbamare Original":  { staple: true },
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
  if (m.staple) {
    if (m.needs && ctx.splits[m.needs] <= 0) return { kind: "skip", packs: 0, label: "Not needed for this shop", lineTotal: null };
    return { kind: "staple", packs: 1, label: `1 × ${row.pack} · lasts the period`, lineTotal: price };
  }
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
function MacroTile({ label, val, target, unit, color, isLimit }) {
  const pct = Math.round((val / target) * 100);
  const over = isLimit && val > target;
  const barColor = over ? C.over : color;
  return (
    <div style={{ background: C.surface, border: `1px solid ${over ? C.over : C.border}`, borderRadius: 10, padding: "13px 15px", flex: "1 1 140px", minWidth: 0 }}>
      <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: C.dim }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 24, color: over ? C.over : C.text, lineHeight: 1.15, marginTop: 4 }}>
        {val}<span style={{ fontSize: 12, color: C.faint }}>{unit}</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: over ? C.over : C.faint, marginBottom: 8 }}>
        {isLimit ? `limit ${target}${unit} · ${over ? `+${val - target}` : `${pct}%`}` : `/ ${target}${unit} · ${pct}%`}
      </div>
      <div style={{ height: 4, background: C.surface2, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: barColor, transition: "width .25s ease" }} />
      </div>
    </div>
  );
}

// stacked calorie bar segmented by macro kcal (P*4 / C*4 / F*9), normalised to maxCal
function CompareRow({ label, m, selected, onClick, maxCal }) {
  const pkc = m.p * 4, ckc = m.c * 4, fkc = m.f * 9;
  const w = (m.cal / maxCal) * 100;
  return (
    <button onClick={onClick} style={{
      display: "block", width: "100%", textAlign: "left", cursor: "pointer",
      background: selected ? C.surface2 : "transparent",
      border: `1px solid ${selected ? C.protein : C.border}`,
      borderRadius: 9, padding: "11px 13px", marginBottom: 8, transition: "all .15s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: SANS, fontSize: 14, color: selected ? C.text : C.dim, fontWeight: 500 }}>
          {selected ? "● " : "○ "}{label}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.dim }}>
          {m.p}P · {m.c}C · {m.f}F · {m.cal}kcal · <span style={{ color: C.sodium }}>{m.sod}mg Na</span>
        </span>
      </div>
      <div style={{ display: "flex", width: `${w}%`, height: 7, borderRadius: 4, overflow: "hidden", background: C.surface2 }}>
        <div style={{ width: `${(pkc / m.cal) * 100}%`, background: C.protein }} />
        <div style={{ width: `${(ckc / m.cal) * 100}%`, background: C.carbs }} />
        <div style={{ width: `${(fkc / m.cal) * 100}%`, background: C.fat }} />
      </div>
    </button>
  );
}

function MealCard({ title, time, items, totals, children }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: C.text }}>{title}</div>
          {time && <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: C.faint, marginTop: 2 }}>{time}</div>}
        </div>
        {totals && (
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim, textAlign: "right" }}>
            {Math.round(totals.p)}P · {Math.round(totals.c)}C · {Math.round(totals.f)}F<br />
            <span style={{ color: C.faint }}>{Math.round(totals.cal)} kcal · {totals.sod}mg Na</span>
          </div>
        )}
      </div>
      {children}
      {items && (
        <div style={{ marginTop: 4 }}>
          {items.map((it, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: idx ? `1px solid ${C.surface2}` : "none" }}>
              <div style={{ fontFamily: SANS, fontSize: 13.5, color: C.text }}>
                {it.name} <span style={{ color: C.faint, fontSize: 12 }}>· {it.note}</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.dim, whiteSpace: "nowrap", paddingLeft: 10 }}>{it.cal}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
      {options.map((o) => {
        const on = value === o.key;
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{
            fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer",
            padding: "7px 14px", borderRadius: 8,
            color: on ? C.bg : C.dim,
            background: on ? C.protein : "transparent",
            border: `1px solid ${on ? C.protein : C.border}`,
            transition: "all .15s ease",
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

const stepBtn = {
  fontFamily: MONO, fontSize: 18, lineHeight: 1, cursor: "pointer",
  width: 30, height: 30, borderRadius: 7, color: C.dim,
  background: C.surface2, border: `1px solid ${C.border}`,
};
function NumStepper({ label, value, set, step, unit }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", flex: "1 1 150px" }}>
      <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: C.dim, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => set(+(Math.max(0, value - step)).toFixed(2))} style={stepBtn}>–</button>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.text, flex: 1, textAlign: "center" }}>{value}<span style={{ fontSize: 12, color: C.faint }}>{unit}</span></div>
        <button onClick={() => set(+(value + step).toFixed(2))} style={stepBtn}>+</button>
      </div>
    </div>
  );
}
function BodyStat({ label, val, unit, goal, color }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 15px", flex: "1 1 120px" }}>
      <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: C.dim }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 24, color: color || C.text, marginTop: 4 }}>{val}<span style={{ fontSize: 12, color: C.faint }}>{unit}</span></div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.faint, marginTop: 2 }}>goal {goal}{unit}</div>
    </div>
  );
}
function ProgressLine({ label, from, to, val, color }) {
  const pct = to === from ? 100 : Math.max(0, Math.min(100, ((val - from) / (to - from)) * 100));
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 12, color: C.dim, marginBottom: 5 }}>
        <span>{label}</span><span>{val.toFixed(1)} / {to} <span style={{ color: C.faint }}>({pct.toFixed(0)}%)</span></span>
      </div>
      <div style={{ height: 6, background: C.surface2, borderRadius: 5, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width .25s ease" }} />
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
  const { mainItems, yoghurtItems, shakeItems, tbsp } = D;

  const shakeT = sum(shakeItems);
  const yogT = sum(yoghurtItems);
  const snackT = sum(snackItems);
  const mainT = sum(mainItems);

  const day = sum([shakeT, yogT, snackT, mainT]);

  const shoppingRows = retailerData.retailers[shopRetailer] || [];
  const shoppingGroups = useMemo(() => groupShoppingRows(shoppingRows), [shoppingRows]);
  const shopCtx = useMemo(() => shopDayCtx(shopDays), [shopDays]);
  const buys = useMemo(
    () => Object.fromEntries(shoppingRows.map((r) => [r.id, computeBuy(r, shopCtx)])),
    [shoppingRows, shopCtx]
  );
  const shopTotal = useMemo(() => shoppingRows.reduce((a, r) => a + (buys[r.id]?.lineTotal || 0), 0), [shoppingRows, buys]);
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

  return (
    <>
    <Head>
      <title>Diet Dashboard</title>
      <meta name="description" content="Saved diet rotation, macro targets, body comp check-ins, and shopping list." />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <meta name="theme-color" content={C.bg} />
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icon-192.png" />
    </Head>
    <div style={{ background: C.bg, minHeight: "100vh", padding: "22px 18px 40px", fontFamily: SANS }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');`}</style>

      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: C.protein }}>One day · swappable</div>
          <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 700, color: C.text, marginTop: 2 }}>Diet</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 5 }}>
            {loaded ? "Saved on this device" : "Loading saved state"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: 4 }}>
          {[["day", "Day"], ["body", "Body comp"], ["shopping", "Shopping list"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer", padding: "7px 14px", borderRadius: 6,
              border: "none", color: tab === k ? C.bg : C.dim, background: tab === k ? C.text : "transparent",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {tab === "day" && (
        <>
          {/* totals */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <MacroTile label="Calories" val={Math.round(day.cal)} target={TARGETS.cal} unit="" color={C.text} />
            <MacroTile label="Protein" val={Math.round(day.p)} target={TARGETS.p} unit="g" color={C.protein} />
            <MacroTile label="Carbs" val={Math.round(day.c)} target={TARGETS.c} unit="g" color={C.carbs} />
            <MacroTile label="Fat" val={Math.round(day.f)} target={TARGETS.f} unit="g" color={C.fat} />
            <MacroTile label="Fibre" val={Math.round(day.fib)} target={TARGETS.fib} unit="g" color={C.fibre} />
            <MacroTile label="Veg (RDI)" val={Math.round(day.veg)} target={TARGETS.veg} unit="g" color={C.veg} />
            <MacroTile label="Added sugar" val={Math.round(day.sug)} target={TARGETS.sug} unit="g" color={C.sugar} />
            <MacroTile label="Sodium" val={Math.round(day.sod)} target={TARGETS.sod} unit="mg" color={C.sodium} isLimit />
          </div>

          {/* meals — in eating order */}
          <MealCard title="Snack bowl" time="10:30am · eaten first" items={snackItems} totals={snackT}>
            <Segmented value={snack} onChange={setSnack}
              options={Object.entries(SNACK).map(([k, v]) => ({ key: k, label: v.label }))} />
          </MealCard>

          <MealCard title="Post-gym shake" time="1:00pm" items={shakeItems} totals={shakeT}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.faint, marginBottom: 8 }}>
              Powder auto-set to {tbsp} tbsp — the least that keeps the day over {TARGETS.p}g protein{tbsp === 2 ? " (milk dropped to 333ml)" : ""}.
            </div>
          </MealCard>

          <MealCard title="Dinner" time="6:00pm" items={mainItems} totals={mainT}>
            <Segmented value={main} onChange={setMain}
              options={Object.entries(MAIN).map(([k, v]) => ({ key: k, label: v.label }))} />
            {mainConf.hasSides && (
              <div style={{ marginTop: -4 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>Carb side · rice auto-sizes, potato fixed 500g</div>
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
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <NumStepper label="Weight" value={bw} set={setBw} step={0.1} unit="kg" />
            <NumStepper label="Body fat" value={bf} set={setBf} step={0.1} unit="%" />
          </div>

          {/* current vs goal */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <BodyStat label="Weight" val={bw.toFixed(1)} unit="kg" goal={GOAL.w} color={C.text} />
            <BodyStat label="Body fat" val={bf.toFixed(1)} unit="%" goal={GOAL.bf} color={C.fat} />
            <BodyStat label="Lean mass" val={lean.toFixed(1)} unit="kg" goal={goalLean.toFixed(0)} color={C.protein} />
            <BodyStat label="Fat mass" val={fat.toFixed(1)} unit="kg" goal={goalFat.toFixed(0)} color={C.sugar} />
          </div>

          {/* composition */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.text }}>Composition</span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: C.dim }}>{lean.toFixed(1)} lean · {fat.toFixed(1)} fat</span>
            </div>
            <div style={{ height: 22, background: C.surface2, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ display: "flex", height: "100%", width: `${Math.min(100, (bw / GOAL.w) * 100)}%` }}>
                <div style={{ width: `${(lean / bw) * 100}%`, background: C.protein }} />
                <div style={{ width: `${(fat / bw) * 100}%`, background: C.sugar }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 5 }}>
              <span><span style={{ color: C.protein }}>■</span> lean&nbsp;&nbsp;<span style={{ color: C.sugar }}>■</span> fat</span>
              <span>scale → {GOAL.w}kg</span>
            </div>
          </div>

          {/* progress + projection */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
            <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Progress to {GOAL.w}kg @ {GOAL.bf}%</div>
            <ProgressLine label="Weight" from={startW} to={GOAL.w} val={bw} color={C.text} />
            <ProgressLine label="Lean mass" from={startLean} to={goalLean} val={lean} color={C.protein} />
            <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "stretch", flexWrap: "wrap" }}>
              <NumStepper label="Gain rate / wk" value={rate} set={setRate} step={0.05} unit="kg" />
              <div style={{ flex: "1 1 160px", background: C.surface2, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                {wToGo > 0 ? (
                  <>
                    <div style={{ fontFamily: MONO, fontSize: 20, color: C.text }}>~{Math.ceil(weeks)} wks</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: C.faint }}>{(GOAL.w - bw).toFixed(1)}kg to go · {eta.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</div>
                  </>
                ) : (
                  <div style={{ fontFamily: MONO, fontSize: 14, color: C.fibre }}>Goal weight reached ✓</div>
                )}
              </div>
            </div>
          </div>

          {/* log */}
          <button onClick={logToday} style={{
            width: "100%", fontFamily: SANS, fontSize: 14, fontWeight: 600, cursor: "pointer",
            padding: "12px", borderRadius: 10, color: C.bg, background: C.protein, border: "none", marginBottom: 14,
          }}>+ Log today ({bw.toFixed(1)}kg · {bf.toFixed(1)}%)</button>

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
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: C.faint, marginBottom: 8 }}>Weight trend</div>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} preserveAspectRatio="none">
                  <polyline points={pts} fill="none" stroke={C.protein} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 4 }}>
                  <span>{min.toFixed(1)}kg</span><span>{max.toFixed(1)}kg</span>
                </div>
              </div>
            );
          })()}

          {/* history */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "6px 18px 14px" }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: C.faint, margin: "12px 0 4px" }}>Check-ins</div>
            {log.length === 0 && (
              <div style={{ fontFamily: SANS, fontSize: 13, color: C.dim, padding: "8px 0" }}>No check-ins yet. Log today to start tracking.</div>
            )}
            {[...log].reverse().map((e) => {
              const l = e.w * (1 - e.bf / 100);
              return (
                <div key={e.date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: `1px solid ${C.surface2}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: C.dim }}>{e.date}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: C.text }}>{e.w}kg · {e.bf}% · <span style={{ color: C.protein }}>{l.toFixed(1)} lean</span></span>
                  <button onClick={() => deleteEntry(e.date)} style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 4px" }}>×</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "shopping" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: 4, marginBottom: 8 }}>
                {RETAILER_ORDER.map((key) => (
                  <button key={key} onClick={() => setShopRetailer(key)} style={{
                    fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "7px 14px", borderRadius: 6,
                    border: "none", color: shopRetailer === key ? C.bg : C.dim, background: shopRetailer === key ? C.text : "transparent",
                  }}>{RETAILER_LABELS[key]}</button>
                ))}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim }}>
                {RETAILER_LABELS[shopRetailer]} list · {checkedCount}/{shoppingCount} packed.
              </div>
            </div>
            <button onClick={clearShopping} disabled={!checkedCount} style={{
              fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: checkedCount ? "pointer" : "default",
              padding: "7px 10px", borderRadius: 7, color: checkedCount ? C.text : C.faint,
              background: checkedCount ? C.surface : "transparent", border: `1px solid ${C.border}`,
              opacity: checkedCount ? 1 : 0.55,
            }}>Reset ticks</button>
          </div>
          {/* day count → quantities scale to suit */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.text }}>Shopping for</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setShopDays(Math.max(1, shopDays - 1))} style={stepBtn}>–</button>
                <div style={{ fontFamily: MONO, fontSize: 22, color: C.text, minWidth: 78, textAlign: "center" }}>
                  {shopDays}<span style={{ fontSize: 12, color: C.faint }}> {plural("day", shopDays)}</span>
                </div>
                <button onClick={() => setShopDays(shopDays + 1)} style={stepBtn}>+</button>
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.faint, marginTop: 8 }}>
              {shopCtx.homeDays} home {plural("dinner", shopCtx.homeDays)} · {shopCtx.gygDays} GYG out (1 in {SHOP_GYG_RATIO}). Steak/salmon & potato/rice split evenly.
            </div>
          </div>
          {shoppingGroups.map((s) => (
            <div key={s.sec} style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: C.protein, marginBottom: 8 }}>{s.sec}</div>
              {s.rows.map((r) => {
                const key = shoppingKey(shopRetailer, r);
                const on = checked[key];
                const buy = buys[r.id] || { kind: "info", label: r.quantity || "", lineTotal: null };
                const muted = buy.kind === "skip" || buy.kind === "gyg" || buy.kind === "info";
                const priceLabel = buy.lineTotal != null ? `$${buy.lineTotal.toFixed(2)}` : "—";
                return (
                  <button key={key} onClick={() => setChecked((p) => ({ ...p, [key]: !p[key] }))} style={{
                    display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", textAlign: "left",
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "11px 13px", marginBottom: 7,
                    cursor: "pointer", opacity: muted ? 0.6 : 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `1.5px solid ${on ? C.protein : C.faint}`, background: on ? C.protein : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.bg, fontWeight: 700,
                      }}>{on ? "✓" : ""}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: SANS, fontSize: 13.5, color: on ? C.faint : C.text, textDecoration: on ? "line-through" : "none" }}>{r.name}</div>
                        <div style={{ fontFamily: MONO, fontSize: 11.5, color: muted ? C.faint : C.dim }}>
                          {buy.label}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 12.5, color: C.dim, paddingLeft: 10, whiteSpace: "nowrap" }}>{priceLabel}</div>
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 4 }}>
            <span style={{ fontFamily: SANS, fontSize: 14, color: C.text, fontWeight: 600 }}>Estimated basket · {shopDays} {plural("day", shopDays)}</span>
            <span style={{ fontFamily: MONO, fontSize: 15, color: C.protein }}>${shopTotal.toFixed(2)}</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.faint, marginTop: 6 }}>
            Quantities scale to the day count; 1 in {SHOP_GYG_RATIO} dinners is GYG (eaten out). Prices from data/diet-retailer-equivalents.xlsx.
          </div>
        </div>
      )}
    </div>
    </>
  );
}
