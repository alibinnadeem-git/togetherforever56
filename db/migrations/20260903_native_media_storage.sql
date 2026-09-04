alter table app.media_assets add column if not exists storage_provider text not null default 'external';
alter table app.media_assets add column if not exists storage_key text;
alter table app.media_assets add column if not exists byte_size bigint;
alter table app.media_assets add column if not exists checksum_sha256 text;
alter table app.media_assets add column if not exists status text not null default 'active';
alter table app.media_assets add column if not exists updated_at timestamptz not null default now();
create index if not exists media_assets_provider_idx on app.media_assets(storage_provider,status);
