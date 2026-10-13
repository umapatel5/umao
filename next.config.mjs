import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  outputFileTracingRoot: projectRoot,
  outputFileTracingIncludes: {
    "/api/code/run": ["./runner-service/server.mjs", "./runner-service/process-runner.mjs"]
  },
  outputFileTracingExcludes: {
    "*": [".data/**/*", ".env", ".env*.local"]
  }
};

export default nextConfig;
