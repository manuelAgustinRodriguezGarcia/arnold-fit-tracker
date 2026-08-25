"use client";

import { createContext, useContext } from "react";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

const SpotifyContext = createContext(null);

export function SpotifyProvider({ children }) {
  const value = useSpotifyPlayer();
  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error("useSpotify debe usarse dentro de SpotifyProvider");
  }
  return context;
}
