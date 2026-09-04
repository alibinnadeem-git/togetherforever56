'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { Shield, Users, CalendarDays, BriefcaseBusiness, Store, HeartHandshake, GraduationCap, Landmark, Images, ArrowRight, LockKeyhole, Search, Plus, LogIn, UserPlus } from 'lucide-react';

const modules = [
  { title: 'Members & Families', text: 'Alumni identities, family access, chapters, circles and privacy-aware networking.', icon: Users },
  { title: 'Events & Reunions', text: 'Get-togethers, talks and member-suggested events reviewed and ignited by administrators.', icon: CalendarDays },
  { title: 'Jobs & Opportunities', text: 'Jobs, internships, business opportunities, introductions and professional referrals.', icon: BriefcaseBusiness },
  { title: 'Marketplace', text: 'General listings plus land, vehicles, gold, member services and administered digital offers.', icon: Store },
  { title: 'Fundraising & Welfare', text: 'Community causes, private welfare workflows and online or externally completed transactions.', icon: HeartHandshake },
  { title: 'Mentorship & Scholarships', text: 'Mentorship matching, tuition, education guidance and scholarships for members and families.', icon: GraduationCap },
  { title: 'Governance', text: 'Board positions, configurable election/selection/appointment rules, voting and resolutions.', icon: Landmark },
  { title: 'Heritage & Gallery', text: 'Memorial, provenance, reunions, Google Drive/OneDrive references and the living course archive.', icon: Images },
];

export default function HomePage() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return (
    <main>
      <section className="tf-hero min-h-[82vh] text-white">
        <div className="tf-orb one" />
        <div className="tf-orb two" />
        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-yellow-300/30 bg-white/10 p-2.5 backdrop-blur"><Shield className="h-7 w-7 text-yellow-300" /></div>
            <div>
              <div className="text-lg font-extrabold tracking-tight">Together Forever</div>
              <div className="text-xs font-medium text-yellow-200">Brotherhood • Est. 1977</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/auth/sign-up" className="hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20 sm:inline-flex">Request Access</a>
            <a href="/auth/sign-in" className="inline-flex items-center gap-2 rounded-full bg-yellow-300 px-4 py-2 text-sm font-bold text-green-950 shadow-lg shadow-black/20 transition hover:bg-yellow-200"><LogIn className="h-4 w-4"/> Sign In</a>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-20 md:grid-cols-[1.2fr_.8fr] md:px-8 md:pt-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-yellow-200">PMA 56 Long Course Network</div>
            <h1 className="max-w-4xl text-5xl font-black leading-[.95] tracking-[-.05em] md:text-7xl">Brotherhood forged.<br/><span className="text-yellow-300">Legacy eternal.</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-emerald-50/85 md:text-lg">A private, multigenerational alumni and family network for heritage, opportunity, community, governance and support—designed to stay simple as it grows.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/auth/sign-in" className="inline-flex items-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 font-bold text-green-950 shadow-xl shadow-black/20">Sign in to Network <ArrowRight className="h-4 w-4" /></a>
              <a href="/auth/sign-up" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-semibold backdrop-blur"><UserPlus className="h-4 w-4"/> Request Access</a>
            </div>
            <p className="mt-3 text-xs text-emerald-50/60">Accounts do not receive Network access until an authorized administrator links them to a verified Together Forever member or family record.</p>
          </div>

          <div className="tf-card rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl md:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div><div className="text-sm font-semibold text-yellow-200">Together Forever Network</div><div className="mt-1 text-2xl font-black">One simple home</div></div>
              <div className="rounded-2xl bg-white/10 p-3"><Search className="h-6 w-6" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {['Home','Network','Create +','Inbox','Me','Governance'].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 font-semibold">{item}</div>)}
            </div>
            <div className="mt-4 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm leading-6 text-yellow-50">All of the platform’s depth is hidden behind a small number of repeatable actions, permissions and workflows.</div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-slate-200 md:grid-cols-4">
          {[['247','Registered Members'],['191','Active Officers'],['19','Shaheeds'],['16 + 3 Officers','In remembrance']].map(([value,label]) => (
            <div key={label} className="bg-white px-5 py-7 text-center"><div className="text-2xl font-black text-green-900 md:text-3xl">{value}</div><div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div></div>
          ))}
        </div>
      </section>

      <section id="network" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="max-w-3xl">
          <div className="text-sm font-bold uppercase tracking-[.18em] text-green-700">Together Forever Network</div>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Everything we designed, kept simple.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">The production platform uses shared identity, RBAC, audience-policy, workflow, transaction and audit engines so new capabilities do not become separate disconnected systems.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map(({ title, text, icon: Icon }) => (
            <article key={title} className="tf-card rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
              <div className="mb-5 inline-flex rounded-2xl bg-green-50 p-3 text-green-800"><Icon className="h-6 w-6" /></div>
              <h3 className="text-lg font-extrabold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-2 md:px-8">
          <div>
            <div className="text-sm font-bold uppercase tracking-[.18em] text-yellow-300">Identity & access</div>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">Five-digit family-linked membership</h2>
            <p className="mt-4 max-w-xl leading-7 text-slate-300">Relationship prefixes enable simple audience rules while immutable internal IDs protect data integrity when a display membership number changes.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 font-mono text-sm sm:grid-cols-3">
            {['M-56271','W-56271','S-1-56271','S-2-56271','D-1-56271','GS-1-56271'].map((code)=><div key={code} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-yellow-200">{code}</div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="rounded-[2rem] bg-green-950 p-7 text-white md:p-12">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div><div className="text-sm font-bold uppercase tracking-[.18em] text-yellow-300">Built for the next decade</div><h2 className="mt-2 text-3xl font-black">One create action. One policy language. One workflow model.</h2></div>
            <a href="/auth/sign-in" className="inline-flex items-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 font-bold text-green-950"><LogIn className="h-5 w-5" /> Sign In</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-8">
          <div><strong className="text-slate-900">Together Forever</strong><div>Established 1977 · Brotherhood Forged, Legacy Eternal</div></div>
          <div>© 2025 Together Forever. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
