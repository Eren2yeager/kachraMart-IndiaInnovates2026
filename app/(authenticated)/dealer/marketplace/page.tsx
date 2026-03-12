"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DealerMarketplacePage() {
  return (
    <ProtectedRoute allowedRoles={["dealer"]}>
      <ComingSoon
        title="Recycling Marketplace"
        description="A curated marketplace where dealers can discover, filter, and purchase waste inventory."
        phaseLabel="Phase 5 · Recycler marketplace"
        actions={[
          {
            label: "Browse verified waste listings",
            hint: "Filter by type, quantity, location, and verification status.",
          },
          {
            label: "Submit purchase requests & bids",
            hint: "Negotiate prices and secure inventory directly in the platform.",
          },
          {
            label: "Track order lifecycle",
            hint: "From request to approval, dispatch, and completion.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}

