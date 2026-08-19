import { startLogin } from "@/const";
import { useLanguage } from "@/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { BriefcaseBusiness, ChevronRight, Menu, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LanguageToggle } from "./LanguageToggle";

export function Brand() {
  return <Link href="/" className="group inline-flex items-center gap-2.5 text-slate-950"><span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-700 text-sm font-black text-white shadow-lg shadow-teal-900/20 transition group-hover:-rotate-3"><BriefcaseBusiness className="h-4 w-4" /></span><span className="font-display text-[17px] font-bold tracking-tight">CareerSim <span className="text-teal-700">Gulf</span></span></Link>;
}

export function AppHeader({ transparent = false }: { transparent?: boolean }) {
  const { t } = useLanguage();
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigateCatalog = () => { setMobileOpen(false); setLocation("/catalog"); };
  return (
    <header className={`relative z-30 ${transparent ? "" : "border-b border-slate-200/80 bg-white/85 backdrop-blur-xl"}`}>
      <div className="container flex h-20 items-center justify-between gap-4">
        <Brand />
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex" aria-label="Primary navigation">
          <Link href="/catalog" className="transition hover:text-teal-700">{t.nav.simulations}</Link>
          {isAuthenticated && <><Link href="/career-path" className="transition hover:text-teal-700">{t.nav.careerPath}</Link><Link href="/portfolio" className="transition hover:text-teal-700">{t.nav.portfolio}</Link></>}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <LanguageToggle />
          {!loading && (isAuthenticated ? <button type="button" onClick={() => setLocation("/career-path")} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 active:scale-[0.97]"><UserRound className="h-3.5 w-3.5" />{user?.name?.split(" ")[0] ?? t.nav.careerPath}</button> : <button type="button" onClick={startLogin} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 active:scale-[0.97]">{t.nav.signIn}<ChevronRight className="h-3.5 w-3.5" /></button>)}
        </div>
        <div className="flex items-center gap-2 md:hidden"><LanguageToggle /><button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-800"><Menu className="h-4 w-4" /></button></div>
      </div>
      {mobileOpen && <div className="absolute inset-x-0 top-full border-b border-slate-200 bg-white p-4 shadow-xl md:hidden"><div className="container grid gap-2 text-sm font-semibold"><button type="button" onClick={navigateCatalog} className="rounded-xl px-3 py-3 text-start hover:bg-slate-50">{t.nav.simulations}</button>{isAuthenticated && <><button type="button" onClick={() => { setMobileOpen(false); setLocation("/career-path"); }} className="rounded-xl px-3 py-3 text-start hover:bg-slate-50">{t.nav.careerPath}</button><button type="button" onClick={() => { setMobileOpen(false); setLocation("/portfolio"); }} className="rounded-xl px-3 py-3 text-start hover:bg-slate-50">{t.nav.portfolio}</button></>}{!isAuthenticated && <button type="button" onClick={startLogin} className="rounded-xl bg-slate-950 px-3 py-3 text-white">{t.nav.signIn}</button>}</div></div>}
    </header>
  );
}
