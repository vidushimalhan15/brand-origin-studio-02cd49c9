import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "@/components/AppLayout";
import PostGeneration from "@/components/PostGeneration";

export const Route = createFileRoute("/post-generation")({
  component: PostGenerationPage,
});

function PostGenerationPage() {
  return (
    <AppLayout>
      <PostGeneration />
    </AppLayout>
  );
}
