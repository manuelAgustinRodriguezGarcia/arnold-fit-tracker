"use client";

import { useContext } from "react";
import { ArnoldContext } from "@/context/ArnoldContext";

export function useArnold() {
  const context = useContext(ArnoldContext);
  if (!context) {
    throw new Error("useArnold debe usarse dentro de ArnoldProvider");
  }
  return context;
}
