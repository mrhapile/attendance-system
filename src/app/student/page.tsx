"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/auth/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Student = {
    id: string;
    name: string;
    roll_no: string;
    year: number;
};

type Subject = {
    id: string;
    name: string;
};

type AttendanceRecord = {
    subject_id: string;
    status: "Present" | "Absent";
};

type SubjectStats = {
    subjectId: string;
    subjectName: string;
    totalClasses: number;
    attendedClasses: number;
    percentage: number;
    message: string;
    statusColor: string;
};

export default function StudentDashboard() {
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [stats, setStats] = useState<SubjectStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get logged-in user
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    console.error("Auth error:", authError);
                    router.push("/student/login");
                    return;
                }

                // 2. Fetch student details
                const { data: studentData, error: studentError } = await supabase
                    .from("students")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (studentError) {
                    console.error("Error fetching student:", studentError);
                } else {
                    setStudent(studentData);
                }

                // 3. Fetch enrolled subjects
                const { data: enrollmentsData, error: enrollmentsError } = await supabase
                    .from("enrollments")
                    .select(`
            subject_id,
            subjects (
              id,
              name
            )
          `)
                    .eq("student_id", user.id);

                if (enrollmentsError) {
                    console.error("Error fetching enrollments:", enrollmentsError);
                    return;
                }

                // 4. Fetch attendance records for this student
                const { data: attendanceData, error: attendanceError } = await supabase
                    .from("attendance")
                    .select("subject_id, status")
                    .eq("student_id", user.id);

                if (attendanceError) {
                    console.error("Error fetching attendance:", attendanceError);
                    return;
                }

                // 5. Calculate Stats
                if (enrollmentsData && attendanceData) {
                    const calculatedStats: SubjectStats[] = enrollmentsData.map((enrollment: any) => {
                        const subject = enrollment.subjects;
                        const subjectId = subject.id;
                        const subjectName = subject.name;

                        // Filter attendance for this subject
                        const subjectAttendance = attendanceData.filter(
                            (record: AttendanceRecord) => record.subject_id === subjectId
                        );

                        const totalClasses = subjectAttendance.length;
                        const attendedClasses = subjectAttendance.filter(
                            (record) => record.status === "Present"
                        ).length;

                        let percentage = 0;
                        if (totalClasses > 0) {
                            percentage = (attendedClasses / totalClasses) * 100;
                        }

                        // 75% Rule Logic
                        let message = "";
                        let statusColor = "text-gray-900";

                        if (totalClasses === 0) {
                            message = "No attendance recorded yet.";
                            statusColor = "text-gray-500";
                        } else if (percentage < 75) {
                            // Shortfall: required = ceil((0.75 * total) - attended)
                            const required = Math.ceil((0.75 * totalClasses) - attendedClasses);
                            message = `You are short by ${required} classes.`;
                            statusColor = "text-red-600";
                        } else {
                            // Surplus: safe_leaves = attended - (0.75 * total)
                            // We use floor because you can't take a partial leave safely without dropping below, 
                            // but strictly speaking, if you are exactly 75%, you have 0 safe leaves.
                            const safeLeaves = Math.floor(attendedClasses - (0.75 * totalClasses));
                            message = `You can safely skip ${safeLeaves} classes.`;
                            statusColor = "text-green-600";
                        }

                        return {
                            subjectId,
                            subjectName,
                            totalClasses,
                            attendedClasses,
                            percentage,
                            message,
                            statusColor,
                        };
                    });

                    setStats(calculatedStats);
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
                    <h1 className="text-3xl font-bold">Student Dashboard</h1>
                    {student && (
                        <div className="text-lg">
                            Welcome, {student.name} ({student.roll_no})
                        </div>
                    )}
                </div>
                <LogoutButton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.length === 0 ? (
                    <p className="text-gray-500 col-span-full">You are not enrolled in any subjects.</p>
                ) : (
                    stats.map((stat) => (
                        <Card key={stat.subjectId} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle>{stat.subjectName}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="text-4xl font-bold">
                                            {stat.percentage.toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {stat.attendedClasses} / {stat.totalClasses} Attended
                                        </div>
                                    </div>

                                    <div className={`text-sm font-medium ${stat.statusColor}`}>
                                        {stat.message}
                                    </div>

                                    {/* Simple Progress Bar Visual */}
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                        <div
                                            className={`h-2.5 rounded-full ${stat.percentage < 75 ? 'bg-red-600' : 'bg-green-600'}`}
                                            style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
