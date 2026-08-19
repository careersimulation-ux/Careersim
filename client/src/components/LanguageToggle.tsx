import { useLanguage } from "@/i18n";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 active:scale-[0.97]"
      aria-label="Change language">
      <Languages className="h-3.5 w-3.5 text-teal-700" />
      {language === "en" ? "العربية" : "English"}
    </button>
  );
}
