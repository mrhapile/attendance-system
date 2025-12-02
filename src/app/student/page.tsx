"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type Student = {
    id: string;
    name: string;
    roll_no: string;
    year: number;
};

type AttendanceRecord = {
    subject_id: string;
    date: string;
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

    // Global Stats
    const [globalStats, setGlobalStats] = useState({
        totalSubjects: 0,
        totalClassesHeld: 0,
        totalClassesAttended: 0,
        overallPercentage: 0,
    });

    // Chart Data
    const [chartData, setChartData] = useState<any>(null);

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
                    .select("subject_id, date, status")
                    .eq("student_id", user.id)
                    .order("date", { ascending: true });

                if (attendanceError) {
                    console.error("Error fetching attendance:", attendanceError);
                    return;
                }

                // 5. Calculate Stats & Prepare Chart Data
                if (enrollmentsData && attendanceData) {
                    let totalHeld = 0;
                    let totalAttended = 0;

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

                        totalHeld += totalClasses;
                        totalAttended += attendedClasses;

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
                            const required = Math.ceil((0.75 * totalClasses) - attendedClasses);
                            message = `You need ${required} more classes to reach 75%`;
                            statusColor = "text-red-600";
                        } else {
                            const safeLeaves = Math.floor(attendedClasses - (0.75 * totalClasses));
                            message = `You can skip ${safeLeaves} classes safely`;
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

                    setGlobalStats({
                        totalSubjects: enrollmentsData.length,
                        totalClassesHeld: totalHeld,
                        totalClassesAttended: totalAttended,
                        overallPercentage: totalHeld > 0 ? (totalAttended / totalHeld) * 100 : 0,
                    });

                    // Prepare Chart Data
                    // We want a line chart where x-axis is dates, and y-axis is cumulative attendance % or just status?
                    // User asked for: "y-axis: 1 for Present, 0 for Absent".
                    // And "One graph per subject OR one combined graph".
                    // A combined graph with 0/1 for multiple subjects will be very messy (overlapping lines).
                    // Let's try to group by date and show "Daily Attendance Rate" (Present in X subjects / Total subjects that day)?
                    // OR just follow instructions strictly: "one combined graph" with 0/1.
                    // Let's do a combined graph where each dataset is a subject.

                    const uniqueDates = Array.from(new Set(attendanceData.map((r: any) => r.date))).sort();

                    const datasets = enrollmentsData.map((enrollment: any, index: number) => {
                        const subject = enrollment.subjects;
                        const subjectColor = `hsl(${index * 60}, 70%, 50%)`; // Generate different colors

                        const dataPoints = uniqueDates.map(date => {
                            const record = attendanceData.find((r: any) => r.subject_id === subject.id && r.date === date);
                            if (!record) return null; // No class that day
                            return record.status === "Present" ? 1 : 0;
                        });

                        return {
                            label: subject.name,
                            data: dataPoints,
                            borderColor: subjectColor,
                            backgroundColor: subjectColor,
                            tension: 0.1,
                            spanGaps: true, // Connect lines across missing dates
                        };
                    });

                    setChartData({
                        labels: uniqueDates.map(d => new Date(d).toLocaleDateString()),
                        datasets: datasets,
                    });
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
                <div className="flex gap-2 items-center">
                    <Link href="/student/leave/apply">
                        <Button>Apply for Leave</Button>
                    </Link>
                    <Link href="/student/leave">
                        <Button variant="outline">My Leave Applications</Button>
                    </Link>
                    <LogoutButton />
                </div>
            </div>

            {/* Global Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Overall Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{globalStats.overallPercentage.toFixed(1)}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Classes Attended</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{globalStats.totalClassesAttended}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Classes Held</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{globalStats.totalClassesHeld}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Subjects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{globalStats.totalSubjects}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance Trends Graph */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Attendance Trends</CardTitle>
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
                                            max: 1,
                                            ticks: {
                                                stepSize: 1,
                                                callback: (value) => value === 1 ? 'Present' : 'Absent'
                                            }
                                        }
                                    },
                                    plugins: {
                                        tooltip: {
                                            callbacks: {
                                                label: (context) => {
                                                    return `${context.dataset.label}: ${context.raw === 1 ? 'Present' : 'Absent'}`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Subject Cards */}
            <h2 className="text-2xl font-bold mb-4">Subject Details</h2>
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
