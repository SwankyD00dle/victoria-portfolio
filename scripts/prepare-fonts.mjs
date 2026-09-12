import { access, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const directory = new URL("../packages/frontend/public/fonts/", import.meta.url);
// UXfolio labels Satoshi Black as its 700 face; retain that visual weight.
const faces = new Map([
  ["400", "regular"],
  ["500", "medium"],
  ["900", "bold"],
]);
const missing = [];
for (const [weight, name] of faces) {
  try {
    await access(new URL(`satoshi-${name}.woff2`, directory));
  } catch {
    missing.push(weight);
  }
}
if (missing.length) {
  console.log(
    "Downloading Satoshi from Fontshare for this site's self-hosted use. License: https://www.fontshare.com/terms",
  );
  const response = await fetch(
    "https://api.fontshare.com/v2/css?f[]=satoshi@400,500,900&display=swap",
    { signal: AbortSignal.timeout(30000) },
  );
  if (!response.ok) throw new Error(`Fontshare returned ${response.status}. Retry when available.`);
  const stylesheet = await response.text();
  await mkdir(directory, { recursive: true });
  for (const block of stylesheet.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
    const weight = /font-weight:\s*(\d+)/.exec(block[1] ?? "")?.[1];
    const source = /url\(['"]?([^'"()]+\.woff2)['"]?\)/.exec(block[1] ?? "")?.[1];
    if (!weight || !source || !missing.includes(weight)) continue;
    const url = new URL(source, "https://api.fontshare.com");
    if (url.protocol !== "https:" || url.hostname !== "cdn.fontshare.com")
      throw new Error("Unexpected font host.");
    const font = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!font.ok) throw new Error(`Could not download Satoshi ${weight}.`);
    await writeFile(
      new URL(`satoshi-${faces.get(weight)}.woff2`, directory),
      Buffer.from(await font.arrayBuffer()),
    );
  }
  for (const name of faces.values())
    await access(fileURLToPath(new URL(`satoshi-${name}.woff2`, directory)));
}
