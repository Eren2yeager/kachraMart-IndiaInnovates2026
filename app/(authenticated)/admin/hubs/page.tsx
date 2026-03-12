"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function AdminHubsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ComingSoon
        title="Hubs & Inventory Management"
        description="Manage central waste hubs, capacities, and verified inventory across the city."
        phaseLabel="Phase 4 · Hubs & inventory"
        actions={[
          {
            label: "Hub overview",
            hint: "See locations, capacities, and current load for each hub.",
          },
          {
            label: "Inventory by waste type",
            hint: "Track how much of each waste type is stored and verified.",
          },
          {
            label: "Link inventory to dealer orders",
            hint: "Connect stored waste to outgoing marketplace transactions.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}

