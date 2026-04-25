import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "@/components/AppLayout";
import BrandIdentityStep from "@/components/BrandIdentityStep";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppLayout>
      <BrandIdentityStep />
    </AppLayout>
  );
}
