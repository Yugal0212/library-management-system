-- CreateEnum
CREATE TYPE "public"."LoanStatus" AS ENUM ('BORROWED', 'PENDING_RETURN', 'RETURNED');

-- AlterTable
ALTER TABLE "public"."Loan" ADD COLUMN     "status" "public"."LoanStatus" NOT NULL DEFAULT 'BORROWED';
