import { useLanguage } from "@/i18n";
import type { SimulationConfig } from "@shared/simulation/types";
import { Clock3, Download, MailOpen, Paperclip } from "lucide-react";
import { useState } from "react";

type Email = SimulationConfig["emails"][number];

export function InboxPanel({ emails, files, onOpenFiles }: { emails: Email[]; files: SimulationConfig["files"]; onOpenFiles: (fileId: string) => void }) {
  const { language, text } = useLanguage();
  const [selectedId, setSelectedId] = useState(emails[0]?.id);
  const selected = emails.find(email => email.id === selectedId) ?? emails[0];
  const labels = language === "ar" ? { title: "البريد الوارد", received: "تم الاستلام", attachment: "مرفق", open: "فتح الملف", download: "تنزيل" } : { title: "Inbox", received: "Received", attachment: "Attachment", open: "Open file", download: "Download" };
  const downloadFile = (file: SimulationConfig["files"][number]) => {
    const anchor = document.createElement("a");
    anchor.href = file.downloadUrl;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };
  if (!selected) return null;
  return <section className="grid min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[290px_1fr]"><aside className="border-b border-slate-200 bg-slate-50/60 lg:border-b-0 lg:border-e"><div className="border-b border-slate-200 px-5 py-5"><h2 className="font-display text-xl font-bold text-slate-950">{labels.title}</h2><p className="mt-1 text-xs text-slate-500">{emails.length} {language === "ar" ? "رسائل مرتبطة بالمهمة" : "mission messages"}</p></div><div className="p-2">{emails.map(email => <button type="button" key={email.id} onClick={() => setSelectedId(email.id)} className={`mb-1 w-full rounded-xl p-3 text-start transition ${email.id === selected.id ? "bg-white shadow-sm ring-1 ring-slate-200" : "hover:bg-white/80"}`}><div className="flex justify-between gap-3"><span className="truncate text-xs font-bold text-slate-900">{email.from}</span><span className="shrink-0 text-[10px] text-slate-400">{email.timestamp.split(", ").at(-1)}</span></div><p className="mt-1 truncate text-xs font-semibold text-slate-700">{text(email.subject)}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{text(email.preview)}</p></button>)}</div></aside><article className="p-6 sm:p-8"><div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5"><div><p className="text-xs font-semibold text-teal-700">{selected.from}</p><h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950">{text(selected.subject)}</h1><p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" />{labels.received} · {selected.timestamp}</p></div><span className="grid h-9 w-9 place-items-center rounded-full bg-teal-50 text-teal-700"><MailOpen className="h-4 w-4" /></span></div><p className="max-w-2xl whitespace-pre-line py-7 text-sm leading-7 text-slate-700">{text(selected.body)}</p>{selected.attachments.length > 0 && <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{labels.attachment}</p><div className="flex flex-wrap gap-2">{selected.attachments.map(attachmentId => { const file = files.find(item => item.id === attachmentId); if (!file) return null; return <div key={attachmentId} className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"><button type="button" onClick={() => onOpenFiles(file.id)} title={labels.open} className="inline-flex items-center gap-2 px-3 py-2 transition hover:bg-teal-50"><Paperclip className="h-3.5 w-3.5 text-teal-700" />{file.name}</button><button type="button" onClick={() => downloadFile(file)} title={`${labels.download}: ${file.name}`} className="border-s border-slate-200 px-2.5 text-teal-700 transition hover:bg-teal-50" aria-label={`${labels.download}: ${file.name}`}><Download className="h-3.5 w-3.5" /></button></div>; })}</div></div>}</article></section>;
}
