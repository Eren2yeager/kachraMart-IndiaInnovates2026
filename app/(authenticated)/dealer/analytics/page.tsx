"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DealerAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["dealer"]}>
      <ComingSoon
        title="Dealer Analytics"
        description="Track your purchasing patterns, spending, and waste material insights."
        phaseLabel="Phase 6 · Analytics & Insights"
        actions={[
          {
            label: "Purchase history",
            hint: "View all your past orders and spending trends.",
          },
          {
            label: "Material insights",
            hint: "Analyze which waste types you purchase most frequently.",
          },
          {
            label: "Cost analysis",
            hint: "Track pricing trends and optimize your procurement.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}
