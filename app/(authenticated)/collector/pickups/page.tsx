"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function CollectorPickupsPage() {
  return (
    <ProtectedRoute allowedRoles={["collector"]}>
      <ComingSoon
        title="Assigned Pickup Requests"
        description="A focused workspace where collectors can see, accept, and complete pickup tasks efficiently."
        phaseLabel="Phase 3 · Collector assignment & routing"
        actions={[
          {
            label: "List of assigned pickups",
            hint: "See upcoming, in-progress, and completed pickups in one place.",
          },
          {
            label: "Route-aware task ordering",
            hint: "Automatically sort pickups by optimized route and priority.",
          },
          {
            label: "One-tap pickup confirmation",
            hint: "Mark waste as collected and move it into hub inventory.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}

