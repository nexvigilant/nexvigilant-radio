"use client";

import { useState } from "react";
import type { Frequency } from "@/lib/station";
import { ToolPlayer } from "./tool-player";

interface RadioDialProps {
  frequencies: Frequency[];
}

export function RadioDial({ frequencies }: RadioDialProps) {
  const [tuned, setTuned] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = frequencies.filter(
    (f) =>
      f.domain.toLowerCase().includes(search.toLowerCase()) ||
      f.band.toLowerCase().includes(search.toLowerCase()) ||
      f.tools.some((t) => t.name.toLowerCase().includes(search.toLowerCase()))
  );

  const tunedFreq = frequencies.find((f) => f.domain === tuned);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Frequency list */}
      <div className="lg:col-span-1 space-y-4">
        <input
          type="text"
          placeholder="Search frequencies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
        />

        <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
          {filtered.map((freq) => (
            <button
              key={freq.domain}
              onClick={() => setTuned(freq.domain)}
              className={`w-full text-left rounded-lg px-3 py-2.5 transition-all ${
                tuned === freq.domain
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-zinc-900/50 border border-transparent hover:bg-zinc-800 text-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Signal strength bars */}
                  <div className="flex items-end gap-px">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`w-1 rounded-sm ${
                          freq.strength >= bar * 25
                            ? tuned === freq.domain
                              ? "bg-emerald-400"
                              : "bg-zinc-500"
                            : "bg-zinc-800"
                        }`}
                        style={{ height: `${bar * 3 + 4}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium truncate">
                    {freq.domain.replace(".nexvigilant.com", "").replace(/\./g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {freq.band}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">
                    {freq.tools.length}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-xs text-zinc-600 text-center pt-2">
          {filtered.length} frequencies — {filtered.reduce((n, f) => n + f.tools.length, 0)} channels
        </div>
      </div>

      {/* Right: Tuned frequency — tool player */}
      <div className="lg:col-span-2">
        {tunedFreq ? (
          <ToolPlayer frequency={tunedFreq} />
        ) : (
          <div className="flex flex-col items-center justify-center h-96 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <div className="text-6xl mb-4 opacity-20">📡</div>
            <p className="text-zinc-500 text-lg">Tune to a frequency</p>
            <p className="text-zinc-600 text-sm mt-1">
              Select a domain from the dial to start receiving
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
