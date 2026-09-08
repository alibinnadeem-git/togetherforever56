import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../../lib/auth/server';
import { accessForAuthUser } from '../../../lib/access';
import MatrimonialClient from './matrimonial-client';

type SessionUser={id:string};type SessionResult={user?:SessionUser|null;data?:{user?:SessionUser|null}|null};
export const dynamic='force-dynamic';
export default async function MatrimonialPage(){const raw=(await auth.getSession()) as unknown as SessionResult;const user=raw.user??raw.data?.user??null;if(!user?.id)redirect('/auth/sign-in');const access=await accessForAuthUser(user.id);if(!access||access.accountStatus!=='active')redirect('/network');return <main className="min-h-screen bg-[#06150d] text-white"><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><Link href="/network/me" className="text-sm text-white/55">← Me</Link><section className="mt-5 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-7 sm:p-9"><div className="text-xs font-bold uppercase tracking-[.18em] text-amber-200/70">Beta · Privacy-first</div><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Matrimonial Introductions</h1><p className="mt-3 max-w-3xl text-white/55">Create a respectful adult introduction profile, review proposed introductions, and give or withdraw your own consent. Contact details are not exposed by this workflow.</p></section><MatrimonialClient/></div></main>}
