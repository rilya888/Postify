import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Play } from "lucide-react";
import { DashboardActions } from "@/components/dashboard/dashboard-actions";
import { PlanBadge } from "@/components/subscription/plan-badge";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your content repurposing dashboard",
};

/**
 * Dashboard page showing user statistics and recent activity
 */
export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Fetch user stats
  const [projectsCount, recentProjects] = await Promise.all([
    prisma.project.count({
      where: { userId: session.user.id },
    }),
    prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        outputs: {
          select: {
            platform: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Your content DNA, one place.</p>
          </div>
          <PlanBadge />
        </div>
        <DashboardActions />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentProjects.filter(p => p.outputs.length > 0).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Generated Outputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentProjects.reduce((acc, project) => acc + project.outputs.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors gap-2"
                >
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="font-medium">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {project.outputs.map((output) => (
                      <Badge key={output.platform} variant="secondary">
                        {output.platform}
                      </Badge>
                    ))}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/projects/${project.id}/generate`}>
                        <Play className="h-4 w-4 mr-1" aria-hidden />
                        Generate
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No projects yet. Create your first project!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}