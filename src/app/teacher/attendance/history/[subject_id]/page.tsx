"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AttendanceRecord = {
    id: string;
    date: string;
    status: "Present" | "Absent";
};

type DateSummary = {
    date: string;
    totalPresent: number;
    totalAbsent: number;
};

export default function AttendanceHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const subject_id = params.subject_id as string;

    const [history, setHistory] = useState<DateSummary[]>([]);
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

                // Fetch all attendance records for this subject
                const { data, error } = await supabase
                    .from("attendance")
                    .select("date, status")
                    .eq("subject_id", subject_id)
                    .order("date", { ascending: false });

                if (error) {
                    console.error("Error fetching history:", error);
                    return;
                }

                if (data) {
                    // Group by date
                    const grouped: Record<string, DateSummary> = {};

                    data.forEach((record: any) => {
                        const date = record.date;
                        if (!grouped[date]) {
                            grouped[date] = { date, totalPresent: 0, totalAbsent: 0 };
                        }
                        if (record.status === "Present") {
                            grouped[date].totalPresent++;
                        } else {
                            grouped[date].totalAbsent++;
                        }
                    });

                    setHistory(Object.values(grouped));
                }

            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [subject_id, router]);

    const handleExportExcel = async () => {
        try {
            const { data, error } = await supabase
                .from("attendance")
                .select(`
          date,
          status,
          students (
            name,
            roll_no
          )
        `)
                .eq("subject_id", subject_id)
                .order("date", { ascending: false });

            if (error || !data) {
                alert("Failed to fetch data for export");
                return;
            }

            const formattedData = data.map((item: any) => ({
                Date: item.date,
                "Roll No": item.students.roll_no,
                "Student Name": item.students.name,
                Status: item.status,
            }));

            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
            XLSX.writeFile(workbook, `attendance_${subject_id}.xlsx`);
        } catch (err) {
            console.error("Export error:", err);
            alert("Failed to export Excel");
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        const tableData = history.map((item) => [
            item.date,
            item.totalPresent,
            item.totalAbsent,
        ]);

        autoTable(doc, {
            head: [["Date", "Present Count", "Absent Count"]],
            body: tableData,
        });

        doc.save(`attendance_summary_${subject_id}.pdf`);
    };

    if (loading) {
        return <div className="p-8">Loading history...</div>;
    }

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Attendance History</h1>
                <div className="flex gap-2">
                    <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
                        Export Excel
                    </Button>
                    <Button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700">
                        Export PDF
                    </Button>
                    <Button variant="outline" onClick={() => router.back()}>
                        Back
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {history.length === 0 ? (
                    <p className="text-gray-500">No attendance records found.</p>
                ) : (
                    history.map((item) => (
                        <Card key={item.date} className="hover:shadow-md transition-shadow">
                            <CardContent className="flex items-center justify-between p-6">
                                <div>
                                    <div className="text-xl font-semibold">
                                        {new Date(item.date).toLocaleDateString()}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        <span className="text-green-600 font-medium">
                                            Present: {item.totalPresent}
                                        </span>
                                        <span className="mx-2">|</span>
                                        <span className="text-red-600 font-medium">
                                            Absent: {item.totalAbsent}
                                        </span>
                                    </div>
                                </div>
                                <Link href={`/teacher/attendance/history/${subject_id}/${item.date}`}>
                                    <Button variant="secondary">View Details</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
