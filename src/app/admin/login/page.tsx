"use client";

import LoginForm from "@/components/auth/login-form";

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
                <LoginForm redirectTo="/admin" userType="Admin" />
            </div>
        </div>
    );
}
