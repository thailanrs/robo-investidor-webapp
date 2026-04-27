import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { POST } from "./route";

describe("POST /api/resumo-ia", () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    // Restore process.env.GEMINI_API_KEY after each test
    process.env.GEMINI_API_KEY = originalApiKey;
  });

  test("should return 500 if GEMINI_API_KEY is missing", async () => {
    // Force GEMINI_API_KEY to be undefined
    delete process.env.GEMINI_API_KEY;

    const req = new Request("http://localhost/api/resumo-ia", {
      method: "POST",
      body: JSON.stringify({ acoes: [{ Ticker: "PETR4" }] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: "GEMINI_API_KEY não configurada.",
    });
  });

  test("should return 400 if acoes is empty", async () => {
    // Set a dummy API key to pass the first check
    process.env.GEMINI_API_KEY = "dummy-key";

    const req = new Request("http://localhost/api/resumo-ia", {
      method: "POST",
      body: JSON.stringify({ acoes: [] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: "Lista de ações inválida ou vazia.",
    });
  });
});
