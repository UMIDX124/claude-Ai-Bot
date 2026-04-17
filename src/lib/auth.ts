import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { User, UserRole } from "@prisma/client";

export class AuthError extends Error {
  constructor(message: string, public status: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return db.user.findUnique({
    where: { clerkId: userId },
    include: { employee: true },
  });
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not authenticated");
  if (!user.isActive || user.deletedAt) throw new AuthError("Account inactive", 403);
  return user;
}

export async function requireRole(roles: UserRole[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new ForbiddenError(
      `Required role: ${roles.join(" or ")}, current: ${user.role}`,
    );
  }
  return user;
}

export async function requireUserOrRedirect(redirectTo = "/sign-in"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

/**
 * Resolve current Clerk user → upsert into Prisma. Used by server-rendered
 * pages on cold first hit when the webhook may not have landed yet.
 */
export async function ensureUserRecord(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const existing = await db.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  return db.user.create({
    data: {
      clerkId: userId,
      email,
      firstName: clerkUser.firstName ?? null,
      lastName: clerkUser.lastName ?? null,
      fullName:
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        null,
      avatarUrl: clerkUser.imageUrl ?? null,
    },
  });
}
