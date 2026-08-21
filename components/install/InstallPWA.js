"use client";

import { useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import styles from "./InstallPWA.module.css";

export function InstallPWA() {
  const { canShowInstall, canPrompt, showIosGuide, promptInstall } =
    usePWAInstall();
  const [iosOpen, setIosOpen] = useState(false);

  if (!canShowInstall) {
    return null;
  }

  async function onInstall() {
    if (canPrompt) {
      await promptInstall();
      return;
    }
    if (showIosGuide) {
      setIosOpen(true);
    }
  }

  return (
    <>
      <div className={styles.banner}>
        <div>
          <strong>Instalá Arnold</strong>
          <p>Usala como una app, también sin conexión.</p>
        </div>
        <Button onClick={onInstall} icon={<Download size={18} />}>
          Instalar Arnold
        </Button>
      </div>
      <Modal
        open={iosOpen}
        title="Instalar en iPhone"
        onClose={() => setIosOpen(false)}
      >
        <p className={styles.guideIntro}>Para instalar Arnold en tu iPhone:</p>
        <ol className={styles.steps}>
          <li>Abrí Arnold desde Safari.</li>
          <li>
            Tocá Compartir. <Share size={16} />
          </li>
          <li>Elegí &quot;Agregar a pantalla de inicio&quot;.</li>
        </ol>
      </Modal>
    </>
  );
}
