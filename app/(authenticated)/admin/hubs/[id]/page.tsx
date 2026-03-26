"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function HubDetailPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ComingSoon
        title="Hub Details"
        description="View and manage detailed information about a specific waste collection hub."
        phaseLabel="Phase 3 · Hub Management"
        actions={[
          {
            label: "Hub overview",
            hint: "See current inventory, capacity, and operational status.",
          },
          {
            label: "Inventory management",
            hint: "Track waste types and quantities stored at this hub.",
          },
          {
            label: "Performance metrics",
            hint: "Monitor collection rates, utilization, and efficiency.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}
