"use client";

import { useState } from "react";
import { db } from "@/lib/instantdb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlaskConical, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [sentTo, setSentTo] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setError("");
        try {
            await db.auth.sendMagicCode({ email });
            setSentTo(email);
        } catch (err: any) {
            setError(err?.body?.message || "Failed to send code. Check your InstantDB app ID.");
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;
        setError("");
        try {
            await db.auth.signInWithMagicCode({ email: sentTo, code });
        } catch (err: any) {
            setError(err?.body?.message || "Invalid code. Please try again.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center engine-gradient relative overflow-hidden">
            {/* Background grid pattern */}
            <div className="absolute inset-0 grid-bg opacity-30" />

            {/* Decorative orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 shadow-lg shadow-primary/10">
                        <FlaskConical className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        ProcessLab
                    </h1>
                </div>

                {/* Card */}
                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-semibold text-foreground">
                            {sentTo ? "Check your email" : "Welcome back"}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {sentTo
                                ? `We sent a code to ${sentTo}`
                                : "Sign in to your engineering workspace"}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {!sentTo ? (
                        <form onSubmit={handleSendCode} className="space-y-4">
                            <div>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="engineer@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-11 bg-background/50 border-border/50"
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-11 font-medium">
                                Continue with Email
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            <Input
                                type="text"
                                placeholder="Enter verification code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="h-11 text-center text-lg tracking-widest bg-background/50 border-border/50"
                                required
                                autoFocus
                            />
                            <Button type="submit" className="w-full h-11 font-medium">
                                Verify & Sign In
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-sm text-muted-foreground"
                                onClick={() => {
                                    setSentTo("");
                                    setCode("");
                                }}
                            >
                                Use a different email
                            </Button>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    Collaborative engineering design platform
                </p>
            </div>
        </div>
    );
}
