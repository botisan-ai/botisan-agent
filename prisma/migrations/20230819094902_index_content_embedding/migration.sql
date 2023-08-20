-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "indexedContent" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "indexedEmbedding" BLOB;
ALTER TABLE "Conversation" ADD COLUMN "indexedItemId" INTEGER;
