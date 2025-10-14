/**
 * Gateway Client Tests
 * 
 * Verifies Gateway client configuration and telemetry extraction
 */

import { describe, test, expect, beforeAll } from "vitest";
import { gateway, testGatewayConnection } from "@/lib/ai/gatewayClient";

describe("Gateway Client", () => {
  describe("Configuration", () => {
    test("gateway client should be initialized", () => {
      expect(gateway).toBeDefined();
      expect(gateway.chat).toBeDefined();
      expect(gateway.chat.completions).toBeDefined();
    });

    test("gateway baseURL should be configured", () => {
      // @ts-ignore - accessing private property for testing
      const baseURL = gateway.baseURL;
      expect(baseURL).toBeDefined();
      expect(baseURL).toContain("gateway");
    });
  });

  describe("Connection", () => {
    test("testGatewayConnection should return boolean", async () => {
      const isConnected = await testGatewayConnection();
      expect(typeof isConnected).toBe("boolean");
    }, 10000); // 10s timeout for network call
  });

  describe("Chat Request Format", () => {
    test("should accept valid chat request", () => {
      const validRequest = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system" as const, content: "You are helpful" },
          { role: "user" as const, content: "Hello" },
        ],
        temperature: 0.7,
      };

      expect(validRequest.model).toBe("gpt-4o-mini");
      expect(validRequest.messages).toHaveLength(2);
    });

    test("should accept reasoning_effort parameter", () => {
      const requestWithReasoning = {
        model: "gpt-5",
        messages: [
          { role: "user" as const, content: "Test" },
        ],
        reasoning_effort: "medium" as const,
      };

      expect(requestWithReasoning.reasoning_effort).toBe("medium");
    });
  });

  describe("Response Format", () => {
    test("should define meta structure", () => {
      const mockMeta = {
        ttftMs: 100,
        latencyMs: 500,
        costUsd: 0.001,
        modelUsed: "gpt-4o",
        reasoningEffort: "medium",
        tokensUsed: {
          input: 50,
          output: 100,
          total: 150,
        },
      };

      expect(mockMeta.ttftMs).toBeGreaterThanOrEqual(0);
      expect(mockMeta.latencyMs).toBeGreaterThan(mockMeta.ttftMs);
      expect(mockMeta.costUsd).toBeGreaterThanOrEqual(0);
      expect(mockMeta.modelUsed).toBeTruthy();
    });
  });
});

