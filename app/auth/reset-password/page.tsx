'use client';

import Link from 'next/link';
import { FormEvent,useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield,KeyRound } from 'lucide-react';
import { authClient } from '../../../lib/auth/client';

export default function ResetPasswordPage(){
  const params=useSearchParams();
  const token=params.get('token')||'';
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [error,setError]=useState('');
  const [done,setDone]=useState(false);
  const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError('');if(!token){setError('This password link is missing or invalid. Request a new one from Sign In.');return;}if(password.length<8){setError('Password must be at least 8 characters.');return;}if(password!==confirm){setError('Passwords do not match.');return;}setBusy(true);try{const result=await authClient.resetPassword({newPassword:password,token});if(result.error){setError(result.error.message||'Unable to set password.');return;}setDone(true);}catch{setError('Unable to set password. Request a new link and try again.');}finally{setBusy(false);}}
  return <main className="min-h-screen bg-[#06150d] px-4 py-10 text-white flex items-center justify-center"><section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black/35 p-7 sm:p-9 shadow-2xl backdrop-blur-xl"><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/30 bg-amber-300/10"><Shield className="h-8 w-8 text-amber-300"/></div><div><h1 className="text-2xl font-bold">Together Forever</h1><p className="text-sm text-amber-200/80">Secure Password Setup</p></div></div>{done?<div className="mt-8"><KeyRound className="h-10 w-10 text-emerald-300"/><h2 className="mt-4 text-3xl font-semibold">Password updated</h2><p className="mt-3 text-white/60">Your password is ready. You can now sign in to the Network.</p><Link href="/auth/sign-in" className="mt-6 inline-flex rounded-xl bg-amber-300 px-5 py-3 font-semibold text-[#07120b]">Go to Sign In</Link></div>:<><h2 className="mt-8 text-3xl font-semibold">Choose your password</h2><p className="mt-2 text-sm leading-6 text-white/60">This secure link can be used for first-time password setup or a later password reset.</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm">New password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none"/></label><label className="block text-sm">Confirm password<input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none"/></label>{error&&<p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3.5 font-semibold text-[#07120b] disabled:opacity-60"><KeyRound className="h-5 w-5"/>{busy?'Saving…':'Set Password'}</button></form><Link href="/auth/sign-in" className="mt-6 inline-block text-sm text-white/55 hover:text-white">Back to Sign In</Link></>}</section></main>;
}
