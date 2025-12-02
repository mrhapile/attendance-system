"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Teacher = {
    id: string;
    name: string;
    email: string;
};

type Subject = {
    id: string;
    name: string;
    teacher_id: string;
};

export default function TeacherDashboard() {
    const router = useRouter();
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get logged-in user
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    console.error("Auth error:", authError);
                    router.push("/teacher/login");
                    return;
                }

                // 2. Fetch teacher details
                const { data: teacherData, error: teacherError } = await supabase
                    .from("teachers")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (teacherError) {
                    console.error("Error fetching teacher:", teacherError);
                } else {
                    setTeacher(teacherData);
                }

                // 3. Fetch subjects for this teacher
                const { data: subjectsData, error: subjectsError } = await supabase
                    .from("subjects")
                    .select("*")
                    .eq("teacher_id", user.id);

                if (subjectsError) {
                    console.error("Error fetching subjects:", subjectsError);
                } else {
                    setSubjects(subjectsData || []);
                }

            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
                    {teacher && <p className="text-gray-600">Welcome, {teacher.name}</p>}
                </div>
                <div className="flex gap-2 items-center">
                    <Link href="/teacher/leave">
                        <Button variant="outline">View Leave Requests</Button>
                    </Link>
                    <LogoutButton />
                </div>
            </div>

            <h2 className="text-xl font-semibold mb-4">Your Subjects</h2>

            {subjects.length === 0 ? (
                <p className="text-gray-500">No subjects assigned yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map((subject) => (
                        <Card key={subject.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>{subject.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                <Link href={`/teacher/attendance/${subject.id}`}>
                                    <Button className="w-full">Take Attendance</Button>
                                </Link>
                                <Link href={`/teacher/attendance/history/${subject.id}`}>
                                    <Button variant="outline" className="w-full">View History</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
