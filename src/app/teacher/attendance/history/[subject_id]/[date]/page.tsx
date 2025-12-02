"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type AttendanceDetail = {
    id: string;
    status: "Present" | "Absent";
    student: {
        name: string;
        roll_no: string;
    };
};

export default function AttendanceDateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const subject_id = params.subject_id as string;
    const date = params.date as string;

    const [records, setRecords] = useState<AttendanceDetail[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Auth Check
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) {
                    router.push("/teacher/login");
                    return;
                }

                // Fetch attendance for specific date and subject, join with students
                const { data, error } = await supabase
                    .from("attendance")
                    .select(`
            id,
            status,
            students (
              name,
              roll_no
            )
          `)
                    .eq("subject_id", subject_id)
                    .eq("date", date);

                if (error) {
                    console.error("Error fetching details:", error);
                    return;
                }

                if (data) {
                    const formattedRecords: AttendanceDetail[] = data.map((item: any) => ({
                        id: item.id,
                        status: item.status,
                        student: item.students, // Supabase returns object for single relation
                    }));
                    setRecords(formattedRecords);
                }

            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [subject_id, date, router]);

    if (loading) {
        return <div className="p-8">Loading details...</div>;
    }

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Attendance Details</h1>
                    <p className="text-gray-500 mt-1">
                        Date: {new Date(date).toLocaleDateString()}
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    Back
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Roll No</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>{record.student.roll_no}</TableCell>
                                    <TableCell className="font-medium">
                                        {record.student.name}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span
                                            className={`px-2 py-1 rounded text-sm font-medium ${record.status === "Present"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {record.status}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
