"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Check if user is admin based on email whitelist
function isAdmin(email?: string): boolean {
  if (!email) return false;

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || "";
  const allowedEmails = adminEmails.split(",").map(e => e.trim().toLowerCase());

  return allowedEmails.includes(email.toLowerCase());
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;
    
    // Redirect if not authenticated
    if (!user) {
      router.push("/auth/login");
      return;
    }
    
    // Redirect if not admin
    if (!isAdmin(user.email)) {
      router.push("/");
      return;
    }
  }, [user, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="hw-page flex items-center justify-center p-4 bg-[#FFF8F3] min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if not authenticated
  if (!user) {
    return (
      <div className="hw-page flex items-center justify-center p-4 bg-[#FFF8F3] min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Please sign in to access admin tools</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin(user.email)) {
    return (
      <div className="hw-page flex items-center justify-center p-4 bg-[#FFF8F3] min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              You do not have permission to access the admin area.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex hw-page bg-[#FFF8F3]">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64">
        {children}
      </main>
    </div>
  );
}
