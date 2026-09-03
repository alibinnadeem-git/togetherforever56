-- Harden system audience presets so repeated environment provisioning stays deterministic.
create unique index if not exists uq_system_audience_policy_name
  on app.audience_policies(name)
  where is_system = true;
