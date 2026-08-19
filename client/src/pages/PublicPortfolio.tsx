import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { Award, GraduationCap, Loader2, ShieldCheck } from "lucide-react";
import { useParams } from "wouter";
import { PortfolioItems, type PortfolioViewData } from "./Portfolio";

export default function PublicPortfolio() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const query = trpc.sharing.portfolio.useQuery({ slug });
  const copy = language === "ar" ? { work: "ملف أعمال CareerSim", description: "محاكاة مكتملة ومهارات موثقة من خلال تجارب عمل افتراضية.", missing: "هذا الملف غير متاح أو خاص." } : { work: "CareerSim portfolio", description: "Completed simulations and demonstrated skills from immersive virtual work experiences.", missing: "This portfolio is unavailable or private." };
  if (query.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div>;
  if (!query.data) return <div className="min-h-screen bg-slate-50"><AppHeader /><main className="grid min-h-[60vh] place-items-center p-5"><div className="rounded-2xl bg-white p-8 text-center shadow-xl shadow-slate-900/5"><ShieldCheck className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-4 text-sm text-slate-600">{copy.missing}</p></div></main></div>;
  const data = query.data as unknown as PortfolioViewData;
  return <div className="min-h-screen bg-[#f8fafc]"><AppHeader /><main className="container py-9 lg:py-14"><section className="rounded-[2rem] border border-teal-100 bg-teal-50 p-7 sm:p-10"><span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-teal-800"><Award className="h-3.5 w-3.5" />{copy.work}</span><div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="font-display text-4xl font-bold tracking-tight text-slate-950">{data.user.name}</h1><p className="mt-2 text-sm text-slate-600">{data.profile.major} · {data.profile.university}</p><p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{copy.description}</p></div><div className="flex gap-2 text-xs font-bold text-teal-800"><GraduationCap className="h-4 w-4" />{data.items.length} {language === "ar" ? "محاكاة مكتملة" : "completed simulations"}</div></div></section><PortfolioItems data={data} language={language} publicView /></main></div>;
}
