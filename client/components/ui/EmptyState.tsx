interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  suggestions = [],
  onSuggestionClick,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[28px] border border-slate-200 bg-white text-slate-700 shadow-sm">
        {icon}
      </div>

      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>

      <p className="mt-4 max-w-lg text-sm leading-8 text-slate-500">
        {description}
      </p>

      {suggestions.length > 0 && onSuggestionClick && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {suggestions.map((item) => (
            <button
              key={item}
              onClick={() => onSuggestionClick(item)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
