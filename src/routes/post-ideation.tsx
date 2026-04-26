import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "@/components/AppLayout";
import PostIdeation from "@/components/PostIdeation";

export const Route = createFileRoute("/post-ideation")({
  component: PostIdeationPage,
});

function PostIdeationPage() {
  return (
    <AppLayout>
      <PostIdeation />
    </AppLayout>
  );
}
