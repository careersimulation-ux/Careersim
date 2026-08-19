import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { academicYearOptions, identifyCareerFamily, type AcademicYear, type EducationLevel } from "@shared/studentRouting";
import { Check, ChevronLeft, ChevronRight, Compass, GraduationCap, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Dialog, DialogContent } from "./ui/dialog";

const highSchoolInterests = ["Engineering", "Medicine", "Chemistry", "Technology", "Graphic Design", "Business", "Finance", "Law", "Other"];
const universityInterests = ["Data Analysis", "Business Intelligence", "Technology", "Business", "Finance", "Marketing", "Engineering", "Science"];
const majorOptions = ["Civil Engineering", "Mechanical Engineering", "Electrical Engineering", "Medicine", "Pharmacy", "Chemistry", "Computer Science", "Information Technology", "Graphic Design", "Business Administration", "Accounting", "Marketing", "Other"];
const countries = ["Saudi Arabia", "United Arab Emirates", "Qatar", "Kuwait", "Bahrain", "Oman"];

const assessmentBank = {
  engineering: [
    { en: "Which activity normally happens first on a construction project?", ar: "أي نشاط يحدث عادة أولاً في مشروع إنشائي؟", options: ["Site preparation", "Final finishing"], answer: 0 },
    { en: "A project schedule is mainly used to…", ar: "يستخدم جدول المشروع بشكل أساسي من أجل…", options: ["Coordinate tasks and timing", "Replace safety checks"], answer: 0 },
    { en: "Why are drawings reviewed before work starts?", ar: "لماذا تُراجع الرسومات قبل بدء العمل؟", options: ["To clarify scope and requirements", "To choose the final salary"], answer: 0 },
  ],
  technology: [
    { en: "Which is the clearest way to confirm a user need?", ar: "ما أوضح طريقة لتأكيد احتياج المستخدم؟", options: ["A short user story", "A random guess"], answer: 0 },
    { en: "What does a chart help a team do?", ar: "بماذا يساعد المخطط الفريق؟", options: ["Spot patterns in data", "Hide information"], answer: 0 },
    { en: "A good requirement should be…", ar: "يجب أن يكون المتطلب الجيد…", options: ["Clear and testable", "Vague and changing"], answer: 0 },
  ],
  business: [
    { en: "A useful process handoff has…", ar: "يتضمن تسليم العملية المفيد…", options: ["A clear owner and next step", "No accountable owner"], answer: 0 },
    { en: "Stakeholder evidence helps you…", ar: "تساعدك أدلة أصحاب المصلحة على…", options: ["Validate a problem before acting", "Skip the diagnosis"], answer: 0 },
    { en: "A pilot is designed to…", ar: "صممت التجربة من أجل…", options: ["Test a focused change safely", "Replace every system at once"], answer: 0 },
  ],
  general: [
    { en: "The best first step when solving a problem is to…", ar: "أفضل خطوة أولى عند حل مشكلة هي…", options: ["Understand the evidence", "Choose a solution immediately"], answer: 0 },
    { en: "A measurable goal includes…", ar: "يتضمن الهدف القابل للقياس…", options: ["A clear success measure", "Only an opinion"], answer: 0 },
    { en: "Feedback is most useful when it is…", ar: "تكون التغذية الراجعة أكثر فائدة عندما تكون…", options: ["Specific and actionable", "Unclear"], answer: 0 },
  ],
};

type ExistingProfile = {
  fullName?: string | null; age?: number | null; educationLevel?: string | null; country?: string | null; university?: string | null;
  major?: string | null; academicYear?: string | null; graduationYear?: number | null; careerInterests?: string[]; preferredLanguage?: "en" | "ar";
};

export function PersonalizedOnboardingDialog({ open, onOpenChange, existingProfile, editMode = false }: { open: boolean; onOpenChange: (open: boolean) => void; existingProfile?: ExistingProfile | null; editMode?: boolean }) {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [educationLevel, setEducationLevel] = useState<EducationLevel>("university");
  const [country, setCountry] = useState("Saudi Arabia");
  const [major, setMajor] = useState("");
  const [university, setUniversity] = useState("");
  const [academicYear, setAcademicYear] = useState<AcademicYear>("year_1");
  const [graduationYear, setGraduationYear] = useState<number | "">(new Date().getFullYear());
  const [interests, setInterests] = useState<string[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [confirmCareerChange, setConfirmCareerChange] = useState(false);
  const save = trpc.profile.savePersonalized.useMutation({
    onSuccess: path => { setRecommendation(path); setStep(5); },
    onError: error => toast.error(error.message || (language === "ar" ? "تعذر حفظ الملف" : "We could not save your profile.")),
  });

  useEffect(() => {
    if (!open) return;
    setStep(1); setRecommendation(null); setAnswers([]);
    setFullName(existingProfile?.fullName || user?.name || ""); setAge(existingProfile?.age ?? "");
    setEducationLevel((existingProfile?.educationLevel as EducationLevel) || "university"); setCountry(existingProfile?.country || "Saudi Arabia");
    setMajor(existingProfile?.major || ""); setUniversity(existingProfile?.university || "");
    setAcademicYear((existingProfile?.academicYear as AcademicYear) || "year_1"); setGraduationYear(existingProfile?.graduationYear ?? new Date().getFullYear());
    setInterests(existingProfile?.careerInterests || []); setConfirmCareerChange(false);
  }, [open, existingProfile, user?.name]);

  const studentType = educationLevel === "high_school" ? "high-school" : educationLevel === "graduate" ? "graduate" : "university";
  const interestOptions = educationLevel === "high_school" ? highSchoolInterests : universityInterests;
  const career = useMemo(() => identifyCareerFamily(major, interests), [major, interests]);
  const requiresSkillCheck = educationLevel === "university" && ["year_3", "year_4", "year_5", "final_year"].includes(academicYear ?? "");
  const questions = assessmentBank[career.key as keyof typeof assessmentBank] ?? assessmentBank.general;
  const isArabic = language === "ar";
  const copy = isArabic ? {
    title: "خلّينا نعرفك أولاً", subtitle: "أجب عن أسئلة بسيطة لنختار لك أفضل تجربة.", personal: "شخصي", education: "التعليم", field: "المجال", path: "مسارك", name: "الاسم الكامل", age: "العمر", educationLevel: "المستوى التعليمي", high: "طالب ثانوي", universityStudent: "طالب جامعي", graduate: "خريج", other: "أخرى", interests: "ما المجالات التي تهمك؟", major: "التخصص أو الكلية", university: "الجامعة", academic: "السنة الدراسية", graduation: "سنة التخرج", next: "التالي", back: "السابق", save: "اعرض مساري", quick: "فحص مهارات سريع", quickText: "ثلاثة أسئلة قصيرة تساعدنا على تحديد نقطة بداية مناسبة.", welcome: "مرحباً", why: "لماذا هذه البداية؟", explore: "ابدأ الاستكشاف", start: "ابدأ التجربة", otherCareers: "استكشف مسارات أخرى", signIn: "سجّل الدخول للمتابعة", confirm: "تغيير تخصصك قد يغيّر مسارك المهني. هل تريد المتابعة؟", cancel: "إلغاء", continue: "متابعة", required: "أكمل الحقول المطلوبة للمتابعة." }
    : { title: "Let’s get to know you first", subtitle: "Answer a few quick questions so we can choose the best simulation for you.", personal: "Personal", education: "Education", field: "Field", path: "Your path", name: "Full name", age: "Age", educationLevel: "Education level", high: "High School Student", universityStudent: "University Student", graduate: "Graduate", other: "Other", interests: "Which fields interest you?", major: "Major or faculty", university: "University", academic: "Academic year", graduation: "Graduation year", next: "Next", back: "Back", save: "See my path", quick: "Quick Skill Check", quickText: "Three short questions help us select a confident starting point.", welcome: "Welcome", why: "Why this starting point?", explore: "Start exploring", start: "Start experience", otherCareers: "Explore other careers", signIn: "Sign in to continue", confirm: "Changing your major may change your career path. Continue?", cancel: "Cancel", continue: "Continue", required: "Complete the required fields to continue." };

  const toggleInterest = (value: string) => setInterests(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value].slice(0, 4));
  const validPersonal = fullName.trim().length >= 2 && typeof age === "number" && age >= 13 && age <= 100;
  const validEducation = Boolean(educationLevel);
  const validField = interests.length > 0 && (educationLevel === "high_school" || (major.trim() && university.trim() && (educationLevel !== "university" || academicYear) && (educationLevel !== "graduate" || graduationYear)));
  const assessmentScore = answers.length === questions.length ? Math.round((answers.filter((answer, index) => answer === questions[index]?.answer).length / questions.length) * 100) : null;
  const saveProfile = (forceCareerChange = false) => {
    if (!validField) return toast.error(copy.required);
    if (editMode && existingProfile?.major && major.trim() && existingProfile.major.trim().toLowerCase() !== major.trim().toLowerCase() && !forceCareerChange) { setConfirmCareerChange(true); return; }
    save.mutate({ fullName, age: Number(age), educationLevel, country, major: educationLevel === "high_school" ? null : major, university: educationLevel === "high_school" ? null : university, academicYear: educationLevel === "university" ? academicYear : null, graduationYear: educationLevel === "graduate" ? Number(graduationYear) : null, careerInterests: interests, preferredLanguage: language, assessmentScore });
  };
  const next = () => {
    if (step === 1 && !validPersonal) return toast.error(copy.required);
    if (step === 2 && !validEducation) return toast.error(copy.required);
    if (step === 3) { if (!validField) return toast.error(copy.required); if (requiresSkillCheck) return setStep(4); return saveProfile(); }
    if (step === 4) { if (answers.length !== questions.length) return toast.error(copy.required); saveProfile(); }
    setStep(current => current + 1);
  };
  const steps = [copy.personal, copy.education, copy.field, copy.path];

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-0 bg-transparent p-0 shadow-none sm:rounded-[2rem]" aria-describedby={undefined}>
    <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl shadow-slate-950/20">
      {!isAuthenticated ? <div className="bg-slate-950 px-7 py-10 text-center text-white sm:px-12"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-400 text-slate-950"><Sparkles className="h-5 w-5" /></span><h2 className="mt-5 font-display text-3xl font-bold">{copy.title}</h2><p className="mx-auto mt-3 max-w-md leading-7 text-slate-300">{copy.subtitle}</p><button type="button" onClick={() => { sessionStorage.setItem("careersim-personalized-onboarding", "1"); startLogin(); }} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950"><GraduationCap className="h-4 w-4" />{copy.signIn}</button></div> : step === 5 && recommendation ? <div className="p-7 sm:p-10"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-100 text-teal-800"><Check className="h-5 w-5" /></span><p className="mt-6 text-sm font-semibold text-teal-700">{copy.welcome} {fullName.split(" ")[0]}!</p><h2 className="mt-2 font-display text-3xl font-bold text-slate-950">{recommendation.decision.experience[language]}</h2><p className="mt-4 leading-7 text-slate-600">{recommendation.decision.reason[language]}</p><div className="mt-7 grid gap-3 rounded-2xl bg-slate-50 p-5 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Career</p><p className="mt-1 font-semibold text-slate-900">{recommendation.decision.career.label[language]}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Level</p><p className="mt-1 font-semibold text-slate-900">{recommendation.decision.experience[language]}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Skills</p><p className="mt-1 text-sm font-semibold text-slate-900">{recommendation.decision.career.skills.slice(0, 2).join(" · ")}</p></div></div><div className="mt-7 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => { onOpenChange(false); setLocation(recommendation.decision.recommendedSimulationAvailable ? `/simulations/${recommendation.decision.recommendedSimulationSlug}` : recommendation.decision.isExploration ? "/explore" : "/catalog"); }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white">{recommendation.decision.isExploration ? copy.explore : copy.start}<ChevronRight className="h-4 w-4 rtl:rotate-180" /></button><button type="button" onClick={() => { onOpenChange(false); setLocation("/catalog"); }} className="rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-700">{copy.otherCareers}</button></div></div> : <div>
        <div className="bg-slate-950 px-6 pb-7 pt-8 text-white sm:px-10"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-teal-200"><Sparkles className="h-3.5 w-3.5" />CareerSim pathfinder</span><h2 className="mt-3 font-display text-3xl font-bold">{copy.title}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">{copy.subtitle}</p><div className="mt-7 grid grid-cols-4 gap-2">{steps.map((label, index) => <div key={label}><div className={`h-1 rounded-full ${index + 1 <= Math.min(step, 4) ? "bg-teal-400" : "bg-white/15"}`} /><p className={`mt-2 text-[10px] font-bold ${index + 1 === step ? "text-teal-200" : "text-slate-500"}`}>0{index + 1} {label}</p></div>)}</div></div>
        <div className="p-6 sm:p-10">{step === 1 && <div className="grid gap-5"><label className="grid gap-2 text-sm font-bold text-slate-700">{copy.name}<input autoFocus value={fullName} onChange={event => setFullName(event.target.value)} className="h-12 rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></label><label className="grid max-w-[180px] gap-2 text-sm font-bold text-slate-700">{copy.age}<input type="number" min="13" max="100" value={age} onChange={event => setAge(event.target.value ? Number(event.target.value) : "")} className="h-12 rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></label></div>}{step === 2 && <div className="grid gap-3 sm:grid-cols-2">{([['high_school', copy.high], ['university', copy.universityStudent], ['graduate', copy.graduate], ['other', copy.other]] as Array<[EducationLevel, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => setEducationLevel(value)} className={`rounded-2xl border p-5 text-start transition ${educationLevel === value ? "border-teal-700 bg-teal-50 ring-2 ring-teal-100" : "border-slate-200 hover:border-teal-300"}`}><GraduationCap className={`h-5 w-5 ${educationLevel === value ? "text-teal-700" : "text-slate-400"}`} /><p className="mt-4 font-bold text-slate-900">{label}</p></button>)}</div>}{step === 3 && <div className="grid gap-5"><label className="grid gap-2 text-sm font-bold text-slate-700">{isArabic ? "الدولة" : "Country"}<select value={country} onChange={event => setCountry(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-teal-600">{countries.map(item => <option key={item}>{item}</option>)}</select></label>{educationLevel !== "high_school" && <><label className="grid gap-2 text-sm font-bold text-slate-700">{copy.major}<input list="careersim-majors" value={major} onChange={event => setMajor(event.target.value)} placeholder={isArabic ? "ابحث أو اكتب تخصصك" : "Search or type your major"} className="h-12 rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-teal-600" /><datalist id="careersim-majors">{majorOptions.map(item => <option key={item} value={item} />)}</datalist></label><label className="grid gap-2 text-sm font-bold text-slate-700">{copy.university}<input value={university} onChange={event => setUniversity(event.target.value)} placeholder={isArabic ? "ابحث أو اكتب جامعتك" : "Search or type your university"} className="h-12 rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-teal-600" /></label>{educationLevel === "university" ? <label className="grid gap-2 text-sm font-bold text-slate-700">{copy.academic}<select value={academicYear ?? ""} onChange={event => setAcademicYear(event.target.value as AcademicYear)} className="h-12 rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-teal-600">{academicYearOptions.map(item => <option value={item.value} key={item.value}>{item.label[language]}</option>)}</select></label> : <label className="grid gap-2 text-sm font-bold text-slate-700">{copy.graduation}<input type="number" min="1900" max="2200" value={graduationYear} onChange={event => setGraduationYear(event.target.value ? Number(event.target.value) : "")} className="h-12 rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-teal-600" /></label>}</>}<fieldset><legend className="mb-3 text-sm font-bold text-slate-700">{copy.interests}</legend><div className="flex flex-wrap gap-2">{interestOptions.map(item => <button key={item} type="button" onClick={() => toggleInterest(item)} className={`rounded-full border px-3 py-2 text-xs font-bold ${interests.includes(item) ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 text-slate-600"}`}>{item}</button>)}</div></fieldset></div>}{step === 4 && <div><p className="text-sm font-bold text-teal-700">{copy.quick}</p><h3 className="mt-2 font-display text-2xl font-bold text-slate-950">{copy.quickText}</h3><div className="mt-6 space-y-5">{questions.map((question, index) => <fieldset key={question.en}><legend className="text-sm font-bold text-slate-800">{isArabic ? question.ar : question.en}</legend><div className="mt-3 grid gap-2">{question.options.map((option, optionIndex) => <button key={option} type="button" onClick={() => setAnswers(current => { const nextAnswers = [...current]; nextAnswers[index] = optionIndex; return nextAnswers; })} className={`rounded-xl border px-4 py-3 text-start text-sm font-semibold ${answers[index] === optionIndex ? "border-teal-700 bg-teal-50 text-teal-900" : "border-slate-200 text-slate-600"}`}>{option}</button>)}</div></fieldset>)}</div></div>}<div className="mt-8 flex items-center justify-between gap-3">{step > 1 ? <button type="button" onClick={() => setStep(current => current - 1)} className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-slate-600"><ChevronLeft className="h-4 w-4 rtl:rotate-180" />{copy.back}</button> : <span />}{confirmCareerChange ? <div className="flex items-center gap-2"><span className="max-w-[210px] text-xs font-semibold text-amber-700">{copy.confirm}</span><button type="button" onClick={() => { setConfirmCareerChange(true); saveProfile(true); }} className="rounded-xl bg-slate-950 px-3 py-3 text-xs font-bold text-white">{copy.continue}</button></div> : <button type="button" onClick={next} disabled={save.isPending} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{step === 3 && !requiresSkillCheck || step === 4 ? copy.save : copy.next}<ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>}</div></div>
      </div>}
    </div>
  </DialogContent></Dialog>;
}
