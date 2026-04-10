import { describe, expect, it } from "vitest";

describe("Notion secrets validation", () => {
  it("NOTION_TOKEN is set and non-empty", () => {
    const token = process.env.NOTION_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(0);
  });

  it("DATABASE_GESTAO_ID is set and non-empty", () => {
    const dbId = process.env.DATABASE_GESTAO_ID;
    expect(dbId).toBeDefined();
    expect(dbId!.length).toBeGreaterThan(0);
  });

  it("NOTION_TOKEN can authenticate with Notion API", async () => {
    const token = process.env.NOTION_TOKEN;
    if (!token) {
      console.warn("NOTION_TOKEN not set, skipping API test");
      return;
    }
    const response = await fetch("https://api.notion.com/v1/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
      },
    });
    expect(response.status).toBe(200);
  });
});
