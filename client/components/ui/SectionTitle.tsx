interface Props {
  title: string;

  icon?: React.ReactNode;
}

export default function SectionTitle({
  title,

  icon,
}: Props) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {icon}

      <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
        {title}
      </h2>
    </div>
  );
}
