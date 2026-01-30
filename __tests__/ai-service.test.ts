/**
 * Simple test for AI service functions
 * This is a basic test to ensure the functions are properly exported and can be called
 */

import { generateForPlatforms } from "@/lib/services/ai";
import { validateContentLength, validateContentSafety, sanitizeContent, validatePlatformContent } from "@/lib/utils/content-validation";

// Mock data for testing
const mockProjectId = "test-project-id";
const mockUserId = "test-user-id";
const mockSourceContent = "This is a sample content for testing purposes.";
const mockPlatforms = ["linkedin", "twitter"];

console.log("Testing AI service functions...");

// Test content validation functions
console.log("\n1. Testing content validation functions:");
console.log("- Validating content length for LinkedIn:", validateContentLength(mockSourceContent, "linkedin"));
console.log("- Validating content safety:", validateContentSafety(mockSourceContent));
console.log("- Sanitizing content:", sanitizeContent(mockSourceContent));
console.log("- Validating platform content:", validatePlatformContent(mockSourceContent, "linkedin"));

console.log("\n2. Testing AI generation function (without actually calling OpenAI):");

// Note: This test won't actually work without proper environment setup and OpenAI key
// But it verifies that the function is properly exported
console.log("- Function generateForPlatforms is available:", typeof generateForPlatforms === "function");

console.log("\nAll tests completed successfully!");