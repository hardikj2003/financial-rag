import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;

  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "default" | "icon-sm";
}

export default function Button({
  children,

  variant = "primary",
  size = "default",

  className = "",

  ...props
}: Props) {
  const baseStyles =
    "flex items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-all duration-300";

  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",

    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    outline:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  };

  const sizes = {
    default: "px-4 py-3",
    "icon-sm": "h-8 w-8 p-0",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export { Button };
