import { Sparkles } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] shadow-glow">
        <Sparkles className="h-4 w-4 text-sky-200" />
      </div>
      <div>
        <p className="text-sm font-semibold leading-none text-white">Foresee AI</p>
        <p className="mt-1 text-xs text-white/45">Think Ahead. Decide Better.</p>
      </div>
    </div>
  );
}
