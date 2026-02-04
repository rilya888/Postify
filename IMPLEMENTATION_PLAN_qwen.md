# Implementation Plan: Content Repurposing Tool - Advanced Pipeline

## Overview

This document outlines the implementation plan for transforming the current content repurposing tool to follow the ideal platform workflow. The goal is to achieve maximum quality at minimum cost, with predictable behavior and scalable architecture.

## Current State vs Target State

### Current Implementation
- Simple direct pipeline: `sourceContent → AI Generation → Output`
- Single model (`gpt-4-turbo`) for all operations
- Basic caching mechanism
- Limited input sources (text only)

### Target Architecture
- Multi-stage pipeline: `Ingest → Normalize → Content Pack → Generate Outputs → Polish/Validate`
- Model specialization by role (nano, mini, standard, pro)
- Sophisticated caching based on content pack
- Multiple input sources (text, files, YouTube, audio/video)

## Detailed Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

#### 1. Update Prisma Schema
- **Objective**: Add required entities for the new architecture
- **Tasks**:
  - Add `SourceAsset` model with fields: `id`, `projectId`, `type`, `url`, `fileName`, `durationSeconds`, `language`, `transcriptionModel`, `createdAt`
  - Add `Transcript` model with fields: `id`, `sourceAssetId`, `rawTranscript`, `normalizedTranscript`, `language`, `durationSeconds`, `transcriptionModel`, `costEstimate`, `createdAt`
  - Add `ContentPack` model with fields: `id`, `projectId`, `data` (JSON), `hash`, `version`, `createdAt`
  - Add `GenerationJob` model with fields: `id`, `projectId`, `status`, `progress`, `createdAt`, `completedAt`
  - Update existing models as needed
- **Files to modify**: `prisma/schema.prisma`
- **Deliverables**: Updated schema file, migration script

#### 2. Create Ingestion Service
- **Objective**: Implement the first stage of the pipeline
- **Tasks**:
  - Create `lib/services/ingestion.ts`
  - Implement text/file ingestion with validation
  - Implement YouTube link processing with subtitle extraction
  - Add placeholder for audio/video (to be expanded later)
  - Add input validation and sanitization
- **Files to create**: `lib/services/ingestion.ts`
- **Deliverables**: Ingestion service with basic functionality

#### 3. Create Normalization Service
- **Objective**: Implement content cleaning and structuring
- **Tasks**:
  - Create `lib/services/normalization.ts`
  - Implement text cleaning (remove filler words, timestamps, etc.)
  - Add language detection functionality
  - Implement topic and audience identification
  - Add content segmentation capabilities
- **Files to create**: `lib/services/normalization.ts`
- **Deliverables**: Normalization service

### Phase 2: Content Pack Creation (Week 2)

#### 4. Create Content Pack Service
- **Objective**: Implement the core concept of structured content representation
- **Tasks**:
  - Create `lib/services/content-pack.ts`
  - Implement content pack generation using `gpt-4.1-nano`
  - Define content pack schema with required fields:
    - `summary_short` (5–7 lines)
    - `summary_long` (12–20 lines)
    - `key_points[]` (10–25 items)
    - `audience` (target audience)
    - `tone_suggestions` (suggested tones)
    - `quotes[]` (5–15 quotes/facts)
    - `cta_options[]` (3–8 call-to-actions)
    - `hashtags[]` (relevant hashtags)
    - `compliance_notes` (compliance considerations)
  - Implement content pack caching with deterministic keys
- **Files to create**: `lib/services/content-pack.ts`
- **Deliverables**: Content pack service with full functionality

#### 5. Update AI Service Architecture
- **Objective**: Transition to the new multi-stage approach
- **Tasks**:
  - Modify `lib/services/ai.ts` to use content pack approach
  - Create separate functions for each AI role:
    - `normalizeContent()` - for normalization
    - `createContentPack()` - for content pack creation
    - `generateForPlatforms()` - for output generation
    - `validateAndPolish()` - for validation and polishing
  - Implement model selection based on operation type
  - Update existing functions to work with the new pipeline
- **Files to modify**: `lib/services/ai.ts`
- **Deliverables**: Updated AI service with new architecture

### Phase 3: Audio/Video Processing (Week 3)

#### 6. Add Audio/Video Transcription
- **Objective**: Enable audio/video input capabilities
- **Tasks**:
  - Install and configure FFmpeg for audio extraction
  - Implement Whisper API integration for transcription
  - Add Pro mode with higher accuracy models (`gpt-4o-mini-transcribe`)
  - Store raw and normalized transcripts in DB
  - Add transcription status tracking (pending, in-progress, completed, failed)
  - Implement transcription cost calculation
- **Files to create**: `lib/services/transcription.ts`
- **Files to modify**: `lib/services/ingestion.ts`, `prisma/schema.prisma`
- **Deliverables**: Full audio/video transcription support

#### 7. Update Ingestion Service
- **Objective**: Integrate audio/video handling
- **Tasks**:
  - Add audio/video upload handling with file validation
  - Implement file size and format validation
  - Add transcription queue management
  - Update error handling for audio/video processing
- **Files to modify**: `lib/services/ingestion.ts`
- **Deliverables**: Enhanced ingestion service with audio/video support

### Phase 4: Enhanced Features (Week 4)

#### 8. Add Model Differentiation
- **Objective**: Implement specialized models for different roles
- **Tasks**:
  - Update OpenAI client to support different models by role
  - Implement model selection logic:
    - Transcription: `whisper-1` (Standard), `gpt-4o-mini-transcribe` (Pro)
    - Normalization: `gpt-4.1-nano`
    - Content Pack: `gpt-4.1-nano` (Standard), `gpt-4.1-mini` (Pro)
    - Generation: `gpt-5-mini` (Standard), `gpt-5.2` (Pro)
    - Validation: `gpt-4.1-nano`
  - Add temperature and token configurations per operation
  - Implement fallback mechanisms for model availability
- **Files to modify**: `lib/ai/openai-client.ts`, `lib/services/ai.ts`
- **Deliverables**: Model differentiation system

#### 9. Implement Advanced Caching
- **Objective**: Optimize performance and reduce costs
- **Tasks**:
  - Update cache key generation to be deterministic using SHA256
  - Implement content pack-based caching
  - Add cache TTL strategies per operation type:
    - Content Pack: 7–30 days
    - Outputs: 7–30 days
    - Polish: 1–7 days
  - Add cache invalidation mechanisms
  - Implement cache statistics and monitoring
- **Files to modify**: `lib/services/cache.ts`, `lib/services/ai.ts`
- **Deliverables**: Advanced caching system

#### 10. Add Quality Modes
- **Objective**: Provide different quality/cost options
- **Tasks**:
  - Implement Standard vs Pro mode selection
  - Create different model configurations for each mode
  - Add UI controls for mode selection
  - Update pricing and quota systems for different modes
  - Add cost estimation for each mode
- **Files to modify**: `lib/services/ai.ts`, `components/projects/project-form.tsx`
- **Deliverables**: Quality mode selection system

### Phase 5: Validation and Polish (Week 5)

#### 11. Create Validation Service
- **Objective**: Ensure output quality and compliance
- **Tasks**:
  - Create `lib/services/validation.ts`
  - Implement content validation:
    - Length validation per platform
    - Structure validation (headers, bullets, CTA)
    - Brand voice compliance checking
    - PII detection and removal
    - Toxicity and compliance checks
  - Implement content polishing:
    - Grammar correction
    - Style consistency
    - Removal of unnecessary fillers
  - Add validation reports and feedback
- **Files to create**: `lib/services/validation.ts`
- **Deliverables**: Validation and polishing service

#### 12. Update API Routes
- **Objective**: Support new pipeline operations
- **Tasks**:
  - Modify `/api/generate` to use new pipeline
  - Add new endpoint `/api/ingest` for content ingestion
  - Add new endpoint `/api/content-pack` for content pack operations
  - Add new endpoint `/api/transcribe` for transcription operations
  - Update error handling and response structures
  - Add request/response validation
- **Files to modify**: `app/api/generate/route.ts`
- **Files to create**: `app/api/ingest/route.ts`, `app/api/content-pack/route.ts`, `app/api/transcribe/route.ts`
- **Deliverables**: Updated API with new endpoints

### Phase 6: Security and Cost Management (Week 6)

#### 13. Implement Security Measures
- **Objective**: Protect user data and ensure compliance
- **Tasks**:
  - Add PII detection in normalize/polish steps
  - Implement redacted logging (no raw content in logs)
  - Add content filtering for sensitive topics
  - Implement secure file handling
  - Add audit logging for security events
- **Files to modify**: `lib/services/normalization.ts`, `lib/services/validation.ts`, `lib/utils/logger.ts`
- **Deliverables**: Security measures implementation

#### 14. Cost Monitoring and Quotas
- **Objective**: Manage resource usage and costs
- **Tasks**:
  - Track token usage per operation
  - Implement cost estimation per operation
  - Add usage quotas per user plan
  - Add billing integration points
  - Implement cost alerts and notifications
  - Add cost reporting dashboard
- **Files to modify**: `lib/services/ai.ts`, `lib/services/quota.ts`
- **Files to create**: `lib/services/cost-tracking.ts`
- **Deliverables**: Cost management system

### Phase 7: Reliability and Error Handling (Week 7)

#### 15. Enhanced Error Handling
- **Objective**: Improve system reliability
- **Tasks**:
  - Add retry mechanisms for failed operations with exponential backoff
  - Implement fallback strategies for model unavailability
  - Add circuit breaker patterns for external API calls
  - Implement graceful degradation for critical failures
  - Add comprehensive error reporting
- **Files to modify**: `lib/ai/openai-client.ts`, `lib/services/ai.ts`
- **Deliverables**: Enhanced error handling system

#### 16. Performance Monitoring
- **Objective**: Monitor and optimize system performance
- **Tasks**:
  - Add detailed performance metrics for each operation
  - Monitor generation times and costs
  - Add alerting for performance anomalies
  - Implement performance dashboards
  - Add performance regression testing
- **Files to modify**: `lib/utils/performance.ts`
- **Deliverables**: Performance monitoring system

### Phase 8: Integration and Testing (Week 8)

#### 17. Update Frontend Components
- **Objective**: Provide UI for new features
- **Tasks**:
  - Update project form to support ingestion modes
  - Add UI for quality mode selection
  - Add audio/video upload interface with progress indicators
  - Update generation workflow with status updates
  - Add content pack preview and editing capabilities
  - Update dashboard with new metrics
- **Files to modify**: `components/projects/project-form.tsx`, `app/(dashboard)/projects/new/page.tsx`, `app/(dashboard)/projects/[id]/page.tsx`
- **Deliverables**: Updated frontend with new UI elements

#### 18. Testing and Optimization
- **Objective**: Ensure quality and performance
- **Tasks**:
  - Add unit tests for new services
  - Add integration tests for new workflows
  - Add end-to-end tests for complete workflows
  - Performance testing and optimization
  - Cost optimization validation
  - Security testing
- **Files to create**: `__tests__/services/ingestion.test.ts`, `__tests__/services/content-pack.test.ts`, etc.
- **Deliverables**: Comprehensive test suite

### Phase 9: Documentation and Deployment (Week 9)

#### 19. Documentation Updates
- **Objective**: Document new features and changes
- **Tasks**:
  - Update API documentation with new endpoints
  - Add user guides for new features
  - Create developer documentation for the new architecture
  - Update troubleshooting guide
  - Add migration guide for existing users
- **Files to modify**: `docs/API.md`, `docs/USER_GUIDE.md`, `docs/DEVELOPER_GUIDE.md`
- **Deliverables**: Updated documentation

#### 20. Deployment Preparation
- **Objective**: Prepare for production deployment
- **Tasks**:
  - Update environment variables documentation
  - Add deployment scripts for new services
  - Prepare database migration scripts
  - Add health check endpoints
  - Update CI/CD pipelines
- **Files to modify**: `railway.json`, `package.json`, CI/CD configuration
- **Deliverables**: Deployment-ready system

## Additional Considerations

### Migration Strategy
- Plan for migrating existing projects to the new architecture
- Provide backward compatibility during transition period
- Create migration scripts for existing data

### Backward Compatibility
- Ensure existing functionality continues to work during transition
- Provide API compatibility layers where needed
- Allow gradual adoption of new features

### User Experience
- Consider how to gradually introduce new features to users
- Provide clear upgrade paths and benefits
- Maintain familiar interfaces where possible

### Testing Strategy
- Unit tests for individual services
- Integration tests for service interactions
- End-to-end tests for complete workflows
- Performance tests for scalability
- Security tests for data protection

### Monitoring and Observability
- Proper logging with appropriate detail levels
- Metrics collection for performance and usage
- Alerting for critical issues
- Dashboard for operational visibility

### Data Privacy
- Ensure compliance with GDPR, CCPA, and other regulations
- Implement data retention policies
- Provide data export and deletion capabilities
- Secure handling of sensitive information

## Success Metrics

- Reduction in AI API costs through content pack reuse
- Improved generation speed through caching
- Higher user satisfaction with output quality
- Better system reliability and uptime
- Successful processing of audio/video content
- Effective cost management and quota enforcement