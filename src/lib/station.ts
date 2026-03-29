/**
 * NexVigilant Station Client — the wire between Radio and Station.
 *
 * Connects to mcp.nexvigilant.com via HTTP REST.
 * SSE transport available at /sse for real-time streaming.
 */

const STATION_URL = process.env.NEXT_PUBLIC_STATION_URL || "https://mcp.nexvigilant.com";

export interface StationHealth {
  status: string;
  configs: number;
  tools: number;
  courses: number;
  telemetry: {
    total_calls: number;
    error_rate_pct: number;
    latency_p99_ms: number;
    trend: string;
  };
}

export interface StationTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

export interface ToolResult {
  status: "ok" | "error" | "stub";
  [key: string]: unknown;
}

export interface Frequency {
  domain: string;
  band: string;
  tools: StationTool[];
  strength: number; // 0-100 based on latency tier
}

/** Fetch station health */
export async function getHealth(): Promise<StationHealth> {
  const res = await fetch(`${STATION_URL}/health`, { next: { revalidate: 30 } });
  return res.json();
}

/** Fetch all tools from station */
export async function getTools(): Promise<StationTool[]> {
  const res = await fetch(`${STATION_URL}/tools`, { next: { revalidate: 60 } });
  return res.json();
}

/** Call a tool via JSON-RPC */
export async function callTool(name: string, args: Record<string, unknown> = {}): Promise<ToolResult> {
  const start = performance.now();
  const res = await fetch(`${STATION_URL}/rpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });

  const data = await res.json();
  const latency = Math.round(performance.now() - start);

  const result = data.result?.content?.[0]?.text;
  if (result) {
    try {
      const parsed = JSON.parse(result);
      return { ...parsed, _latency_ms: latency };
    } catch {
      return { status: "ok", raw: result, _latency_ms: latency };
    }
  }

  if (data.error) {
    return { status: "error", message: data.error.message, _latency_ms: latency };
  }

  return { status: "error", message: "No response", _latency_ms: latency };
}

/** Group tools into frequencies (domains) and bands */
export function groupIntoFrequencies(tools: StationTool[]): Frequency[] {
  const domainMap = new Map<string, StationTool[]>();

  for (const tool of tools) {
    // Extract domain from tool name: stem_nexvigilant_com_xxx → stem.nexvigilant.com
    const parts = tool.name.split("_");
    let domain = "";

    // Find the nexvigilant_com boundary
    const nvIdx = tool.name.indexOf("_nexvigilant_com_");
    if (nvIdx >= 0) {
      const prefix = tool.name.slice(0, nvIdx);
      domain = `${prefix.replace(/_/g, "-")}.nexvigilant.com`;
    } else {
      // External domains: api_fda_gov_xxx → api.fda.gov
      // Take everything before the last meaningful segment
      const domainParts: string[] = [];
      for (const part of parts) {
        if (["com", "gov", "org", "eu", "fr", "ch"].includes(part)) {
          domainParts.push(part);
          break;
        }
        domainParts.push(part);
      }
      domain = domainParts.join(".");
    }

    if (!domainMap.has(domain)) {
      domainMap.set(domain, []);
    }
    domainMap.get(domain)!.push(tool);
  }

  return Array.from(domainMap.entries())
    .map(([domain, tools]) => ({
      domain,
      band: classifyBand(domain),
      tools,
      strength: estimateStrength(domain),
    }))
    .sort((a, b) => b.tools.length - a.tools.length);
}

/** Classify domain into broadcast band */
function classifyBand(domain: string): string {
  if (domain.includes("fda") || domain.includes("ema") || domain.includes("ich") || domain.includes("cioms"))
    return "Regulatory";
  if (domain.includes("signal") || domain.includes("vigilance") || domain.includes("pv") || domain.includes("faers"))
    return "Pharmacovigilance";
  if (domain.includes("pubmed") || domain.includes("clinicaltrials") || domain.includes("drugbank"))
    return "Clinical";
  if (domain.includes("stem") || domain.includes("chemistry") || domain.includes("epidemiology") || domain.includes("stoichiometry"))
    return "Science";
  if (domain.includes("brain") || domain.includes("knowledge") || domain.includes("guardian"))
    return "Intelligence";
  if (domain.includes("dailymed") || domain.includes("rxnav") || domain.includes("meddra"))
    return "Reference";
  return "Compute";
}

/** Estimate signal strength based on domain type */
function estimateStrength(domain: string): number {
  // Rust-native = strongest signal (sub-ms compute)
  if (domain.includes("nexvigilant.com")) return 95;
  // Reference APIs = moderate
  if (domain.includes("ich") || domain.includes("cioms") || domain.includes("meddra")) return 75;
  // Live APIs = variable
  return 60;
}
