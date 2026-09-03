import { notFound, redirect } from 'next/navigation';
import { auth } from '../../../lib/auth/server';
import { accessForAuthUser } from '../../../lib/access';
import ModuleClient from './module-client';

export const dynamic='force-dynamic';
const allowed=new Set(['events','opportunities','marketplace','fundraising','gallery','businesses','community','proposals','family-life']);
type SessionUser={id:string};type SessionResult={user?:SessionUser|null;data?:{user?:SessionUser|null}|null};

export default async function NetworkModulePage({params}:{params:Promise<{module:string}>}){
 const {module}=await params;if(!allowed.has(module))notFound();
 const raw=(await auth.getSession()) as unknown as SessionResult;const user=raw.user??raw.data?.user??null;if(!user?.id)redirect('/auth/sign-in');
 const access=await accessForAuthUser(user.id);if(!access||access.accountStatus!=='active')redirect('/network');
 return <ModuleClient module={module}/>;
}
