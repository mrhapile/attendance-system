"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type Leave = {
    id: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: "Pending" | "Approved" | "Rejected";
    teacher_note: string;
};

export default function StudentLeaveHistoryPage() {
    const router = useRouter();
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaves = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/student/login");
                return;
            }

            const { data, error } = await supabase
                .from("leaves")
                .select("*")
                .eq("student_id", user.id)
                .order("created_at", { ascending: false });

            if (error) console.error(error);
            else setLeaves(data || []);
            setLoading(false);
        };

        fetchLeaves();
    }, [router]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Approved":
                return <Badge variant="success">Approved</Badge>;
            case "Rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="warning">Pending</Badge>;
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Leave History</h1>
                <div className="flex gap-2">
                    <Link href="/student/leave/apply">
                        <Button>Apply for Leave</Button>
                    </Link>
                    <Button variant="outline" onClick={() => router.push("/student")}>Dashboard</Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Leave Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {leaves.length === 0 ? (
                        <p className="text-gray-500">No leave requests found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dates</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Teacher Note</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaves.map((leave) => (
                                    <TableRow key={leave.id}>
                                        <TableCell>
                                            {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate" title={leave.reason}>
                                            {leave.reason}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(leave.status)}</TableCell>
                                        <TableCell className="text-gray-500 italic">
                                            {leave.teacher_note || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
