interface Props {
  message: string;
}

export default function Toast({ message }: Props) {
  return (
    <div className="animate-message-pop fixed bottom-6 right-6 z-50 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-sm font-medium text-stone-700">{message}</p>
    </div>
  );
}
