import { Bot } from "lucide-react";
import Loader from "../ui/Loader";

export default function TypingLoader() {
  return (
    <div className="flex items-start gap-4 animate-pulse">
      {/* Avatar */}
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm">
        <Bot size={16} />
      </div>

      {/* Bubble */}
      <div className="rounded-3xl rounded-tl-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="mb-2 text-xs font-medium text-slate-400">
          Analyzing financial documents...
        </div>

        <Loader />
      </div>
    </div>
  );
}
