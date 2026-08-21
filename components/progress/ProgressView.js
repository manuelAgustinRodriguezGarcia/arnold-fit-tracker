"use client";

import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SessionCard } from "@/components/progress/SessionCard";
import { useArnold } from "@/hooks/useArnold";
import styles from "./ProgressView.module.css";

export function ProgressView({ onOpenSession }) {
  const { sessions } = useArnold();
  const ordered = [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  return (
    <section
      className={`${styles.view} ${ordered.length === 0 ? styles.centered : ""}`}
    >
      {ordered.length === 0 ? (
        <EmptyState
          icon={<ChartNoAxesColumnIncreasing size={28} />}
          title="Todavía no hay entrenamientos"
          description="Cuando termines tu primera rutina aparecerá acá."
        />
      ) : (
        <div className={styles.list}>
          {ordered.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onOpen={() => onOpenSession(session)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
