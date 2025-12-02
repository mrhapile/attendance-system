"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { createEnrollment, deleteEnrollment } from "@/app/actions/admin-actions";

type Enrollment = {
    id: string;
    students: {
        name: string;
        roll_no: string;
    };
    subjects: {
        name: string;
    };
};

type Student = {
    id: string;
    name: string;
    roll_no: string;
};

type Subject = {
    id: string;
    name: string;
};

export default function AdminEnrollmentsPage() {
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: enrollmentsData } = await supabase
            .from("enrollments")
            .select(`
        id,
        students (
            name,
            roll_no
        ),
        subjects (
            name
        )
      `)
            .order("id", { ascending: false }); // Ideally order by created_at if available

        const { data: studentsData } = await supabase.from("students").select("id, name, roll_no").order("roll_no");
        const { data: subjectsData } = await supabase.from("subjects").select("id, name").order("name");

        // Cast or map the data to match the type
        const formattedEnrollments: Enrollment[] = (enrollmentsData || []).map((item: any) => ({
            id: item.id,
            students: Array.isArray(item.students) ? item.students[0] : item.students,
            subjects: Array.isArray(item.subjects) ? item.subjects[0] : item.subjects,
        }));

        setEnrollments(formattedEnrollments);
        setStudents(studentsData || []);
        setSubjects(subjectsData || []);
        setLoading(false);
    };

    const handleCreate = async (formData: FormData) => {
        setIsSubmitting(true);
        const result = await createEnrollment(formData);
        setIsSubmitting(false);

        if (result.success) {
            alert(result.message);
            fetchData();
            (document.getElementById("create-enrollment-form") as HTMLFormElement).reset();
        } else {
            alert("Error: " + result.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this enrollment?")) return;

        const result = await deleteEnrollment(id);
        if (result.success) {
            alert(result.message);
            fetchData();
        } else {
            alert("Error: " + result.message);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manage Enrollments</h1>
                <Button variant="outline" onClick={() => router.back()}>Back</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Enroll Student</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form id="create-enrollment-form" action={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Select Student</label>
                                <select
                                    name="student_id"
                                    required
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select a Student</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.roll_no} - {s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Select Subject</label>
                                <select
                                    name="subject_id"
                                    required
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select a Subject</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Enrolling..." : "Enroll Student"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Current Enrollments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {enrollments.map((enrollment) => (
                                        <TableRow key={enrollment.id}>
                                            <TableCell>
                                                <div className="font-medium">{enrollment.students?.name}</div>
                                                <div className="text-xs text-gray-500">{enrollment.students?.roll_no}</div>
                                            </TableCell>
                                            <TableCell>{enrollment.subjects?.name}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(enrollment.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
