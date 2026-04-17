import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // OAuth callback removed - using local email/password auth instead
  // Login is handled via tRPC route: auth.login

  // Keep this endpoint for compatibility but redirect to login
  app.get("/api/oauth/callback", (req: Request, res: Response) => {
    res.redirect(302, "/");
  });
}
