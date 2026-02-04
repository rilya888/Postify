-- CreateTable
CREATE TABLE "output_versions" (
    "id" TEXT NOT NULL,
    "outputId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "output_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "output_versions_outputId_idx" ON "output_versions"("outputId");

-- CreateIndex
CREATE INDEX "output_versions_outputId_createdAt_idx" ON "output_versions"("outputId", "createdAt");

-- AddForeignKey
ALTER TABLE "output_versions" ADD CONSTRAINT "output_versions_outputId_fkey" FOREIGN KEY ("outputId") REFERENCES "outputs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
