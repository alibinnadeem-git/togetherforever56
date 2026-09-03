create or replace function app.cast_election_ballot(
  p_election_id uuid,
  p_voter_person_id uuid,
  p_candidate_id uuid,
  p_receipt_hash text,
  p_ballot_hash text
) returns void
language plpgsql
security definer
set search_path=app,public
as $$
begin
  if not exists(
    select 1 from app.election_candidates
    where id=p_candidate_id
      and election_id=p_election_id
      and status in ('eligible','approved','nominated')
  ) then
    raise exception 'Candidate is not valid for this election';
  end if;

  insert into app.election_voter_receipts(election_id,voter_person_id,ballot_token_hash)
  values(p_election_id,p_voter_person_id,p_receipt_hash);

  insert into app.election_ballots(election_id,candidate_id,ballot_token_hash)
  values(p_election_id,p_candidate_id,p_ballot_hash);
end $$;
