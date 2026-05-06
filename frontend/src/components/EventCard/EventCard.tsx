import { useState, useRef, useCallback, useEffect } from 'react';
import { Panel, Typography, Flex } from '@maxhub/max-ui';
import styles from './EventCard.module.scss';
import type { TagInfoResponse, EventInfoResponse } from '../../api/types';

interface EventCardProps {
  eventInfo: EventInfoResponse;
  onMoreClick: () => void;
  onRegisterSwapped: () => void;
  onUnregisterSwapped: () => void;
}

export const EventCard = ({
  eventInfo,
  onMoreClick,
  onRegisterSwapped,
  onUnregisterSwapped,
}: EventCardProps) => {
  const { title, tags, is_registered, points, date } = eventInfo;

  const SWIPE_THRESHOLD = 65;
  const SWIPE_FACTOR = 0.3;

  const [offsetX, setOffsetX] = useState(0);
  const [isPressed, setIsPressed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const offsetXRef = useRef(0);            // актуальное смещение
  const isDraggingRef = useRef(false);

  // Сохраняем актуальные колбэки, чтобы не привязываться к перерисовкам
  const callbacksRef = useRef({ onRegisterSwapped, onUnregisterSwapped });
  useEffect(() => {
    callbacksRef.current = { onRegisterSwapped, onUnregisterSwapped };
  }, [onRegisterSwapped, onUnregisterSwapped]);

  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      const weekday = weekdays[d.getDay()];
      return `${hours}:${minutes}  ${weekday}  ${day}.${month}.${year}`;
    } catch {
      return dateStr;
    }
  };

  const handleStart = useCallback((clientX: number) => {
    startXRef.current = clientX;
    offsetXRef.current = offsetX;   // начальное смещение (обычно 0)
    isDraggingRef.current = true;
    setIsPressed(true);
  }, [offsetX]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDraggingRef.current) return;
    const diff = clientX - startXRef.current;
    let newOffset = offsetXRef.current + diff * SWIPE_FACTOR;
    newOffset = Math.min(150, Math.max(newOffset, -150));
    offsetXRef.current = newOffset;   // синхронно обновляем ref
    setOffsetX(newOffset);
  }, []);

  const handleEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPressed(false);

    const finalOffset = offsetXRef.current;   // берём актуальное смещение
    const swipedLeft = finalOffset < -SWIPE_THRESHOLD;
    const swipedRight = finalOffset > SWIPE_THRESHOLD;

    if (swipedLeft && !is_registered) {
      callbacksRef.current.onRegisterSwapped();
    } else if (swipedRight && is_registered) {
      callbacksRef.current.onUnregisterSwapped();
    }

    // Сброс после обработки
    offsetXRef.current = 0;
    setOffsetX(0);
  }, [is_registered]);

  // Touch‑обработчики
  const touchHandlers = {
    onTouchStart: (e: React.TouchEvent) => handleStart(e.touches[0].clientX),
    onTouchMove: (e: React.TouchEvent) => handleMove(e.touches[0].clientX),
    onTouchEnd: handleEnd,
    onTouchCancel: handleEnd,
  };

  // Mouse‑обработчики с корректной подпиской/отпиской
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);

    const onMouseMove = (ev: MouseEvent) => handleMove(ev.clientX);
    const onMouseUp = () => {
      handleEnd();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [handleStart, handleMove, handleEnd]);

  const topSectionStyle = {
    transform: `translateX(${offsetX}px)`,
    transition: isDraggingRef.current
      ? 'none'
      : 'transform 0.3s ease-out, filter 0.15s ease-out',
    filter: isPressed ? 'brightness(0.9)' : 'brightness(1)',
  };

  const topPanelClass = is_registered
    ? `${styles.topPanel} ${styles.topPanelRegistered}`
    : styles.topPanel;

  return (
    <div
      ref={containerRef}
      className={styles.container}
      {...touchHandlers}
      onMouseDown={onMouseDown}
    >
      <div className={styles.bottomPanel} />

      <div
        className={topPanelClass}
        style={topSectionStyle}
        onClick={onMoreClick}
      >
        <Panel mode="primary" className={styles.panelContent}>
          <div className={styles.header}>
            <Typography.Title variant="medium-strong" className={styles.title}>
              {title}
            </Typography.Title>
            <div className={styles.pointsBadge}>
              <span className={styles.pointsValue}>🏆 {points}</span>
            </div>
          </div>
          <Flex gap={8} wrap="wrap" style={{ marginTop: 8 }}>
            {tags.map((tag: TagInfoResponse, idx) => (
            <span key={idx} style={{
              background: 'var(--background-secondary, #f0f0f0)',
              padding: '4px 8px',
              borderRadius: 8,
              fontSize: 14,
            }}>
              🏷️ {tag.title}
            </span>
          ))}
          </Flex>
          <div className={styles.dateWrapper}>
            <span className={styles.date}>🗓️ {formatEventDate(date)}</span>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default EventCard;