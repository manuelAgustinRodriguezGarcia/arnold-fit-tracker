"use client";

import { BrandMark } from "@/components/ui/BrandMark";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <BrandMark heading />
      <div className={styles.aside}>
        <OfflineBanner />
      </div>
    </header>
  );
}
