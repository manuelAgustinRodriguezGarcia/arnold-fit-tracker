"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import styles from "./OfflineBanner.module.css";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <p className={styles.banner}>
      <WifiOff size={14} />
      Sin conexión
    </p>
  );
}
