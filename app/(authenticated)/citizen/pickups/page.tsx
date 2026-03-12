"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function CitizenPickupsPage() {
  return (
    <ProtectedRoute allowedRoles={["citizen"]}>
      <ComingSoon
        title="Pickup Requests"
        description="Soon you'll be able to create, schedule, and track waste pickup requests directly from your dashboard."
        phaseLabel="Phase 3 · Waste listing & pickup"
        actions={[
          {
            label: "Create pickup requests from AI classifications",
            hint: "Convert detected waste items into pickup-ready listings.",
          },
          {
            label: "Track pickup status in real time",
            hint: "From request created to collector assigned and picked up.",
          },
          {
            label: "View your pickup history",
            hint: "See how much waste you've diverted from landfills.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}

