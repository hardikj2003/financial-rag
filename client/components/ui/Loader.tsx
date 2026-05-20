export default function Loader() {
  return (
    <div className="flex items-center gap-1">
      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />

      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.1s]" />

      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]" />
    </div>
  );
}
