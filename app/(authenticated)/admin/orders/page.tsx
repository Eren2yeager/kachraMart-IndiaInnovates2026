"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function AdminOrdersPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ComingSoon
        title="Admin Orders"
        description="Manage and monitor all orders across the platform, from dealers purchasing waste to fulfillment tracking."
        phaseLabel="Phase 5 · Order Management"
        actions={[
          {
            label: "View all orders",
            hint: "See pending, approved, and completed orders across all hubs.",
          },
          {
            label: "Order approval workflow",
            hint: "Review and approve dealer purchase requests.",
          },
          {
            label: "Fulfillment tracking",
            hint: "Monitor order status and delivery progress.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}
