import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex).trim();
    if (process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = trimmed.slice(separatorIndex + 1).trim();
  }
}

const webConfigDir = path.dirname(fileURLToPath(import.meta.url));
loadEnvFile(path.resolve(webConfigDir, "../../.env"));

/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
