import ReactMarkdown from "react-markdown";

interface Props {
  role: "user" | "assistant";

  content: string;
}

export default function MessageBubble({ role, content }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-7 ${
          isUser
            ? "bg-blue-600 text-white"
            : "border border-slate-800 bg-slate-900 text-slate-100"
        }`}
      >
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
