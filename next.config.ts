import fs from "fs";
import path from "path";
import type { NextConfig } from "next";

// Load runtime config if it exists (mounted Secret)
let runtimeEnv: Record<string, string> = {};
const configPath = path.join("/app", "config", "runtime.json");

if (fs.existsSync(configPath)) {
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    runtimeEnv = JSON.parse(raw);
    console.log("✅ Loaded runtime config from /app/config/runtime.json");
  } catch (err) {
    console.warn("⚠️ Failed to parse runtime config:", err);
  }
} else {
  console.warn("⚠️ No runtime config found at", configPath);
}

const nextConfig: NextConfig = {
  output: "standalone",
  env: runtimeEnv,
};

export default nextConfig;
