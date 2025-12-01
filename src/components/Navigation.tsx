"use client";

import { Flex, Button } from "@once-ui-system/core";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/liquid-glass", label: "Liquid Glass" },
    { href: "/generative-mosaic", label: "Mosaic" },
  ];

  return (
    <Flex
      as="nav"
      justifyContent="center"
      padding="m"
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}
    >
      <Flex
        gap="xs"
        padding="xs"
        radius="l"
        border="neutral-alpha-medium"
        background="neutral-alpha-weak"
        style={{ backdropFilter: "blur(12px)" }}
      >
        {links.map((link) => (
          <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
            <Button
              variant={pathname === link.href ? "secondary" : "ghost"}
              size="m"
            >
              {link.label}
            </Button>
          </Link>
        ))}
      </Flex>
    </Flex>
  );
}
