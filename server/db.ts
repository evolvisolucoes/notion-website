import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, notionResources, userAccess, InsertNotionResource, InsertUserAccess, userCredentials } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Create a new user with email and password hash.
 * Called by admin when registering a new user.
 */
export async function createUser(email: string, passwordHash: string, name?: string, role: "user" | "admin" = "user") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(users).values({
      email,
      passwordHash,
      name: name || null,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return result;
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    throw error;
  }
}

/**
 * Get user by email for login.
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by ID.
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Update user last signed in timestamp.
 */
export async function updateLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update lastSignedIn:", error);
  }
}

// ─── User Management ───

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;

  try {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update user role:", error);
    throw error;
  }
}

// ─── Notion Resources ───

export async function getAllResources() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notionResources);
}

export async function getResourceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(notionResources).where(eq(notionResources.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createResource(resource: InsertNotionResource) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(notionResources).values(resource);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create resource:", error);
    throw error;
  }
}

export async function deleteResource(id: number) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.delete(notionResources).where(eq(notionResources.id, id));
  } catch (error) {
    console.error("[Database] Failed to delete resource:", error);
    throw error;
  }
}

// ─── User Access Control ───

export async function getUserResources(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        id: notionResources.id,
        notionId: notionResources.notionId,
        type: notionResources.type,
        title: notionResources.title,
        description: notionResources.description,
        icon: notionResources.icon,
      })
      .from(userAccess)
      .innerJoin(notionResources, eq(userAccess.resourceId, notionResources.id))
      .where(eq(userAccess.userId, userId));

    return result;
  } catch (error) {
    console.error("[Database] Failed to get user resources:", error);
    return [];
  }
}

export async function grantAccess(userId: number, resourceId: number, grantedBy: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Check if access already exists
    const existing = await db
      .select()
      .from(userAccess)
      .where(eq(userAccess.userId, userId) && eq(userAccess.resourceId, resourceId))
      .limit(1);

    if (existing.length > 0) {
      return; // Already has access
    }

    await db.insert(userAccess).values({
      userId,
      resourceId,
      grantedBy,
      grantedAt: new Date(),
    });
  } catch (error) {
    console.error("[Database] Failed to grant access:", error);
    throw error;
  }
}

export async function revokeAccess(userId: number, resourceId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .delete(userAccess)
      .where(eq(userAccess.userId, userId) && eq(userAccess.resourceId, resourceId));
  } catch (error) {
    console.error("[Database] Failed to revoke access:", error);
    throw error;
  }
}

export async function getUserAccessList(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        resourceId: userAccess.resourceId,
        resourceTitle: notionResources.title,
        grantedAt: userAccess.grantedAt,
      })
      .from(userAccess)
      .innerJoin(notionResources, eq(userAccess.resourceId, notionResources.id))
      .where(eq(userAccess.userId, userId));

    return result;
  } catch (error) {
    console.error("[Database] Failed to get user access list:", error);
    return [];
  }
}

export async function getResourceAccessList(resourceId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        userId: userAccess.userId,
        userName: users.name,
        userEmail: users.email,
        grantedAt: userAccess.grantedAt,
      })
      .from(userAccess)
      .innerJoin(users, eq(userAccess.userId, users.id))
      .where(eq(userAccess.resourceId, resourceId));

    return result;
  } catch (error) {
    console.error("[Database] Failed to get resource access list:", error);
    return [];
  }
}
