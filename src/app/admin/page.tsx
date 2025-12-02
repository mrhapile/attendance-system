"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/auth/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalSubjects: 0,
        totalClassesHeld: 0,
        averageAttendance: 0,
    });
    const [chartData, setChartData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Auth Check
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) {
                    router.push("/admin/login");
                    return;
                }

                // 2. Verify Admin Role
                const { data: adminData, error: adminError } = await supabase
                    .from("admins")
                    .select("id")
                    .eq("id", user.id)
                    .single();

                if (adminError || !adminData) {
                    console.error("Not an admin:", adminError);
                    router.push("/"); // Redirect to home if not admin
                    return;
                }

                // 3. Fetch Stats
                const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true });
                const { count: teacherCount } = await supabase.from("teachers").select("*", { count: "exact", head: true });
                const { count: subjectCount } = await supabase.from("subjects").select("*", { count: "exact", head: true });

                // Fetch attendance for calculations
                const { data: attendanceData } = await supabase.from("attendance").select("status, date");

                let totalClassesHeld = 0;
                let averageAttendance = 0;
                let dailyAttendance: Record<string, { present: number; total: number }> = {};

                if (attendanceData) {
                    totalClassesHeld = attendanceData.length; // This is actually total *records*, not classes held. 
                    // To get classes held, we should group by subject_id + date. But for "Total Classes Held" metric in analytics, usually means total sessions.
                    // Let's approximate "Total Classes Held" as unique subject_id + date combinations?
                    // Or just count total records as "Student-Classes".
                    // User asked: "Total classes held (count attendance rows)". Okay, I will use total records.

                    const totalPresent = attendanceData.filter(r => r.status === "Present").length;
                    if (totalClassesHeld > 0) {
                        averageAttendance = (totalPresent / totalClassesHeld) * 100;
                    }

                    // Prepare Chart Data (Daily Average Attendance %)
                    attendanceData.forEach((record: any) => {
                        if (!dailyAttendance[record.date]) {
                            dailyAttendance[record.date] = { present: 0, total: 0 };
                        }
                        dailyAttendance[record.date].total++;
                        if (record.status === "Present") {
                            dailyAttendance[record.date].present++;
                        }
                    });
                }

                setStats({
                    totalStudents: studentCount || 0,
                    totalTeachers: teacherCount || 0,
                    totalSubjects: subjectCount || 0,
                    totalClassesHeld: totalClassesHeld,
                    averageAttendance: averageAttendance,
                });

                // Chart Data
                const sortedDates = Object.keys(dailyAttendance).sort();
                const chartLabels = sortedDates.map(d => new Date(d).toLocaleDateString());
                const chartValues = sortedDates.map(d => {
                    const day = dailyAttendance[d];
                    return (day.present / day.total) * 100;
                });

                setChartData({
                    labels: chartLabels,
                    datasets: [
                        {
                            label: "Average Attendance %",
                            data: chartValues,
                            borderColor: "rgb(75, 192, 192)",
                            backgroundColor: "rgba(75, 192, 192, 0.5)",
                            tension: 0.1,
                        }
                    ]
                });

            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading) {
        return <div className="p-8">Loading admin dashboard...</div>;
    }

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <LogoutButton />
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalStudents}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Teachers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Subjects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSubjects}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClassesHeld}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Avg Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averageAttendance.toFixed(1)}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Department Attendance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                    {chartData && (
                        <div className="h-[300px] w-full">
                            <Line
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            max: 100,
                                        }
                                    }
                                }}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Management Links */}
            <h2 className="text-2xl font-bold mb-4">Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/admin/teachers">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle>Manage Teachers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500">Add, view, and remove teachers.</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/students">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle>Manage Students</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500">Add, view, and remove students.</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/subjects">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle>Manage Subjects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500">Add subjects and assign teachers.</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/enrollments">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle>Manage Enrollments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500">Enroll students in subjects.</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
