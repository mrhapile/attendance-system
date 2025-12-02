"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type LeaveRequest = {
    id: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: "Pending" | "Approved" | "Rejected";
    teacher_note: string;
    students: {
        name: string;
        roll_no: string;
    };
};

export default function TeacherLeavePage() {
    const router = useRouter();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchLeaves = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/teacher/login");
                return;
            }

            // Fetch all leaves for now (simplified logic as per plan)
            // In a real app, we'd filter by students enrolled in this teacher's subjects
            const { data, error } = await supabase
                .from("leaves")
                .select(`
          *,
          students (
            name,
            roll_no
          )
        `)
                .order("created_at", { ascending: false });

            if (error) console.error(error);
            else setLeaves(data || []);
            setLoading(false);
        };

        fetchLeaves();
    }, [router]);

    const handleUpdateStatus = async (id: string, status: "Approved" | "Rejected") => {
        const note = notes[id] || "";

        const { error } = await supabase
            .from("leaves")
            .update({ status, teacher_note: note })
            .eq("id", id);

        if (error) {
            alert("Error updating status");
        } else {
            // Update local state
            setLeaves(leaves.map(l => l.id === id ? { ...l, status, teacher_note: note } : l));
        }
    };

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
                <h1 className="text-3xl font-bold">Leave Requests</h1>
                <Button variant="outline" onClick={() => router.push("/teacher")}>Dashboard</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Student Leave Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {leaves.length === 0 ? (
                        <p className="text-gray-500">No leave requests found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Note</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaves.map((leave) => (
                                    <TableRow key={leave.id}>
                                        <TableCell>
                                            <div className="font-medium">{leave.students?.name}</div>
                                            <div className="text-xs text-gray-500">{leave.students?.roll_no}</div>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate" title={leave.reason}>
                                            {leave.reason}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(leave.status)}</TableCell>
                                        <TableCell>
                                            {leave.status === "Pending" ? (
                                                <Input
                                                    placeholder="Add note..."
                                                    value={notes[leave.id] || ""}
                                                    onChange={(e) => setNotes({ ...notes, [leave.id]: e.target.value })}
                                                    className="h-8 w-40"
                                                />
                                            ) : (
                                                <span className="text-gray-500 italic text-sm">{leave.teacher_note}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {leave.status === "Pending" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 h-8"
                                                        onClick={() => handleUpdateStatus(leave.id, "Approved")}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="h-8"
                                                        onClick={() => handleUpdateStatus(leave.id, "Rejected")}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
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
