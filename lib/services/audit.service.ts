import { db } from "@/drizzle/db";
import { auditLogs } from "@/drizzle/schema";
import type { NewAuditLog } from "@/types";

export async function auditLog(
  data: Omit<NewAuditLog, "id" | "createdAt">
): Promise<void> {
  await db.insert(auditLogs).values(data);
}
