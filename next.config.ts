import type { NextConfig } from "next";

const config: NextConfig = {
  agentRules: false,
  devIndicators: false,
  output: "export",
  images: { unoptimized: true },
};

export default config;
