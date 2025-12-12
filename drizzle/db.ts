import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.SUPABASE_DATABASE_URL) {
  throw new Error("SUPABASE_DATABASE_URL is not defined");
}

const sql = neon(process.env.SUPABASE_DATABASE_URL);
export const db = drizzle(sql, { schema });
