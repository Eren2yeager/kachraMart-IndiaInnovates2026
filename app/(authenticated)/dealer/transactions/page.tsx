"use client";

import { ComingSoon } from "@/components/layout/ComingSoon";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DealerTransactionsPage() {
  return (
    <ProtectedRoute allowedRoles={["dealer"]}>
      <ComingSoon
        title="Transaction History"
        description="View all your payment transactions and financial records."
        phaseLabel="Phase 5 · Financial Management"
        actions={[
          {
            label: "Payment history",
            hint: "See all completed payments and invoices.",
          },
          {
            label: "Pending payments",
            hint: "Track outstanding balances and due dates.",
          },
          {
            label: "Download statements",
            hint: "Export transaction records for accounting purposes.",
          },
        ]}
      />
    </ProtectedRoute>
  );
}
