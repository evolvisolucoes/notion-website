import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import bcrypt from "bcrypt";

// Mock database functions
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  updateLastSignedIn: vi.fn(),
  getDb: vi.fn(),
}));

// Mock jose for JWT signing
vi.mock("jose", () => ({
  SignJWT: class {
    setProtectedHeader() { return this; }
    setExpirationTime() { return this; }
    sign() { return Promise.resolve("mock-jwt-token"); }
  },
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

let testPasswordHash: string = "";

beforeEach(async () => {
  testPasswordHash = await bcrypt.hash("password123", 10);
});

function createAuthContext(): { ctx: TrpcContext; setCookie: any } {
  const setCookieData: any = {};

  const user: AuthenticatedUser = {
    id: 1,
    email: "test@example.com",
    passwordHash: testPasswordHash,
    name: "Test User",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: any) => {
        setCookieData.name = name;
        setCookieData.value = value;
        setCookieData.options = options;
      },
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx, setCookie: setCookieData };
}

describe("auth.login", () => {
  it("should reject invalid email/password", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.auth.login({
        email: "nonexistent@example.com",
        password: "wrongpassword",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Email ou senha inválidos");
    }
  });

  it("should return user on successful login", async () => {
    const { ctx, setCookie } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Mock successful user lookup
    const { getUserByEmail } = await import("./db");
    const mockGetUserByEmail = getUserByEmail as any;
    
    const testUser: AuthenticatedUser = {
      id: 1,
      email: "test@example.com",
      passwordHash: testPasswordHash,
      name: "Test User",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    mockGetUserByEmail.mockResolvedValue(testUser);

    const result = await caller.auth.login({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("test@example.com");
    expect(setCookie.name).toBe("app_session_id");
    expect(setCookie.value).toBe("mock-jwt-token");
  });
});
