import { readFile, realpath, stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectLocalAssets,
  createSanityDocuments,
  ImportValidationError,
  isInsideDirectory,
  parseImportArguments,
  resolveLocalAsset,
  validateImportPortfolio,
} from "./import-utils";

async function main() {
  const mode = parseImportArguments(process.argv.slice(2));
  const seedPath = fileURLToPath(
    new URL("../packages/frontend/src/data/portfolio.json", import.meta.url),
  );
  let seed: unknown;
  try {
    seed = JSON.parse(await readFile(seedPath, "utf8"));
  } catch {
    throw new ImportValidationError("Cannot read the local portfolio JSON seed.");
  }
  const portfolio = validateImportPortfolio(seed);
  const assets = collectLocalAssets(portfolio);
  const publicDirectory = await realpath(
    fileURLToPath(new URL("../packages/frontend/public", import.meta.url)),
  );
  const preparedAssets = await Promise.all(
    assets.map(async (asset) => {
      const localPath = resolveLocalAsset(publicDirectory, asset.src);
      let path: string;
      try {
        path = await realpath(localPath);
      } catch {
        throw new ImportValidationError("A seed asset is missing from frontend/public.");
      }
      if (!isInsideDirectory(publicDirectory, path) || !(await stat(path)).isFile()) {
        throw new ImportValidationError("Assets must be regular files inside frontend/public.");
      }
      const extension = extname(path).toLowerCase();
      const allowed =
        asset.kind === "file"
          ? [".pdf"]
          : [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif", ".tif", ".tiff"];
      if (!allowed.includes(extension)) {
        throw new ImportValidationError("Only local images and a PDF résumé may be imported.");
      }
      return { ...asset, path };
    }),
  );
  console.log(
    `Validated ${portfolio.projects.length} projects, 2 singletons, ${assets.filter((asset) => asset.kind === "image").length} unique images, and 1 résumé.`,
  );
  if (mode === "dry-run") {
    console.log("Dry run complete. No network calls or writes were made. Use --apply to import.");
    return;
  }

  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;
  const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_WRITE_TOKEN;
  if (!projectId || !dataset || !token) {
    throw new ImportValidationError(
      "Applying requires your SANITY_PROJECT_ID, SANITY_DATASET, and SANITY_API_WRITE_TOKEN environment variables.",
    );
  }
  if (!/^[a-z0-9]+$/.test(projectId) || !/^[a-z0-9][a-z0-9_-]*$/.test(dataset)) {
    throw new ImportValidationError("The Sanity project or dataset configuration is invalid.");
  }

  const { createClient } = await import("@sanity/client");
  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: "2025-02-19",
    useCdn: false,
    perspective: "published",
  });
  const assetIds = new Map<string, string>();
  for (const asset of preparedAssets) {
    if (assetIds.has(asset.src)) continue;
    const uploaded = await client.assets.upload(asset.kind, await readFile(asset.path), {
      filename: basename(asset.path),
    });
    assetIds.set(asset.src, uploaded._id);
  }
  const documents = createSanityDocuments(portfolio, assetIds);
  let transaction = client.transaction();
  for (const document of documents) {
    transaction = transaction.createIfNotExists(document);
  }
  await transaction.commit();
  console.log(
    `Import complete: ${documents.length} documents created if absent. Existing documents were not changed or deleted.`,
  );
}

await main().catch((error: unknown) => {
  console.error(
    error instanceof ImportValidationError
      ? error.message
      : "Import failed. Check local files, configuration, and Sanity permissions. Existing documents were not overwritten.",
  );
  process.exitCode = 1;
});
