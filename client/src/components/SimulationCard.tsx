import { translateSkill, useLanguage } from "@/i18n";
import type { LocalizedText } from "@shared/simulation/types";
import { ArrowUpRight, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export type CatalogCardItem = {
  slug: string;
  title: LocalizedText;
  company: LocalizedText;
  industry: LocalizedText;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  skills: string[];
  status: "published" | "coming_soon" | "draft" | "archived";
};

export function SimulationCard({ item, featured = false }: { item: CatalogCardItem; featured?: boolean }) {
  const { text, t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const live = item.status === "published";
  const accent = featured ? "from-teal-900 via-teal-800 to-cyan-800" : "from-slate-900 to-slate-800";
  return <article className={`group relative overflow-hidden rounded-[1.5rem] border ${featured ? "border-teal-200" : "border-slate-200"} bg-white p-5 shadow-[0_20px_55px_-35px_rgba(15,23,42,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_65px_-35px_rgba(15,23,42,0.55)]`}>
    <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent}`} />
    <div className="mb-9 flex items-start justify-between gap-4 pt-2"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{text(item.industry)}</p><h3 className="font-display text-xl font-bold tracking-tight text-slate-950">{text(item.title)}</h3><p className="mt-1 text-sm text-slate-500">{text(item.company)}</p></div><span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${live ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}>{live ? <Sparkles className="h-3 w-3" /> : <LockKeyhole className="h-3 w-3" />}{live ? t.catalog.live : t.catalog.soon}</span></div>
    <div className="mb-5 flex items-center gap-3 text-xs font-medium text-slate-500"><span className="rounded-md bg-slate-100 px-2 py-1">{t.common[item.difficulty]}</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{item.estimatedMinutes} {t.catalog.minutes}</span></div>
    <div className="mb-6 flex flex-wrap gap-1.5">{item.skills.slice(0, 3).map(skill => <span key={skill} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600">{translateSkill(skill, language)}</span>)}</div>
    <button type="button" disabled={!live} onClick={() => live && setLocation(`/simulations/${item.slug}`)} className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition active:scale-[0.98] ${live ? "bg-slate-950 text-white hover:bg-teal-800" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}>{live ? t.catalog.view : t.catalog.soon}<ArrowUpRight className="h-4 w-4" /></button>
  </article>;
}
