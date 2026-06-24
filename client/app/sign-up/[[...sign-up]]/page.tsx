import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-50 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Finance<span className="text-blue-600">RAG</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          AI financial research assistant
        </p>
      </div>
      <SignUp />
    </div>
  );
}
