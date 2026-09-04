import Link from 'next/link';
import {redirect} from 'next/navigation';
import {Shield} from 'lucide-react';
import {auth} from '../../../lib/auth/server';
import {accessForAuthUser,hasPermission} from '../../../lib/access';
import ScopedRolesClient from './scoped-roles-client';
type U={id:string};type S={user?:U|null;data?:{user?:U|null}|null};export const dynamic='force-dynamic';
export default async function ScopedRolesPage(){const raw=(await auth.getSession()) as unknown as S;const u=raw.user??raw.data?.user??null;if(!u?.id)redirect('/auth/sign-in');const a=await accessForAuthUser(u.id);if(!hasPermission(a,'roles.update'))redirect('/network');return <main className="min-h-screen bg-[#06150d] text-white"><header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"><Link href="/admin/roles" className="flex items-center gap-3"><Shield className="h-7 w-7 text-amber-300"/><div><div className="font-bold">Scoped Roles</div><div className="text-xs text-white/45">Least-privilege assignments by space</div></div></Link><span className="font-mono text-xs text-white/40">{a?.membershipCode}</span></div></header><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><ScopedRolesClient/></div></main>}
