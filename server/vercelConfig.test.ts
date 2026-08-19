import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("Vercel deployment configuration", () => {
  it("builds the Vite client to a static directory and retains SPA deep-link routing", () => {
    const config = JSON.parse(fs.readFileSync(path.join(projectRoot, "vercel.json"), "utf-8")) as {
      framework?: string;
      buildCommand?: string;
      outputDirectory?: string;
      rewrites?: Array<{ source: string; destination: string }>;
      functions?: Record<string, unknown>;
    };

    expect(config.framework).toBe("vite");
    expect(config.buildCommand).toBe("pnpm build:client");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.functions).toHaveProperty("api/[...path].ts");
    expect(config.rewrites).toContainEqual({ source: "/api/(.*)", destination: "/api/$1" });
    expect(config.rewrites).toContainEqual({ source: "/(.*)", destination: "/index.html" });
  });

  it("includes the Express/tRPC Vercel function entry point", () => {
    const functionFile = path.join(projectRoot, "api", "[...path].ts");
    const source = fs.readFileSync(functionFile, "utf-8");
    expect(source).toContain("export default app");
    expect(source).toContain('"/api/trpc"');
  });
});
