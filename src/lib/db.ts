import { neon } from "@neondatabase/serverless";
import { emptyData } from "./defaults";
import { normalizeData } from "./family-data";
import { AppData, FamilyInfo, FamilyPayload } from "./types";
import { createHash, randomBytes, randomUUID } from "crypto";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for KindPoints sync.");
}

const sql = neon(databaseUrl);

let schemaReady: Promise<void> | undefined;

type ParentRow = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  family_id: string | null;
  is_family_creator: boolean;
  password_hash: string | null;
};

type FamilyRow = {
  id: string;
  sync_id: string;
  sync_secret: string;
  data: AppData;
  created_at: string;
};

export function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function createSyncId() {
  return `KP-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function createSyncSecret() {
  return randomBytes(18).toString("base64url");
}

async function createFamilyForParent(parentId: string) {
  const familyId = randomUUID();
  const syncId = createSyncId();
  const syncSecret = createSyncSecret();

  await sql`
    insert into families (id, sync_id, sync_secret, sync_secret_hash, data, created_by_parent_id)
    values (${familyId}, ${syncId}, ${syncSecret}, ${hashSecret(syncSecret)}, ${JSON.stringify(emptyData)}::jsonb, ${parentId})
  `;

  return familyId;
}

export async function ensureSchema() {
  schemaReady ??= (async () => {
    await sql`
      create table if not exists families (
        id text primary key,
        sync_id text not null unique,
        sync_secret text not null,
        sync_secret_hash text not null,
        data jsonb not null,
        created_by_parent_id text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `;
    await sql`
      create table if not exists parents (
        id text primary key,
        email text not null unique,
        name text,
        image text,
        password_hash text,
        family_id text references families(id) on delete set null,
        is_family_creator boolean not null default false,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `;
    await sql`alter table parents add column if not exists password_hash text`;
    await sql`
      create table if not exists password_reset_tokens (
        id text primary key,
        parent_id text not null references parents(id) on delete cascade,
        token_hash text not null unique,
        expires_at timestamptz not null,
        used_at timestamptz,
        created_at timestamptz not null default now()
      )
    `;
    await sql`create index if not exists idx_parents_family_id on parents(family_id)`;
    await sql`create index if not exists idx_families_sync_id on families(sync_id)`;
    await sql`create index if not exists idx_password_reset_tokens_parent_id on password_reset_tokens(parent_id)`;
  })();

  return schemaReady;
}

export async function getOrCreateParent(input: { email: string; name?: string | null; image?: string | null }) {
  await ensureSchema();
  const email = input.email.toLowerCase();
  const existing = await sql`select * from parents where email = ${email} limit 1` as ParentRow[];

  if (existing[0]) {
    await sql`update parents set name = ${input.name ?? existing[0].name}, image = ${input.image ?? existing[0].image}, updated_at = now() where id = ${existing[0].id}`;
    return existing[0];
  }

  const parentId = randomUUID();
  const familyId = await createFamilyForParent(parentId);
  const rows = await sql`
    insert into parents (id, email, name, image, family_id, is_family_creator)
    values (${parentId}, ${email}, ${input.name ?? null}, ${input.image ?? null}, ${familyId}, true)
    returning *
  ` as ParentRow[];

  return rows[0];
}

export async function getParentByEmail(email: string) {
  await ensureSchema();
  const rows = await sql`select * from parents where email = ${email.toLowerCase()} limit 1` as ParentRow[];
  return rows[0];
}

export async function createParentWithPassword(input: { email: string; name?: string | null; passwordHash: string }) {
  await ensureSchema();
  const email = input.email.toLowerCase();
  const existing = await getParentByEmail(email);

  if (existing?.password_hash) {
    throw new Error("An account already exists for this email.");
  }

  if (existing) {
    const familyId = existing.family_id ?? await createFamilyForParent(existing.id);
    const rows = await sql`
      update parents
      set name = ${input.name ?? existing.name}, password_hash = ${input.passwordHash}, family_id = ${familyId}, updated_at = now()
      where id = ${existing.id}
      returning *
    ` as ParentRow[];
    return rows[0];
  }

  const parentId = randomUUID();
  const familyId = await createFamilyForParent(parentId);
  const rows = await sql`
    insert into parents (id, email, name, password_hash, family_id, is_family_creator)
    values (${parentId}, ${email}, ${input.name ?? null}, ${input.passwordHash}, ${familyId}, true)
    returning *
  ` as ParentRow[];

  return rows[0];
}

export async function updateParentPassword(parentId: string, passwordHash: string) {
  await ensureSchema();
  await sql`update parents set password_hash = ${passwordHash}, updated_at = now() where id = ${parentId}`;
}

export async function createPasswordResetToken(email: string) {
  await ensureSchema();
  const parent = await getParentByEmail(email);
  if (!parent?.password_hash) return undefined;

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSecret(token);
  const tokenId = randomUUID();

  await sql`
    insert into password_reset_tokens (id, parent_id, token_hash, expires_at)
    values (${tokenId}, ${parent.id}, ${tokenHash}, now() + interval '1 hour')
  `;

  return token;
}

export async function consumePasswordResetToken(token: string, passwordHash: string) {
  await ensureSchema();
  const tokenHash = hashSecret(token);
  const rows = await sql`
    select id, parent_id from password_reset_tokens
    where token_hash = ${tokenHash} and used_at is null and expires_at > now()
    limit 1
  ` as { id: string; parent_id: string }[];

  const resetToken = rows[0];
  if (!resetToken) throw new Error("Reset link is invalid or expired.");

  await updateParentPassword(resetToken.parent_id, passwordHash);
  await sql`update password_reset_tokens set used_at = now() where id = ${resetToken.id}`;
}

function toFamilyPayload(parent: ParentRow, family: FamilyRow): FamilyPayload {
  const familyInfo: FamilyInfo = {
    id: family.id,
    syncId: family.sync_id,
    syncSecret: parent.is_family_creator ? family.sync_secret : undefined,
    isCreator: parent.is_family_creator,
    createdAt: family.created_at
  };

  return { data: normalizeData(family.data), family: familyInfo };
}

export async function getFamilyPayload(email: string) {
  const parent = await getParentByEmail(email);
  if (!parent?.family_id) return undefined;

  const families = await sql`select * from families where id = ${parent.family_id} limit 1` as FamilyRow[];
  if (!families[0]) return undefined;

  return toFamilyPayload(parent, families[0]);
}

export async function updateFamilyData(email: string, mutate: (data: AppData) => { data: AppData; created?: unknown }) {
  const parent = await getParentByEmail(email);
  if (!parent?.family_id) throw new Error("Parent does not have a family.");

  const families = await sql`select * from families where id = ${parent.family_id} limit 1` as FamilyRow[];
  const family = families[0];
  if (!family) throw new Error("Family not found.");

  const result = mutate(normalizeData(family.data));
  const rows = await sql`
    update families set data = ${JSON.stringify(result.data)}::jsonb, updated_at = now()
    where id = ${family.id}
    returning *
  ` as FamilyRow[];

  return { ...toFamilyPayload(parent, rows[0]), created: result.created };
}

export async function joinFamily(email: string, syncId: string, secret: string) {
  const parent = await getParentByEmail(email);
  if (!parent) throw new Error("Parent not found.");

  const families = await sql`select * from families where upper(sync_id) = ${syncId.toUpperCase()} limit 1` as FamilyRow[];
  const family = families[0];
  if (!family) throw new Error("Family sync ID was not found.");

  const secretMatches = await sql`
    select id from families where id = ${family.id} and sync_secret_hash = ${hashSecret(secret)} limit 1
  ` as { id: string }[];
  if (!secretMatches[0]) throw new Error("Secret key is not valid.");

  await sql`
    update parents set family_id = ${family.id}, is_family_creator = false, updated_at = now()
    where id = ${parent.id}
  `;

  return getFamilyPayload(email);
}

export async function rotateFamilySecret(email: string) {
  const parent = await getParentByEmail(email);
  if (!parent?.family_id || !parent.is_family_creator) throw new Error("Only the first parent can revoke the sync secret.");

  const nextSecret = createSyncSecret();
  await sql`
    update families set sync_secret = ${nextSecret}, sync_secret_hash = ${hashSecret(nextSecret)}, updated_at = now()
    where id = ${parent.family_id}
  `;

  return getFamilyPayload(email);
}