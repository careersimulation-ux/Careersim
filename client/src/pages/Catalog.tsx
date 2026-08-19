import { AppHeader } from "@/components/AppHeader";
import { CatalogCardItem, SimulationCard } from "@/components/SimulationCard";
import { useLanguage } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { Compass, Loader2 } from "lucide-react";

export default function Catalog() {
  const { t } = useLanguage();
  const query = trpc.catalog.list.useQuery();
  return <div className="min-h-screen bg-[#f8fafc]"><AppHeader /><main><section className="border-b border-slate-200 bg-white"><div className="container py-14 lg:py-20"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700"><Compass className="h-3.5 w-3.5" />{t.catalog.eyebrow}</span><h1 className="mt-5 max-w-2xl font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">{t.catalog.title}</h1><p className="mt-5 max-w-xl leading-7 text-slate-600">{t.catalog.subtitle}</p></div></section><section className="container py-10 lg:py-14">{query.isLoading && <div className="grid min-h-72 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div>}{query.isError && <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-800">{t.common.error}</div>}{query.data && <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{query.data.map(item => <SimulationCard key={item.id} item={item as CatalogCardItem} featured={item.status === "published"} />)}</div>}</section></main></div>;
}
