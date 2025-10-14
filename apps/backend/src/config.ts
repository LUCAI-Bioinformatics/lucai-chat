import path from 'node:path';

const cwd = process.cwd();

export const PORT = Number.parseInt(process.env.PORT ?? '8080', 10);
export const API_PREFIX = process.env.API_PREFIX ?? '/api';
export const CORS_ALLOW_ORIGINS = (process.env.CORS_ALLOW_ORIGINS ?? '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
export const ASK_SERVICE_URL = process.env.ASK_SERVICE_URL ?? 'http://ask-service:9000';
export const DB_PATH = process.env.DB_PATH ?? path.resolve(cwd, 'data', 'lucai.db');
