"use client";

import {
  Heading,
  Column,
} from "@once-ui-system/core";
import { GlassCard } from "@/components/GlassCard";

export default function Home() {
  return (
    <Column fillWidth center padding="l" style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <Column maxWidth="l" center gap="l" border="neutral-alpha-medium" radius="xs-8" background="neutral-alpha-weak" style={{ aspectRatio: "16/9", padding: "8rem 8.5rem" }}>
        <img
          src="/images/foras.png"
          alt="foras"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "1rem",
            border: "1px solid var(--neutral-alpha-medium)",
          }}
        />
        <GlassCard>
          <Heading>Liquid Glass</Heading>
        </GlassCard>
      </Column>
    </Column>
  );
}
