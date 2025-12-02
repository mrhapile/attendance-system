"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function createTeacher(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("User creation failed");

        // 2. Create DB Entry
        const { error: dbError } = await supabaseAdmin
            .from("teachers")
            .insert([{ id: authData.user.id, name, email }]);

        if (dbError) {
            // Rollback auth user if DB fails (optional but good practice)
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw dbError;
        }

        revalidatePath("/admin/teachers");
        return { success: true, message: "Teacher created successfully" };
    } catch (error: any) {
        console.error("Create Teacher Error:", error);
        return { success: false, message: error.message };
    }
}

export async function deleteTeacher(id: string) {
    try {
        // Delete from Auth (Cascade should handle DB if set up, but let's be safe)
        // Actually, our schema might not have cascade on auth.users -> teachers.
        // But usually we delete from Auth and let DB clean up or delete from DB first.
        // Let's delete from Auth, which is the source of truth for access.
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) throw error;

        // Also delete from public table if cascade isn't set
        await supabaseAdmin.from("teachers").delete().eq("id", id);

        revalidatePath("/admin/teachers");
        return { success: true, message: "Teacher deleted successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function createStudent(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const roll_no = formData.get("roll_no") as string;
    const year = parseInt(formData.get("year") as string);
    const password = formData.get("password") as string;

    try {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("User creation failed");

        // 2. Create DB Entry
        const { error: dbError } = await supabaseAdmin
            .from("students")
            .insert([{ id: authData.user.id, name, email, roll_no, year }]);

        if (dbError) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw dbError;
        }

        revalidatePath("/admin/students");
        return { success: true, message: "Student created successfully" };
    } catch (error: any) {
        console.error("Create Student Error:", error);
        return { success: false, message: error.message };
    }
}

export async function deleteStudent(id: string) {
    try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) throw error;
        await supabaseAdmin.from("students").delete().eq("id", id);
        revalidatePath("/admin/students");
        return { success: true, message: "Student deleted successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function createSubject(formData: FormData) {
    const name = formData.get("name") as string;
    const teacher_id = formData.get("teacher_id") as string;

    try {
        const { error } = await supabaseAdmin
            .from("subjects")
            .insert([{ name, teacher_id }]);

        if (error) throw error;
        revalidatePath("/admin/subjects");
        return { success: true, message: "Subject created successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteSubject(id: string) {
    try {
        const { error } = await supabaseAdmin.from("subjects").delete().eq("id", id);
        if (error) throw error;
        revalidatePath("/admin/subjects");
        return { success: true, message: "Subject deleted successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function createEnrollment(formData: FormData) {
    const student_id = formData.get("student_id") as string;
    const subject_id = formData.get("subject_id") as string;

    try {
        const { error } = await supabaseAdmin
            .from("enrollments")
            .insert([{ student_id, subject_id }]);

        if (error) throw error;
        revalidatePath("/admin/enrollments");
        return { success: true, message: "Enrollment created successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteEnrollment(id: string) {
    try {
        const { error } = await supabaseAdmin.from("enrollments").delete().eq("id", id);
        if (error) throw error;
        revalidatePath("/admin/enrollments");
        return { success: true, message: "Enrollment deleted successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
