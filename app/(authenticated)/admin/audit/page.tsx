"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function AdminAuditPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ComingSoon
        title="Admin Audit Log"
        description="Track all system activities and changes for compliance and security monitoring."
        phaseLabel="Phase 7 · Audit & Compliance"
        actions={[
          {
            label: "View audit trail",
            hint: "See all user actions and system events with timestamps.",
          },
          {
            label: "Filter by user or action",
            hint: "Search and filter audit logs by specific criteria.",
          },
          {
            label: "Export audit reports",
            hint: "Generate compliance reports for regulatory requirements.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}
