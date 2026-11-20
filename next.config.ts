import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  const backend = process.env.BACKEND_URL ??
    (phase === PHASE_DEVELOPMENT_SERVER ? "http://127.0.0.1:8000" : undefined);

  return {
    agentRules: false,
    output: "standalone",
    poweredByHeader: false,
    async rewrites() {
      return backend
        ? [{ source: "/api/:path*", destination: `${new URL(backend).origin}/api/:path*` }]
        : [];
    },
  };
}
