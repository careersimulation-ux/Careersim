import { ENV } from "./_core/env";
import { getSupabase } from "./supabase";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type InsertUser = {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role?: "user" | "admin";
  lastSignedIn?: Date;
};

function mapUser(row: Record<string, any>): User {
  return {
    id: Number(row.id),
    openId: row.open_id,
    name: row.name ?? null,
    email: row.email ?? null,
    loginMethod: row.login_method ?? null,
    role: row.role === "admin" ? "admin" : "user",
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastSignedIn: new Date(row.last_signed_in),
  };
}

/** Synchronizes a Manus OAuth identity to the private CareerSim schema. */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const row: Record<string, unknown> = {
    open_id: user.openId,
    last_signed_in: (user.lastSignedIn ?? new Date()).toISOString(),
  };
  if (user.name !== undefined) row.name = user.name;
  if (user.email !== undefined) row.email = user.email;
  if (user.loginMethod !== undefined) row.login_method = user.loginMethod;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) {
    row.role = user.role ?? "admin";
  }

  const { error } = await getSupabase().from("users").upsert(row, { onConflict: "open_id" });
  if (error) throw new Error(`Supabase user upsert failed: ${error.message}`);
}

export async function getUserByOpenId(openId: string) {
  const { data, error } = await getSupabase().from("users").select("*").eq("open_id", openId).limit(1);
  if (error) throw new Error(`Supabase user lookup failed: ${error.message}`);
  return data?.[0] ? mapUser(data[0]) : undefined;
}
