import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../../lib/auth/server';
import { accessForAuthUser } from '../../../lib/access';
import SafetyClient from './safety-client';
type SessionUser={id:string};type SessionResult={user?:SessionUser|null;data?:{user?:SessionUser|null}|null};
export const dynamic='force-dynamic';
export default async function SafetyPage(){const raw=(await auth.getSession()) as unknown as SessionResult;const user=raw.user??raw.data?.user??null;if(!user?.id)redirect('/auth/sign-in');const access=await accessForAuthUser(user.id);if(!access||access.accountStatus!=='active')redirect('/network');return <main className="min-h-screen bg-[#06150d] text-white"><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><Link href="/network" className="text-sm text-white/55">← Network</Link><div className="mt-5"><h1 className="text-4xl font-semibold">Safety Center</h1><p className="mt-2 text-white/55">Report concerns, manage blocked members and review the status of your reports.</p></div><SafetyClient canModerate={access.permissions.includes('trust.moderate')}/></div></main>}
