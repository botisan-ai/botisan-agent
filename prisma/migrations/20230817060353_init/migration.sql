-- CreateTable
CREATE TABLE "Conversation" (
    "id" SERIAL NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationItem" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT,
    "content" TEXT,
    "function_call" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ConversationToConversationItem" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ConversationToConversationItem_AB_unique" ON "_ConversationToConversationItem"("A", "B");

-- CreateIndex
CREATE INDEX "_ConversationToConversationItem_B_index" ON "_ConversationToConversationItem"("B");

-- AddForeignKey
ALTER TABLE "_ConversationToConversationItem" ADD CONSTRAINT "_ConversationToConversationItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConversationToConversationItem" ADD CONSTRAINT "_ConversationToConversationItem_B_fkey" FOREIGN KEY ("B") REFERENCES "ConversationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
