import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "@/components/AppLayout";
import ImageGeneration from "@/components/ImageGeneration";

export const Route = createFileRoute("/image-generation")({
  component: ImageGenerationPage,
});

function ImageGenerationPage() {
  return (
    <AppLayout>
      <ImageGeneration />
    </AppLayout>
  );
}
