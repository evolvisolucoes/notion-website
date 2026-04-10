import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, notionResources, userAccess, InsertNotionResource, InsertUserAccess } from "../drizzle/schema";
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Notion Resources helpers ───

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getAllResources() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notionResources);
}

export async function addResource(resource: InsertNotionResource) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notionResources).values(resource).onDuplicateKeyUpdate({
    set: { title: resource.title, description: resource.description, icon: resource.icon, type: resource.type },
  });
}

export async function removeResource(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userAccess).where(eq(userAccess.resourceId, id));
  await db.delete(notionResources).where(eq(notionResources.id, id));
}

// ─── User Access helpers ───

export async function getUserResources(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      accessId: userAccess.id,
      resourceId: notionResources.id,
      notionId: notionResources.notionId,
      type: notionResources.type,
      title: notionResources.title,
      description: notionResources.description,
      icon: notionResources.icon,
      grantedAt: userAccess.grantedAt,
    })
    .from(userAccess)
    .innerJoin(notionResources, eq(userAccess.resourceId, notionResources.id))
    .where(eq(userAccess.userId, userId));
  return rows;
}

export async function grantAccess(userId: number, resourceId: number, grantedBy: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(userAccess)
    .where(and(eq(userAccess.userId, userId), eq(userAccess.resourceId, resourceId)))
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(userAccess).values({ userId, resourceId, grantedBy });
}

export async function revokeAccess(userId: number, resourceId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userAccess).where(
    and(eq(userAccess.userId, userId), eq(userAccess.resourceId, resourceId))
  );
}

export async function getAccessForResource(resourceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      accessId: userAccess.id,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      grantedAt: userAccess.grantedAt,
    })
    .from(userAccess)
    .innerJoin(users, eq(userAccess.userId, users.id))
    .where(eq(userAccess.resourceId, resourceId));
}

export async function checkUserAccess(userId: number, notionId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: userAccess.id })
    .from(userAccess)
    .innerJoin(notionResources, eq(userAccess.resourceId, notionResources.id))
    .where(and(eq(userAccess.userId, userId), eq(notionResources.notionId, notionId)))
    .limit(1);
  return rows.length > 0;
}
