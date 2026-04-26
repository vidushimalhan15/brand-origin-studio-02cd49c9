import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "@/components/AppLayout";
import BrandSetupPage from "@/pages/BrandSetupPage";

export const Route = createFileRoute("/brand-setup")({
  component: BrandSetupRoute,
});

function BrandSetupRoute() {
  return (
    <AppLayout>
      <BrandSetupPage />
    </AppLayout>
  );
}
