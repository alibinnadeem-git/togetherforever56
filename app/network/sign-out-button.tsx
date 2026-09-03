'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { authClient } from '../../lib/auth/client';

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace('/');
    router.refresh();
  }

  return (
    <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white">
      <LogOut className="h-4 w-4" /> Sign out
    </button>
  );
}
