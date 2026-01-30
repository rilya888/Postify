import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { generateForPlatforms } from "@/lib/services/ai";
import { prisma } from "@/lib/db/prisma";
import { Logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Parse request body
    const { projectId, platforms, sourceContent, options } = await request.json();

    // Validate required fields
    if (!projectId || !Array.isArray(platforms) || !sourceContent) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: projectId, platforms, sourceContent" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate that project belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      return new Response("Project not found or access denied", { status: 404 });
    }

    // Validate platforms
    const validPlatforms = ["linkedin", "twitter", "email"];
    const invalidPlatforms = platforms.filter((p: string) => !validPlatforms.includes(p));

    if (invalidPlatforms.length > 0) {
      return new Response(
        JSON.stringify({ error: `Invalid platforms: ${invalidPlatforms.join(", ")}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Perform generation
    const result = await generateForPlatforms(
      projectId,
      userId,
      sourceContent,
      platforms,
      options
    );

    // Return results
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    Logger.error("Error in generate API route", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({ 
        error: "Internal server error during content generation",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}