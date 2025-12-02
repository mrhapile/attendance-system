"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming we have Textarea or I'll use standard textarea
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApplyLeavePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [studentId, setStudentId] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/student/login");
                return;
            }
            setStudentId(user.id);
        };
        checkAuth();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!studentId) return;

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const start_date = formData.get("start_date") as string;
        const end_date = formData.get("end_date") as string;
        const reason = formData.get("reason") as string;

        try {
            const { error } = await supabase
                .from("leaves")
                .insert([
                    {
                        student_id: studentId,
                        start_date,
                        end_date,
                        reason,
                        status: "Pending",
                    },
                ]);

            if (error) throw error;

            alert("Leave application submitted successfully!");
            router.push("/student/leave");
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Apply for Leave</h1>
                <Button variant="outline" onClick={() => router.back()}>Back</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Leave Application Form</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Start Date</label>
                                <Input name="start_date" type="date" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium">End Date</label>
                                <Input name="end_date" type="date" required />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Reason</label>
                            <textarea
                                name="reason"
                                required
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Enter reason for leave..."
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Submitting..." : "Submit Application"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
