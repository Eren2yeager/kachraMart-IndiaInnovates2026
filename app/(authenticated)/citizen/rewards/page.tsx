"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function CitizenRewardsPage() {
  return (
    <ProtectedRoute allowedRoles={["citizen"]}>
      <ComingSoon
        title="Rewards & Impact"
        description="A dedicated space to see how your actions translate into reward points and real environmental impact."
        phaseLabel="Phase 3–4 · Rewards & tracking"
        actions={[
          {
            label: "Reward points wallet",
            hint: "Earn points based on waste type, quantity, and segregation quality.",
          },
          {
            label: "Impact analytics for citizens",
            hint: "Track CO₂ saved, waste diverted from landfill, and recycling rate.",
          },
          {
            label: "Leaderboard & community goals",
            hint: "Compete and collaborate with your neighborhood or city.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}

