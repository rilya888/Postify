-- CreateTable SourceAsset (Stage 4: audio ingest)
CREATE TABLE "source_assets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrlOrPath" TEXT,
    "durationSeconds" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable Transcript
CREATE TABLE "transcripts" (
    "id" TEXT NOT NULL,
    "sourceAssetId" TEXT NOT NULL,
    "rawTranscript" TEXT NOT NULL,
    "normalizedTranscript" TEXT,
    "language" TEXT,
    "durationSeconds" DOUBLE PRECISION,
    "transcriptionModel" TEXT,
    "costEstimate" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "source_assets_projectId_idx" ON "source_assets"("projectId");
CREATE INDEX "source_assets_userId_idx" ON "source_assets"("userId");
CREATE UNIQUE INDEX "transcripts_sourceAssetId_key" ON "transcripts"("sourceAssetId");
CREATE INDEX "transcripts_sourceAssetId_idx" ON "transcripts"("sourceAssetId");

-- AddForeignKey
ALTER TABLE "source_assets" ADD CONSTRAINT "source_assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "source_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
