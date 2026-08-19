import { useAuth } from "@/_core/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/i18n";
import { trpc } from "@/lib/trpc";
import type { LocalizedText } from "@shared/simulation/types";
import { Award, Copy, ExternalLink, Eye, EyeOff, GraduationCap, Loader2, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const local = (value: unknown, language: "en" | "ar") => (value as LocalizedText | undefined)?.[language] ?? "CareerSim Gulf";

export type PortfolioViewData = {
  profile: { publicSlug: string; major: string | null; university: string | null; portfolioIsPublic: "yes" | "no" };
  user: { name: string | null };
  items: Array<{
    item: { id: string; summary: string };
    result: { totalScore: number };
    simulation: { title: LocalizedText; company: LocalizedText; industry: LocalizedText; skills: string[]; slug: string };
    certificate: { verificationCode: string } | null;
  }>;
};

function PortfolioItems({ data, language, publicView = false }: { data: PortfolioViewData; language: "en" | "ar"; publicView?: boolean }) {
  const [, setLocation] = useLocation();
  const copy = language === "ar" ? { completed: "تم الإكمال", certificate: "عرض الشهادة", project: "عرض المشروع", skills: "المهارات" } : { completed: "Completed", certificate: "View certificate", project: "View project", skills: "Skills" };
  return <div className="mt-8 grid gap-4 md:grid-cols-2">{data.items.map(({ item, result, simulation, certificate }) => <article key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,.4)]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-teal-700">{local(simulation.industry, language)}</p><h2 className="mt-2 font-display text-xl font-bold text-slate-950">{local(simulation.title, language)}</h2><p className="mt-1 text-sm text-slate-500">{local(simulation.company, language)}</p></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 font-display text-sm font-bold text-teal-800">{result.totalScore}%</span></div><p className="mt-5 text-sm leading-6 text-slate-600">{item.summary}</p><div className="mt-5 flex flex-wrap gap-2">{(simulation.skills as string[]).slice(0, 3).map(skill => <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{skill}</span>)}</div><div className="mt-6 flex flex-wrap gap-2"><button type="button" onClick={() => certificate && setLocation(`/certificate/${certificate.verificationCode}`)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2.5 text-xs font-bold text-white"><Award className="h-3.5 w-3.5" />{copy.certificate}</button>{!publicView && <button type="button" onClick={() => setLocation(`/simulations/${simulation.slug}`)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700"><ExternalLink className="h-3.5 w-3.5" />{copy.project}</button>}</div></article>)}</div>;
}

export default function Portfolio() {
  const { language } = useLanguage();
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const query = trpc.sharing.myPortfolio.useQuery(undefined, { enabled: Boolean(user) });
  const [, setLocation] = useLocation();
  const copy = language === "ar" ? { title: "ملفك المهني", subtitle: "سجل عملي قابل للمشاركة يوضح المحاكاة التي أكملتها والمهارات التي أثبتّها.", public: "الرابط العام", copy: "نسخ الرابط", start: "استكشف المحاكاة", empty: "لم تكمل أي محاكاة بعد.", publicOn: "الملف عام", publicOff: "الملف خاص", makePublic: "اجعل الملف عاماً", makePrivate: "اجعل الملف خاصاً" } : { title: "Your career portfolio", subtitle: "A shareable record of the simulations you have completed and the skills you have demonstrated.", public: "Public link", copy: "Copy link", start: "Explore simulations", empty: "You have not completed a simulation yet.", publicOn: "Portfolio is public", publicOff: "Portfolio is private", makePublic: "Make public", makePrivate: "Make private" };
  if (loading || query.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div>;
  if (!query.data) return <div className="min-h-screen bg-slate-50"><AppHeader /><main className="container py-20 text-center"><p className="text-slate-600">{copy.empty}</p><button type="button" onClick={() => setLocation("/catalog")} className="mt-5 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">{copy.start}</button></main></div>;
  const data = query.data as unknown as PortfolioViewData;
  const publicUrl = `${window.location.origin}/u/${data.profile.publicSlug}`;
  const copyLink = async () => { await navigator.clipboard.writeText(publicUrl); toast.success(language === "ar" ? "تم نسخ الرابط" : "Public link copied"); };
  const visibility = trpc.profile.setPortfolioVisibility.useMutation({ onSuccess: () => { query.refetch(); toast.success(language === "ar" ? "تم تحديث الخصوصية" : "Portfolio visibility updated"); }, onError: () => toast.error(language === "ar" ? "تعذر تحديث الخصوصية" : "Could not update visibility") });
  const isPublic = data.profile.portfolioIsPublic === "yes";
  return <div className="min-h-screen bg-[#f8fafc]"><AppHeader /><main className="container py-9 lg:py-14"><section className="rounded-[2rem] bg-slate-950 p-7 text-white sm:p-10"><div className="grid gap-6 md:grid-cols-[1fr_auto]"><div><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-teal-100"><Sparkles className="h-3.5 w-3.5" />CareerSim Gulf</span><h1 className="mt-6 font-display text-4xl font-bold tracking-tight">{copy.title}</h1><p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">{copy.subtitle}</p></div><div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-teal-500 text-xl font-bold text-slate-950">{data.user.name?.slice(0, 1).toUpperCase() ?? "S"}</span><div><p className="font-display text-lg font-bold">{data.user.name}</p><p className="mt-1 text-sm text-slate-400">{data.profile.major} · {data.profile.university}</p></div></div></div><div className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="flex items-center gap-2 text-xs font-bold text-teal-100">{isPublic ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{isPublic ? copy.publicOn : copy.publicOff}</p><p className="mt-1 truncate text-xs text-slate-300">{publicUrl}</p></div><div className="flex gap-2"><button type="button" disabled={!isPublic} onClick={copyLink} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-900 disabled:opacity-40"><Copy className="h-3.5 w-3.5" />{copy.copy}</button><button type="button" disabled={visibility.isPending} onClick={() => visibility.mutate({ isPublic: !isPublic })} className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/20 px-3 py-2.5 text-xs font-bold text-white hover:bg-white/10">{isPublic ? copy.makePrivate : copy.makePublic}</button></div></div></section>{data.items.length ? <PortfolioItems data={data} language={language} /> : <section className="mt-7 rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center"><GraduationCap className="mx-auto h-9 w-9 text-teal-700" /><p className="mt-4 text-sm text-slate-600">{copy.empty}</p><button type="button" onClick={() => setLocation("/catalog")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white">{copy.start}<Share2 className="h-4 w-4" /></button></section>}</main></div>;
}

export { PortfolioItems };
