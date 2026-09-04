import {NextResponse} from 'next/server';
import {auth} from '../../../../../lib/auth/server';
import {accessForAuthUser,hasPermission} from '../../../../../lib/access';
import {db} from '../../../../../lib/db';
import {requireStepUp} from '../../../../../lib/security/step-up';

type U={id:string};type S={user?:U|null;data?:{user?:U|null}|null};
const cell=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`;
async function gate(){const raw=(await auth.getSession()) as unknown as S;const u=raw.user??raw.data?.user??null;if(!u?.id)return {e:NextResponse.json({error:'Unauthorized'},{status:401})};const a=await accessForAuthUser(u.id);if(!a||a.accountStatus!=='active'||!hasPermission(a,'exports.run'))return {e:NextResponse.json({error:'Forbidden'},{status:403})};return {a};}
export async function GET(req:Request){const g=await gate();if(g.e)return g.e;const step=await requireStepUp(g.a!.personId,'exports.run');if(step)return NextResponse.json(step,{status:428});const entity=new URL(req.url).searchParams.get('entity')||'members';const s=db();let headers:string[]=[];let rows:Record<string,unknown>[]=[];
if(entity==='members'){headers=['membership_code','full_name','relationship_prefix','account_status'];rows=await s`select mc.code membership_code,p.full_name,p.relationship_prefix,p.account_status from app.persons p left join app.membership_codes mc on mc.person_id=p.id order by mc.code nulls last,p.full_name` as unknown as Record<string,unknown>[];}
else if(entity==='events'){headers=['title','event_type','starts_at','ends_at','timezone','location_name','status'];rows=await s`select title,event_type,starts_at,ends_at,timezone,location_name,status from app.events order by starts_at nulls last,created_at desc` as unknown as Record<string,unknown>[];}
else if(entity==='benefits'){headers=['title','provider_name','category','foreverpoints_cost','starts_at','ends_at','status'];rows=await s`select title,provider_name,category,foreverpoints_cost,starts_at,ends_at,status from app.member_benefits order by created_at desc` as unknown as Record<string,unknown>[];}
else return NextResponse.json({error:'Unsupported export entity'},{status:400});
const csv=[headers.map(cell).join(','),...rows.map(r=>headers.map(h=>cell(r[h])).join(','))].join('\r\n');const filename=`together-forever-${entity}-${new Date().toISOString().slice(0,10)}.csv`;return new NextResponse(csv,{status:200,headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="${filename}"`,'cache-control':'no-store'}});}
