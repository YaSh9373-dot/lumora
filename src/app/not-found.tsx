import { Compass } from "lucide-react";
import { GradientLink } from "@/components/effects/gradient-button";
import { Container, EmptyState } from "@/components/layout/states";

export default function NotFound() {
  return (
    <Container className="pt-20">
      <EmptyState icon={Compass} title="This page wandered off" description="The link may be broken or the page was moved.">
        <GradientLink href="/">Go home</GradientLink>
        <GradientLink href="/creators" variant="secondary">
          Discover creators
        </GradientLink>
      </EmptyState>
    </Container>
  );
}
