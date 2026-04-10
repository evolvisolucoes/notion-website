import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ───

type CookieCall = { name: string; options: Record<string, unknown> };

function createContext(overrides: Partial<TrpcContext["user"]> = {}, role: "user" | "admin" = "admin"): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const user = {
    id: 1,
    openId: "test-user-open-id",
    email: "test@evolvi.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── Auth Tests ───

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.email).toBe("test@evolvi.com");
  });

  it("returns null when unauthenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

// ─── Notion Health Tests ───

describe("notion.health", () => {
  it("returns health status for authenticated user", async () => {
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notion.health();
    // Should have connected field (true or false depending on token)
    expect(result).toHaveProperty("connected");
    expect(typeof result.connected).toBe("boolean");
    expect(result).toHaveProperty("dbConnected");
    expect(typeof result.dbConnected).toBe("boolean");
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notion.health()).rejects.toThrow();
  });
});

// ─── Admin Tests ───

describe("admin routes", () => {
  it("admin.listUsers rejects non-admin users", async () => {
    const { ctx } = createContext({}, "user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listUsers()).rejects.toThrow();
  });

  it("admin.listUsers works for admin users", async () => {
    const { ctx } = createContext({}, "admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listUsers();
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin.listResources works for admin users", async () => {
    const { ctx } = createContext({}, "admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listResources();
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin.promoteUser rejects non-admin users", async () => {
    const { ctx } = createContext({}, "user");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.promoteUser({ userId: 999, role: "admin" })
    ).rejects.toThrow();
  });

  it("admin.addResource rejects non-admin users", async () => {
    const { ctx } = createContext({}, "user");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.addResource({
        notionId: "test-id",
        type: "database",
        title: "Test DB",
      })
    ).rejects.toThrow();
  });

  it("admin.grantAccess rejects non-admin users", async () => {
    const { ctx } = createContext({}, "user");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.grantAccess({ userId: 1, resourceId: 1 })
    ).rejects.toThrow();
  });

  it("admin.revokeAccess rejects non-admin users", async () => {
    const { ctx } = createContext({}, "user");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.revokeAccess({ userId: 1, resourceId: 1 })
    ).rejects.toThrow();
  });
});

// ─── Resources Tests ───

describe("resources.myResources", () => {
  it("returns resources for authenticated user", async () => {
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.resources.myResources();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.resources.myResources()).rejects.toThrow();
  });
});

// ─── Notion Signup Tests ───

describe("notion.signup", () => {
  it("validates input schema - requires nome and email", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    // Missing required fields should throw
    await expect(
      (caller.notion.signup as any)({ nome: "" })
    ).rejects.toThrow();
  });
});

// ─── Notion getDatabaseContent Tests ───

describe("notion.getDatabaseContent", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.notion.getDatabaseContent({ databaseId: "test-id" })
    ).rejects.toThrow();
  });
});

// ─── Notion getPageContent Tests ───

describe("notion.getPageContent", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.notion.getPageContent({ pageId: "test-id" })
    ).rejects.toThrow();
  });
});

// ─── Notion updateBlock Tests ───

describe("notion.updateBlock", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.notion.updateBlock({ blockId: "test-id", type: "paragraph", data: { content: "test" } })
    ).rejects.toThrow();
  });
});
