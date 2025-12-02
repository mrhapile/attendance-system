"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh(); // Clear any cached data
    };

    return (
        <Button variant="outline" onClick={handleLogout}>
            Sign Out
        </Button>
    );
}
