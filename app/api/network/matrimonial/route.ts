import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth/server';
import { accessForAuthUser } from '../../../../lib/access';
import { db } from '../../../../lib/db';

type SessionUser={id:string};
type SessionResult={user?:SessionUser|null;data?:{user?:SessionUser|null}|null};
type FeatureRow={state:string};
type PersonRow={id:string;date_of_birth:string|null};
type MatchSubjectRow={a_person_id:string|null;b_person_id:string|null};
type ConsentRow={approved_count:number};

async function gate(){
  const raw=(await auth.getSession()) as unknown as SessionResult;
  const user=raw.user??raw.data?.user??null;
  if(!user?.id)return {error:NextResponse.json({error:'Unauthorized'},{status:401})};
  const access=await accessForAuthUser(user.id);
  if(!access||access.accountStatus!=='active')return {error:NextResponse.json({error:'Forbidden'},{status:403})};
  return {access};
}

async function featureEnabled(){
  const s=db();
  const rows=await s`select state from app.feature_flags where key='matrimonial' limit 1` as unknown as FeatureRow[];
  return rows[0]?.state==='on'||rows[0]?.state==='beta';
}

export async function GET(){
  const g=await gate();if(g.error)return g.error;
  if(!(await featureEnabled()))return NextResponse.json({error:'Matrimonial introductions are not enabled.'},{status:404});
  const s=db();
  const own=await s`select fr.id::text,fr.title,fr.description,fr.request_data,fr.status,fr.created_at,p.date_of_birth from app.family_requests fr left join app.persons p on p.id=fr.subject_person_id where fr.request_type='matrimonial' and (fr.subject_person_id=${g.access!.personId}::uuid or fr.created_by_person_id=${g.access!.personId}::uuid) order by fr.created_at desc` as unknown as Array<Record<string,unknown>>;
  const discovery=await s`select fr.id::text,fr.title,fr.description,fr.request_data->>'locationPreference' location_preference,fr.request_data->>'lookingFor' looking_for,extract(year from age(current_date,p.date_of_birth))::int age from app.family_requests fr join app.persons p on p.id=fr.subject_person_id where fr.request_type='matrimonial' and fr.status='published' and fr.subject_person_id<>${g.access!.personId}::uuid and p.date_of_birth is not null and p.date_of_birth<=current_date-interval '18 years' order by fr.created_at desc limit 60` as unknown as Array<Record<string,unknown>>;
  const matches=await s`select m.id::text,m.status,m.created_at,case when a.subject_person_id=${g.access!.personId}::uuid then b.title else a.title end counterpart_title,case when a.subject_person_id=${g.access!.personId}::uuid then b.description else a.description end counterpart_summary,coalesce(selfc.consent_status,'pending') self_consent,coalesce(otherc.consent_status,'pending') counterpart_consent from app.matrimonial_matches m join app.family_requests a on a.id=m.request_a_id join app.family_requests b on b.id=m.request_b_id left join app.matrimonial_match_consents selfc on selfc.match_id=m.id and selfc.person_id=${g.access!.personId}::uuid left join app.matrimonial_match_consents otherc on otherc.match_id=m.id and otherc.person_id=case when a.subject_person_id=${g.access!.personId}::uuid then b.subject_person_id else a.subject_person_id end where a.subject_person_id=${g.access!.personId}::uuid or b.subject_person_id=${g.access!.personId}::uuid order by m.created_at desc` as unknown as Array<Record<string,unknown>>;
  return NextResponse.json({feature:'beta',own,discovery,matches,privacy:{contactReleased:false,message:'Contact details are not exposed by this workflow. Mutual consent only unlocks introduction status.'}});
}

export async function POST(request:Request){
  const g=await gate();if(g.error)return g.error;
  if(!(await featureEnabled()))return NextResponse.json({error:'Matrimonial introductions are not enabled.'},{status:404});
  const b=await request.json() as {action?:string;about?:string;lookingFor?:string;locationPreference?:string;requestId?:string;matchId?:string;decision?:string};
  const s=db();
  if(b.action==='profile.create'){
    const people=await s`select id::text,date_of_birth from app.persons where id=${g.access!.personId}::uuid limit 1` as unknown as PersonRow[];
    const person=people[0];
    if(!person?.date_of_birth)return NextResponse.json({error:'Date of birth is required before creating an introduction profile.'},{status:400});
    const adult=await s`select (${person.date_of_birth}::date<=current_date-interval '18 years') as ok` as unknown as Array<{ok:boolean}>;
    if(!adult[0]?.ok)return NextResponse.json({error:'Matrimonial introductions are available only to adults.'},{status:403});
    const about=b.about?.trim()||'',lookingFor=b.lookingFor?.trim()||'';
    if(about.length<20||lookingFor.length<10)return NextResponse.json({error:'Please provide a meaningful introduction and what you are looking for.'},{status:400});
    const existing=await s`select id::text from app.family_requests where request_type='matrimonial' and subject_person_id=${g.access!.personId}::uuid and status not in ('withdrawn','archived','rejected','completed') limit 1` as unknown as Array<{id:string}>;
    if(existing[0])return NextResponse.json({error:'You already have an active matrimonial introduction profile.'},{status:409});
    const policy=await s`select id::text from app.audience_policies where policy_type='network' and is_active=true limit 1` as unknown as Array<{id:string}>;
    const data={about,lookingFor,locationPreference:b.locationPreference?.trim()||null};
    const created=await s`insert into app.family_requests(request_type,title,description,request_data,audience_policy_id,created_by_person_id,subject_person_id,status) values ('matrimonial','Matrimonial introduction',${about},${JSON.stringify(data)}::jsonb,${policy[0]?.id||null}::uuid,${g.access!.personId}::uuid,${g.access!.personId}::uuid,'pending') returning id::text` as unknown as Array<{id:string}>;
    await s`insert into app.audit_logs(actor_person_id,action,object_type,object_id,after_data) values (${g.access!.personId}::uuid,'matrimonial.profile.create','family_request',${created[0].id}::uuid,${JSON.stringify({status:'pending'})}::jsonb)`;
    return NextResponse.json({ok:true,id:created[0].id,status:'pending'},{status:201});
  }
  if(b.action==='profile.withdraw'){
    if(!b.requestId)return NextResponse.json({error:'requestId required'},{status:400});
    const changed=await s`update app.family_requests set status='withdrawn',updated_at=now() where id=${b.requestId}::uuid and request_type='matrimonial' and subject_person_id=${g.access!.personId}::uuid and status not in ('withdrawn','completed','archived') returning id::text` as unknown as Array<{id:string}>;
    if(!changed[0])return NextResponse.json({error:'Profile not found or cannot be withdrawn.'},{status:404});
    await s`update app.matrimonial_matches set status='withdrawn',updated_at=now() where status not in ('completed','archived','declined') and (request_a_id=${b.requestId}::uuid or request_b_id=${b.requestId}::uuid)`;
    return NextResponse.json({ok:true});
  }
  if(b.action==='match.consent'){
    if(!b.matchId||!['approved','declined','withdrawn'].includes(b.decision||''))return NextResponse.json({error:'Valid matchId and decision required'},{status:400});
    const subjects=await s`select a.subject_person_id::text a_person_id,b.subject_person_id::text b_person_id from app.matrimonial_matches m join app.family_requests a on a.id=m.request_a_id join app.family_requests b on b.id=m.request_b_id where m.id=${b.matchId}::uuid limit 1` as unknown as MatchSubjectRow[];
    const pair=subjects[0];
    if(!pair||![pair.a_person_id,pair.b_person_id].includes(g.access!.personId))return NextResponse.json({error:'Forbidden'},{status:403});
    await s`insert into app.matrimonial_match_consents(match_id,person_id,consent_status,decided_at) values (${b.matchId}::uuid,${g.access!.personId}::uuid,${b.decision},now()) on conflict(match_id,person_id) do update set consent_status=excluded.consent_status,decided_at=now(),updated_at=now()`;
    await s`insert into app.matrimonial_match_events(match_id,actor_person_id,event_type,event_data) values (${b.matchId}::uuid,${g.access!.personId}::uuid,'consent.changed',${JSON.stringify({decision:b.decision})}::jsonb)`;
    if(b.decision==='declined')await s`update app.matrimonial_matches set status='declined',updated_at=now() where id=${b.matchId}::uuid`;
    else if(b.decision==='withdrawn')await s`update app.matrimonial_matches set status='awaiting_consent',updated_at=now() where id=${b.matchId}::uuid and status not in ('declined','completed','archived')`;
    else {
      const counts=await s`select count(*)::int approved_count from app.matrimonial_match_consents where match_id=${b.matchId}::uuid and consent_status='approved' and person_id in (${pair.a_person_id}::uuid,${pair.b_person_id}::uuid)` as unknown as ConsentRow[];
      if((counts[0]?.approved_count||0)>=2){await s`update app.matrimonial_matches set status='mutual_consent',updated_at=now() where id=${b.matchId}::uuid and status not in ('declined','completed','archived')`;await s`insert into app.matrimonial_match_events(match_id,event_type,event_data) values (${b.matchId}::uuid,'mutual_consent',${JSON.stringify({contactReleased:false})}::jsonb)`;}else await s`update app.matrimonial_matches set status='awaiting_consent',updated_at=now() where id=${b.matchId}::uuid and status not in ('declined','completed','archived')`;
    }
    return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:'Unknown action'},{status:400});
}
