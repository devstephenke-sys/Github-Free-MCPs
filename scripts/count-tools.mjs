import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const toolsDir = join(import.meta.dirname, "..", "src", "tools");
let count = 0;
const names = [];

for (const file of readdirSync(toolsDir)) {
  if (!file.endsWith(".ts")) continue;
  const text = readFileSync(join(toolsDir, file), "utf8");
  const matches = text.matchAll(/server\.tool\(\s*\n?\s*"([^"]+)"/g);
  for (const m of matches) {
    count++;
    names.push(m[1]);
  }
}

names.sort();
console.log(`Registered tools: ${count}`);
for (const n of names) console.log(`  - ${n}`);
