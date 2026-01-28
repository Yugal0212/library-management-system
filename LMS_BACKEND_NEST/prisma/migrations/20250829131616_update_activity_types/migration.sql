-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ActivityType" ADD VALUE 'LIBRARY_SETTINGS_CREATED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'LIBRARY_SETTINGS_UPDATED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'LIBRARY_SETTINGS_RESET';
ALTER TYPE "public"."ActivityType" ADD VALUE 'USER_REGISTERED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'USER_LOGIN';
ALTER TYPE "public"."ActivityType" ADD VALUE 'USER_LOGOUT';
ALTER TYPE "public"."ActivityType" ADD VALUE 'EMAIL_VERIFIED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'PASSWORD_RESET_REQUESTED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'PASSWORD_RESET_COMPLETED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'ADMIN_USER_CREATED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'ITEM_BORROWED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'ITEM_RETURNED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'PROFILE_UPDATED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'ROLE_CHANGED';
