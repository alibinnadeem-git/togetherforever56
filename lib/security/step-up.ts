import { db } from '../db';

export async function hasValidStepUp(personId:string,purpose:string){
  const s=db();
  const rows=await s`select id::text from app.step_up_authorizations where person_id=${personId}::uuid and purpose=${purpose} and expires_at>now() and consumed_at is null order by authorized_at desc limit 1` as unknown as Array<{id:string}>;
  return Boolean(rows[0]?.id);
}

export async function requireStepUp(personId:string,purpose:string){
  const ok=await hasValidStepUp(personId,purpose);
  return ok?null:{error:'Step-up authentication required.',code:'STEP_UP_REQUIRED'};
}
