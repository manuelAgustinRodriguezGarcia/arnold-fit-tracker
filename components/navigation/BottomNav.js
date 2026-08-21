"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesColumnIncreasing, Dumbbell, House } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import styles from "./BottomNav.module.css";

function NavIcon({ id }) {
  switch (id) {
    case "home":
      return <House size={22} strokeWidth={2.2} />;
    case "routines":
      return <Dumbbell size={22} strokeWidth={2.2} />;
    case "progress":
      return <ChartNoAxesColumnIncreasing size={22} strokeWidth={2.2} />;
    default: {
      const exhaustive = id;
      void exhaustive;
      return <House size={22} strokeWidth={2.2} />;
    }
  }
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Principal">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`${styles.item} ${active ? styles.active : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <NavIcon id={item.id} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
