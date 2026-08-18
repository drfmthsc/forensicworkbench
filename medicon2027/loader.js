/* MEDICON 2027 — hotel data loader
   Option 3: Google Sheet is master, baked JSON is fallback.
   Publish each Sheet tab via File > Share > Publish to web > CSV, paste URLs below. */

const SHEET = {
  hotels:     "https://docs.google.com/spreadsheets/d/e/2PACX-1vSTPF6Tg3KrMkORAjk6BSXVN_jPcJLEWcssbnRQKl-BU7HlVs5BEr5rXwtMvOWSRurU6kMh7K7x-3kA/pub?gid=64996672&single=true&output=csv",
  categories: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSTPF6Tg3KrMkORAjk6BSXVN_jPcJLEWcssbnRQKl-BU7HlVs5BEr5rXwtMvOWSRurU6kMh7K7x-3kA/pub?gid=1545251534&single=true&output=csv"
};
const FALLBACK = "data/hotels.json";
const TIMEOUT = 3500;

function parseCSV(text){
  const rows=[]; let row=[], cell="", q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){cell+='"';i++;} else q=false; } else cell+=c; }
    else if(c==='"') q=true;
    else if(c===','){ row.push(cell); cell=""; }
    else if(c==='\n'){ row.push(cell); rows.push(row); row=[]; cell=""; }
    else if(c!=='\r') cell+=c;
  }
  if(cell||row.length){ row.push(cell); rows.push(row); }
  const head=rows.shift().map(h=>h.trim());
  return rows.filter(r=>r.some(v=>v.trim()))
             .map(r=>Object.fromEntries(head.map((h,i)=>[h,(r[i]||"").trim()])));
}

const bool = v => String(v).toUpperCase()==="TRUE";
const num  = v => { const n=parseFloat(v); return isNaN(n)?null:n; };

function normalise(h, c){
  return {
    categories: c.filter(x=>bool(x.active))
                 .sort((a,b)=>num(a.order)-num(b.order)),
    hotels: h.filter(x=>x.status!=="hidden" && x.name)
             .map(x=>({...x,
                distance_km:num(x.distance_km),
                rating:num(x.rating),
                reviews:num(x.reviews),
                shuttle:bool(x.shuttle)}))
             .sort((a,b)=>a.distance_km-b.distance_km)
  };
}

async function fetchCSV(url){
  const ctl=new AbortController();
  const t=setTimeout(()=>ctl.abort(), TIMEOUT);
  try{
    const r=await fetch(url,{signal:ctl.signal,cache:"no-store"});
    if(!r.ok) throw new Error(r.status);
    return parseCSV(await r.text());
  } finally { clearTimeout(t); }
}

export async function loadHotels(){
  try{
    const [h,c] = await Promise.all([fetchCSV(SHEET.hotels), fetchCSV(SHEET.categories)]);
    if(!h.length || !c.length) throw new Error("empty sheet");
    return {...normalise(h,c), source:"sheet"};
  }catch(err){
    console.warn("Sheet unavailable, using baked copy:", err.message);
    const r = await fetch(FALLBACK,{cache:"no-store"});
    const d = await r.json();
    return {...normalise(d.hotels, d.categories), source:"fallback", updated:d.updated};
  }
}
