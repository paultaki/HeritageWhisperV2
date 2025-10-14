/**
 * AI Model Routing Tests
 * 
 * Verifies GPT-5 model selection and reasoning effort mapping
 */

import { describe, test, expect } from "vitest";
import { effortForMilestone, getModelConfig, flags, models } from "@/lib/ai/modelConfig";

describe("AI Model Configuration", () => {
  describe("effortForMilestone", () => {
    test("Story 3 should use low effort", () => {
      expect(effortForMilestone(3)).toBe("low");
    });

    test("Story 10 should use medium effort", () => {
      expect(effortForMilestone(10)).toBe("medium");
    });

    test("Story 20 should use medium effort", () => {
      expect(effortForMilestone(20)).toBe("medium");
    });

    test("Story 50 should use high effort", () => {
      expect(effortForMilestone(50)).toBe("high");
    });

    test("Story 100 should use high effort", () => {
      expect(effortForMilestone(100)).toBe("high");
    });

    test("Milestone progression should be correct", () => {
      // Low effort: 1-9
      expect(effortForMilestone(1)).toBe("low");
      expect(effortForMilestone(9)).toBe("low");
      
      // Medium effort: 10-49
      expect(effortForMilestone(10)).toBe("medium");
      expect(effortForMilestone(49)).toBe("medium");
      
      // High effort: 50+
      expect(effortForMilestone(50)).toBe("high");
      expect(effortForMilestone(100)).toBe("high");
    });
  });

  describe("getModelConfig", () => {
    test("tier1 should always use fast model with no reasoning effort", () => {
      const config = getModelConfig("tier1");
      expect(config.model).toBe(models.fastChat);
      expect(config.reasoning_effort).toBeUndefined();
    });

    test("echo should always use fast model with no reasoning effort", () => {
      const config = getModelConfig("echo");
      expect(config.model).toBe(models.fastChat);
      expect(config.reasoning_effort).toBeUndefined();
    });

    test("tier3 respects GPT5_TIER3_ENABLED flag", () => {
      const config = getModelConfig("tier3", 10);
      
      if (flags.GPT5_TIER3_ENABLED) {
        expect(config.model).toBe(models.gpt5Chat);
        expect(config.reasoning_effort).toBe("medium"); // Story 10 = medium effort
      } else {
        expect(config.model).toBe(models.fastChat);
        expect(config.reasoning_effort).toBeUndefined();
      }
    });

    test("whisper respects GPT5_WHISPERS_ENABLED flag", () => {
      const config = getModelConfig("whisper");
      
      if (flags.GPT5_WHISPERS_ENABLED) {
        expect(config.model).toBe(models.gpt5Chat);
        expect(config.reasoning_effort).toBe("medium");
      } else {
        expect(config.model).toBe(models.fastChat);
        expect(config.reasoning_effort).toBeUndefined();
      }
    });

    test("tier3 effort should adjust by milestone", () => {
      if (flags.GPT5_TIER3_ENABLED) {
        const config3 = getModelConfig("tier3", 3);
        expect(config3.reasoning_effort).toBe("low");

        const config10 = getModelConfig("tier3", 10);
        expect(config10.reasoning_effort).toBe("medium");

        const config50 = getModelConfig("tier3", 50);
        expect(config50.reasoning_effort).toBe("high");
      }
    });
  });

  describe("Feature Flags", () => {
    test("flags should be boolean", () => {
      expect(typeof flags.GPT5_TIER3_ENABLED).toBe("boolean");
      expect(typeof flags.GPT5_WHISPERS_ENABLED).toBe("boolean");
    });

    test("model IDs should be strings", () => {
      expect(typeof models.fastChat).toBe("string");
      expect(typeof models.gpt5Chat).toBe("string");
    });

    test("fast model should default to gpt-4o-mini", () => {
      expect(models.fastChat).toMatch(/gpt-4o-mini/);
    });

    test("gpt5 model should default to gpt-5", () => {
      expect(models.gpt5Chat).toMatch(/gpt-5/);
    });
  });
});

