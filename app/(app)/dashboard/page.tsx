"use client";

import { db } from "@/lib/instantdb";
import { id, tx } from "@instantdb/react";
import { ProjectCard } from "@/components/project/ProjectCard";
import { CreateProjectDialog } from "@/components/project/CreateProjectDialog";
import { FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const { user } = db.useAuth();
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);

    // Get or create workspace for user
    const { data } = db.useQuery({ workspaces: {} });

    useEffect(() => {
        if (!user || !data) return;

        const userWorkspace = data.workspaces.find(
            (w: any) => w.ownerId === user.id
        );

        if (userWorkspace) {
            setWorkspaceId(userWorkspace.id);
        } else {
            // Create default workspace
            const newId = id();
            db.transact(
                tx.workspaces[newId].update({
                    name: "My Workspace",
                    ownerId: user.id,
                    createdAt: Date.now(),
                })
            );
            setWorkspaceId(newId);
        }
    }, [user, data]);

    // Query projects for this workspace
    const { data: projectsData } = db.useQuery(
        workspaceId
            ? { projects: { $: { where: { workspaceId } } } }
            : { projects: { $: { where: { workspaceId: "__none__" } } } }
    );

    const projects = projectsData?.projects || [];

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage your engineering projects
                    </p>
                </div>
                {workspaceId && <CreateProjectDialog workspaceId={workspaceId} />}
            </div>

            {/* Projects Grid */}
            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project: any) => (
                        <ProjectCard
                            key={project.id}
                            id={project.id}
                            name={project.name}
                            description={project.description}
                            status={project.status}
                            createdAt={project.createdAt}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                        <FlaskConical className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No projects yet</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                        Create your first engineering project to start designing process
                        systems on the canvas.
                    </p>
                    {workspaceId && <CreateProjectDialog workspaceId={workspaceId} />}
                </div>
            )}
        </div>
    );
}
