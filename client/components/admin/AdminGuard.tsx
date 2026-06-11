"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { getAdminStatus } from "@/services/admin/admin.service";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const token = await getToken();
        if (!token) {
          router.replace("/");
          return;
        }

        const response = await getAdminStatus(token);

        if (!response.isAdmin) {
          router.replace("/");
          return;
        }

        setIsAdmin(true);
      } catch {
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [getToken, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Checking permissions...
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
