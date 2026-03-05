import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres@127.0.0.1/chatdemo';

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
