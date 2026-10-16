#!/usr/bin/env node
/**
 * Generates the value for the ADMIN_PASSWORD_HASH environment variable.
 *
 * Usage:
 *   node scripts/hash-admin-password.mjs "your password"
 *   node scripts/hash-admin-password.mjs            # prompts (input hidden)
 *
 * Format produced: `scrypt:<saltHex>:<hashHex>` — the exact shape
 * `verifyAdminPassword` in src/lib/admin/auth.ts expects. Never commit the
 * output; paste it into the Vercel environment variable instead.
 */

import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const KEY_LENGTH = 64;

async function readPassword() {
  const fromArg = process.argv[2];
  if (fromArg) return fromArg;

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question("Admin password (visible): ");
    return answer;
  } finally {
    rl.close();
  }
}

const password = await readPassword();

if (!password) {
  console.error("No password provided. Nothing generated.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, KEY_LENGTH);

console.log(`scrypt:${salt.toString("hex")}:${hash.toString("hex")}`);
