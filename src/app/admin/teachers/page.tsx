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
import { createTeacher, deleteTeacher } from "@/app/actions/admin-actions";

type Teacher = {
    id: string;
    name: string;
    email: string;
};

export default function AdminTeachersPage() {
    const router = useRouter();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        const { data, error } = await supabase.from("teachers").select("*");
        if (error) console.error(error);
        else setTeachers(data || []);
        setLoading(false);
    };

    const handleCreate = async (formData: FormData) => {
        setIsSubmitting(true);
        const result = await createTeacher(formData);
        setIsSubmitting(false);

        if (result.success) {
            alert(result.message);
            fetchTeachers(); // Refresh list
            // Reset form? We might need a ref for the form to reset it.
            (document.getElementById("create-teacher-form") as HTMLFormElement).reset();
        } else {
            alert("Error: " + result.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this teacher?")) return;

        const result = await deleteTeacher(id);
        if (result.success) {
            alert(result.message);
            fetchTeachers();
        } else {
            alert("Error: " + result.message);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manage Teachers</h1>
                <Button variant="outline" onClick={() => router.back()}>Back</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Add New Teacher</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form id="create-teacher-form" action={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <Input name="name" required placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <Input name="email" type="email" required placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Password</label>
                                <Input name="password" type="password" required placeholder="******" minLength={6} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Teacher"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>All Teachers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachers.map((teacher) => (
                                    <TableRow key={teacher.id}>
                                        <TableCell className="font-medium">{teacher.name}</TableCell>
                                        <TableCell>{teacher.email}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(teacher.id)}
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
