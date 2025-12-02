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

type Student = {
    id: string;
    name: string;
    roll_no: string;
};

type AttendanceStatus = "Present" | "Absent";

export default function AttendancePage() {
    const params = useParams();
    const router = useRouter();
    const subject_id = params.subject_id as string;

    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchStudents = async () => {
            if (!subject_id) return;

            try {
                // 0. Auth Check
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) {
                    router.push("/teacher/login");
                    return;
                }

                // Fetch enrollments and join with students table
                // We need to explicitly select the fields we want from the joined table
                const { data, error } = await supabase
                    .from("enrollments")
                    .select(`
            student_id,
            students (
              id,
              name,
              roll_no
            )
          `)
                    .eq("subject_id", subject_id);

                if (error) {
                    console.error("Error fetching students:", error);
                    alert("Failed to fetch students");
                    return;
                }

                if (data) {
                    // Transform data to a flat array of students
                    // Supabase returns the joined data as an object (or array of objects)
                    // We need to handle the case where 'students' might be null or an array (though it should be a single object here due to FK)
                    const formattedStudents: Student[] = data
                        .map((item: any) => {
                            const studentData = item.students;
                            // Check if studentData exists (it should, but good to be safe)
                            if (!studentData) return null;

                            // Handle if it's an array (unlikely with this schema but possible with some join types)
                            const student = Array.isArray(studentData) ? studentData[0] : studentData;

                            return {
                                id: student.id,
                                name: student.name,
                                roll_no: student.roll_no,
                            };
                        })
                        .filter((s): s is Student => s !== null); // Filter out any nulls

                    setStudents(formattedStudents);

                    // Initialize attendance state (default to Present)
                    const initialAttendance: Record<string, AttendanceStatus> = {};
                    formattedStudents.forEach((student) => {
                        initialAttendance[student.id] = "Present";
                    });
                    setAttendance(initialAttendance);
                }
            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [subject_id]);

    const toggleAttendance = (studentId: string) => {
        setAttendance((prev) => ({
            ...prev,
            [studentId]: prev[studentId] === "Present" ? "Absent" : "Present",
        }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        const attendanceRecords = students.map((student) => ({
            subject_id,
            student_id: student.id,
            date,
            status: attendance[student.id],
        }));

        try {
            const { error } = await supabase
                .from("attendance")
                .insert(attendanceRecords);

            if (error) {
                console.error("Error submitting attendance:", error);
                alert("Failed to submit attendance: " + error.message);
            } else {
                alert("Attendance submitted successfully!");
                router.push("/teacher");
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            alert("An unexpected error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8">Loading students...</div>;
    }

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Mark Attendance</CardTitle>
                    <div className="text-sm text-gray-500">
                        Date: {new Date().toLocaleDateString()}
                    </div>
                </CardHeader>
                <CardContent>
                    {students.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No students enrolled in this subject.
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border mb-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Roll No</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell>{student.roll_no}</TableCell>
                                                <TableCell className="font-medium">
                                                    {student.name}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant={
                                                            attendance[student.id] === "Present"
                                                                ? "default"
                                                                : "destructive"
                                                        }
                                                        size="sm"
                                                        className="w-24"
                                                        onClick={() => toggleAttendance(student.id)}
                                                    >
                                                        {attendance[student.id]}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex justify-end gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? "Submitting..." : "Submit Attendance"}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
