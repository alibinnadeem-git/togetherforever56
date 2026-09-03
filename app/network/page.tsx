import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shield, Users, CalendarDays, BriefcaseBusiness, Store, HeartHandshake, Landmark, LockKeyhole, CircleCheckBig } from 'lucide-react';
import { auth } from '../../lib/auth/server';
import { accessForAuthUser } from '../../lib/access';
import { SignOutButton } from './sign-out-button';

export const dynamic = 'force-dynamic';

type SessionUser = { id: string; name?: string | null; email?: string | null };
type SessionResult = {
  user?: SessionUser | null;
  data?: { user?: SessionUser | null } | null;
};

const modules = [
  { name: 'Members & Family', text: 'Directory, family identities, chapters and circles.', icon: Users },
  { name: 'Events', text: 'Reunions, talks, member suggestions and approvals.', icon: CalendarDays },
  { name: 'Jobs & Business', text: 'Jobs, internships, business opportunities and introductions.', icon: BriefcaseBusiness },
  { name: 'Marketplace', text: 'General, property, vehicles, gold and digital benefits.', icon: Store },
  { name: 'Welfare & Growth', text: 'Fundraising, welfare, mentorship and scholarships.', icon: HeartHandshake },
  { name: 'Governance', text: 'Board roles, elections, selections, appointments and proposals.', icon: Landmark },
];

export default async function NetworkPage() {
  const raw = (await auth.getSession()) as unknown as SessionResult;
  const user = raw.user ?? raw.data?.user ?? null;
  if (!user?.id) redirect('/auth/sign-in');

  const access = await accessForAuthUser(user.id);

  if (!access) {
    return (
      <main className="min-h-screen bg-[#06150d] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Shield className="h-9 w-9 text-amber-300" />
              <div><div className="font-bold">Together Forever Network</div><div className="text-xs text-white/50">Brotherhood • Est. 1977</div></div>
            </Link>
            <SignOutButton />
          </header>
          <section className="mt-20 rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.06] p-7 sm:p-10">
            <LockKeyhole className="h-11 w-11 text-amber-300" />
            <h1 className="mt-6 text-3xl font-semibold">Account authenticated. Membership link pending.</h1>
            <p className="mt-4 max-w-2xl leading-7 text-white/65">
              Your Neon Auth identity is valid, but it has not yet been linked to an approved Together Forever member or family record. This protects the alumni network from automatic access based only on account creation.
            </p>
            <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/70">
              Signed in as <strong className="text-white">{user.name || user.email || user.id}</strong>. An authorized administrator can link this account to its verified M/W/S/D/GS/GD identity.
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (access.accountStatus !== 'active') {
    return (
      <main className="min-h-screen bg-[#06150d] px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <Shield className="h-10 w-10 text-amber-300" />
          <h1 className="mt-5 text-3xl font-semibold">Membership awaiting activation</h1>
          <p className="mt-3 text-white/60">{access.fullName} · {access.membershipCode || 'Membership code pending'} · Status: {access.accountStatus}</p>
          <div className="mt-7"><SignOutButton /></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06150d] text-white">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#06150d]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3"><Shield className="h-9 w-9 text-amber-300" /><div><div className="font-bold">Together Forever Network</div><div className="text-xs text-white/50">{access.membershipCode}</div></div></Link>
          <SignOutButton />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-7 sm:p-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200"><CircleCheckBig className="h-3.5 w-3.5" /> Verified network identity</div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Welcome, {access.fullName}</h1>
              <p className="mt-3 text-white/55">{access.membershipCode} · {access.roles.length ? access.roles.join(' · ') : 'Network member'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm text-white/60">Your dashboard only reveals modules and records allowed by your identity, audience policies and assigned responsibilities.</div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ name, text, icon: Icon }) => (
            <article key={name} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-amber-300/25 hover:bg-white/[0.06]">
              <Icon className="h-7 w-7 text-amber-300" />
              <h2 className="mt-5 text-xl font-semibold">{name}</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6">
          <h2 className="font-semibold">Your current access</h2>
          <p className="mt-2 text-sm text-white/50">Roles: {access.roles.length ? access.roles.join(', ') : 'none assigned'} · Permissions: {access.permissions.length}</p>
        </section>
      </div>
    </main>
  );
}
