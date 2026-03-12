"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function CollectorRoutesPage() {
  return (
    <ProtectedRoute allowedRoles={["collector"]}>
      <ComingSoon
        title="Routes & Navigation"
        description="Turn scattered pickup points into optimized, map-driven routes for your day."
        phaseLabel="Phase 3–4 · Route optimization"
        actions={[
          {
            label: "Smart daily route suggestions",
            hint: "Auto-generate efficient pickup routes based on distance and priority.",
          },
          {
            label: "Map view with live guidance",
            hint: "Visualize all stops and navigate with map integration.",
          },
          {
            label: "Route completion insights",
            hint: "Understand time taken, distance covered, and waste collected per route.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}

