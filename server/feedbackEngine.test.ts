import { describe, expect, it } from "vitest";
import { withTimeout } from "./feedbackEngine";

describe("AI feedback availability guard", () => {
  it("returns a resolved operation before its deadline", async () => {
    await expect(withTimeout(Promise.resolve("ready"), 50, "test operation")).resolves.toBe("ready");
  });

  it("rejects an unavailable operation quickly so the completion flow can use deterministic feedback", async () => {
    const stalled = new Promise<never>(() => undefined);
    await expect(withTimeout(stalled, 5, "test operation")).rejects.toThrow("exceeded 5ms");
  });
});
