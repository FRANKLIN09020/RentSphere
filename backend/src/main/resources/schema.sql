-- Compatibility migration for databases created before BaseEntity gained the
-- soft-delete flag. PostgreSQL cannot add a NOT NULL column to populated tables
-- unless existing rows receive a value, so use a default of false.
ALTER TABLE IF EXISTS public.approval_requests ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.agreements ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.buildings ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.complaints ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.deposit_disputes ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.invoices ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.organizations ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.payments ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.properties ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.rent_increases ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.tenants ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.units ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
