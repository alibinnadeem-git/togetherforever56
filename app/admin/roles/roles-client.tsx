'use client';

import { useEffect, useMemo, useState } from 'react';

type Role = { id:string; key:string; name:string; description:string|null; is_system:boolean; is_active:boolean; permission_keys:string[] };
type Permission = { id:string; key:string; domain:string; action:string; description:string|null; is_sensitive:boolean };
type Payload = { roles:Role[]; permissions:Permission[] };

export default function RolesClient({ canCreate, canUpdate }:{ canCreate:boolean; canUpdate:boolean }) {
  const [data,setData]=useState<Payload>({roles:[],permissions:[]});
  const [selected,setSelected]=useState<Role|null>(null);
  const [name,setName]=useState('');
  const [key,setKey]=useState('');
  const [description,setDescription]=useState('');
  const [permissionKeys,setPermissionKeys]=useState<string[]>([]);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);

  async function load(){ const r=await fetch('/api/admin/roles',{cache:'no-store'}); if(r.ok) setData(await r.json()); }
  useEffect(()=>{ void load(); },[]);
  const grouped=useMemo(()=>Object.entries(data.permissions.reduce<Record<string,Permission[]>>((a,p)=>{(a[p.domain]??=[]).push(p);return a;},{})),[data.permissions]);

  function edit(role:Role){ setSelected(role); setName(role.name); setKey(role.key); setDescription(role.description||''); setPermissionKeys(role.permission_keys||[]); setMessage(''); }
  function fresh(){ setSelected(null); setName(''); setKey(''); setDescription(''); setPermissionKeys([]); setMessage(''); }
  function toggle(k:string){ setPermissionKeys(v=>v.includes(k)?v.filter(x=>x!==k):[...v,k]); }

  async function save(){
    setBusy(true); setMessage('');
    const method=selected?'PATCH':'POST';
    const r=await fetch('/api/admin/roles',{method,headers:{'content-type':'application/json'},body:JSON.stringify({id:selected?.id,key,name,description,isActive:selected?.is_active??true,permissionKeys})});
    const body=await r.json();
    if(!r.ok){setMessage(body.error||'Unable to save role'); setBusy(false); return;}
    setData(body); setMessage(selected?'Role updated.':'Role created.'); setBusy(false); fresh(); await load();
  }

  async function archive(role:Role){
    if(!canUpdate || role.is_system) return;
    setBusy(true);
    const r=await fetch(`/api/admin/roles?id=${encodeURIComponent(role.id)}`,{method:'DELETE'});
    const body=await r.json();
    if(r.ok) setData(body); else setMessage(body.error||'Unable to archive role');
    setBusy(false);
  }

  return <div className="grid gap-6 lg:grid-cols-[.9fr_1.4fr]">
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Roles</h1><p className="mt-1 text-sm text-white/50">Create responsibilities and grant exact permissions.</p></div>{canCreate&&<button onClick={fresh} className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-[#07120b]">New role</button>}</div>
      <div className="mt-5 space-y-3">{data.roles.map(role=><button key={role.id} onClick={()=>edit(role)} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id===role.id?'border-amber-300/50 bg-amber-300/10':'border-white/10 bg-black/15 hover:bg-white/[0.05]'}`}><div className="flex items-center justify-between gap-3"><div className="font-semibold">{role.name}</div><span className={`rounded-full px-2 py-1 text-[10px] ${role.is_active?'bg-emerald-300/10 text-emerald-200':'bg-white/10 text-white/45'}`}>{role.is_active?'Active':'Archived'}</span></div><div className="mt-1 text-xs text-white/45">{role.key}{role.is_system?' · system':''}</div><div className="mt-3 text-xs text-white/55">{role.permission_keys.length} permissions</div></button>)}</div>
    </section>

    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <h2 className="text-2xl font-semibold">{selected?'Edit role':'Create role'}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm">Name<input value={name} onChange={e=>setName(e.target.value)} disabled={Boolean(selected && !canUpdate)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 outline-none"/></label><label className="text-sm">Key<input value={key} onChange={e=>setKey(e.target.value)} disabled={!!selected} placeholder="chapter_event_manager" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 outline-none disabled:opacity-50"/></label></div>
      <label className="mt-4 block text-sm">Responsibilities / description<textarea value={description} onChange={e=>setDescription(e.target.value)} disabled={Boolean(selected && !canUpdate)} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 outline-none"/></label>
      <div className="mt-6"><div className="font-semibold">Permissions</div><div className="mt-4 space-y-5">{grouped.map(([domain,items])=><div key={domain}><div className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-amber-200/70">{domain}</div><div className="grid gap-2 sm:grid-cols-2">{items.map(p=><label key={p.key} className="flex cursor-pointer gap-3 rounded-xl border border-white/10 bg-black/15 p-3 text-sm"><input type="checkbox" checked={permissionKeys.includes(p.key)} onChange={()=>toggle(p.key)} disabled={selected?!canUpdate:!canCreate} className="mt-1"/><span><span className="font-medium">{p.key}</span>{p.description&&<span className="mt-1 block text-xs leading-5 text-white/45">{p.description}</span>}{p.is_sensitive&&<span className="mt-1 block text-[10px] font-bold uppercase text-amber-300">Sensitive</span>}</span></label>)}</div></div>)}</div></div>
      {message&&<div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">{message}</div>}
      <div className="mt-6 flex flex-wrap gap-3">{((selected&&canUpdate)||(!selected&&canCreate))&&<button onClick={()=>void save()} disabled={busy||!name||(!selected&&!key)} className="rounded-xl bg-amber-300 px-5 py-3 font-semibold text-[#07120b] disabled:opacity-50">{busy?'Saving…':selected?'Save changes':'Create role'}</button>}{selected&&canUpdate&&!selected.is_system&&selected.is_active&&<button onClick={()=>void archive(selected)} disabled={busy} className="rounded-xl border border-red-300/20 bg-red-300/10 px-5 py-3 font-semibold text-red-100">Archive role</button>}</div>
    </section>
  </div>;
}
