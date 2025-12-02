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
import { createSubject, deleteSubject } from "@/app/actions/admin-actions";

type Subject = {
    id: string;
    name: string;
    teacher_id: string;
    teachers: {
        name: string;
    };
};

type Teacher = {
    id: string;
    name: string;
};

export default function AdminSubjectsPage() {
    const router = useRouter();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: subjectsData } = await supabase
            .from("subjects")
            .select(`
        id,
        name,
        teacher_id,
        teachers (
            name
        )
      `)
            .order("name", { ascending: true });

        const { data: teachersData } = await supabase.from("teachers").select("id, name");

        const formattedSubjects: Subject[] = (subjectsData || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            teacher_id: item.teacher_id,
            teachers: Array.isArray(item.teachers) ? item.teachers[0] : item.teachers,
        }));

        setSubjects(formattedSubjects);
        setTeachers(teachersData || []);
        setLoading(false);
    };

    const handleCreate = async (formData: FormData) => {
        setIsSubmitting(true);
        const result = await createSubject(formData);
        setIsSubmitting(false);

        if (result.success) {
            alert(result.message);
            fetchData();
            (document.getElementById("create-subject-form") as HTMLFormElement).reset();
        } else {
            alert("Error: " + result.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this subject?")) return;

        const result = await deleteSubject(id);
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
                <h1 className="text-3xl font-bold">Manage Subjects</h1>
                <Button variant="outline" onClick={() => router.back()}>Back</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Add New Subject</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form id="create-subject-form" action={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Subject Name</label>
                                <Input name="name" required placeholder="Data Structures" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Assign Teacher</label>
                                <select
                                    name="teacher_id"
                                    required
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select a Teacher</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Subject"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>All Subjects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject Name</TableHead>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subjects.map((subject) => (
                                    <TableRow key={subject.id}>
                                        <TableCell className="font-medium">{subject.name}</TableCell>
                                        <TableCell>{subject.teachers?.name || "Unassigned"}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(subject.id)}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
