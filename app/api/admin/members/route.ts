import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth/server';
import { accessForAuthUser, hasPermission } from '../../../../lib/access';
import { db } from '../../../../lib/db';

type SessionUser={id:string};
type SessionResult={user?:SessionUser|null;data?:{user?:SessionUser|null}|null};
type MemberInput={authUserId?:string;fullName?:string;relationshipKey?:string;rootNumber?:string;ordinal?:number|null;accountStatus?:string;roleKeys?:string[]};

async function actor(permission:string){
  const raw=(await auth.getSession()) as unknown as SessionResult;
  const user=raw.user??raw.data?.user??null;
  if(!user?.id) return {error:NextResponse.json({error:'Unauthorized'},{status:401})};
  const access=await accessForAuthUser(user.id);
  if(!hasPermission(access,permission)) return {error:NextResponse.json({error:'Forbidden'},{status:403})};
  return {access};
}

async function payload(){
  const sql=db();
  const authUsers=await sql`select u.id::text,u.name,u.email,u."emailVerified" as email_verified,u."createdAt" as created_at, exists(select 1 from app.persons p where p.auth_user_id=u.id) as linked from neon_auth."user" u order by u."createdAt" desc`;
  const persons=await sql`select p.id::text,p.full_name,p.email,p.account_status,mc.code as membership_code,rt.key as relationship_key,rt.label as relationship_label,fg.root_number,coalesce(array_agg(distinct r.key) filter(where r.key is not null),'{}') as role_keys from app.persons p left join app.membership_codes mc on mc.person_id=p.id left join app.relationship_types rt on rt.id=p.relationship_type_id left join app.family_groups fg on fg.id=p.family_group_id left join app.person_roles pr on pr.person_id=p.id and (pr.ends_at is null or pr.ends_at>now()) left join app.roles r on r.id=pr.role_id group by p.id,mc.code,rt.key,rt.label,fg.root_number order by p.created_at desc`;
  const relationships=await sql`select key,label,prefix,requires_ordinal,is_adult,can_login from app.relationship_types where is_active=true order by case when key='member' then 0 else 1 end,label`;
  const roles=await sql`select key,name,description,is_system,is_active from app.roles where is_active=true order by is_system desc,name`;
  return {authUsers,persons,relationships,roles};
}

export async function GET(){
  const gate=await actor('members.read'); if(gate.error) return gate.error;
  return NextResponse.json(await payload());
}

export async function POST(request:Request){
  const gate=await actor('members.create'); if(gate.error) return gate.error;
  const body=(await request.json()) as MemberInput;
  if(!body.authUserId||!body.fullName?.trim()||!body.relationshipKey) return NextResponse.json({error:'Auth user, name and relationship are required.'},{status:400});
  const sql=db();
  try{
    const created=await sql`select * from app.create_linked_identity(${body.authUserId}::uuid,${body.fullName.trim()},${body.relationshipKey},${body.rootNumber?.trim()||null},${body.ordinal??null},${gate.access!.personId}::uuid,${body.accountStatus||'active'})` as unknown as Array<{person_id:string;membership_code:string;root_number:string}>;
    const personId=created[0]?.person_id;
    const requested=[...new Set(Array.isArray(body.roleKeys)?body.roleKeys:[])];
    if(requested.length){
      if(!hasPermission(gate.access!,'roles.assign')) return NextResponse.json({error:'Identity created, but assigning extra roles requires roles.assign.'},{status:403});
      for(const roleKey of requested){
        await sql`insert into app.person_roles(person_id,role_id,assigned_by_person_id) select ${personId}::uuid,id,${gate.access!.personId}::uuid from app.roles where key=${roleKey} and is_active=true on conflict do nothing`;
      }
      await sql`insert into app.audit_logs(actor_person_id,action,object_type,object_id,after_data) values (${gate.access!.personId}::uuid,'roles.assign','person',${personId}::uuid,${JSON.stringify({roleKeys:requested})}::jsonb)`;
    }
    return NextResponse.json({created:created[0],...(await payload())},{status:201});
  }catch(error){
    const message=error instanceof Error?error.message:'Unable to create member identity.';
    return NextResponse.json({error:message},{status:400});
  }
}

export async function PATCH(request:Request){
  const gate=await actor('roles.assign'); if(gate.error) return gate.error;
  const body=(await request.json()) as {personId?:string;roleKeys?:string[];accountStatus?:string};
  if(!body.personId) return NextResponse.json({error:'personId is required.'},{status:400});
  const sql=db();
  const keys=[...new Set(Array.isArray(body.roleKeys)?body.roleKeys:[])];
  if(body.accountStatus){
    if(!hasPermission(gate.access!,'members.update')) return NextResponse.json({error:'members.update is required to change account status.'},{status:403});
    await sql`update app.persons set account_status=${body.accountStatus},updated_at=now() where id=${body.personId}::uuid`;
  }

  // Preserve only the required identity base role. Administrator, President,
  // Governing Board and all custom roles remain fully revocable.
  await sql`
    delete from app.person_roles pr
    using app.roles r
    where pr.role_id=r.id
      and pr.person_id=${body.personId}::uuid
      and r.key not in ('member','family_member')
  `;

  for(const roleKey of keys){
    await sql`insert into app.person_roles(person_id,role_id,assigned_by_person_id) select ${body.personId}::uuid,id,${gate.access!.personId}::uuid from app.roles where key=${roleKey} and is_active=true and key not in ('member','family_member') on conflict do nothing`;
  }
  await sql`insert into app.audit_logs(actor_person_id,action,object_type,object_id,after_data) values (${gate.access!.personId}::uuid,'member.access.update','person',${body.personId}::uuid,${JSON.stringify({roleKeys:keys,accountStatus:body.accountStatus})}::jsonb)`;
  return NextResponse.json(await payload());
}
