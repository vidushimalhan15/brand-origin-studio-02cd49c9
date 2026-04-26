import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "@/components/AppLayout";
import BrandIdentityStep from "@/components/BrandIdentityStep";

export const Route = createFileRoute("/brand-setup")({
  component: BrandSetupRoute,
});

function BrandSetupRoute() {
  return (
    <AppLayout>
      <BrandIdentityStep />
    </AppLayout>
  );
}
