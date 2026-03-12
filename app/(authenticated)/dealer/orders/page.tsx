"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DealerOrdersPage() {
  return (
    <ProtectedRoute allowedRoles={["dealer"]}>
      <ComingSoon
        title="Dealer Orders"
        description="A consolidated view of all your waste purchase activity across hubs and time."
        phaseLabel="Phase 5 · Transaction management"
        actions={[
          {
            label: "Order history & status",
            hint: "See pending, approved, rejected, and completed orders in one place.",
          },
          {
            label: "Pricing and invoice tracking",
            hint: "Track price per kg, total value, and download invoices.",
          },
          {
            label: "Reorder from favorite hubs",
            hint: "Quickly repeat orders from trusted waste hubs.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}

