import { Logo } from "@/components/ui/Logo";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <h1 className={styles.brandTitle}>
          <Logo variant="wordmark" height={52} />
          <span className="sr-only">Arnold</span>
        </h1>
        <p className={styles.tagline}>
          “You can have results or excuses{" "}
          <strong>not both</strong>”
        </p>
      </div>
      <div className={styles.aside}>
        <OfflineBanner />
      </div>
    </header>
  );
}
