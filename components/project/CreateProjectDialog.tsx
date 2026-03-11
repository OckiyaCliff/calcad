"use client";

import { useState } from "react";
import { db } from "@/lib/instantdb";
import { id, tx } from "@instantdb/react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export function CreateProjectDialog({
    workspaceId,
}: {
    workspaceId: string;
}) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleCreate = () => {
        if (!name.trim()) return;
        const projectId = id();
        db.transact(
            tx.projects[projectId].update({
                name: name.trim(),
                description: description.trim(),
                status: "draft",
                createdAt: Date.now(),
                workspaceId,
            })
        );
        setName("");
        setDescription("");
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Ethanol Distillation Design"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of this engineering project..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <Button onClick={handleCreate} className="w-full">
                        Create Project
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
