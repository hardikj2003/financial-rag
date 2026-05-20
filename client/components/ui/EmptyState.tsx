interface Props {
  icon: React.ReactNode;

  title: string;

  description: string;
}

export default function EmptyState({
  icon,

  title,

  description,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* Icon */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[28px] border border-slate-200 bg-white text-slate-700 shadow-sm">
        {icon}
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>

      {/* Description */}
      <p className="mt-4 max-w-lg text-sm leading-8 text-slate-500">
        {description}
      </p>

      {/* Suggestions */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {[
          "Summarize Reliance earnings",
          "Analyze Jio growth strategy",
          "Compare operating margins",
          "Explain capital expenditure plans",
        ].map((item) => (
          <button
            key={item}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
