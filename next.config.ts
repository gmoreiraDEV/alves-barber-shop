import type { NextConfig } from "next";

function normalizeDeploymentId(value?: string) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return undefined;
  }

  return normalizedValue.replace(/[^a-zA-Z0-9._-]/g, "-");
}

const deploymentId = normalizeDeploymentId(
  process.env.NEXT_DEPLOYMENT_ID ??
    process.env.VERCEL_DEPLOYMENT_ID ??
    process.env.RAILWAY_DEPLOYMENT_ID ??
    process.env.RAILWAY_SNAPSHOT_ID ??
    process.env.DEPLOYMENT_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.RENDER_GIT_COMMIT ??
    process.env.RAILWAY_GIT_COMMIT_SHA,
);

const nextConfig: NextConfig = {
  reactCompiler: true,
  ...(deploymentId ? { deploymentId } : {}),
};

export default nextConfig;
