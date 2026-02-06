import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const sourcePath = path.join(cwd, ".env.local");
const targetPath = path.join(cwd, "apps", "web", ".env.local");

if (!fs.existsSync(sourcePath)) {
  console.log("[sync:env] Skipped: root .env.local not found");
  process.exit(0);
}

const source = fs.readFileSync(sourcePath, "utf8");
const targetExists = fs.existsSync(targetPath);
const target = targetExists ? fs.readFileSync(targetPath, "utf8") : "";

if (source === target) {
  console.log("[sync:env] apps/web/.env.local is already up to date");
  process.exit(0);
}

fs.writeFileSync(targetPath, source, "utf8");
console.log("[sync:env] Synced root .env.local -> apps/web/.env.local");
