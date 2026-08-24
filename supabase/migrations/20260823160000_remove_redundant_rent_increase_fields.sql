-- increase_amount and increase_percent are derived from previous_rent and
-- proposed_rent. Keeping all four values allowed inconsistent rent records.
alter table if exists public.rent_increases
    drop column if exists increase_amount,
    drop column if exists increase_percent;
