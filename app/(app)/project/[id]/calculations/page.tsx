"use client";

export default function CalculationsPage() {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Calculations</h1>
            <p className="text-muted-foreground text-sm mb-8">
                View and manage engineering calculations for this project.
            </p>
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl">📐</span>
                </div>
                <h3 className="text-lg font-semibold mb-1">Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    The calculation workspace will allow you to create standalone
                    engineering calculations with variables, equations, and unit-aware
                    math.
                </p>
            </div>
        </div>
    );
}
