"use client";

import { Alert, Loader } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/lib/auth-context";
import { canAccessPath } from "@/lib/rbac";

export default function AdminLayout({ children }) {
  const { ready, isAuthenticated, permissions } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace("/");
    }
  }, [ready, isAuthenticated, router]);

  if (!ready || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const allowed = canAccessPath(pathname || "/admin", permissions);

  return (
    <AdminShell>
      {allowed ? (
        children
      ) : (
        <Alert
          icon={<IconLock size={16} />}
          title="Access denied"
          color="red"
          variant="light"
        >
          You do not currently have permission to view this page. Switch to a
          different mock user or update permissions from Access Control.
        </Alert>
      )}
    </AdminShell>
  );
}
