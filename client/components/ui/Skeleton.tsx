interface Props {
  className?: string;
}

export default function Skeleton({ className = "" }: Props) {
  return (
    <div
      className={`animate-shimmer rounded-2xl bg-slate-200/70 ${className}`}
    />
  );
}
