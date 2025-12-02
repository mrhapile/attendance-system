import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Attendance System</h1>
      <div className="flex gap-4">
        <Link href="/teacher/login">
          <Button>Teacher Login</Button>
        </Link>
        <Link href="/student/login">
          <Button variant="outline">Student Login</Button>
        </Link>
      </div>
    </main>
  );
}
