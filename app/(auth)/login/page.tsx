"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/instantdb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlaskConical, Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [sentTo, setSentTo] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();
    const { user, isLoading: authLoading } = db.useAuth();

    // Auto-redirect if user is already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.push("/dashboard");
        }
    }, [user, authLoading, router]);

    // Normalize email: trim and lowercase
    const normalizeEmail = (e: string) => e.trim().toLowerCase();

    const handleSendCode = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const cleanEmail = normalizeEmail(email);
        if (!cleanEmail) {
            setError("Please enter a valid email address.");
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            await db.auth.sendMagicCode({ email: cleanEmail });
            setSentTo(cleanEmail);
            setOtp(["", "", "", "", "", ""]);
        } catch (err: any) {
            console.error("Auth Error:", err);
            setError(err?.body?.message || "Failed to send code. Please verify your connection or App ID.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const code = otp.join("");
        if (code.length !== 6) {
            setError("Please enter the full 6-digit code.");
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            // CRITICAL: Must use EXACTLY the same normalized email as used in sendMagicCode
            await db.auth.signInWithMagicCode({
                email: sentTo,
                code: code.trim()
            });
            setIsSuccess(true);
            // Imperative redirect for immediate transition
            router.push("/dashboard");
        } catch (err: any) {
            console.error("Verification Error:", err);
            setError(err?.body?.message || "Invalid or expired code. Please try again.");
            // Reset OTP on error to let user retry clearly
            setOtp(["", "", "", "", "", ""]);
            otpRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const pastedData = value.substring(0, 6).split("").filter(c => /\d/.test(c));
            const newOtp = [...otp];
            pastedData.forEach((char, i) => {
                if (index + i < 6) newOtp[index + i] = char;
            });
            setOtp(newOtp);
            // Focus last filled or next empty
            const nextIdx = Math.min(index + (pastedData.length || 1), 5);
            otpRefs.current[nextIdx]?.focus();
            return;
        }

        // Only allow digits
        if (value && !/\d/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    // Auto-submit OTP when full
    useEffect(() => {
        if (otp.join("").length === 6 && !isLoading && sentTo && !isSuccess) {
            handleVerifyCode();
        }
    }, [otp]);

    return (
        <div className="min-h-screen flex items-center justify-center engine-gradient relative overflow-hidden font-sans">
            {/* Background enhancement */}
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />

            {/* Floating particles (CSS only) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-primary/10 blur-xl animate-pulse"
                        style={{
                            width: `${Math.random() * 300 + 100}px`,
                            height: `${Math.random() * 300 + 100}px`,
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${i * 2}s`,
                            animationDuration: `${Math.random() * 10 + 10}s`
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Header Section */}
                <div className="text-center mb-10 transition-all duration-500">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 shadow-xl shadow-primary/5 mb-6 group">
                        {isSuccess ? (
                            <CheckCircle2 className="w-8 h-8 text-green-500 animate-in zoom-in duration-300" />
                        ) : (
                            <FlaskConical className={cn(
                                "w-8 h-8 text-primary transition-transform duration-700",
                                (isLoading || authLoading) ? "animate-spin" : "group-hover:rotate-12"
                            )} />
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                        ProcessLab
                    </h1>
                    <p className="text-blue-200/60 font-medium tracking-wide text-xs uppercase">
                        Engineering Intelligence Platform
                    </p>
                </div>

                {/* Main Card */}
                <div className="glass-dark border border-white/5 bg-black/40 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative overflow-hidden">
                    {/* Progress indicator during loading */}
                    {(isLoading || authLoading) && (
                        <div className="absolute top-0 left-0 w-full h-1 overflow-hidden">
                            <div className="h-full bg-primary animate-progress-indefinite w-1/3" />
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-white">
                                {isSuccess ? "Access Granted" : sentTo ? "Verify Identity" : "Welcome Engineer"}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-2 px-4">
                                {isSuccess
                                    ? "Redirecting to your workspace..."
                                    : sentTo
                                        ? `Enter the 6-digit code sent to ${sentTo}`
                                        : "Initialize secure session to access your models."}
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        {isSuccess ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            </div>
                        ) : !sentTo ? (
                            /* Step 1: Email Form */
                            <form onSubmit={handleSendCode} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <Input
                                            type="email"
                                            placeholder="engineer@processlab.ai"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={isLoading || authLoading}
                                            className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading || authLoading || !email}
                                    className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Authenticating...
                                        </>
                                    ) : (
                                        <>
                                            Get Login Code
                                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        ) : (
                            /* Step 2: OTP Form */
                            <form onSubmit={handleVerifyCode} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between gap-2 sm:gap-3">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { otpRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            pattern="\d{1}"
                                            maxLength={6} // Allow paste for first one
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(i, e)}
                                            disabled={isLoading}
                                            className="w-full h-14 sm:h-16 text-center text-2xl font-bold bg-white/5 border-2 border-white/10 text-white rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-white/5"
                                            placeholder="-"
                                        />
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <Button
                                        type="button"
                                        onClick={handleVerifyCode}
                                        disabled={isLoading || otp.join("").length < 6}
                                        className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            "Verify & Launch"
                                        )}
                                    </Button>

                                    <div className="flex items-center justify-between px-1">
                                        <button
                                            type="button"
                                            onClick={() => setSentTo("")}
                                            className="text-xs text-muted-foreground hover:text-white transition-colors underline underline-offset-4"
                                            disabled={isLoading}
                                        >
                                            Change email
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSendCode}
                                            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5"
                                            disabled={isLoading}
                                        >
                                            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
                                            Resend code
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
                    System Version: 1.0.4-MVP
                </div>
            </div>
        </div>
    );
}
