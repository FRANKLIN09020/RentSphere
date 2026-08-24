-- Run once against an existing RentSphere database after deploying the matching
-- backend version. Hibernate's ddl-auto=update does not remove obsolete columns.
ALTER TABLE rent_increases
    DROP COLUMN IF EXISTS increase_amount,
    DROP COLUMN IF EXISTS increase_percent;
