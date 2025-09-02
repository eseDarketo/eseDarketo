"use client";

import {
  Heading,
  Text,
  Button,
  Column,
  Badge,
  Logo,
  Line,
  LetterFx,
  Card,
} from "@once-ui-system/core";

export default function Home() {
  const cards = (amount: number) =>{
    return Array.from({length: amount}, (_, index) => (
      <Card
      key={index}
      direction="column"
      padding="24"
      radius="xs-8"
      border="neutral-medium"
      fillWidth
      center
      background="brand-alpha-weak"
      >
        <Heading 
        variant="display-strong-xl"
        onBackground="neutral-strong"
        >
          Hello World
        </Heading>
      </Card>
    ))
  };


  return (
    <Column fillWidth center padding="l" style={{ minHeight: "100vh" }}>
      <Column maxWidth="xs" center gap="l" border="neutral-alpha-medium" radius="xs-8" padding="xl" background="neutral-alpha-weak">
        {cards(3)}
      </Column>
    </Column>
  );
}
