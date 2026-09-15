-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateEnum
CREATE TYPE "verification_purpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "friendship_status" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "group_role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "settlement_method" AS ENUM ('UPI', 'CASH', 'BANK', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" CITEXT,
    "email_verified_at" TIMESTAMPTZ(6),
    "claimed_at" TIMESTAMPTZ(6),
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "default_currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "locale" TEXT NOT NULL DEFAULT 'en-IN',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_credentials" (
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_credentials_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "oauth_identities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_uid" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "family_id" UUID NOT NULL,
    "user_agent" TEXT,
    "ip" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" "verification_purpose" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "addressee_id" UUID NOT NULL,
    "status" "friendship_status" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ(6),

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" UUID NOT NULL,
    "group_id" UUID,
    "inviter_id" UUID NOT NULL,
    "email" CITEXT,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "banner_url" TEXT,
    "currency" CHAR(3) NOT NULL,
    "simplify_debts" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "group_role" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id","user_id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "group_id" UUID,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "currency" CHAR(3) NOT NULL,
    "total_minor" BIGINT NOT NULL,
    "original_currency" CHAR(3),
    "original_total_minor" BIGINT,
    "fx_rate" DECIMAL(18,8),
    "expense_date" TIMESTAMPTZ(6) NOT NULL,
    "category_id" UUID,
    "split_strategy" JSONB NOT NULL,
    "recurring_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_payers" (
    "expense_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount_minor" BIGINT NOT NULL,

    CONSTRAINT "expense_payers_pkey" PRIMARY KEY ("expense_id","user_id")
);

-- CreateTable
CREATE TABLE "expense_shares" (
    "expense_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount_minor" BIGINT NOT NULL,

    CONSTRAINT "expense_shares_pkey" PRIMARY KEY ("expense_id","user_id")
);

-- CreateTable
CREATE TABLE "expense_revisions" (
    "id" UUID NOT NULL,
    "expense_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changed_by" UUID NOT NULL,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "expense_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" UUID NOT NULL,
    "group_id" UUID,
    "from_user_id" UUID NOT NULL,
    "to_user_id" UUID NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "method" "settlement_method" NOT NULL DEFAULT 'OTHER',
    "external_ref" TEXT,
    "note" TEXT,
    "settled_at" TIMESTAMPTZ(6) NOT NULL,
    "recorded_by" UUID NOT NULL,
    "confirmed_at" TIMESTAMPTZ(6),
    "confirmed_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_cache" (
    "group_id" UUID NOT NULL,
    "from_user_id" UUID NOT NULL,
    "to_user_id" UUID NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "balance_cache_pkey" PRIMARY KEY ("group_id","from_user_id","to_user_id","currency")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "key" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "response_status" INTEGER NOT NULL,
    "response_body" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("user_id","key")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "expense_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_events" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "group_id" UUID,
    "subject_type" TEXT NOT NULL,
    "subject_id" UUID NOT NULL,
    "verb" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_reads" (
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "read_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_reads_pkey" PRIMARY KEY ("user_id","event_id")
);

-- CreateTable
CREATE TABLE "notification_prefs" (
    "user_id" UUID NOT NULL,
    "prefs" JSONB NOT NULL,

    CONSTRAINT "notification_prefs_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "recurring_expenses" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "template" JSONB NOT NULL,
    "rrule" TEXT NOT NULL,
    "next_run_at" TIMESTAMPTZ(6),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "group_id" UUID,
    "category_id" UUID,
    "period" TEXT NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fx_rates" (
    "base" CHAR(3) NOT NULL,
    "quote" CHAR(3) NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "as_of" DATE NOT NULL,

    CONSTRAINT "fx_rates_pkey" PRIMARY KEY ("base","quote","as_of")
);

-- CreateTable
CREATE TABLE "whiteboard_notes" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "color" TEXT,
    "position" JSONB NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "whiteboard_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_mentions" (
    "note_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "note_mentions_pkey" PRIMARY KEY ("note_id","user_id")
);

-- CreateTable
CREATE TABLE "note_reactions" (
    "note_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "emoji" TEXT NOT NULL,

    CONSTRAINT "note_reactions_pkey" PRIMARY KEY ("note_id","user_id","emoji")
);

-- CreateTable
CREATE TABLE "note_comments" (
    "id" UUID NOT NULL,
    "note_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_reads" (
    "note_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "read_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_reads_pkey" PRIMARY KEY ("note_id","user_id")
);

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "oauth_identities_user_id_idx" ON "oauth_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_identities_provider_provider_uid_key" ON "oauth_identities"("provider", "provider_uid");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_family_id_idx" ON "sessions"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_hash_key" ON "verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "verification_tokens_user_id_purpose_idx" ON "verification_tokens"("user_id", "purpose");

-- CreateIndex
CREATE INDEX "friendships_requester_id_idx" ON "friendships"("requester_id");

-- CreateIndex
CREATE INDEX "friendships_addressee_id_idx" ON "friendships"("addressee_id");

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_hash_key" ON "invites"("token_hash");

-- CreateIndex
CREATE INDEX "invites_group_id_idx" ON "invites"("group_id");

-- CreateIndex
CREATE INDEX "group_members_user_id_idx" ON "group_members"("user_id");

-- CreateIndex
CREATE INDEX "expenses_group_id_expense_date_idx" ON "expenses"("group_id", "expense_date" DESC);

-- CreateIndex
CREATE INDEX "expenses_category_id_idx" ON "expenses"("category_id");

-- CreateIndex
CREATE INDEX "expenses_recurring_id_idx" ON "expenses"("recurring_id");

-- CreateIndex
CREATE INDEX "expense_payers_user_id_idx" ON "expense_payers"("user_id");

-- CreateIndex
CREATE INDEX "expense_shares_user_id_idx" ON "expense_shares"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_revisions_expense_id_version_key" ON "expense_revisions"("expense_id", "version");

-- CreateIndex
CREATE INDEX "settlements_group_id_settled_at_idx" ON "settlements"("group_id", "settled_at" DESC);

-- CreateIndex
CREATE INDEX "settlements_from_user_id_idx" ON "settlements"("from_user_id");

-- CreateIndex
CREATE INDEX "settlements_to_user_id_idx" ON "settlements"("to_user_id");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "categories_key_key" ON "categories"("key");

-- CreateIndex
CREATE INDEX "attachments_owner_type_owner_id_idx" ON "attachments"("owner_type", "owner_id");

-- CreateIndex
CREATE INDEX "comments_expense_id_created_at_idx" ON "comments"("expense_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_events_group_id_created_at_idx" ON "activity_events"("group_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_events_actor_id_idx" ON "activity_events"("actor_id");

-- CreateIndex
CREATE INDEX "recurring_expenses_active_next_run_at_idx" ON "recurring_expenses"("active", "next_run_at");

-- CreateIndex
CREATE INDEX "budgets_user_id_idx" ON "budgets"("user_id");

-- CreateIndex
CREATE INDEX "budgets_group_id_idx" ON "budgets"("group_id");

-- CreateIndex
CREATE INDEX "whiteboard_notes_group_id_created_at_idx" ON "whiteboard_notes"("group_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "note_comments_note_id_created_at_idx" ON "note_comments"("note_id", "created_at");

-- AddForeignKey
ALTER TABLE "auth_credentials" ADD CONSTRAINT "auth_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_identities" ADD CONSTRAINT "oauth_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recurring_id_fkey" FOREIGN KEY ("recurring_id") REFERENCES "recurring_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_payers" ADD CONSTRAINT "expense_payers_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_payers" ADD CONSTRAINT "expense_payers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_revisions" ADD CONSTRAINT "expense_revisions_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_revisions" ADD CONSTRAINT "expense_revisions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_cache" ADD CONSTRAINT "balance_cache_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_reads" ADD CONSTRAINT "activity_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_reads" ADD CONSTRAINT "activity_reads_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "activity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whiteboard_notes" ADD CONSTRAINT "whiteboard_notes_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whiteboard_notes" ADD CONSTRAINT "whiteboard_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_mentions" ADD CONSTRAINT "note_mentions_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "whiteboard_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_mentions" ADD CONSTRAINT "note_mentions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_reactions" ADD CONSTRAINT "note_reactions_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "whiteboard_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_reactions" ADD CONSTRAINT "note_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_comments" ADD CONSTRAINT "note_comments_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "whiteboard_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_comments" ADD CONSTRAINT "note_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_reads" ADD CONSTRAINT "note_reads_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "whiteboard_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_reads" ADD CONSTRAINT "note_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- Hand-written from here down.
--
-- Everything below is part of the §6.2 specification that Prisma's schema
-- language cannot express: CHECK constraints, a functional unique index,
-- partial indexes, and the deferrable constraint trigger that enforces
-- invariant 1 in the database itself.
--
-- Because Prisma does not model these, a future `migrate dev` may propose
-- dropping the indexes. `test/schema.constraints.test.ts` asserts every object
-- below still exists, so that cannot happen silently. See prisma/README.md.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── CHECK constraints (§6.2) ───────────────────────────────────────────────

ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_total_minor_positive" CHECK ("total_minor" > 0);

ALTER TABLE "expense_payers"
  ADD CONSTRAINT "expense_payers_amount_positive" CHECK ("amount_minor" > 0);

-- expense_shares is deliberately unconstrained in sign: an ADJUSTMENT split can
-- legitimately leave a participant with a negative share.

ALTER TABLE "settlements"
  ADD CONSTRAINT "settlements_amount_positive" CHECK ("amount_minor" > 0);

ALTER TABLE "settlements"
  ADD CONSTRAINT "settlements_distinct_parties" CHECK ("from_user_id" <> "to_user_id");

-- ── partial unique index on live emails (§6.2) ─────────────────────────────
-- Placeholder members have email = NULL and there may be many of them, which
-- Postgres permits: NULLs are not equal to one another in a unique index.
-- Soft-deleted users are excluded so an address can be reused after deletion.

CREATE UNIQUE INDEX "users_email_live_key"
  ON "users" ("email")
  WHERE "deleted_at" IS NULL AND "email" IS NOT NULL;

-- ── one friendship per pair, in either direction (§6.2) ────────────────────
-- A -> B and B -> A are the same relationship, so the index is on the ordered
-- pair rather than on the columns as written.

CREATE UNIQUE INDEX "friendships_pair_key"
  ON "friendships" (LEAST("requester_id", "addressee_id"), GREATEST("requester_id", "addressee_id"));

-- ── partial indexes for the hot reads (§6.2 "Indexes that matter") ─────────
-- The list query always filters deleted_at IS NULL, so the partial index is
-- both smaller and the one the planner picks.

CREATE INDEX "expenses_group_date_live_idx"
  ON "expenses" ("group_id", "expense_date" DESC)
  WHERE "deleted_at" IS NULL;

CREATE INDEX "settlements_group_settled_live_idx"
  ON "settlements" ("group_id", "settled_at" DESC)
  WHERE "deleted_at" IS NULL;

-- ── invariant 1, enforced by the database ──────────────────────────────────
--
--   sum(expense_payers.amount_minor) = expenses.total_minor
--   sum(expense_shares.amount_minor) = expenses.total_minor
--
-- The domain enforces this, the API enforces it, and the tests assert it. This
-- is the third line: a bug, a migration or a hand-run UPDATE that breaks it
-- fails the transaction rather than quietly corrupting the ledger.
--
-- DEFERRED because a correct write is necessarily multi-statement: the expense
-- row exists for a moment before its shares do. The check runs once at COMMIT.

CREATE OR REPLACE FUNCTION assert_expense_sums(p_expense_id uuid) RETURNS void AS $$
DECLARE
  v_total  bigint;
  v_payers bigint;
  v_shares bigint;
BEGIN
  SELECT "total_minor" INTO v_total FROM "expenses" WHERE "id" = p_expense_id;

  -- The expense was hard-deleted in this same transaction and the cascade is
  -- what invoked us. Nothing left to check.
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM("amount_minor"), 0) INTO v_payers
    FROM "expense_payers" WHERE "expense_id" = p_expense_id;

  SELECT COALESCE(SUM("amount_minor"), 0) INTO v_shares
    FROM "expense_shares" WHERE "expense_id" = p_expense_id;

  IF v_payers <> v_total THEN
    RAISE EXCEPTION
      'invariant 1: expense % has sum(payers) = % but total = %', p_expense_id, v_payers, v_total
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_shares <> v_total THEN
    RAISE EXCEPTION
      'invariant 1: expense % has sum(shares) = % but total = %', p_expense_id, v_shares, v_total
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggered from the two child tables, where the expense id is a foreign key...
CREATE OR REPLACE FUNCTION trg_assert_expense_sums_child() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM assert_expense_sums(OLD."expense_id");
  ELSE
    PERFORM assert_expense_sums(NEW."expense_id");
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ...and from the expense itself, where it is the primary key. Editing
-- total_minor without editing the shares must fail just as loudly.
CREATE OR REPLACE FUNCTION trg_assert_expense_sums_parent() RETURNS trigger AS $$
BEGIN
  PERFORM assert_expense_sums(NEW."id");
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "expense_payers_sum_check"
  AFTER INSERT OR UPDATE OR DELETE ON "expense_payers"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION trg_assert_expense_sums_child();

CREATE CONSTRAINT TRIGGER "expense_shares_sum_check"
  AFTER INSERT OR UPDATE OR DELETE ON "expense_shares"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION trg_assert_expense_sums_child();

CREATE CONSTRAINT TRIGGER "expenses_sum_check"
  AFTER INSERT OR UPDATE ON "expenses"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION trg_assert_expense_sums_parent();
