"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ComingSoon
        title="Admin Analytics"
        description="A command center for understanding how waste flows across citizens, collectors, hubs, and dealers."
        phaseLabel="Phase 6 · Analytics & impact"
        actions={[
          {
            label: "Waste flow overview",
            hint: "Track how much waste is collected, stored, and sold by type.",
          },
          {
            label: "Recycling and diversion metrics",
            hint: "Monitor recycling rates and landfill diversion over time.",
          },
          {
            label: "Environmental impact dashboards",
            hint: "Quantify CO₂ saved and other sustainability indicators.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}

