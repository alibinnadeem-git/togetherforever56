import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../../lib/auth/server';
import { accessForAuthUser,hasPermission } from '../../../lib/access';
import MatrimonialAdminClient from './matrimonial-admin-client';

type SessionUser={id:string};type SessionResult={user?:SessionUser|null;data?:{user?:SessionUser|null}|null};
export const dynamic='force-dynamic';
export default async function MatrimonialAdminPage(){const raw=(await auth.getSession()) as unknown as SessionResult;const user=raw.user??raw.data?.user??null;if(!user?.id)redirect('/auth/sign-in');const access=await accessForAuthUser(user.id);if(!hasPermission(access,'matrimonial.review'))redirect('/network');return <main className="min-h-screen bg-[#06150d] text-white"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><Link href="/admin" className="text-sm text-white/55">← Admin</Link><section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 sm:p-9"><div className="text-xs font-bold uppercase tracking-[.18em] text-amber-200/70">Sensitive workflow · Step-up required</div><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Matrimonial Review</h1><p className="mt-3 max-w-3xl text-white/55">Approve privacy-safe adult introduction profiles, pair eligible profiles, and advance only mutually-consented introductions. Reviewer payloads exclude email and phone.</p></section><MatrimonialAdminClient/></div></main>}
