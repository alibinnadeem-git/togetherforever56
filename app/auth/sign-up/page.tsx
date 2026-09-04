'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, UserPlus } from 'lucide-react';
import { authClient } from '../../../lib/auth/client';

export default function SignUpPage() {
  const router = useRouter();
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [invite,setInvite]=useState('');
  const [inviteInfo,setInviteInfo]=useState<{email?:string;relationshipKey?:string;referralCode?:string}|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{const token=new URLSearchParams(window.location.search).get('invite')||'';if(!token)return;setInvite(token);void fetch(`/api/invitations/resolve?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async r=>{const j=await r.json();if(!r.ok){setError(j.error||'Invitation is invalid or expired.');return;}setInviteInfo(j);if(j.email)setEmail(j.email);});},[]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await authClient.signUp.email({ name, email, password });
      if(result.error){ setError(result.error.message || 'Unable to create account.'); return; }
      if(invite){const accepted=await fetch('/api/invitations/resolve',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:invite})});if(!accepted.ok){const j=await accepted.json();setError(j.error||'Account created, but the invitation could not be attached. Sign in and contact an administrator.');return;}}
      router.replace('/network'); router.refresh();
    } catch { setError('Unable to create account. Please try again.'); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#06150d] px-4 py-10 text-white flex items-center justify-center">
    <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black/35 p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/30 bg-amber-300/10"><Shield className="h-8 w-8 text-amber-300"/></div><div><h1 className="text-2xl font-bold">Together Forever</h1><p className="text-sm text-amber-200/80">Request Network Access</p></div></div>
      <h2 className="mt-8 text-3xl font-semibold">Create your secure account</h2>
      <p className="mt-2 text-sm leading-6 text-white/60">This creates an authentication identity only. Network access starts after an authorized administrator links it to a verified M/W/S/D/GS/GD record.</p>
      {inviteInfo&&<div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">Secure invitation recognized · referral {inviteInfo.referralCode||'—'}{inviteInfo.relationshipKey?` · ${inviteInfo.relationshipKey}`:''}. Your invited email is locked to this request.</div>}
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm">Full name<input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name" className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none"/></label>
        <label className="block text-sm">Email<input required readOnly={!!inviteInfo?.email} type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none read-only:opacity-70"/></label>
        <label className="block text-sm">Password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none"/></label>
        {error&&<p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3.5 font-semibold text-[#07120b] disabled:opacity-60"><UserPlus className="h-5 w-5"/>{busy?'Creating…':'Create Pending Account'}</button>
      </form>
      <div className="mt-6 text-sm text-white/55">Already have an account? <Link href="/auth/sign-in" className="font-semibold text-amber-300">Sign in</Link></div>
    </section>
  </main>;
}
