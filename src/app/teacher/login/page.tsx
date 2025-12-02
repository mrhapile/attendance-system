import LoginForm from "@/components/auth/login-form";

export default function TeacherLoginPage() {
    return <LoginForm redirectTo="/teacher" userType="Teacher" />;
}
