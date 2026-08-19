import { useAuth } from "@/_core/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { PersonalizedOnboardingDialog } from "@/components/PersonalizedOnboardingDialog";
import { useLanguage } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Onboarding() {
  const { language } = useLanguage();
  const { loading } = useAuth({ redirectOnUnauthenticated: true });
  const profile = trpc.profile.me.useQuery();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(true);
  if (loading || profile.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div>;
  const copy = language === "ar" ? { title: "يبدأ مسارك ببعض الأسئلة.", description: "تستخدم CareerSim مرحلتك التعليمية واهتماماتك لشرح نقطة بداية مناسبة. يمكنك تحديثها لاحقاً.", continue: "متابعة" } : { title: "Your path starts with a few questions.", description: "CareerSim uses your education stage and interests to explain a confident starting point. You can update it later.", continue: "Continue" };
  return <div className="min-h-screen bg-slate-50"><AppHeader /><main className="container grid min-h-[calc(100vh-80px)] place-items-center py-10"><div className="max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_60px_-42px_rgba(15,23,42,.45)]"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-100 text-teal-700"><Sparkles className="h-5 w-5" /></span><h1 className="mt-5 font-display text-3xl font-bold text-slate-950">{copy.title}</h1><p className="mt-3 leading-7 text-slate-500">{copy.description}</p><button type="button" onClick={() => setOpen(true)} className="mt-7 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">{copy.continue}</button></div><PersonalizedOnboardingDialog open={open} onOpenChange={value => { setOpen(value); if (!value) setLocation(profile.data?.educationLevel ? "/career-path" : "/"); }} existingProfile={profile.data} /></main></div>;
}
