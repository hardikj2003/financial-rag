interface Props {
  children: React.ReactNode;

  color?: "default" | "success" | "blue";
}

export default function Badge({
  children,

  color = "default",
}: Props) {
  const variants = {
    default: "bg-slate-100 text-slate-600",

    success: "bg-emerald-50 text-emerald-700",

    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${variants[color]}`}
    >
      {children}
    </span>
  );
}
