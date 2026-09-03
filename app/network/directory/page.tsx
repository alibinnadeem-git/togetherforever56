import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '../../../lib/auth/server';
import { accessForAuthUser } from '../../../lib/access';
import DirectoryClient from './directory-client';
type SessionUser={id:string};type SessionResult={user?:SessionUser|null;data?:{user?:SessionUser|null}|null};export const dynamic='force-dynamic';
export default async function DirectoryPage(){const raw=(await auth.getSession()) as unknown as SessionResult;const user=raw.user??raw.data?.user??null;if(!user?.id)redirect('/auth/sign-in');const access=await accessForAuthUser(user.id);if(!access||access.accountStatus!=='active')redirect('/network');return <main className="min-h-screen bg-[#06150d] text-white"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><Link href="/network" className="text-sm text-white/55">← Network</Link><section className="mt-5 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-7 sm:p-9"><h1 className="text-3xl font-semibold sm:text-4xl">Members & Family Directory</h1><p className="mt-2 max-w-2xl text-white/55">Search by name, membership code or professional/service context. Profile visibility is enforced by the server.</p></section><DirectoryClient/></div></main>}
