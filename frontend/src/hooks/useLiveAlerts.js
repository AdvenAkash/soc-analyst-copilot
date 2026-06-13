/**
 * useLiveAlerts — drip-feeds SAMPLE_ALERTS one at a time.
 *
 * Mechanics:
 *   - setInterval pushes one alert every DRIP_INTERVAL_MS
 *   - newestAlertId is set on each tick (used for flash animation)
 *   - newestAlertId clears after FLASH_DURATION_MS
 *   - On first CRITICAL alert → auto-triggers after CRITICAL_DELAY_MS pause
 *
 * @param {{ onCriticalDetected: (alerts: object[]) => void }} options
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { SAMPLE_ALERTS } from "../constants/alerts.js";

const DRIP_INTERVAL_MS  = 400;
const FLASH_DURATION_MS = 700;
const CRITICAL_DELAY_MS = 900;

export function useLiveAlerts({ onCriticalDetected }) {
  const [visibleAlerts, setVisibleAlerts] = useState([]);
  const [isLive, setIsLive]               = useState(false);
  const [newestAlertId, setNewestAlertId] = useState(null);
  const [criticalSeen, setCriticalSeen]   = useState(false);

  const indexRef   = useRef(0);
  const timerRef   = useRef(null);
  const flashTimer = useRef(null);

  const startLive = useCallback(() => {
    clearInterval(timerRef.current);
    clearTimeout(flashTimer.current);
    setVisibleAlerts([]);
    setNewestAlertId(null);
    setCriticalSeen(false);
    indexRef.current = 0;
    setIsLive(true);
  }, []);

  const stopLive = useCallback(() => {
    clearInterval(timerRef.current);
    clearTimeout(flashTimer.current);
    setIsLive(false);
  }, []);

  useEffect(() => {
    if (!isLive) return;

    timerRef.current = setInterval(() => {
      const i = indexRef.current;

      if (i >= SAMPLE_ALERTS.length) {
        clearInterval(timerRef.current);
        setIsLive(false);
        return;
      }

      const alert = SAMPLE_ALERTS[i];
      indexRef.current = i + 1;

      setVisibleAlerts(prev => [alert, ...prev]);

      setNewestAlertId(alert.id);
      clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(
        () => setNewestAlertId(null),
        FLASH_DURATION_MS
      );

      if (alert.sev === "CRITICAL" && !criticalSeen) {
        setCriticalSeen(true);
        clearInterval(timerRef.current);
        setIsLive(false);

        setTimeout(() => {
          onCriticalDetected(SAMPLE_ALERTS.slice(0, indexRef.current));
        }, CRITICAL_DELAY_MS);
      }
    }, DRIP_INTERVAL_MS);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(flashTimer.current);
    };
  }, [isLive, criticalSeen, onCriticalDetected]);

  return { visibleAlerts, isLive, newestAlertId, criticalSeen, startLive, stopLive };
}
