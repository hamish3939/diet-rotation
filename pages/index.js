import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

const DEFAULT_INGREDIENTS = [
  { id: "basa", name: "Basa Portions Skin Off", shopName: "Coles Basa Portions Skin Off 2 Pack 260g", brand: "Coles (260g pk)", servingLabel: "whole pack", servingGrams: 260, protein: 47, carbs: 1, fat: 5, calories: 213, category: "protein", pricePerPack: 7.5, packServings: 1 },
  { id: "salmon", name: "Tasmanian Salmon Skin Off", shopName: "Coles Tasmanian Salmon Portions Skin Off 280g", brand: "Coles (280g pk)", servingLabel: "whole pack", servingGrams: 280, protein: 54, carbs: 2, fat: 36, calories: 580, category: "protein", pricePerPack: 15, packServings: 1 },
  { id: "steak", name: "Porterhouse Steak", shopName: "Coles No Added Hormone Beef Quick Cook Porterhouse Steak 180g", brand: "Coles (180g)", servingLabel: "whole steak", servingGrams: 180, protein: 46, carbs: 0, fat: 22, calories: 400, category: "protein", pricePerPack: 9, packServings: 1 },
  { id: "sirena-lite", name: "Sirena Lite Tuna in Oil", shopName: "Sirena Lite Tuna in Oil Italian Style 95g", brand: "Sirena (95g can)", servingLabel: "whole can (drain oil)", servingGrams: 70, protein: 18, carbs: 0, fat: 2, calories: 88, category: "protein", pricePerPack: 3, packServings: 1 },
  { id: "carved-chicken", name: "Carved Roast Chicken", shopName: "Coles Free Range Chicken Breast Carved Roast 200g", brand: "Coles FR (200g pk)", servingLabel: "½ pack · 100g", servingGrams: 100, protein: 24, carbs: 3, fat: 1.5, calories: 113, category: "protein", pricePerPack: 9, packServings: 2 },
  { id: "bens-protein-rice", name: "Protein+ Lentil Rice", shopName: "Ben's Original Protein+ Lentils Turmeric & Brown Rice 180g", brand: "Ben's Original (180g)", servingLabel: "whole pouch", servingGrams: 180, protein: 7, carbs: 52, fat: 4, calories: 272, category: "carb", pricePerPack: 3.5, packServings: 1 },
  { id: "bens-chicken-rice", name: "Savoury Chicken Rice", shopName: "Ben's Original Savoury Chicken Flavour Rice 250g", brand: "Ben's Original (250g)", servingLabel: "whole pouch", servingGrams: 250, protein: 8, carbs: 75, fat: 6, calories: 385, category: "carb", pricePerPack: 3.5, packServings: 1 },
  { id: "baby-potatoes", name: "Baby Potatoes Herb Butter", shopName: "Coles Kitchen Vegetables Baby Potatoes Herb Butter 400g", brand: "Coles Kitchen (400g)", servingLabel: "whole pack", servingGrams: 400, protein: 8, carbs: 42, fat: 11, calories: 316, category: "carb", pricePerPack: 5.5, packServings: 1 },
  { id: "veg-florets", name: "Carrot & Broccoli Florets", shopName: "Coles Kitchen Carrot and Broccoli Florets 150g", brand: "Coles Kitchen (150g)", servingLabel: "whole pack", servingGrams: 150, protein: 3, carbs: 9, fat: 0.5, calories: 50, category: "carb", pricePerPack: 4, packServings: 1 },
  { id: "avofresh", name: "Avofresh Hint of Lemon", shopName: "Avofresh Tube Hint of Lemon 160g", brand: "Avofresh (160g tube)", servingLabel: "¼ tube · 40g", servingGrams: 40, protein: 1, carbs: 0, fat: 9, calories: 83, category: "fat", pricePerPack: 6, packServings: 4 },
  { id: "cocobella", name: "Coconut Yoghurt Vanilla", shopName: "Cocobella Coconut Yoghurt Vanilla 500g", brand: "Cocobella (500g tub)", servingLabel: "½ tub · 250g", servingGrams: 250, protein: 3, carbs: 20, fat: 25, calories: 338, category: "dairy", pricePerPack: 7, packServings: 2 },
  { id: "carmans", name: "Oat Clusters Honey Crunch", shopName: "Carman's Aussie Oat Clusters Honey Crunch 450g", brand: "Carman's (450g)", servingLabel: "1 cup · ~50g", servingGrams: 50, protein: 4, carbs: 33, fat: 5, calories: 200, category: "carb", pricePerPack: 8.9, packServings: 9 },
  { id: "banana", name: "Banana", shopName: "Bananas", brand: "Fresh", servingLabel: "1 medium", servingGrams: 120, protein: 1, carbs: 27, fat: 0, calories: 105, category: "carb", pricePerPack: 4, packServings: 6 },
  { id: "frozen-berries", name: "Frozen Mixed Berries", shopName: "Coles Frozen Mixed Berries 500g", brand: "Coles (500g bag)", servingLabel: "½ bag · 250g", servingGrams: 250, protein: 2, carbs: 33, fat: 0, calories: 150, category: "carb", pricePerPack: 5, packServings: 2 },
  { id: "hp-almond-milk", name: "High Protein Almond Milk", shopName: "Sanitarium So Good High Protein Almond Milk 1L", brand: "So Good (1L)", servingLabel: "250ml", servingGrams: 250, protein: 10, carbs: 1, fat: 5.5, calories: 97, category: "dairy", pricePerPack: 5, packServings: 4 },
  { id: "plant-protein", name: "Plant Protein Powder", shopName: "Plant Protein Powder", brand: "Generic", servingLabel: "1 scoop · 30g", servingGrams: 30, protein: 20, carbs: 2, fat: 1, calories: 120, category: "supplement", pricePerPack: 45, packServings: 30, daily: true },
  { id: "creatine", name: "Creatine Monohydrate", shopName: "Creatine Monohydrate", brand: "Generic", servingLabel: "1 scoop · 5g", servingGrams: 5, protein: 0, carbs: 0, fat: 0, calories: 0, category: "supplement", pricePerPack: 30, packServings: 60, daily: true },
  { id: "peanut-butter", name: "Peanut Butter", shopName: "Peanut Butter", brand: "Generic", servingLabel: "1 tbsp · 16g", servingGrams: 16, protein: 4, carbs: 3, fat: 8, calories: 95, category: "fat", pricePerPack: 5, packServings: 25 },
  { id: "zero-drink", name: "Zero Soft Drink", shopName: "Fanta Zero / Coke Zero / Sprite Zero 6-Pack Minis", brand: "Fanta/Coke/Sprite", servingLabel: "2 mini cans", servingGrams: 500, protein: 0, carbs: 0, fat: 0, calories: 0, category: "other", pricePerPack: 9, packServings: 3 },
  { id: "spinach", name: "Baby Spinach", shopName: "Coles Baby Spinach 120g", brand: "Coles (120g bag)", servingLabel: "big handful · 60g", servingGrams: 60, protein: 2, carbs: 1, fat: 0, calories: 14, category: "carb", pricePerPack: 3, packServings: 2 },
  { id: "gyg-bowl", name: "GYG Bowl", shopName: "Guzman y Gomez Bowl (eat-in)", brand: "Guzman y Gomez", servingLabel: "custom order", servingGrams: 480, protein: 44, carbs: 74, fat: 30, calories: 760, category: "other", pricePerPack: 18, packServings: 1, note: "Dual protein: slow cooked + ground beef. Chimi mayo instead of cheese. No sour cream." },
];

const SHAKE = { name: "The Big Shake", items: [
  { ingredientId: "plant-protein", qty: 3 },
  { ingredientId: "banana", qty: 1 },
  { ingredientId: "hp-almond-milk", qty: 1 },
  { ingredientId: "frozen-berries", qty: 1 },
  { ingredientId: "spinach", qty: 1 },
  { ingredientId: "creatine", qty: 1 },
]};

const YOGHURT = { name: "Yoghurt Bowl", items: [
  { ingredientId: "cocobella", qty: 1 },
  { ingredientId: "banana", qty: 2 },
  { ingredientId: "carmans", qty: 1 },
]};

const DEFAULT_DAYS = [
  { id: "day1", label: "Day 1 — Basa", meals: {
    shake: { ...SHAKE },
    riceSnack: { name: "Chicken + Chicken Rice + Avo + Veg", items: [
      { ingredientId: "carved-chicken", qty: 1 }, { ingredientId: "bens-chicken-rice", qty: 1 },
      { ingredientId: "avofresh", qty: 1 }, { ingredientId: "veg-florets", qty: 1 },
    ]},
    yoghurtSnack: { ...YOGHURT },
    main: { name: "Basa + Chicken Rice + Veg", items: [
      { ingredientId: "basa", qty: 1 }, { ingredientId: "bens-chicken-rice", qty: 1 },
      { ingredientId: "veg-florets", qty: 1 },
    ]},
  }},
  { id: "day2", label: "Day 2 — Salmon", meals: {
    shake: { ...SHAKE },
    riceSnack: { name: "Chicken + Chicken Rice + Avo + Veg", items: [
      { ingredientId: "carved-chicken", qty: 1 }, { ingredientId: "bens-chicken-rice", qty: 1 },
      { ingredientId: "avofresh", qty: 1 }, { ingredientId: "veg-florets", qty: 1 },
    ]},
    yoghurtSnack: { ...YOGHURT },
    main: { name: "Salmon + Potatoes + Veg", items: [
      { ingredientId: "salmon", qty: 1 }, { ingredientId: "baby-potatoes", qty: 1 },
      { ingredientId: "veg-florets", qty: 1 },
    ]},
  }},
  { id: "day3", label: "Day 3 — Steak", meals: {
    shake: { ...SHAKE },
    riceSnack: { name: "Tuna + Lentil Rice + Avo + Veg", items: [
      { ingredientId: "sirena-lite", qty: 1 }, { ingredientId: "bens-protein-rice", qty: 1 },
      { ingredientId: "avofresh", qty: 1 }, { ingredientId: "veg-florets", qty: 1 },
    ]},
    yoghurtSnack: { ...YOGHURT },
    main: { name: "Steak + Potatoes + Veg", items: [
      { ingredientId: "steak", qty: 1 }, { ingredientId: "baby-potatoes", qty: 1 },
      { ingredientId: "veg-florets", qty: 1 },
    ]},
  }},
  { id: "day4", label: "Day 4 — GYG", meals: {
    shake: { ...SHAKE },
    riceSnack: { name: "Tuna + Lentil Rice + Avo + Veg", items: [
      { ingredientId: "sirena-lite", qty: 1 }, { ingredientId: "bens-protein-rice", qty: 1 },
      { ingredientId: "avofresh", qty: 1 }, { ingredientId: "veg-florets", qty: 1 },
    ]},
    yoghurtSnack: { ...YOGHURT },
    main: { name: "GYG Bowl", items: [
      { ingredientId: "gyg-bowl", qty: 1 },
    ]},
  }},
];

const DEFAULT_TARGETS = { calories: 2800, protein: 170, carbs: 320, fat: 85 };
const CATEGORY_LABELS = { protein: "Proteins", carb: "Carbs", dairy: "Dairy", fat: "Fats", supplement: "Supplements", other: "Other" };
const SLOT_ORDER = ["shake", "riceSnack", "yoghurtSnack", "main"];
const mono = "'Space Mono', monospace";
const sans = "Helvetica, 'Helvetica Neue', Arial, sans-serif";
const catColors = { protein: "#6ec87a", carb: "#e8a955", dairy: "#7ab8e8", fat: "#c97ab8", supplement: "#8a8a96", other: "#777" };
const bg0 = "#0e0e11", bg1 = "#161619", bg2 = "#1c1c20", br1 = "#28282e", br2 = "#202026";
const t1 = "#e4e4e8", t2 = "#8e8e9a", t3 = "#4e4e5a";

function loadData() {
  if (typeof window === "undefined") return null;
  try { const d = localStorage.getItem("diet-rotation"); return d ? JSON.parse(d) : null; } catch { return null; }
}
function saveData(data) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem("diet-rotation", JSON.stringify(data)); } catch {}
}

function calcMealMacros(meal, I) {
  let p=0,c=0,f=0,cal=0;
  (meal?.items||[]).forEach(item => { const i=I.find(x=>x.id===item.ingredientId); if(i){p+=i.protein*item.qty;c+=i.carbs*item.qty;f+=i.fat*item.qty;cal+=i.calories*item.qty;}});
  return {protein:Math.round(p),carbs:Math.round(c),fat:Math.round(f),calories:Math.round(cal)};
}
function calcDayMacros(day,I) {
  let p=0,c=0,f=0,cal=0;
  Object.values(day.meals).forEach(m=>{const x=calcMealMacros(m,I);p+=x.protein;c+=x.carbs;f+=x.fat;cal+=x.calories;});
  return {protein:p,carbs:c,fat:f,calories:cal};
}
function calcAvgs(days,I) {
  const a={calories:0,protein:0,carbs:0,fat:0};
  days.forEach(d=>{const m=calcDayMacros(d,I);a.calories+=m.calories;a.protein+=m.protein;a.carbs+=m.carbs;a.fat+=m.fat;});
  Object.keys(a).forEach(k=>a[k]=Math.round(a[k]/days.length));
  return a;
}

function MealCard({meal,I}) {
  return (
    <div style={{background:bg1,border:`1px solid ${br1}`,borderRadius:12,padding:"14px 16px",marginBottom:8}}>
      <div style={{fontSize:15,fontWeight:700,color:t1,fontFamily:sans,marginBottom:10}}>{meal.name}</div>
      {(meal.items||[]).map((item,idx)=>{
        const ing=I.find(i=>i.id===item.ingredientId); if(!ing) return null;
        const showPortion = !ing.servingLabel.startsWith("whole") && !ing.servingLabel.startsWith("1 medium") && !ing.servingLabel.startsWith("custom");
        return (
          <div key={idx}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,fontFamily:sans,color:t2,padding:"5px 0",borderTop:idx>0?`1px solid ${br2}`:"none"}}>
              <div style={{display:"flex",alignItems:"baseline",gap:6,minWidth:0}}>
                <span style={{flexShrink:0}}>{item.qty>1?`${item.qty}× `:""}{ing.name}</span>
                {showPortion && <span style={{fontSize:11,color:t3,fontFamily:mono,flexShrink:0}}>{ing.servingLabel}</span>}
              </div>
              <span style={{color:t3,fontFamily:mono,fontSize:12,flexShrink:0,marginLeft:8}}>{Math.round(ing.calories*item.qty)||""}</span>
            </div>
            {ing.note && <div style={{fontSize:11,fontFamily:mono,color:t3,padding:"2px 0 4px",lineHeight:1.4}}>{ing.note}</div>}
          </div>
        );
      })}
    </div>
  );
}

function DayView({day,I,targets}) {
  const m=calcDayMacros(day,I);
  const bars=[
    {label:"Calories",value:m.calories,target:targets.calories,color:"#777"},
    {label:"Protein",value:m.protein,target:targets.protein,color:"#6ec87a"},
    {label:"Carbs",value:m.carbs,target:targets.carbs,color:"#e8a955"},
    {label:"Fat",value:m.fat,target:targets.fat,color:"#c97ab8"},
  ];
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {bars.map(b=>{
          const pct=Math.min((b.value/b.target)*100,100);
          const over=b.value>b.target*1.08;
          return (
            <div key={b.label} style={{background:bg1,border:`1px solid ${br1}`,borderRadius:10,padding:"10px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                <span style={{fontSize:11,fontFamily:mono,color:t3,textTransform:"uppercase",letterSpacing:"0.04em"}}>{b.label}</span>
                <span style={{fontSize:15,fontFamily:mono,fontWeight:600,color:over?"#ef5555":t1}}>{b.value}<span style={{color:t3,fontWeight:400,fontSize:12}}>/{b.target}</span></span>
              </div>
              <div style={{height:4,background:bg2,borderRadius:2}}>
                <div style={{height:"100%",width:`${pct}%`,background:over?"#ef5555":b.color,borderRadius:2,transition:"width 0.3s ease"}}/>
              </div>
            </div>
          );
        })}
      </div>
      {SLOT_ORDER.map(slot=>(<MealCard key={slot} meal={day.meals[slot]} I={I}/>))}
    </div>
  );
}

function IngredientCard({ing}) {
  return (
    <div style={{background:bg1,border:`1px solid ${br1}`,borderRadius:12,padding:14,display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:t1,lineHeight:1.3,fontFamily:sans}}>{ing.name}</div>
          <div style={{fontSize:11,color:t3,fontFamily:mono,marginTop:2}}>{ing.brand}</div>
        </div>
        <div style={{fontSize:9,fontFamily:mono,textTransform:"uppercase",letterSpacing:"0.04em",padding:"3px 8px",borderRadius:4,background:`${catColors[ing.category]||"#666"}15`,color:catColors[ing.category]||"#666",fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>{ing.category}</div>
      </div>
      <div style={{fontSize:12,color:t2,fontFamily:mono}}>per {ing.servingLabel} ({ing.servingGrams}g)</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4}}>
        {[{l:"P",v:ing.protein,c:"#6ec87a"},{l:"C",v:ing.carbs,c:"#e8a955"},{l:"F",v:ing.fat,c:"#c97ab8"},{l:"kcal",v:ing.calories,c:t1}].map(x=>(
          <div key={x.l} style={{textAlign:"center",padding:"6px 0",background:bg2,borderRadius:5}}>
            <div style={{fontSize:15,fontWeight:700,color:x.c,fontFamily:mono}}>{x.v}</div>
            <div style={{fontSize:9,fontFamily:mono,color:t3,marginTop:1}}>{x.l}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,color:t3,fontFamily:mono,display:"flex",justifyContent:"space-between"}}>
        <span>${ing.pricePerPack}/{ing.packServings}sv</span>
        <span style={{color:t2}}>${(ing.pricePerPack/ing.packServings).toFixed(2)}/sv</span>
      </div>
    </div>
  );
}

function ShoppingList({days,I}) {
  const rotation={};const dailyAgg={};
  days.forEach(day=>{Object.values(day.meals).forEach(meal=>{(meal.items||[]).forEach(item=>{
    const ing=I.find(i=>i.id===item.ingredientId); if(!ing) return;
    if(ing.daily){if(!dailyAgg[item.ingredientId])dailyAgg[item.ingredientId]=0;dailyAgg[item.ingredientId]=Math.max(dailyAgg[item.ingredientId],item.qty);}
    else{if(!rotation[item.ingredientId])rotation[item.ingredientId]=0;rotation[item.ingredientId]+=item.qty;}
  });});});
  const dailyList=[];
  Object.entries(dailyAgg).forEach(([id,qpd])=>{const ing=I.find(i=>i.id===id);if(!ing)return;const ts=qpd*7;const pk=Math.ceil(ts/ing.packServings);dailyList.push({...ing,totalServes:ts,packsNeeded:pk,cost:pk*ing.pricePerPack});});
  const grouped={};
  Object.entries(rotation).forEach(([id,ts])=>{const ing=I.find(i=>i.id===id);if(!ing)return;if(!grouped[ing.category])grouped[ing.category]=[];const pk=Math.ceil(ts/ing.packServings);grouped[ing.category].push({...ing,totalServes:ts,packsNeeded:pk,cost:pk*ing.pricePerPack});});
  let total=0;Object.values(grouped).forEach(items=>items.forEach(i=>total+=i.cost));dailyList.forEach(i=>total+=i.cost);
  const Row=({item})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",fontSize:13,fontFamily:sans}}>
      <span style={{color:t1}}>{item.shopName || item.name}</span>
      <div style={{display:"flex",gap:16,alignItems:"center",fontFamily:mono,fontSize:12}}>
        <span style={{color:t2}}>{item.totalServes}sv</span>
        <span style={{color:t3}}>{item.packsNeeded}pk</span>
        <span style={{color:t1,fontWeight:600,minWidth:52,textAlign:"right"}}>${item.cost.toFixed(2)}</span>
      </div>
    </div>
  );
  return (
    <div>
      <div style={{fontSize:11,fontFamily:mono,color:t3,marginBottom:16,textTransform:"uppercase",letterSpacing:"0.06em"}}>One full rotation (1× each day)</div>
      {Object.entries(CATEGORY_LABELS).map(([cat,label])=>{
        if(!grouped[cat]) return null;
        return (<div key={cat} style={{marginBottom:16}}>
          <div style={{fontSize:11,fontFamily:mono,textTransform:"uppercase",letterSpacing:"0.08em",color:t3,marginBottom:8,paddingBottom:5,borderBottom:`1px solid ${br2}`}}>{label}</div>
          {grouped[cat].map(item=><Row key={item.id} item={item}/>)}
        </div>);
      })}
      {dailyList.length>0&&(
        <div style={{marginTop:24,paddingTop:16,borderTop:`1px solid ${br1}`}}>
          <div style={{fontSize:11,fontFamily:mono,textTransform:"uppercase",letterSpacing:"0.08em",color:t3,marginBottom:12}}>Daily Essentials (weekly)</div>
          {dailyList.map(item=><Row key={item.id} item={item}/>)}
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0",borderTop:`2px solid ${br1}`,marginTop:20,fontFamily:mono}}>
        <span style={{fontSize:12,fontWeight:600,color:t1,textTransform:"uppercase",letterSpacing:"0.04em"}}>Est. Rotation Cost</span>
        <span style={{fontSize:22,fontWeight:700,color:t1}}>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}

function TargetsTab({targets,setTargets,days,I}) {
  const avgs = calcAvgs(days,I);
  const perDay = days.map(d => ({ label: d.label, macros: calcDayMacros(d, I) }));
  const sliders = [
    { key: "calories", label: "Calories", unit: "kcal", min: 1800, max: 4000, step: 50, color: "#777" },
    { key: "protein", label: "Protein", unit: "g", min: 100, max: 300, step: 5, color: "#6ec87a" },
    { key: "carbs", label: "Carbs", unit: "g", min: 150, max: 500, step: 5, color: "#e8a955" },
    { key: "fat", label: "Fat", unit: "g", min: 40, max: 150, step: 5, color: "#c97ab8" },
  ];
  return (
    <div>
      <div style={{background:bg1,border:`1px solid ${br1}`,borderRadius:12,padding:18,marginBottom:16}}>
        <div style={{fontSize:11,fontFamily:mono,textTransform:"uppercase",letterSpacing:"0.08em",color:t3,marginBottom:14}}>Rotation Average (4 days)</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
          {[
            {l:"Calories",v:avgs.calories,t:targets.calories,u:"kcal",c:"#777"},
            {l:"Protein",v:avgs.protein,t:targets.protein,u:"g",c:"#6ec87a"},
            {l:"Carbs",v:avgs.carbs,t:targets.carbs,u:"g",c:"#e8a955"},
            {l:"Fat",v:avgs.fat,t:targets.fat,u:"g",c:"#c97ab8"},
          ].map(m => {
            const diff = m.v - m.t;
            const over = diff > m.t * 0.08;
            return (
              <div key={m.l} style={{textAlign:"center"}}>
                <div style={{fontSize:9,fontFamily:mono,color:t3,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>{m.l}</div>
                <div style={{fontSize:20,fontWeight:700,fontFamily:mono,color:over?"#ef5555":t1}}>{m.v}</div>
                <div style={{fontSize:11,fontFamily:mono,color:diff>0?"#ef5555aa":diff<-20?"#e8a955aa":t3,marginTop:2}}>
                  {diff>0?"+":""}{diff}{m.u==="kcal"?"":"g"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{background:bg1,border:`1px solid ${br1}`,borderRadius:12,padding:18,marginBottom:20}}>
        <div style={{fontSize:11,fontFamily:mono,textTransform:"uppercase",letterSpacing:"0.08em",color:t3,marginBottom:14}}>Per Day Breakdown</div>
        {perDay.map((d,idx) => (
          <div key={idx} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:idx>0?`1px solid ${br2}`:"none"}}>
            <span style={{fontSize:13,fontFamily:sans,color:t2,fontWeight:600}}>{d.label}</span>
            <div style={{display:"flex",gap:14,fontFamily:mono,fontSize:12}}>
              <span style={{color:t1}}>{d.macros.calories}</span>
              <span style={{color:"#6ec87a"}}>{d.macros.protein}p</span>
              <span style={{color:"#e8a955"}}>{d.macros.carbs}c</span>
              <span style={{color:"#c97ab8"}}>{d.macros.fat}f</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,fontFamily:mono,textTransform:"uppercase",letterSpacing:"0.08em",color:t3,marginBottom:14}}>Adjust Targets</div>
      {sliders.map(s => (
        <div key={s.key} style={{background:bg1,border:`1px solid ${br1}`,borderRadius:10,padding:"14px 16px",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
            <span style={{fontSize:13,fontFamily:sans,color:t2,fontWeight:600}}>{s.label}</span>
            <span style={{fontSize:18,fontFamily:mono,fontWeight:700,color:t1}}>{targets[s.key]}<span style={{fontSize:12,fontWeight:400,color:t3,marginLeft:3}}>{s.unit}</span></span>
          </div>
          <input type="range" min={s.min} max={s.max} step={s.step} value={targets[s.key]}
            onChange={e => setTargets(prev => ({...prev, [s.key]: parseInt(e.target.value)}))}
            style={{width:"100%",height:6,appearance:"none",WebkitAppearance:"none",background:`linear-gradient(to right, ${s.color} ${((targets[s.key]-s.min)/(s.max-s.min))*100}%, ${bg2} ${((targets[s.key]-s.min)/(s.max-s.min))*100}%)`,borderRadius:3,outline:"none",cursor:"pointer"}}
          />
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,fontFamily:mono,color:t3,marginTop:4}}>
            <span>{s.min}{s.unit}</span><span>{s.max}{s.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MealPlanner() {
  const [tab,setTab]=useState("planner");
  const [activeDay,setActiveDay]=useState(0);
  const [I,setI]=useState(DEFAULT_INGREDIENTS);
  const [days,setDays]=useState(DEFAULT_DAYS);
  const [targets,setTargets]=useState(DEFAULT_TARGETS);
  const [loaded,setLoaded]=useState(false);
  const [catFilter,setCatFilter]=useState("all");

  useEffect(()=>{
    const d = loadData();
    if(d) {
      if(d.ingredients) setI(d.ingredients);
      if(d.days) setDays(d.days);
      if(d.targets) setTargets(d.targets);
    }
    setLoaded(true);
  },[]);

  useEffect(()=>{
    if(loaded) saveData({ingredients:I,days,targets});
  },[I,days,targets,loaded]);

  if(!loaded) return <div style={{padding:40,textAlign:"center",color:t3,fontFamily:mono,background:bg0,minHeight:"100vh"}}>Loading...</div>;

  const tabs=[{id:"planner",label:"Days"},{id:"ingredients",label:"Ingredients"},{id:"shopping",label:"Shopping"},{id:"targets",label:"Targets"}];
  const categories=["all",...Object.keys(CATEGORY_LABELS)];
  const filtered=catFilter==="all"?I:I.filter(i=>i.category===catFilter);
  const avgs=calcAvgs(days,I);

  return (
    <>
      <Head>
        <title>Fuel Protocol</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0e0e11" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🥩</text></svg>" />
      </Head>
      <div style={{fontFamily:sans,minHeight:"100vh",color:t1,maxWidth:700,margin:"0 auto",background:bg0,padding:"0 12px",WebkitTapHighlightColor:"transparent"}}>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
          *{box-sizing:border-box;margin:0;padding:0;}
          html,body{background:${bg0};-webkit-font-smoothing:antialiased;}
          button{cursor:pointer;border:none;background:none;-webkit-tap-highlight-color:transparent;}
          button:active{opacity:0.7;}
          input[type=range]{-webkit-appearance:none;appearance:none;}
          input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:${t1};cursor:pointer;border:2px solid ${bg0};box-shadow:0 0 0 1px ${br1};}
          input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:${t1};cursor:pointer;border:2px solid ${bg0};box-shadow:0 0 0 1px ${br1};}
        `}</style>

        <div style={{padding:"20px 0 14px"}}>
          <div style={{fontSize:11,fontFamily:mono,textTransform:"uppercase",letterSpacing:"0.12em",color:t3,marginBottom:4}}>Fuel Protocol</div>
          <div style={{display:"flex",gap:12,alignItems:"center",padding:"10px 14px",background:bg1,border:`1px solid ${br1}`,borderRadius:10,marginTop:8}}>
            <span style={{fontSize:20,fontFamily:mono,fontWeight:700,color:t1}}>{targets.calories}</span>
            <span style={{fontSize:11,fontFamily:mono,color:t3}}>kcal</span>
            <div style={{width:1,height:16,background:br1,margin:"0 2px"}}/>
            <span style={{fontSize:13,fontFamily:mono,color:"#6ec87a"}}>{targets.protein}p</span>
            <span style={{fontSize:13,fontFamily:mono,color:"#e8a955"}}>{targets.carbs}c</span>
            <span style={{fontSize:13,fontFamily:mono,color:"#c97ab8"}}>{targets.fat}f</span>
          </div>
          <div style={{fontSize:11,fontFamily:mono,color:t3,marginTop:8,padding:"0 2px"}}>
            Avg: {avgs.calories} kcal · {avgs.protein}p · {avgs.carbs}c · {avgs.fat}f
          </div>
        </div>

        <div style={{display:"flex",gap:0,marginBottom:16,borderBottom:`1px solid ${br1}`,position:"sticky",top:0,background:bg0,zIndex:10,paddingTop:4}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 14px",fontSize:12,fontFamily:mono,fontWeight:tab===t.id?700:400,color:tab===t.id?t1:t3,borderBottom:tab===t.id?`2px solid ${t1}`:"2px solid transparent",marginBottom:-1,transition:"all 0.15s"}}>{t.label}</button>
          ))}
        </div>

        {tab==="planner"&&(
          <div>
            <div style={{display:"flex",gap:4,marginBottom:14}}>
              {days.map((day,idx)=>(
                <button key={day.id} onClick={()=>setActiveDay(idx)} style={{flex:1,padding:"8px 6px",fontSize:12,fontFamily:sans,fontWeight:activeDay===idx?700:400,color:activeDay===idx?t1:t3,background:activeDay===idx?bg1:"transparent",border:activeDay===idx?`1px solid ${br1}`:"1px solid transparent",borderRadius:8}}>{day.label}</button>
              ))}
            </div>
            <DayView day={days[activeDay]} I={I} targets={targets}/>
          </div>
        )}

        {tab==="ingredients"&&(
          <div>
            <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>
              {categories.map(cat=>(
                <button key={cat} onClick={()=>setCatFilter(cat)} style={{padding:"5px 12px",fontSize:11,fontFamily:mono,textTransform:"uppercase",letterSpacing:"0.03em",fontWeight:catFilter===cat?700:400,color:catFilter===cat?t1:t3,background:catFilter===cat?bg1:"transparent",border:catFilter===cat?`1px solid ${br1}`:"1px solid transparent",borderRadius:5}}>{cat==="all"?"All":CATEGORY_LABELS[cat]||cat}</button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {filtered.map(ing=><IngredientCard key={ing.id} ing={ing}/>)}
            </div>
            <div style={{marginTop:16,textAlign:"center",fontSize:11,fontFamily:mono,color:t3}}>{I.length} ingredients</div>
          </div>
        )}

        {tab==="shopping"&&<ShoppingList days={days} I={I}/>}
        {tab==="targets"&&<TargetsTab targets={targets} setTargets={setTargets} days={days} I={I}/>}

        <div style={{height:60}}/>
      </div>
    </>
  );
}
