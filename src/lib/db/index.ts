/**
 * Database Configuration for Water Damage Repair Texas
 * Uses wd_ prefixed tables to separate from pickleball data
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./wd-schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Export all from wd-schema (uses wd_ prefixed tables)
export * from "./wd-schema";
