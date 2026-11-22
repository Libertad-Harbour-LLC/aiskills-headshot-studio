"use client";

import { useState } from "react";
import { FaRocket, FaBars, FaTimes } from "react-icons/fa";
import { SiVercel } from "react-icons/si";
import { APP } from "@/lib/app.config";
import { useLang } from "@/lib/i18n";

const DEPLOY = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(`https://github.com/Libertad-Harbour-LLC/aiskills-${APP.id}`)}&env=AISKILLS_API_KEY&envDescription=${encodeURIComponent("Your AI SKILLS API key")}&envLink=${encodeURIComponent("https://aiskills.team/api-keys")}`;

export default function Header({ view, setView, galleryCount = 0 }) {
  const { lang, setLang, tx } = useLang();
  const [open, setOpen] = useState(false);
  const links = [
    { id: "studio", label: { en: "Workspace", ru: "Студия" } },
    { id: "gallery", label: { en: "Gallery", ru: "Галерея" }, badge: galleryCount },
  ];

  return (
    <nav className="h-20 shrink-0 border-b border-glass-border bg-glass-bg backdrop-blur-3xl sticky top-0 z-[100] px-4 md:px-12 flex items-center justify-between gap-3 relative">
      <a href="/" className="flex items-center gap-3 group min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform shrink-0">
          <FaRocket className="text-white text-lg" />
        </div>
        <span className="font-black text-xl tracking-tighter uppercase text-foreground truncate">{APP.name}</span>
      </a>

      <div className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <button key={l.id} type="button" onClick={() => setView(l.id)} aria-current={view === l.id ? "page" : undefined}
            className={`text-sm font-semibold tracking-tight transition-all relative py-2 ${view === l.id ? "text-foreground" : "text-muted hover:text-foreground"}`}>
            {tx(l.label)}
            {l.badge > 0 && <span className="ml-1.5 text-[10px] text-muted">{l.badge}</span>}
            {view === l.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex rounded-xl border border-glass-border bg-glass-bg p-0.5" role="group" aria-label="Language">
          {["en", "ru"].map((l) => (
            <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${lang === l ? "bg-primary-500 text-white" : "text-muted hover:text-foreground"}`}>
              {l}
            </button>
          ))}
        </div>
        <a href={DEPLOY} target="_blank" rel="noopener noreferrer"
          className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-slate-900/10">
          <SiVercel className="text-xs" /> Deploy
        </a>
        <a href="https://aiskills.team" target="_blank" rel="noopener"
          className="hidden sm:flex items-center px-4 py-2 rounded-xl bg-glass-bg border border-glass-border hover:bg-glass-hover text-[10px] font-bold tracking-widest uppercase text-muted hover:text-foreground">
          AI SKILLS
        </a>
        <button type="button" className="md:hidden p-2 text-muted hover:text-foreground" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          {open ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
        </button>
      </div>

      {open && (
        <div className="absolute top-20 left-0 right-0 bg-[var(--solid-bg)]/95 backdrop-blur-2xl border-b border-glass-border shadow-2xl flex flex-col md:hidden z-50 p-4 gap-2">
          {links.map((l) => (
            <button key={l.id} type="button" onClick={() => { setView(l.id); setOpen(false); }}
              className={`p-4 rounded-xl text-left font-semibold text-sm ${view === l.id ? "bg-primary-500/15 text-foreground" : "text-muted hover:bg-glass-bg"}`}>
              {tx(l.label)}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
