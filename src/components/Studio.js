"use client";

// Portrait studio: left panel with the settings, right canvas with the state (ready / developing / error / result).
// All calls go through this app's own server routes (/api/*) — the API key never reaches the browser.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaBolt, FaMagic, FaChevronDown, FaExpand, FaPlus, FaTrash, FaImages, FaLayerGroup, FaClone, FaLock } from "react-icons/fa";
import { FiDownload, FiExternalLink } from "react-icons/fi";
import { APP, STYLES, ASPECTS, RESOLUTIONS } from "@/lib/app.config";
import { useLang, errorText } from "@/lib/i18n";
import Header from "./Header";

const HISTORY_KEY = `${APP.id}:history`;
const CODE_KEY = `${APP.id}:access-code`;
const TERMINAL = new Set(["completed", "failed", "refunded"]);
const SLOT = APP.slots[0];

const ASPECT_LABELS = {
  "1:1": { en: "1:1 Square", ru: "1:1 Квадрат" },
  "4:5": { en: "4:5 Portrait", ru: "4:5 Портрет" },
  "3:4": { en: "3:4 Portrait", ru: "3:4 Портрет" },
  "16:9": { en: "16:9 Landscape", ru: "16:9 Альбом" },
  "9:16": { en: "9:16 Story", ru: "9:16 Сторис" },
};

const L = {
  studio: { en: "Portrait studio", ru: "Портретная студия" },
  engine: { en: "Professional AI engine", ru: "Профессиональный ИИ-движок" },
  style: { en: "Style category", ru: "Стиль" },
  photos: { en: "Reference photos", ru: "Ваши фото" },
  urlPh: { en: "Reference image URL…", ru: "Ссылка на фото…" },
  need: { en: "1–4 photos of your face", ru: "1–4 фото вашего лица" },
  aspect: { en: "Aspect ratio", ru: "Формат" },
  quality: { en: "Quality", ru: "Качество" },
  variants: { en: "Variants", ru: "Вариантов" },
  wishes: { en: "Extra wishes", ru: "Пожелания" },
  wishesPh: { en: "e.g. no glasses, dark blue blazer", ru: "например: без очков, тёмно-синий пиджак" },
  generate: { en: "Generate", ru: "Создать" },
  processing: { en: "Processing…", ru: "Обработка…" },
  ready: { en: "Studio ready.", ru: "Студия готова." },
  readyText: { en: "Upload your reference and select a category\nto create your professional portrait.", ru: "Загрузите своё фото и выберите стиль —\nстудия сделает профессиональный портрет." },
  developing: { en: "Developing portrait…", ru: "Проявляем портрет…" },
  calibrating: { en: "Calibrating session…", ru: "Готовим сессию…" },
  session: { en: "Session active", ru: "Сессия идёт" },
  errTitle: { en: "Processing error", ru: "Ошибка обработки" },
  failed: { en: "Generation failed — the money was refunded.", ru: "Не получилось — деньги вернулись." },
  portrait: { en: "portrait", ru: "портрет" },
  pack: { en: "pack ready", ru: "готово" },
  downloadAll: { en: "Download all", ru: "Скачать все" },
  downloading: { en: "Downloading…", ru: "Скачиваю…" },
  newOne: { en: "New portrait", ru: "Новый портрет" },
  aiGen: { en: "AI generated", ru: "Создано ИИ" },
  galleryTitle: { en: "Gallery", ru: "Галерея" },
  galleryText: { en: "Your recent portraits on this device.", ru: "Ваши последние портреты на этом устройстве." },
  galleryEmpty: { en: "Nothing here yet — create your first portrait in the studio.", ru: "Пока пусто — создайте первый портрет в студии." },
  clear: { en: "Clear", ru: "Очистить" },
  charged: { en: "Charged from the site owner's AI SKILLS balance. Failed results are refunded.", ru: "Списывается с баланса AI SKILLS владельца сайта. Неудачные результаты возвращаются." },
};

function readHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function writeHistory(list) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 40))); } catch {}
}
function priceText(price, count) {
  if (!price || price.cents == null) return "";
  return `$${((price.cents * count) / 100).toFixed(2)}`;
}
async function downloadFile(url, name) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error();
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

// Dropdown in the original's look: glass button, list opens on click, closes on outside click / Escape.
function Select({ icon: Icon, label, value, options, onChange, up = false, id }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const out = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", out);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", out); document.removeEventListener("keydown", esc); };
  }, []);
  const current = options.find((o) => o.value === value);
  return (
    <div className="space-y-3" ref={ref}>
      <label id={`${id}-l`} className="text-sm text-foreground font-semibold flex items-center gap-2">
        <span className="w-1 h-1 bg-primary-500 rounded-full" /> {label}
      </label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(!open)} aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-l`}
          className="w-full flex items-center justify-between p-3 bg-glass-bg border border-glass-border hover:bg-glass-hover shadow-sm rounded-lg text-sm font-semibold transition-all outline-none focus-visible:ring-1 focus-visible:ring-primary-500 text-foreground backdrop-blur-md">
          <span className="flex items-center gap-3 min-w-0"><Icon className="text-primary-500 shrink-0" /><span className="truncate">{current?.label}</span></span>
          <FaChevronDown className={`text-[10px] transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div role="listbox" aria-labelledby={`${id}-l`}
            className={`absolute ${up ? "bottom-12" : "top-12"} left-0 right-0 max-h-60 bg-[var(--solid-bg)] border border-glass-border rounded-lg overflow-y-auto custom-scrollbar shadow-2xl z-[100] p-1`}>
            {options.map((o) => (
              <button key={o.value} type="button" role="option" aria-selected={o.value === value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all ${o.value === value
                  ? "bg-primary-500 text-white shadow-md shadow-primary-500/20" : "text-muted hover:bg-glass-hover hover:text-foreground"}`}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Endless strip of the styles, like the original's example carousel. Click = pick the style.
function StyleCarousel({ onPick, active }) {
  const { tx } = useLang();
  const items = [...STYLES, ...STYLES];
  return (
    <div className="w-full overflow-hidden relative py-6">
      <div className="flex gap-4 w-max px-4 animate-marquee">
        {items.map((s, i) => (
          <button key={`${s.id}-${i}`} type="button" onClick={() => onPick(s.id)} tabIndex={i < STYLES.length ? 0 : -1}
            aria-hidden={i >= STYLES.length || undefined} aria-label={tx(s.label)}
            className={`w-40 md:w-52 aspect-[3/4] rounded-2xl overflow-hidden relative group border bg-glass-bg shrink-0 text-left ${active === s.id ? "border-primary-500" : "border-glass-border"}`}>
            {s.example
              ? <img src={s.example} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              : <div className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                  style={{ background: `radial-gradient(120% 80% at 50% 25%, ${s.tone || "var(--primary-500)"}55, transparent 60%), linear-gradient(160deg, var(--solid-bg), #0b0b0e)` }}>
                  <div className="absolute inset-x-0 top-[22%] mx-auto w-16 h-16 rounded-full bg-white/10 border border-white/10" />
                  <div className="absolute inset-x-6 top-[50%] h-24 rounded-t-[48px] bg-white/[0.06] border border-white/10" />
                </div>}
            <div className="absolute top-3 left-3 right-3 text-[11px] font-black uppercase tracking-widest text-white drop-shadow">{tx(s.label)}</div>
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 flex items-center gap-1.5 shadow-xl">
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-white uppercase tracking-widest leading-none">{tx(L.aiGen)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Studio() {
  const { t, tx } = useLang();
  const [view, setView] = useState("studio");
  const [cfg, setCfg] = useState(null);
  const [code, setCode] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [needCode, setNeedCode] = useState(false);
  const [state, setState] = useState(() => APP.initialState());
  const [photos, setPhotos] = useState([]);
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [run, setRun] = useState(null); // { at, label, jobs: [] }
  const [history, setHistory] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const fileRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then(setCfg).catch(() => setCfg({ configured: false }));
    setHistory(readHistory());
    try { setCode(localStorage.getItem(CODE_KEY) || ""); } catch {}
  }, []);
  useEffect(() => { if (cfg?.accessCode && !code) setNeedCode(true); }, [cfg, code]);

  const headers = useMemo(() => ({ "Content-Type": "application/json", ...(code ? { "x-access-code": code } : {}) }), [code]);
  const set = (patch) => setState((s) => ({ ...s, ...patch }));
  const price = cfg?.prices?.[APP.priceModel(state)];
  const pText = priceText(price, state.count);
  const pending = run && run.jobs.some((j) => !TERMINAL.has(j.status));
  const done = run && !pending ? run.jobs.filter((j) => j.status === "completed" && j.result_urls?.length) : [];
  const urls = done.flatMap((j) => j.result_urls);
  const allFailed = run && !pending && !urls.length;

  // Poll unfinished jobs every 5 s.
  const runRef = useRef(run);
  runRef.current = run;
  const poll = useCallback(async () => {
    const r = runRef.current;
    if (!r) return;
    const open = r.jobs.filter((j) => !TERMINAL.has(j.status));
    if (!open.length) return;
    const fresh = await Promise.all(open.map((j) =>
      fetch(`/api/generations/${j.id}`, { headers, cache: "no-store" }).then((x) => (x.ok ? x.json() : null)).catch(() => null)));
    setRun((cur) => {
      if (!cur || cur.at !== r.at) return cur;
      const jobs = cur.jobs.map((j) => fresh.find((f) => f && f.id === j.id) || j);
      const next = { ...cur, jobs };
      if (jobs.every((j) => TERMINAL.has(j.status))) {
        const list = [{ ...next }, ...readHistory().filter((h) => h.at !== next.at)];
        writeHistory(list);
        setHistory(list);
      }
      return next;
    });
  }, [headers]);
  useEffect(() => {
    if (!pending) return;
    const id = setInterval(poll, 5000);
    const first = setTimeout(poll, 2500);
    const tick = setInterval(() => setElapsed((Date.now() - runRef.current.at) / 1000), 100);
    return () => { clearInterval(id); clearTimeout(first); clearInterval(tick); };
  }, [pending, poll]);

  const addLink = () => {
    const v = link.trim();
    if (!v) return;
    if (!/^https?:\/\//i.test(v)) { setErr(t("err_bad_input_url")); return; }
    setPhotos((p) => [...p, v].slice(0, SLOT.max));
    setLink("");
    setErr("");
  };

  const onFiles = async (files) => {
    const list = [...files].slice(0, SLOT.max - photos.length);
    if (!list.length) return;
    setUploading(true);
    setErr("");
    try {
      const { upload } = await import("@vercel/blob/client");
      const out = [];
      for (const f of list) {
        if (f.size > APP.upload.maxBytes) { setErr(t("err_image_too_large")); continue; }
        const b = await upload(`${APP.id}/${f.name}`, f, { access: "public", handleUploadUrl: "/api/upload", clientPayload: code || "" });
        out.push(b.url);
      }
      setPhotos((p) => [...p, ...out].slice(0, SLOT.max));
    } catch {
      setErr(t("err_generic"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const generate = async () => {
    setErr("");
    const inputs = [...photos];
    if (link.trim() && /^https?:\/\//i.test(link.trim()) && inputs.length < SLOT.max) inputs.push(link.trim());
    if (!inputs.length) { setErr(t("needInput")); return; }
    if (inputs.length !== photos.length) { setPhotos(inputs); setLink(""); }
    setBusy(true);
    setView("studio");
    try {
      const r = await fetch("/api/generate", { method: "POST", headers, body: JSON.stringify({ ...state, inputs: { [SLOT.key]: inputs } }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (d.error === "access_code_required") { setNeedCode(true); setCode(""); }
        setErr(d.error === "missing_input" ? t("needInput") : errorText(t, d.error || "generic"));
        setRun(null);
        return;
      }
      const next = {
        at: Date.now(),
        label: APP.label(state, tx),
        jobs: d.items.map((i) => ({ id: i.id, status: "processing", result_urls: [], price_cents: i.price_cents })),
      };
      setElapsed(0);
      setRun(next);
      if (window.innerWidth < 1024) canvasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const list = [next, ...readHistory()];
      writeHistory(list);
      setHistory(list);
    } catch {
      setErr(t("err_generic"));
    } finally {
      setBusy(false);
    }
  };

  const openHistory = (h) => {
    setRun({ ...h, jobs: h.jobs.map((j) => (j.status === "completed" ? j : { ...j, status: "processing" })) });
    setErr("");
    setView("studio");
  };

  const saveCode = () => {
    const v = codeDraft.trim();
    if (!v) return;
    setCode(v);
    try { localStorage.setItem(CODE_KEY, v); } catch {}
    setNeedCode(false);
  };

  const downloadAll = async () => {
    setDownloading(true);
    for (let i = 0; i < urls.length; i++) await downloadFile(urls[i], `headshot-${state.style}-${i + 1}.png`);
    setDownloading(false);
  };

  const styleOptions = STYLES.map((s) => ({ value: s.id, label: tx(s.label) }));
  const aspectOptions = ASPECTS.map((a) => ({ value: a, label: tx(ASPECT_LABELS[a]) || a }));
  const qualityOptions = RESOLUTIONS.map((r) => ({ value: r, label: r.toUpperCase() }));
  const countOptions = APP.counts.map((c) => ({ value: c, label: String(c) }));
  const canGenerate = (photos.length > 0 || /^https?:\/\//i.test(link.trim())) && !busy && !pending && !(cfg && !cfg.configured);
  const showError = err && !pending;

  return (
    <>
      <Header view={view} setView={setView} galleryCount={history.length} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {cfg && !cfg.configured && (
          <div role="alert" className="shrink-0 px-6 py-3 text-xs font-semibold text-center bg-secondary-500/10 border-b border-secondary-500/30 text-foreground">
            {t("notConfigured")}
          </div>
        )}

        {view === "gallery" ? (
          <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">{tx(L.galleryTitle)}</h1>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{tx(L.galleryText)}</p>
                </div>
                {history.length > 0 && (
                  <button type="button" onClick={() => { writeHistory([]); setHistory([]); }}
                    className="px-4 py-2 rounded-xl bg-glass-bg border border-glass-border hover:bg-glass-hover text-[10px] font-bold uppercase tracking-widest text-muted hover:text-foreground flex items-center gap-2">
                    <FaTrash /> {tx(L.clear)}
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-glass-border rounded-3xl text-center text-muted text-xs font-bold uppercase tracking-widest">{tx(L.galleryEmpty)}</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {history.map((h) => {
                    const u = h.jobs.find((j) => j.result_urls?.[0])?.result_urls?.[0];
                    return (
                      <button key={h.at} type="button" onClick={() => openHistory(h)}
                        className="relative group rounded-2xl overflow-hidden border border-glass-border aspect-[3/4] bg-glass-bg text-left hover:border-primary-500">
                        {u ? <img src={u} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          : <div className="w-full h-full grid place-items-center text-muted text-xs">{h.jobs.some((j) => !TERMINAL.has(j.status)) ? "…" : "—"}</div>}
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                          <div className="text-[10px] font-black uppercase tracking-widest text-white truncate">{h.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        ) : (
          <div className="flex flex-col-reverse lg:flex-row flex-1 h-full w-full overflow-y-auto lg:overflow-hidden">
            <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-r border-glass-border bg-glass-bg backdrop-blur-3xl flex flex-col shrink-0 h-auto lg:h-full lg:overflow-y-auto custom-scrollbar">
              <div className="p-6 border-b border-glass-border">
                <h1 className="text-lg font-black tracking-tight uppercase text-foreground drop-shadow-sm">{tx(L.studio)}</h1>
                <p className="mt-2 text-[10px] text-muted font-medium uppercase tracking-[0.2em]">{tx(L.engine)}</p>
              </div>

              <div className="flex-1 p-6 space-y-6">
                <Select id="style" icon={FaMagic} label={tx(L.style)} value={state.style} options={styleOptions} onChange={(v) => set({ style: v })} />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="ref-url" className="text-sm text-foreground font-semibold flex items-center gap-2">
                      <span className="w-1 h-1 bg-primary-500 rounded-full" /> {tx(L.photos)}
                    </label>
                    <span className="text-[10px] font-bold text-muted">{photos.length}/{SLOT.max}</span>
                  </div>
                  {photos.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {photos.map((u, i) => (
                        <div key={u + i} className="relative w-24 aspect-square rounded-2xl bg-glass-bg overflow-hidden group border-2 border-primary-500/20">
                          <img src={u} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} aria-label={t("remove")}
                            className="absolute top-2 right-2 bg-red-500 p-2 rounded-xl text-white shadow-xl opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 transition-all hover:scale-110">
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {photos.length < SLOT.max && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input id="ref-url" type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder={tx(L.urlPh)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }} onBlur={addLink}
                          className="flex-1 min-w-0 bg-glass-bg border border-glass-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-primary-500/50 text-foreground placeholder:text-muted/70" />
                        <input ref={fileRef} type="file" hidden multiple accept={APP.upload.types.join(",")} onChange={(e) => onFiles(e.target.files)} />
                        <button type="button" onClick={() => (cfg?.upload ? fileRef.current?.click() : addLink())}
                          aria-label={cfg?.upload ? t("upload") : t("add")} title={cfg?.upload ? t("upload") : t("add")}
                          className="w-10 h-10 bg-primary-500/10 border border-primary-500/10 text-primary-500 rounded-lg flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all shadow-sm group">
                          {uploading ? <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            : <FaPlus className="group-hover:scale-110 transition-transform" />}
                        </button>
                      </div>
                      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (cfg?.upload) onFiles(e.dataTransfer.files); }}
                        className="p-4 border-2 border-dashed border-glass-border rounded-xl flex flex-col items-center justify-center gap-2 bg-glass-bg/30 text-center">
                        <FaImages className="text-muted text-xl opacity-30" />
                        <span className="text-[10px] text-muted font-bold uppercase tracking-widest">{tx(L.need)}</span>
                        {!cfg?.upload && <span className="text-[10px] text-muted/80 normal-case">{t("uploadOff")}</span>}
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] leading-relaxed text-muted">{tx(SLOT.hint)}</p>
                </div>

                <Select id="aspect" icon={FaExpand} label={tx(L.aspect)} value={state.aspect} options={aspectOptions} onChange={(v) => set({ aspect: v })} up />
                <div className="grid grid-cols-2 gap-3">
                  <Select id="quality" icon={FaLayerGroup} label={tx(L.quality)} value={state.resolution} options={qualityOptions} onChange={(v) => set({ resolution: v })} up />
                  <Select id="count" icon={FaClone} label={tx(L.variants)} value={state.count} options={countOptions} onChange={(v) => set({ count: v })} up />
                </div>
                <div className="space-y-3">
                  <label htmlFor="note" className="text-sm text-foreground font-semibold flex items-center gap-2">
                    <span className="w-1 h-1 bg-primary-500 rounded-full" /> {tx(L.wishes)}
                  </label>
                  <input id="note" value={state.note} maxLength={200} onChange={(e) => set({ note: e.target.value })} placeholder={tx(L.wishesPh)}
                    className="w-full bg-glass-bg border border-glass-border rounded-lg px-3 py-3 text-sm outline-none focus:border-primary-500/50 text-foreground placeholder:text-muted/70" />
                </div>
              </div>

              <div className="p-6 border-t border-glass-border mt-auto space-y-3">
                <button type="button" onClick={generate} disabled={!canGenerate}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl py-4 font-bold tracking-wider uppercase text-xs flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 shadow-xl shadow-primary-500/30 border border-primary-400/50">
                  {busy || pending ? <span className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" /> : <FaBolt className="text-yellow-400" />}
                  {busy || pending ? tx(L.processing) : `${tx(L.generate)}${pText ? ` · ${pText}` : ""}`}
                </button>
                <p className="text-[10px] leading-relaxed text-muted text-center">{tx(L.charged)}</p>
              </div>
            </aside>

            <main ref={canvasRef} className="flex-1 relative flex flex-col bg-transparent overflow-hidden min-h-[60vh] lg:min-h-0 shrink-0">
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/[0.03] to-secondary-500/[0.03]" />
                <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-primary-500/[0.12] rounded-full blur-[140px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] bg-secondary-500/[0.12] rounded-full blur-[120px]" />
              </div>

              <div className="flex-1 relative z-10 p-6 md:p-12 overflow-y-auto flex items-center justify-center custom-scrollbar" aria-live="polite">
                {pending ? (
                  <div className="flex flex-col items-center justify-center space-y-12">
                    <div className="relative">
                      <div className="w-48 h-48 border-2 border-primary-500/10 rounded-full border-t-primary-500 animate-spin-slow" />
                      <div className="absolute inset-0 flex items-center justify-center"><FaBolt className="text-primary-500 animate-pulse text-2xl" /></div>
                    </div>
                    <div className="text-center space-y-4">
                      <div className="text-2xl font-black italic uppercase animate-pulse text-foreground drop-shadow-sm">
                        {elapsed < 4 ? tx(L.calibrating) : tx(L.developing)}
                      </div>
                      <div className="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 text-primary-500 text-[9px] font-black uppercase tracking-widest">
                        {tx(L.session)}: {elapsed.toFixed(1)}s
                      </div>
                    </div>
                  </div>
                ) : showError || allFailed ? (
                  <div role="alert" className="max-w-sm w-full p-10 bg-red-500/[0.04] border-2 border-red-500/20 rounded-3xl text-center space-y-4">
                    <div className="text-red-500 font-black uppercase tracking-[0.4em] text-[10px]">{tx(L.errTitle)}</div>
                    <p className="text-muted text-xs font-bold leading-loose">{showError ? err : tx(L.failed)}</p>
                  </div>
                ) : urls.length > 0 ? (
                  <div className="w-full max-w-5xl space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-black uppercase tracking-widest text-foreground">{run.label} {urls.length > 1 ? tx(L.pack) : tx(L.portrait)}</h2>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setRun(null)}
                          className="px-5 py-2 rounded-xl bg-glass-bg border border-glass-border hover:bg-glass-hover text-[10px] font-bold uppercase tracking-widest text-foreground">
                          {tx(L.newOne)}
                        </button>
                        <button type="button" onClick={downloadAll} disabled={downloading}
                          className="px-5 py-2 bg-primary-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-primary-600 transition-all shadow-lg disabled:opacity-60">
                          <FiDownload /> {downloading ? tx(L.downloading) : urls.length > 1 ? tx(L.downloadAll) : t("download")}
                        </button>
                      </div>
                    </div>
                    <div className={urls.length > 1 ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "flex justify-center"}>
                      {urls.map((u, i) => (
                        <div key={u} className={`relative group rounded-3xl overflow-hidden border border-glass-border bg-glass-bg shadow-2xl ${urls.length > 1 ? "aspect-[3/4]" : ""}`}>
                          <img src={u} alt="" className={urls.length > 1 ? "w-full h-full object-cover" : "max-h-[70vh] w-auto h-auto"} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity p-4 flex items-end justify-end gap-2">
                            <a href={u} target="_blank" rel="noopener noreferrer" aria-label={t("open")}
                              className="p-3 bg-white/90 text-black rounded-xl hover:scale-105 transition-transform"><FiExternalLink /></a>
                            <button type="button" onClick={() => downloadFile(u, `headshot-${state.style}-${i + 1}.png`)} aria-label={t("download")}
                              className="p-3 bg-white text-black rounded-xl hover:scale-105 transition-transform"><FiDownload /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 md:p-12 space-y-12">
                    <div className="max-w-md w-full text-center space-y-8">
                      <div className="relative w-28 h-28 mx-auto group">
                        <div className="absolute inset-0 bg-primary-500/10 blur-[30px] rounded-full" />
                        <div className="relative w-full h-full bg-glass-bg border border-glass-border rounded-3xl flex items-center justify-center shadow-sm transition-transform duration-700 group-hover:rotate-12">
                          <FaMagic className="text-3xl text-slate-200" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold tracking-tight uppercase text-foreground drop-shadow-sm">{tx(L.ready)}</h2>
                        <p className="text-muted font-medium text-[10px] uppercase tracking-widest leading-loose whitespace-pre-line">{tx(L.readyText)}</p>
                      </div>
                    </div>
                    <div className="w-full max-w-6xl mx-auto">
                      <StyleCarousel active={state.style} onPick={(id) => set({ style: id })} />
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        )}
      </div>

      {needCode && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm grid place-items-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="code-t" className="w-full max-w-sm rounded-3xl border border-glass-border bg-[var(--solid-bg)] p-6 space-y-4">
            <div id="code-t" className="flex items-center gap-2 font-bold text-foreground"><FaLock /> {t("accessTitle")}</div>
            <p className="text-sm text-muted">{t("accessText")}</p>
            <input value={codeDraft} onChange={(e) => setCodeDraft(e.target.value)} type="password" autoFocus aria-label={t("accessTitle")}
              onKeyDown={(e) => { if (e.key === "Enter") saveCode(); }}
              className="w-full rounded-xl bg-glass-bg border border-glass-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500" />
            <button type="button" onClick={saveCode} className="w-full rounded-xl py-2.5 font-bold bg-primary-500 text-white hover:bg-primary-600">{t("accessSave")}</button>
          </div>
        </div>
      )}
    </>
  );
}
