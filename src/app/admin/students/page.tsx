"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { createStudent, deleteStudent } from "@/app/actions/admin-actions";

type Student = {
    id: string;
    name: string;
    email: string;
    roll_no: string;
    year: number;
};

export default function AdminStudentsPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        const { data, error } = await supabase.from("students").select("*").order("roll_no", { ascending: true });
        if (error) console.error(error);
        else setStudents(data || []);
        setLoading(false);
    };

    const handleCreate = async (formData: FormData) => {
        setIsSubmitting(true);
        const result = await createStudent(formData);
        setIsSubmitting(false);

        if (result.success) {
            alert(result.message);
            fetchStudents();
            (document.getElementById("create-student-form") as HTMLFormElement).reset();
        } else {
            alert("Error: " + result.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this student?")) return;

        const result = await deleteStudent(id);
        if (result.success) {
            alert(result.message);
            fetchStudents();
        } else {
            alert("Error: " + result.message);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manage Students</h1>
                <Button variant="outline" onClick={() => router.back()}>Back</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Add New Student</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form id="create-student-form" action={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <Input name="name" required placeholder="Jane Doe" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Roll No</label>
                                <Input name="roll_no" required placeholder="CS-2024-001" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Year</label>
                                <Input name="year" type="number" required placeholder="1" min={1} max={4} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <Input name="email" type="email" required placeholder="jane@example.com" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Password</label>
                                <Input name="password" type="password" required placeholder="******" minLength={6} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Student"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>All Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Roll No</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Year</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>{student.roll_no}</TableCell>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell>{student.year}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(student.id)}
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
