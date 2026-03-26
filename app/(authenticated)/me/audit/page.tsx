"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function MyAuditPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "dealer", "collector", "citizen"]}>
      <ComingSoon
        title="My Activity Log"
        description="View your personal activity history and account changes."
        phaseLabel="Phase 7 · User Activity"
        actions={[
          {
            label: "Recent activity",
            hint: "See your latest actions and interactions on the platform.",
          },
          {
            label: "Account changes",
            hint: "Track profile updates and security events.",
          },
          {
            label: "Export history",
            hint: "Download your activity data for personal records.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}
