import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { auth } from '../../../lib/auth/server';
import { accessForAuthUser, hasPermission } from '../../../lib/access';
import RolesClient from './roles-client';

export const dynamic = 'force-dynamic';

type SessionUser = { id: string };
type SessionResult = { user?: SessionUser | null; data?: { user?: SessionUser | null } | null };

export default async function RolesAdminPage() {
  const raw = (await auth.getSession()) as unknown as SessionResult;
  const user = raw.user ?? raw.data?.user ?? null;
  if (!user?.id) redirect('/auth/sign-in');
  const access = await accessForAuthUser(user.id);
  if (!hasPermission(access, 'roles.read')) redirect('/network');

  return (
    <main className="min-h-screen bg-[#06150d] text-white">
      <header className="border-b border-white/10 bg-[#06150d]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/network" className="flex items-center gap-3"><Shield className="h-8 w-8 text-amber-300"/><div><div className="font-bold">Together Forever Admin</div><div className="text-xs text-white/50">Roles & Responsibilities</div></div></Link>
          <div className="text-xs text-white/45">{access?.membershipCode}</div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><RolesClient canCreate={hasPermission(access,'roles.create')} canUpdate={hasPermission(access,'roles.update')} /></div>
    </main>
  );
}
