// Checks that required environment variable names are documented in .env.example.
import { readFileSync } from "node:fs";

const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GEMINI_API_KEY"];
const missing = required.filter((key) => !envExample.includes(`${key}=`));

if (missing.length > 0) {
  console.error(`Missing env examples: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Environment documentation check passed.");
