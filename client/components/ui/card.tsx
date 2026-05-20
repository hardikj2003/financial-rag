interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}
