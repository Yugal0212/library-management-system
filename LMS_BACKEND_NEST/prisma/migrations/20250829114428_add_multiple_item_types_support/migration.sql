/*
  Warnings:

  - You are about to drop the column `author` on the `LibraryItem` table. All the data in the column will be lost.
  - You are about to drop the column `genre` on the `LibraryItem` table. All the data in the column will be lost.
  - You are about to drop the column `maxBooksPerUser` on the `LibrarySettings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[barcode]` on the table `LibraryItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `metadata` to the `LibraryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `LibraryItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ItemType" AS ENUM ('BOOK', 'EBOOK', 'AUDIOBOOK', 'DVD', 'BLURAY', 'CD', 'MAGAZINE', 'NEWSPAPER', 'JOURNAL', 'THESIS', 'REFERENCE', 'MAP', 'GAME', 'SOFTWARE', 'EQUIPMENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ActivityType" ADD VALUE 'ITEM_ADDED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'ITEM_UPDATED';
ALTER TYPE "public"."ActivityType" ADD VALUE 'ITEM_ARCHIVED';

-- AlterEnum
ALTER TYPE "public"."ItemStatus" ADD VALUE 'MAINTENANCE';

-- AlterTable
ALTER TABLE "public"."LibraryItem" DROP COLUMN "author",
DROP COLUMN "genre",
ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isbn" TEXT,
ADD COLUMN     "language" TEXT DEFAULT 'English',
ADD COLUMN     "location" TEXT,
ADD COLUMN     "metadata" JSONB NOT NULL,
ADD COLUMN     "type" "public"."ItemType" NOT NULL,
ALTER COLUMN "publishedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."LibrarySettings" DROP COLUMN "maxBooksPerUser",
ADD COLUMN     "maxDVDsPerUser" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "maxItemsPerUser" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "maxMagazinesPerUser" INTEGER NOT NULL DEFAULT 10;

-- DropEnum
DROP TYPE "public"."Genre";

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemCategory" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "ItemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "public"."Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCategory_itemId_categoryId_key" ON "public"."ItemCategory"("itemId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryItem_barcode_key" ON "public"."LibraryItem"("barcode");

-- CreateIndex
CREATE INDEX "LibraryItem_type_idx" ON "public"."LibraryItem"("type");

-- CreateIndex
CREATE INDEX "LibraryItem_barcode_idx" ON "public"."LibraryItem"("barcode");

-- AddForeignKey
ALTER TABLE "public"."ItemCategory" ADD CONSTRAINT "ItemCategory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."LibraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemCategory" ADD CONSTRAINT "ItemCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
