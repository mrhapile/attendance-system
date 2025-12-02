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

export default function AdminLeavePage() {
    const router = useRouter();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [filteredLeaves, setFilteredLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    useEffect(() => {
        const fetchLeaves = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/admin/login");
                return;
            }

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
            else {
                setLeaves(data || []);
                setFilteredLeaves(data || []);
            }
            setLoading(false);
        };

        fetchLeaves();
    }, [router]);

    useEffect(() => {
        let result = leaves;

        if (search) {
            result = result.filter(l =>
                l.students?.name.toLowerCase().includes(search.toLowerCase()) ||
                l.students?.roll_no.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (statusFilter !== "All") {
            result = result.filter(l => l.status === statusFilter);
        }

        setFilteredLeaves(result);
    }, [search, statusFilter, leaves]);

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
                <h1 className="text-3xl font-bold">All Leave Records</h1>
                <Button variant="outline" onClick={() => router.push("/admin")}>Dashboard</Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Leave History</CardTitle>
                        <div className="flex gap-4">
                            <Input
                                placeholder="Search student..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-64"
                            />
                            <select
                                className="flex h-10 w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredLeaves.length === 0 ? (
                        <p className="text-gray-500">No leave records found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Teacher Note</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLeaves.map((leave) => (
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
