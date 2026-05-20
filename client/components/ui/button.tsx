import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;

  variant?: "primary" | "secondary";
}

export default function Button({
  children,

  variant = "primary",

  className = "",

  ...props
}: Props) {
  const baseStyles =
    "flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300";

  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",

    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
