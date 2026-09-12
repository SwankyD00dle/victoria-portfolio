function requireProjectId(value: string | undefined): string {
  const projectId = value?.trim();

  if (!projectId) {
    throw new Error(
      "Sanity Studio needs SANITY_STUDIO_PROJECT_ID. Copy packages/studio/.env.example to packages/studio/.env.local and enter your real Sanity project ID before starting or building the Studio.",
    );
  }

  if (!/^[a-z0-9-]+$/.test(projectId)) {
    throw new Error("SANITY_STUDIO_PROJECT_ID must be a valid Sanity project ID, not a URL.");
  }

  return projectId;
}

export const projectId = requireProjectId(process.env.SANITY_STUDIO_PROJECT_ID);
export const dataset = process.env.SANITY_STUDIO_DATASET?.trim() || "production";
