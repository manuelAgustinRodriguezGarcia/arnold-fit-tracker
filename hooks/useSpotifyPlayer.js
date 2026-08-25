"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getPlaybackState,
  getSpotifyRateLimitedUntil,
  getUserPlaylists,
  isSpotifyRateLimited,
  pausePlayback,
  playContext,
  resumePlayback,
  seekPlayback,
  skipToNext,
  skipToPrevious,
} from "@/lib/spotify/api";
import { disconnectSpotify, startSpotifyLogin } from "@/lib/spotify/auth";
import {
  ACTION_REFRESH_DELAY_MS,
  LOCAL_PROGRESS_TICK_MS,
  MESSAGES,
  PLAYBACK_POLL_COMPACT_MS,
  PLAYBACK_POLL_EXPANDED_MS,
  SKIP_LOCK_MS,
  getSpotifyClientId,
} from "@/lib/spotify/constants";
import { SpotifyApiError, userFacingSpotifyMessage } from "@/lib/spotify/errors";
import { normalizePlayback, normalizePlaylist } from "@/lib/spotify/normalize";
import { hasSpotifySession, SPOTIFY_SESSION_EVENT } from "@/lib/spotify/storage";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function subscribeSpotifySession(callback) {
  window.addEventListener(SPOTIFY_SESSION_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SPOTIFY_SESSION_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useSpotifyPlayer() {
  const isOnline = useOnlineStatus();
  const isConnected = useSyncExternalStore(
    subscribeSpotifySession,
    hasSpotifySession,
    () => false,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [playback, setPlayback] = useState(null);
  const [displayedProgressMs, setDisplayedProgressMs] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");
  const [skipBusy, setSkipBusy] = useState(false);
  const [startingPlaylistId, setStartingPlaylistId] = useState(null);
  const [isSeeking, setIsSeeking] = useState(false);

  const playbackRef = useRef(null);
  const seekingRef = useRef(false);
  const playlistsFetchedRef = useRef(false);
  const noticeIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  useEffect(() => {
    seekingRef.current = isSeeking;
  }, [isSeeking]);

  const showNotice = useCallback((message) => {
    if (!message) {
      return;
    }
    noticeIdRef.current += 1;
    setNotice({ id: `spotify-${noticeIdRef.current}`, message, tone: "error" });
  }, []);

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const markDisconnected = useCallback((message) => {
    setPlayback(null);
    setDisplayedProgressMs(0);
    setPlaylists([]);
    setIsExpanded(false);
    playlistsFetchedRef.current = false;
    setError(message || "");
    if (message) {
      showNotice(message);
    }
  }, [showNotice]);

  const refreshPlayback = useCallback(async () => {
    if (!hasSpotifySession()) {
      setPlayback(null);
      setIsLoading(false);
      return;
    }
    if (!navigator.onLine || isSpotifyRateLimited()) {
      return;
    }

    try {
      const raw = await getPlaybackState();
      if (!mountedRef.current) {
        return;
      }
      const next = normalizePlayback(raw);
      setPlayback(next);
      if (!seekingRef.current) {
        setDisplayedProgressMs(next?.progressMs || 0);
      }
      setError("");
      setIsLoading(false);
    } catch (caught) {
      if (!mountedRef.current) {
        return;
      }
      setIsLoading(false);
      if (caught instanceof SpotifyApiError && caught.code === "unauthorized") {
        disconnectSpotify();
        markDisconnected(MESSAGES.reconnect);
        return;
      }
      if (caught instanceof SpotifyApiError && caught.code === "offline") {
        setError(MESSAGES.offline);
        return;
      }
      if (caught instanceof SpotifyApiError && caught.code === "rate_limit") {
        setError(MESSAGES.rateLimited);
        showNotice(MESSAGES.rateLimited);
        return;
      }
      setError(userFacingSpotifyMessage(caught));
    }
  }, [markDisconnected, showNotice]);

  const connect = useCallback(async () => {
    try {
      await startSpotifyLogin();
    } catch (caught) {
      showNotice(userFacingSpotifyMessage(caught));
    }
  }, [showNotice]);

  const disconnect = useCallback(() => {
    disconnectSpotify();
    markDisconnected("");
  }, [markDisconnected]);

  const runControl = useCallback(
    async (action, { optimistic, revert, failureMessage, lockSkip = false } = {}) => {
      if (!isConnected) {
        return;
      }
      if (!isOnline) {
        showNotice(MESSAGES.offline);
        return;
      }
      if (lockSkip) {
        setSkipBusy(true);
      }
      if (optimistic) {
        optimistic();
      }
      try {
        await action();
        await wait(ACTION_REFRESH_DELAY_MS);
        await refreshPlayback();
      } catch (caught) {
        if (revert) {
          revert();
        }
        if (caught instanceof SpotifyApiError && caught.code === "unauthorized") {
          disconnectSpotify();
          markDisconnected(MESSAGES.reconnect);
          return;
        }
        showNotice(failureMessage || userFacingSpotifyMessage(caught));
      } finally {
        if (lockSkip) {
          window.setTimeout(() => {
            if (mountedRef.current) {
              setSkipBusy(false);
            }
          }, SKIP_LOCK_MS);
        }
      }
    },
    [isConnected, isOnline, markDisconnected, refreshPlayback, showNotice],
  );

  const play = useCallback(() => {
    const current = playbackRef.current;
    runControl(resumePlayback, {
      optimistic: () => {
        setPlayback((prev) => (prev ? { ...prev, isPlaying: true } : prev));
      },
      revert: () => {
        setPlayback((prev) => (prev ? { ...prev, isPlaying: current?.isPlaying } : prev));
      },
      failureMessage: current ? MESSAGES.playFailed : MESSAGES.noDeviceShort,
    });
  }, [runControl]);

  const pause = useCallback(() => {
    const current = playbackRef.current;
    runControl(pausePlayback, {
      optimistic: () => {
        setPlayback((prev) => (prev ? { ...prev, isPlaying: false } : prev));
      },
      revert: () => {
        setPlayback((prev) => (prev ? { ...prev, isPlaying: current?.isPlaying } : prev));
      },
      failureMessage: MESSAGES.playFailed,
    });
  }, [runControl]);

  const next = useCallback(() => {
    runControl(skipToNext, {
      lockSkip: true,
      failureMessage: MESSAGES.skipFailed,
    });
  }, [runControl]);

  const previous = useCallback(() => {
    runControl(skipToPrevious, {
      lockSkip: true,
      failureMessage: MESSAGES.skipFailed,
    });
  }, [runControl]);

  const seek = useCallback(
    async (positionMs) => {
      const duration = playbackRef.current?.durationMs || 0;
      const nextPosition = Math.max(0, Math.min(duration, Math.floor(positionMs)));
      setDisplayedProgressMs(nextPosition);
      setPlayback((prev) => (prev ? { ...prev, progressMs: nextPosition } : prev));
      setIsSeeking(false);
      if (!isOnline) {
        showNotice(MESSAGES.offline);
        return;
      }
      try {
        await seekPlayback(nextPosition);
        await wait(ACTION_REFRESH_DELAY_MS);
        await refreshPlayback();
      } catch (caught) {
        if (caught instanceof SpotifyApiError && caught.code === "unauthorized") {
          disconnectSpotify();
          markDisconnected(MESSAGES.reconnect);
          return;
        }
        showNotice(caught?.code === "no_device" ? MESSAGES.noDeviceShort : MESSAGES.seekFailed);
        await refreshPlayback();
      }
    },
    [isOnline, markDisconnected, refreshPlayback, showNotice],
  );

  const loadPlaylists = useCallback(async (force = false) => {
    if (!isConnected || (!force && playlistsFetchedRef.current)) {
      return;
    }
    if (!isOnline) {
      setPlaylistsError(MESSAGES.offline);
      return;
    }
    setPlaylistsLoading(true);
    setPlaylistsError("");
    try {
      const raw = await getUserPlaylists();
      if (!mountedRef.current) {
        return;
      }
      setPlaylists(raw.map(normalizePlaylist).filter(Boolean));
      playlistsFetchedRef.current = true;
    } catch (caught) {
      if (caught instanceof SpotifyApiError && caught.code === "unauthorized") {
        disconnectSpotify();
        markDisconnected(MESSAGES.reconnect);
        return;
      }
      setPlaylistsError(userFacingSpotifyMessage(caught) || MESSAGES.playlistsFailed);
    } finally {
      if (mountedRef.current) {
        setPlaylistsLoading(false);
      }
    }
  }, [isConnected, isOnline, markDisconnected]);

  const playPlaylist = useCallback(
    async (playlist) => {
      if (!playlist?.uri) {
        return;
      }
      if (!isOnline) {
        showNotice(MESSAGES.offline);
        return;
      }
      setStartingPlaylistId(playlist.id);
      try {
        await playContext(playlist.uri);
        await wait(ACTION_REFRESH_DELAY_MS);
        await refreshPlayback();
      } catch (caught) {
        if (caught instanceof SpotifyApiError && caught.code === "unauthorized") {
          disconnectSpotify();
          markDisconnected(MESSAGES.reconnect);
          return;
        }
        showNotice(
          caught?.code === "no_device" ? MESSAGES.noDevice : MESSAGES.playlistFailed,
        );
      } finally {
        if (mountedRef.current) {
          setStartingPlaylistId(null);
        }
      }
    },
    [isOnline, markDisconnected, refreshPlayback, showNotice],
  );

  const expand = useCallback(() => {
    setIsExpanded(true);
    window.setTimeout(() => {
      loadPlaylists();
    }, 0);
  }, [loadPlaylists]);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isConnected || !isOnline) {
      return undefined;
    }

    function tick() {
      if (document.visibilityState === "hidden" || isSpotifyRateLimited()) {
        return;
      }
      refreshPlayback();
    }

    const start = window.setTimeout(tick, 0);
    const interval = isExpanded ? PLAYBACK_POLL_EXPANDED_MS : PLAYBACK_POLL_COMPACT_MS;
    const timer = window.setInterval(tick, interval);

    function onVisibility() {
      if (document.visibilityState === "visible") {
        tick();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isConnected, isExpanded, isOnline, refreshPlayback]);

  useEffect(() => {
    if (!playback?.isPlaying || isSeeking) {
      return undefined;
    }
    const startedAt = Date.now();
    const base = playback.progressMs || 0;
    const duration = playback.durationMs || 0;
    const timer = window.setInterval(() => {
      const nextValue = duration ? Math.min(duration, base + (Date.now() - startedAt)) : base + (Date.now() - startedAt);
      setDisplayedProgressMs(nextValue);
    }, LOCAL_PROGRESS_TICK_MS);
    return () => window.clearInterval(timer);
  }, [playback?.isPlaying, playback?.progressMs, playback?.trackId, playback?.durationMs, isSeeking]);

  useEffect(() => {
    if (!isSpotifyRateLimited()) {
      return undefined;
    }
    const remaining = Math.max(0, getSpotifyRateLimitedUntil() - Date.now());
    const timer = window.setTimeout(() => {
      refreshPlayback();
    }, remaining + 50);
    return () => window.clearTimeout(timer);
  }, [error, refreshPlayback]);

  return {
    clientIdConfigured: Boolean(getSpotifyClientId()),
    isConnected,
    isLoading,
    isOnline,
    playback,
    displayedProgressMs,
    playlists,
    playlistsLoading,
    playlistsError,
    isExpanded,
    error: !isOnline && isConnected ? MESSAGES.offline : error,
    notice,
    skipBusy,
    startingPlaylistId,
    isSeeking,
    setIsSeeking,
    setDisplayedProgressMs,
    connect,
    disconnect,
    play,
    pause,
    next,
    previous,
    seek,
    playPlaylist,
    loadPlaylists,
    expand,
    collapse,
    refreshPlayback,
    clearNotice,
  };
}
