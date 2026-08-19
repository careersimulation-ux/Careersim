import { useAuth } from "@/_core/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { careerFamilies } from "@shared/studentRouting";
import { ArrowRight, Compass, Loader2, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function ExploreYourFuture() {
  const { language } = useLanguage();
  const { loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const path = trpc.profile.careerPath.useQuery();
  if (loading || path.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div>;
  const copy = language === "ar" ? { eyebrow: "استكشف مستقبلك", title: "جرّب مجالات مختلفة قبل اختيار مسارك.", subtitle: "هذه تجارب استكشافية وليست توصية نهائية. ستظهر تجارب مهنية جديدة هنا كلما أصبحت متاحة.", try: "استكشف هذا المجال", other: "كل المحاكاة" } : { eyebrow: "Explore your future", title: "Try different fields before choosing a path.", subtitle: "These are exploration starting points, not a final career recommendation. New professional experiences will appear here as they become available.", try: "Explore this field", other: "All simulations" };
  return <div className="min-h-screen bg-[#f8fafc]"><AppHeader /><main className="container py-10 sm:py-14"><section className="rounded-[2rem] bg-[radial-gradient(circle_at_80%_0%,rgba(20,184,166,.2),transparent_34%),#0f172a] p-8 text-white sm:p-12"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-teal-200"><Sparkles className="h-3.5 w-3.5" />{copy.eyebrow}</span><h1 className="mt-5 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">{copy.title}</h1><p className="mt-5 max-w-xl leading-7 text-slate-300">{copy.subtitle}</p></section><section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{careerFamilies.map((career, index) => <article key={career.key} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(15,23,42,.35)] transition hover:-translate-y-0.5 hover:border-teal-200"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${index % 2 ? "bg-amber-50 text-amber-700" : "bg-teal-50 text-teal-700"}`}><Compass className="h-5 w-5" /></span><h2 className="mt-6 font-display text-2xl font-bold text-slate-950">{career.label[language]}</h2><p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">{career.skills.slice(0, 3).join(" · ")}</p><button type="button" onClick={() => setLocation(career.availableSimulationSlugs[0] ? `/simulations/${career.availableSimulationSlugs[0]}` : "/catalog")} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-teal-700">{copy.try}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></button></article>)}</section><button type="button" onClick={() => setLocation("/catalog")} className="mt-10 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">{copy.other}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></button></main></div>;
}
