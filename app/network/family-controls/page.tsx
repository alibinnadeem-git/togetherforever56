import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../../lib/auth/server';
import { accessForAuthUser } from '../../../lib/access';
import FamilyControlsClient from './family-controls-client';
type SessionUser={id:string};type SessionResult={user?:SessionUser|null;data?:{user?:SessionUser|null}|null};
export const dynamic='force-dynamic';
export default async function FamilyControlsPage(){const raw=(await auth.getSession()) as unknown as SessionResult;const user=raw.user??raw.data?.user??null;if(!user?.id)redirect('/auth/sign-in');const access=await accessForAuthUser(user.id);if(!access||access.accountStatus!=='active')redirect('/network');return <main className="min-h-screen bg-[#06150d] text-white"><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><Link href="/network" className="text-sm text-white/55">← Network</Link><h1 className="mt-5 text-4xl font-semibold">Family Guardian & Consent Center</h1><p className="mt-2 text-white/55">Verified guardianship and policy-versioned consent for minors in your family.</p><FamilyControlsClient canManage={access.permissions.includes('family.guardian.manage')}/></div></main>}
