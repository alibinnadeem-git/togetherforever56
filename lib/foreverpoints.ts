import { createHmac, randomUUID } from 'node:crypto';
import { db } from './db';

export type ForeverPointsEntry = {
  accountId: string;
  personId: string;
  transactionType: 'earn'|'spend'|'admin_adjustment'|'expiry'|'reversal'|'transfer_in'|'transfer_out';
  pointsDelta: number;
  activityType?: string | null;
  sourceObjectType?: string | null;
  sourceObjectId?: string | null;
  ruleId?: string | null;
  relatedLedgerId?: string | null;
  idempotencyKey: string;
  description?: string | null;
  createdByPersonId?: string | null;
};

function signingSecret() {
  const value = process.env.FOREVERPOINTS_SIGNING_SECRET;
  if (!value || value.length < 32) {
    throw new Error('FOREVERPOINTS_SIGNING_SECRET is not configured; points mutations are disabled.');
  }
  return value;
}

function canonical(input: ForeverPointsEntry, id: string, createdAt: string) {
  return [id,input.accountId,input.personId,input.transactionType,String(input.pointsDelta),input.activityType||'',input.sourceObjectType||'',input.sourceObjectId||'',input.ruleId||'',input.relatedLedgerId||'',input.idempotencyKey,input.description||'',input.createdByPersonId||'',createdAt].join('|');
}

export async function appendForeverPoints(input: ForeverPointsEntry) {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const signature = createHmac('sha256', signingSecret()).update(canonical(input,id,createdAt)).digest('hex');
  const sql = db();
  const rows = await sql`
    insert into app.foreverpoints_ledger (
      id,account_id,person_id,transaction_type,points_delta,activity_type,source_object_type,source_object_id,
      rule_id,related_ledger_id,idempotency_key,description,created_by_person_id,created_at,server_signature
    ) values (
      ${id}::uuid,${input.accountId}::uuid,${input.personId}::uuid,${input.transactionType},${input.pointsDelta},
      ${input.activityType||null},${input.sourceObjectType||null},${input.sourceObjectId||null}::uuid,
      ${input.ruleId||null}::uuid,${input.relatedLedgerId||null}::uuid,${input.idempotencyKey},${input.description||null},
      ${input.createdByPersonId||null}::uuid,${createdAt}::timestamptz,${signature}
    ) returning id::text,ledger_sequence,chain_hash,server_signature,created_at
  `;
  return (rows as unknown as Array<Record<string,unknown>>)[0];
}

export function foreverPointsSigningReady() {
  return Boolean(process.env.FOREVERPOINTS_SIGNING_SECRET && process.env.FOREVERPOINTS_SIGNING_SECRET.length >= 32);
}
