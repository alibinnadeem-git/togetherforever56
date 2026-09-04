import {NextResponse} from 'next/server';
import {auth} from '../../../../lib/auth/server';
import {accessForAuthUser} from '../../../../lib/access';
import {db} from '../../../../lib/db';

type SessionUser={id:string};type SessionInfo={createdAt?:string|Date|null};type SessionResult={user?:SessionUser|null;session?:SessionInfo|null;data?:{user?:SessionUser|null;session?:SessionInfo|null}|null};

export async function POST(request:Request){
  const raw=(await auth.getSession()) as unknown as SessionResult;
  const user=raw.user??raw.data?.user??null;const session=raw.session??raw.data?.session??null;
  if(!user?.id)return NextResponse.json({error:'Unauthorized'},{status:401});
  const access=await accessForAuthUser(user.id);if(!access||access.accountStatus!=='active')return NextResponse.json({error:'Forbidden'},{status:403});
  const body=await request.json() as Record<string,unknown>;const purpose=String(body.purpose||'').trim();const password=String(body.password||'');
  if(!purpose)return NextResponse.json({error:'Purpose required'},{status:400});
  const s=db();const credentials=await s`select 1 from neon_auth.account where "userId"=${user.id}::uuid and "providerId"='credential' and password is not null limit 1` as unknown as Array<Record<string,unknown>>;
  let method='fresh_session';
  if(credentials.length){
    if(!password)return NextResponse.json({error:'Password required',code:'PASSWORD_REQUIRED'},{status:400});
    const verify=await fetch(new URL('/api/auth/verify-password',request.url),{method:'POST',headers:{'content-type':'application/json','cookie':request.headers.get('cookie')||'','origin':new URL(request.url).origin},body:JSON.stringify({password}),cache:'no-store'});
    if(!verify.ok)return NextResponse.json({error:'Password verification failed',code:'VERIFY_FAILED'},{status:401});
    method='password';
  }else{
    const created=session?.createdAt?new Date(session.createdAt).getTime():0;
    if(!created||Date.now()-created>5*60*1000)return NextResponse.json({error:'Re-authentication required. Sign out and sign back in, then retry this sensitive action.',code:'FRESH_SESSION_REQUIRED'},{status:428});
  }
  await s`insert into app.step_up_authorizations(person_id,purpose,method,expires_at,metadata) values(${access.personId}::uuid,${purpose},${method},now()+interval '10 minutes',${JSON.stringify({authUserId:user.id})}::jsonb)`;
  await s`insert into app.security_events(person_id,event_type,severity,metadata) values(${access.personId}::uuid,'step_up_authorized','info',${JSON.stringify({purpose,method})}::jsonb)`;
  return NextResponse.json({ok:true,purpose,method,expiresInSeconds:600});
}
