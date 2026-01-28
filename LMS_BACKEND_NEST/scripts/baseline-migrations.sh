#!/usr/bin/env bash
# Baseline migrations script
# WARNING: This script marks migrations as applied in the database migration table
# without changing the database schema. Use only when you are sure the DB schema
# already matches the migration files in prisma/migrations/.
#
# Usage:
#   Ensure DATABASE_URL is set in the environment, then run:
#     bash ./scripts/baseline-migrations.sh
#
# Edit the MIGRATIONS array below to match the folder names in prisma/migrations
# in chronological order.

set -euo pipefail

if [ -z "${LOCAL_DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set. Set it to your production DB connection string before running."
  exit 1
fi

# Add migration folder names here (in order). Example names are from your repo.
MIGRATIONS=(
  20250825110457_init
  20250825153620_add_is_archived_libraryitem
  20250825160614_auth_fields
  20250829114428_add_multiple_item_types_support
  20250829131616_update_activity_types
  20250829151837_add_loan_status_and_return_date
  20250902142508_add_user_metadata
  20250903050820_add_pending_librarians
  20250903102800_add_pending_librarians
)

echo "Starting baseline: will mark ${#MIGRATIONS[@]} migrations as applied."

echo "Using DATABASE_URL=${DATABASE_URL}"

for m in "${MIGRATIONS[@]}"; do
  echo "Marking migration as applied: $m"
  npx prisma migrate resolve --applied "$m"
done

echo "Baseline complete."
