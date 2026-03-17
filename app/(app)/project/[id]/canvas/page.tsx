"use client";

import { useParams } from "next/navigation";
import { ProcessCanvas } from "@/components/canvas/ProcessCanvas";

export default function CanvasPage() {
    const params = useParams();
    const projectId = params.id as string;

    return <ProcessCanvas projectId={projectId} />;
}
