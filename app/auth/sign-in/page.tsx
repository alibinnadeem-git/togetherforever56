'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogIn, ArrowLeft, KeyRound } from 'lucide-react';
import { authClient } from '../../../lib/auth/client';

const RESET_REDIRECT='https://togetherforever56.vercel.app/auth/reset-password';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) { setError(result.error.message || 'Unable to sign in.'); return; }
      router.replace('/network'); router.refresh();
    } catch { setError('Unable to sign in. Please try again.'); }
    finally { setBusy(false); }
  }

  async function requestPasswordSetup(){
    setError(''); setMessage('');
    if(!email.trim()){setError('Enter your email first.');return;}
    setResetBusy(true);
    try{
      const result=await authClient.requestPasswordReset({email:email.trim(),redirectTo:RESET_REDIRECT});
      if(result.error){setError(result.error.message||'Unable to send password setup email.');return;}
      setMessage('Password setup email sent. Open the secure link in your email to create or replace your password.');
    }catch{setError('Unable to send password setup email. Please try again.');}
    finally{setResetBusy(false);}
  }

  return <main className="min-h-screen bg-[#06150d] text-white flex items-center justify-center px-4 py-10">
    <div className="absolute inset-0 hero-grid opacity-40 pointer-events-none" />
    <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-black/35 p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
      <button onClick={() => router.push('/')} className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back home</button>
      <div className="mb-8 flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/30 bg-amber-300/10"><Shield className="h-8 w-8 text-amber-300" /></div><div><h1 className="text-2xl font-bold">Together Forever</h1><p className="text-sm text-amber-200/80">Brotherhood • Est. 1977</p></div></div>
      <h2 className="text-3xl font-semibold tracking-tight">Enter the Network</h2>
      <p className="mt-2 text-sm leading-6 text-white/60">Sign in with your approved account. Authentication does not grant alumni privileges until your account is linked to a verified member or family record.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block"><span className="mb-2 block text-sm font-medium">Email</span><input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/10" /></label>
        <label className="block"><span className="mb-2 block text-sm font-medium">Password</span><input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/10" /></label>
        {error ? <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}
        {message ? <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}
        <button disabled={busy} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3.5 font-semibold text-[#07120b] transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-60"><LogIn className="h-5 w-5" /> {busy ? 'Signing in…' : 'Sign In'}</button>
      </form>
      <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-4">
        <p className="text-sm font-semibold text-amber-100">First-time access or forgot your password?</p>
        <p className="mt-1 text-xs leading-5 text-white/55">Enter your email above, then use the secure email link to create a password. This is also the activation path for pre-created member and administrator accounts.</p>
        <button type="button" disabled={resetBusy} onClick={()=>void requestPasswordSetup()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/10 disabled:opacity-60"><KeyRound className="h-4 w-4"/>{resetBusy?'Sending…':'Set Up / Reset Password'}</button>
      </div>
      <div className="mt-7 border-t border-white/10 pt-6 text-sm text-white/55">Need access? <Link href="/auth/sign-up" className="font-semibold text-amber-300">Create a pending account</Link>. Membership and family access still require administrator verification.</div>
    </section>
  </main>;
}
