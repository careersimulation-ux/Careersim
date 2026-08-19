import { useLanguage } from "@/i18n";
import { BarChart3, CheckSquare, FileText, Inbox, MessageSquare, NotebookPen } from "lucide-react";

export type WorkspaceView = "inbox" | "messages" | "data" | "files" | "tasks" | "notes";

const navigation: Array<{ id: WorkspaceView; icon: typeof Inbox; en: string; ar: string }> = [
  { id: "inbox", icon: Inbox, en: "Inbox", ar: "البريد" },
  { id: "messages", icon: MessageSquare, en: "Messages", ar: "الرسائل" },
  { id: "data", icon: BarChart3, en: "Data", ar: "البيانات" },
  { id: "files", icon: FileText, en: "Files", ar: "الملفات" },
  { id: "tasks", icon: CheckSquare, en: "Tasks", ar: "المهام" },
  { id: "notes", icon: NotebookPen, en: "Notes", ar: "الملاحظات" },
];

export function WorkspaceSidebar({ activeView, onChange, company }: { activeView: WorkspaceView; onChange: (view: WorkspaceView) => void; company: string }) {
  const { language } = useLanguage();
  return <aside className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:min-h-full lg:w-60 lg:flex-col lg:items-stretch lg:border-b-0 lg:border-e lg:px-4 lg:py-5"><div className="hidden px-2 pb-5 lg:block"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Company workspace</p><p className="mt-1 truncate text-sm font-bold text-slate-950">{company}</p></div>{navigation.map(({ id, icon: Icon, en, ar }) => <button type="button" key={id} onClick={() => onChange(id)} className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${activeView === id ? "bg-teal-700 text-white shadow-md shadow-teal-900/15" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}><Icon className="h-4 w-4" />{language === "ar" ? ar : en}</button>)}</aside>;
}
