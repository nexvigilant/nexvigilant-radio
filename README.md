# NexVigilant Radio

Receiver app for 1,800+ pharmacovigilance tools broadcasting from [mcp.nexvigilant.com](https://mcp.nexvigilant.com).

The Station broadcasts. The Radio receives.

## What It Does

Connects to the NexVigilant Station MCP server and presents all tools as tunable frequencies. Search, browse, and call any tool directly from the browser.

- **198 frequencies** grouped into 7 bands (Pharmacovigilance, Regulatory, Clinical, Science, Intelligence, Reference, Compute)
- **Signal strength indicators** per domain
- **Interactive tool forms** with typed parameters
- **Latency tracking** on every broadcast
- **Broadcast history** for the session

## Live

[nexvigilant-radio.vercel.app](https://nexvigilant-radio.vercel.app)

## Development

```bash
npm install
npm run dev    # http://localhost:3000
```

## Stack

- Next.js 16, TypeScript, Tailwind CSS
- Connects to mcp.nexvigilant.com (HTTP REST + JSON-RPC)
- No API keys required — all tools are public

## Architecture

```
Radio (this app)  -->  mcp.nexvigilant.com/tools   (discovery)
                  -->  mcp.nexvigilant.com/rpc     (tool calls via JSON-RPC)
                  -->  mcp.nexvigilant.com/health  (station status)
```

## License

NexVigilant Source Available License v1.0. Personal non-commercial use only. Organizational use requires written permission from matthew@nexvigilant.com.

Built by [NexVigilant](https://nexvigilant.com) — Empowerment Through Vigilance.
