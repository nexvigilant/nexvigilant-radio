"use client";

import { useState } from "react";
import type { Frequency, ToolResult } from "@/lib/station";
import { callTool } from "@/lib/station";

interface ToolPlayerProps {
  frequency: Frequency;
}

export function ToolPlayer({ frequency }: ToolPlayerProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [args, setArgs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ToolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ tool: string; latency: number; status: string }[]>([]);

  const tool = frequency.tools.find((t) => t.name === selectedTool);
  const params = tool?.inputSchema?.properties
    ? Object.entries(tool.inputSchema.properties)
    : [];
  const required = new Set(tool?.inputSchema?.required || []);

  const handleCall = async () => {
    if (!selectedTool) return;
    setLoading(true);
    setResult(null);

    // Build typed args
    const typedArgs: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(args)) {
      if (!val) continue;
      const schema = tool?.inputSchema?.properties?.[key];
      if (schema?.type === "integer" || schema?.type === "number") {
        typedArgs[key] = Number(val);
      } else if (schema?.type === "boolean") {
        typedArgs[key] = val === "true";
      } else {
        typedArgs[key] = val;
      }
    }

    const res = await callTool(selectedTool, typedArgs);
    setResult(res);
    setLoading(false);
    const latency = "_latency_ms" in res ? Number(res._latency_ms) : 0;
    setHistory((h) => [
      { tool: selectedTool, latency, status: res.status },
      ...h.slice(0, 19),
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Frequency header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">
              {frequency.domain}
            </h2>
            <p className="text-xs text-zinc-500">{frequency.band} band</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-px">
              {[1, 2, 3, 4, 5].map((bar) => (
                <div
                  key={bar}
                  className={`w-1.5 rounded-sm ${
                    frequency.strength >= bar * 20 ? "bg-emerald-400" : "bg-zinc-700"
                  }`}
                  style={{ height: `${bar * 4 + 4}px` }}
                />
              ))}
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              {frequency.strength}%
            </span>
          </div>
        </div>
        <p className="text-sm text-zinc-400">
          {frequency.tools.length} channels available
        </p>
      </div>

      {/* Channel selector */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Channels
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
          {frequency.tools.map((t) => {
            const shortName = t.name
              .replace(frequency.domain.replace(/\./g, "_") + "_", "")
              .replace(/_/g, " ");
            return (
              <button
                key={t.name}
                onClick={() => {
                  setSelectedTool(t.name);
                  setArgs({});
                  setResult(null);
                }}
                className={`text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedTool === t.name
                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                    : "bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300"
                }`}
              >
                <div className="font-medium truncate">{shortName}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool form — the "play" controls */}
      {tool && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-200">{tool.name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{tool.description}</p>
          </div>

          {params.length > 0 && (
            <div className="space-y-3">
              {params.map(([key, schema]) => (
                <div key={key}>
                  <label className="text-xs text-zinc-400 font-medium">
                    {key}
                    {required.has(key) && (
                      <span className="text-amber-400 ml-1">*</span>
                    )}
                    <span className="text-zinc-600 ml-2">{schema.type}</span>
                  </label>
                  <input
                    type="text"
                    placeholder={schema.description || key}
                    value={args[key] || ""}
                    onChange={(e) =>
                      setArgs((a) => ({ ...a, [key]: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleCall}
            disabled={loading}
            className={`w-full rounded-lg py-2.5 text-sm font-medium transition-colors ${
              loading
                ? "bg-zinc-700 text-zinc-400 cursor-wait"
                : "bg-emerald-600 text-white hover:bg-emerald-500"
            }`}
          >
            {loading ? "Receiving..." : "Broadcast"}
          </button>
        </div>
      )}

      {/* Result display */}
      {result && (
        <div
          className={`rounded-xl border p-4 ${
            result.status === "ok"
              ? "border-emerald-500/30 bg-emerald-500/5"
              : result.status === "error"
                ? "border-red-500/30 bg-red-500/5"
                : "border-amber-500/30 bg-amber-500/5"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-mono font-bold ${
                result.status === "ok"
                  ? "text-emerald-400"
                  : result.status === "error"
                    ? "text-red-400"
                    : "text-amber-400"
              }`}
            >
              {result.status?.toUpperCase()}
            </span>
            {"_latency_ms" in result && (
              <span className="text-xs text-zinc-500 font-mono">
                {String(result._latency_ms)}ms
              </span>
            )}
          </div>
          <pre className="text-xs text-zinc-300 overflow-auto max-h-96 whitespace-pre-wrap font-mono">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* History — recent broadcasts */}
      {history.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Recent Broadcasts
          </h3>
          <div className="space-y-1">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1"
              >
                <span className="text-zinc-400 truncate max-w-xs font-mono">
                  {h.tool.split("_").slice(-2).join("_")}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 font-mono">{h.latency}ms</span>
                  <span
                    className={`font-mono ${
                      h.status === "ok" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
