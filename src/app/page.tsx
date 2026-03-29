import { getHealth, getTools, groupIntoFrequencies } from "@/lib/station";
import { RadioDial } from "./components/radio-dial";

export const revalidate = 60;

export default async function RadioPage() {
  const [health, tools] = await Promise.all([getHealth(), getTools()]);
  const frequencies = groupIntoFrequencies(tools);
  const bands = [...new Set(frequencies.map((f) => f.band))];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header — ON AIR */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight">
              NexVigilant Radio
            </h1>
            <span className="text-xs text-zinc-500 font-mono">
              mcp.nexvigilant.com
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span>
              <span className="text-emerald-400 font-mono font-bold text-lg">{health.tools.toLocaleString()}</span>{" "}
              tools
            </span>
            <span>
              <span className="text-emerald-400 font-mono font-bold text-lg">{health.configs}</span>{" "}
              frequencies
            </span>
            <span>
              <span className="text-emerald-400 font-mono font-bold text-lg">{health.courses}</span>{" "}
              courses
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold tracking-wider ${health.status === "ok" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
            >
              {health.status === "ok" ? "ON AIR" : "OFF AIR"}
            </span>
          </div>
        </div>
      </header>

      {/* Band selector — frequency bands like radio presets */}
      <div className="border-b border-zinc-800 px-6 py-3 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl flex gap-2 overflow-x-auto">
          {bands.map((band) => {
            const bandFreqs = frequencies.filter((f) => f.band === band);
            const toolCount = bandFreqs.reduce((n, f) => n + f.tools.length, 0);
            return (
              <span
                key={band}
                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 whitespace-nowrap hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {band}
                <span className="text-zinc-500 font-mono">{toolCount}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Main — the dial */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <RadioDial frequencies={frequencies} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-4 text-center text-xs text-zinc-600">
        NexVigilant Radio — receiving on {frequencies.length} frequencies from
        mcp.nexvigilant.com — Empowerment Through Vigilance
      </footer>
    </div>
  );
}
