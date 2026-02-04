# Stage 3: AI Integration & Generation

This document describes the implementation of Stage 3 for the AI Content Repurposing Tool, which focuses on integrating OpenAI API and implementing content generation for different platforms.

## Overview

Stage 3 implements the core AI functionality of the content repurposing tool, enabling users to transform a single piece of content into platform-specific formats for LinkedIn, Twitter/X, and Email. The implementation includes:

- OpenAI API integration with retry logic
- Platform-specific prompt templates
- Generation service with quota integration
- API endpoints for content generation
- UI components for platform selection and results display
- Content validation and sanitization
- Database schema updates for storing generated content

## Files Created and Modified

### Core AI Infrastructure

#### `lib/ai/openai-client.ts`
Main OpenAI client implementation with lazy initialization to prevent build-time errors. Includes:
- `getOpenAIClient()` function for lazy initialization
- `generateContent()` function for content generation
- `generateContentWithRetry()` function with exponential backoff retry logic
- Proper error handling for missing API keys

#### `types/ai.ts`
Type definitions for AI-related functionality:
- `GenerationOptions` type for generation parameters
- `GenerationMetadata` type for tracking generation details
- `GenerationResult` type for individual platform results
- `BulkGenerationResult` type for multiple platform results

### Prompt Templates

#### `lib/ai/prompts/linkedin.ts`
LinkedIn-specific prompt template with guidelines for:
- Post length (1200-2500 characters)
- Hook-based structure
- Professional but engaging tone
- Appropriate emoji usage
- Relevant hashtags

#### `lib/ai/prompts/twitter.ts`
Twitter/X-specific prompt template with guidelines for:
- Tweet length (up to 280 characters)
- Clear and concise messaging
- Engaging structure
- Appropriate hashtag usage

#### `lib/ai/prompts/email.ts`
Email-specific prompt template with guidelines for:
- Email newsletter format (300-800 words)
- Clear subject line and introduction
- Main message and call-to-action structure
- Formatting recommendations

#### `lib/ai/prompt-templates.ts`
Utilities for working with prompt templates:
- `formatPrompt()` function for replacing placeholders
- `getPlatformPromptTemplate()` function for retrieving platform-specific templates

### Service Layer

#### `lib/services/ai.ts`
Core AI service implementation:
- `generateForPlatforms()` function for generating content across multiple platforms
- `regenerateForPlatform()` function for regenerating content for a specific platform
- Integration with quota system to check user limits
- Database persistence for generated content
- Content validation and sanitization
- Error handling and logging

#### Updated `lib/services/projects.ts`
Added functions for working with project outputs:
- `getProjectWithOutputs()` with ordered results
- `getProjectOutputs()` for fetching outputs for a project
- `getOutputById()` for fetching a specific output
- `updateOutput()` for updating an output with edit tracking

### API Endpoints

#### `app/api/generate/route.ts`
API endpoint for content generation:
- POST method for initiating generation
- Authentication and authorization checks
- Input validation for required fields
- Integration with AI service
- Error response handling
- Proper logging of generation attempts

### UI Components

#### `components/ai/platform-selector.tsx`
Component for selecting target platforms:
- Checkbox-based interface for platform selection
- Visual indicators for platform characteristics
- Responsive design
- Disabled state during generation

#### `components/ai/platform-badge.tsx`
Component for displaying platform badges:
- Visual representation of platforms with icons
- Different variants for success/error states
- Consistent styling with the rest of the UI

### UI Pages

#### `app/(dashboard)/projects/[id]/generate/page.tsx`
Page for content generation workflow:
- Source content display
- Platform selection interface
- Generation progress indicators
- Results display with tabs for different platforms
- Previously generated content display
- Regeneration functionality

### Utilities

#### `lib/utils/content-validation.ts`
Functions for content validation and sanitization:
- `validateContentLength()` for checking content against platform limits
- `sanitizeContent()` for removing potentially harmful elements
- `validateContentSafety()` for checking prohibited patterns
- `validatePlatformContent()` for comprehensive platform validation

### Database Schema

#### Updated `prisma/schema.prisma`
Added `generationMetadata` field to Output model:
- JSON field for storing generation details (model, parameters, timestamps)
- Unique constraint on `[projectId, platform]` to prevent duplicates
- Maintains existing relationships and indexes

## Architecture Considerations

### Future Integration Points

The implementation includes several considerations for future stages:

1. **Stage 4 (Editor & Preview)**:
   - Output model includes `isEdited` flag for tracking user modifications
   - Generated content is stored in database for later editing
   - Content validation is in place for edited content

2. **Stage 5+ (Monetization)**:
   - Integration with quota system for usage tracking
   - Generation metadata includes model and parameter tracking
   - Rate limiting capabilities built into the service layer

3. **Analytics**:
   - Generation metadata includes model, parameters, and timestamps
   - Success/failure tracking is implemented
   - Validation result tracking is included

### Security Measures

- Content sanitization to prevent XSS attacks
- Input validation for platform limits
- Authentication and authorization for all API endpoints
- Safe handling of API keys with environment variables

### Performance Optimizations

- Parallel processing for multiple platforms
- Efficient database queries with proper indexing
- Lazy initialization of OpenAI client
- Caching considerations built into the architecture

## Dependencies Added

- `openai`: OpenAI API client for content generation

## Configuration

The implementation requires the following environment variable:
- `OPENAI_API_KEY`: API key for OpenAI services

## Testing

While not explicitly implemented in this stage, the architecture is designed to support:
- Unit tests for service functions
- Integration tests for API endpoints
- Component tests for UI elements

## Error Handling

The implementation includes comprehensive error handling:
- API error responses with appropriate status codes
- Client-side error display
- Server-side logging of errors
- Graceful degradation when OpenAI API is unavailable

## Conclusion

Stage 3 successfully implements the core AI functionality of the content repurposing tool, providing users with the ability to transform content across multiple platforms. The implementation follows best practices for security, performance, and maintainability while preparing the foundation for future stages.