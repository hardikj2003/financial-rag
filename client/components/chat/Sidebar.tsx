import { PanelLeft } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="hidden w-72 border-r border-slate-800 bg-slate-900 md:flex md:flex-col">
      <div className="flex items-center gap-2 border-b border-slate-800 p-4">
        <PanelLeft size={18} />

        <h1 className="text-lg font-semibold">Financial RAG</h1>
      </div>

      <div className="flex-1 p-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">
          AI-powered financial research assistant.
        </div>
      </div>
    </div>
  );
}
