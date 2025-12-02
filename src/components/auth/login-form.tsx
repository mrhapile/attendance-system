"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginFormProps {
    redirectTo: string;
    userType: "Teacher" | "Student" | "Admin";
}

export default function LoginForm({ redirectTo, userType }: LoginFormProps) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }

            if (authData.user) {
                const userId = authData.user.id;

                if (userType === "Teacher") {
                    // Check if Admin
                    const { data: admin } = await supabase.from("admins").select("id").eq("id", userId).single();
                    if (admin) {
                        await supabase.auth.signOut();
                        setError("You are an Admin. Please use Admin Login.");
                        setLoading(false);
                        return;
                    }
                    // Check if Teacher
                    const { data: teacher } = await supabase.from("teachers").select("id").eq("id", userId).single();
                    if (!teacher) {
                        await supabase.auth.signOut();
                        setError("You are not registered as a teacher.");
                        setLoading(false);
                        return;
                    }
                } else if (userType === "Student") {
                    // Check if Admin
                    const { data: admin } = await supabase.from("admins").select("id").eq("id", userId).single();
                    if (admin) {
                        await supabase.auth.signOut();
                        setError("Admins cannot log in here. Please use Admin Login.");
                        setLoading(false);
                        return;
                    }
                    // Check if Student
                    const { data: student } = await supabase.from("students").select("id").eq("id", userId).single();
                    if (!student) {
                        await supabase.auth.signOut();
                        setError("You are not registered as a student.");
                        setLoading(false);
                        return;
                    }
                } else if (userType === "Admin") {
                    // Check if Admin
                    const { data: admin } = await supabase.from("admins").select("id").eq("id", userId).single();
                    if (!admin) {
                        await supabase.auth.signOut();
                        setError("You are not an admin.");
                        setLoading(false);
                        return;
                    }
                }

                router.push(redirectTo);
            }
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        {userType} Login
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <Input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Signing In..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
