import 'reflect-metadata';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load .env from repo root (two levels up from src/database/)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

/**
 * TypeORM DataSource used by the CLI (typeorm migration:run / generate).
 * NOT imported by AppModule — AppModule uses TypeOrmModule.forRootAsync.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,

  // No entities needed for migration-only usage
  entities: [],

  // Migration files (compiled JS in dist/ when running via CLI)
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',

  // Never auto-sync in production — migrations are the source of truth
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
