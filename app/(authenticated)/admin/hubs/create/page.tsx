"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function CreateHubPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ComingSoon
        title="Create Hub"
        description="Set up a new waste collection hub with location, capacity, and operational details."
        phaseLabel="Phase 3 · Hub Management"
        actions={[
          {
            label: "Hub information",
            hint: "Enter hub name, address, and contact details.",
          },
          {
            label: "Capacity configuration",
            hint: "Set storage capacity for different waste types.",
          },
          {
            label: "Assign manager",
            hint: "Designate a hub manager and operational staff.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}
