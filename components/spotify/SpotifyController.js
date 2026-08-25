"use client";

import { useEffect, useRef } from "react";
import { SpotifyPill } from "@/components/spotify/SpotifyPill";
import { SpotifyPlayerSheet } from "@/components/spotify/SpotifyPlayerSheet";
import { Toast } from "@/components/ui/Toast";
import { useSpotify } from "@/context/SpotifyContext";

export function SpotifyController({ hidden = false, workoutOpen = false }) {
  const {
    isConnected,
    playback,
    displayedProgressMs,
    playlists,
    playlistsLoading,
    playlistsError,
    isExpanded,
    error,
    notice,
    skipBusy,
    shuffleBusy,
    repeatBusy,
    startingPlaylistId,
    isOnline,
    setIsSeeking,
    setDisplayedProgressMs,
    play,
    pause,
    next,
    previous,
    toggleShuffle,
    cycleRepeatMode,
    seek,
    playPlaylist,
    expand,
    collapse,
    clearNotice,
  } = useSpotify();
  const expandRef = useRef(null);

  useEffect(() => {
    const visible = isConnected && !hidden;
    document.documentElement.setAttribute("data-spotify-pill", visible ? "on" : "off");
    return () => {
      document.documentElement.removeAttribute("data-spotify-pill");
    };
  }, [hidden, isConnected]);

  if (!isConnected || hidden) {
    return <Toast notice={notice} onClear={clearNotice} />;
  }

  function onToggle() {
    if (playback?.isPlaying) {
      pause();
    } else {
      play();
    }
  }

  return (
    <>
      <SpotifyPill
        playback={playback}
        error={error}
        isOnline={isOnline}
        skipBusy={skipBusy}
        workoutOpen={workoutOpen}
        expanded={isExpanded}
        expandRef={expandRef}
        onExpand={expand}
        onPrevious={previous}
        onToggle={onToggle}
        onNext={next}
      />
      <SpotifyPlayerSheet
        open={isExpanded}
        playback={playback}
        displayedProgressMs={displayedProgressMs}
        playlists={playlists}
        playlistsLoading={playlistsLoading}
        playlistsError={playlistsError}
        skipBusy={skipBusy}
        shuffleBusy={shuffleBusy}
        repeatBusy={repeatBusy}
        startingPlaylistId={startingPlaylistId}
        error={error}
        isOnline={isOnline}
        restoreFocusRef={expandRef}
        onClose={collapse}
        onPrevious={previous}
        onToggle={onToggle}
        onNext={next}
        onShuffle={toggleShuffle}
        onRepeat={cycleRepeatMode}
        onSeekStart={() => setIsSeeking(true)}
        onSeekInput={setDisplayedProgressMs}
        onSeekCommit={seek}
        onSelectPlaylist={playPlaylist}
      />
      <Toast notice={notice} onClear={clearNotice} />
    </>
  );
}
