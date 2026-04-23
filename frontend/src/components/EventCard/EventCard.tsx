import { useState, useRef, useCallback } from 'react';
import { Panel, Typography, Flex } from '@maxhub/max-ui';
import styles from './EventCard.module.scss';

export interface EventInfo {
  name: string;
  tags: string[];
  is_registered: boolean;
  points: number;
  date: string;
}

interface EventCardProps {
  eventInfo: EventInfo;
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
  const { name, tags, is_registered, points, date } = eventInfo;

  const SWIPE_THRESHOLD = 100;
  const [offsetX, setOffsetX] = useState(0);
  const [isPressed, setIsPressed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentOffsetRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const handleStart = useCallback((clientX: number) => {
    startXRef.current = clientX;
    currentOffsetRef.current = offsetX;
    isDraggingRef.current = true;
    setIsPressed(true);
  }, [offsetX]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDraggingRef.current) return;
    const diff = clientX - startXRef.current;
    let newOffset = currentOffsetRef.current + diff;
    newOffset = Math.min(150, Math.max(newOffset, -150));
    setOffsetX(newOffset);
  }, []);

  const handleEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPressed(false);

    const swipedLeft = offsetX < -SWIPE_THRESHOLD;
    const swipedRight = offsetX > SWIPE_THRESHOLD;

    if (swipedLeft && !is_registered) {
      onRegisterSwapped();
    } else if (swipedRight && is_registered) {
      onUnregisterSwapped();
    }

    setOffsetX(0);
  }, [offsetX, is_registered, onRegisterSwapped, onUnregisterSwapped]);

  const touchHandlers = {
    onTouchStart: (e: React.TouchEvent) => handleStart(e.touches[0].clientX),
    onTouchMove: (e: React.TouchEvent) => handleMove(e.touches[0].clientX),
    onTouchEnd: handleEnd,
    onTouchCancel: handleEnd,
  };

  const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
  const onMouseUp = () => {
    handleEnd();
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  const mouseHandlers = {
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
  };

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
      {...mouseHandlers}
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
      {name}
    </Typography.Title>
    <div className={styles.pointsBadge}>
      <span className={styles.pointsValue}>{points}</span>
    </div>
  </div>
  <Flex gap={8} wrap="wrap" style={{ marginTop: 8 }}>
    {tags.map((tag, idx) => (
      <span key={idx} className={styles.tag}>
        🏷️ {tag}
      </span>
    ))}
  </Flex>
  {/* Дата теперь в потоке, прижата к правому краю и имеет автоматический отступ сверху */}
  <div className={styles.dateWrapper}>
    <span className={styles.date}>📅 {date}</span>
  </div>
</Panel>
      </div>
    </div>
  );
};