import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';

import { DB_PATH } from './config.js';

export type User = {
  id: number;
  name: string;
  email: string;
  organization: string | null;
  role: string | null;
  created_at: string;
};

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    organization TEXT,
    role TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const userCountRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCountRow.count === 0) {
  const usersSeed: Array<Omit<User, 'id' | 'created_at'>> = [
    { name: 'Ana Martínez', email: 'ana.martinez@lucai.bio', organization: 'LUCAI', role: 'Research Lead' },
    { name: 'Bruno Silva', email: 'bruno.silva@lucai.bio', organization: 'LUCAI', role: 'Bioinformatician' },
    { name: 'Carla Gómez', email: 'carla.gomez@lucai.bio', organization: 'Acme Biotech', role: 'Partner Scientist' },
  ];
  const insert = db.prepare(
    'INSERT INTO users (name, email, organization, role) VALUES (@name, @email, @organization, @role)'
  );
  const seed = db.transaction((rows: typeof usersSeed) => {
    for (const row of rows) {
      insert.run(row);
    }
  });
  seed(usersSeed);
}

export function listUsers(): User[] {
  return db.prepare('SELECT id, name, email, organization, role, created_at FROM users ORDER BY created_at DESC').all() as User[];
}

export function findUserById(id: number): User | undefined {
  return db
    .prepare('SELECT id, name, email, organization, role, created_at FROM users WHERE id = ?')
    .get(id) as User | undefined;
}
