import { useState, useRef, useCallback } from 'react';
import { Panel, Typography, Flex } from '@maxhub/max-ui';
import styles from './EventCard.module.scss';

export interface EventInfo {
  name: string;
  tags: string[];
  is_registered: boolean;
  points: number;
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
  const { name, tags, is_registered, points } = eventInfo;

  // Увеличили порог срабатывания свайпа (было 60, стало 120)
  const SWIPE_THRESHOLD = 60;
  // Максимальное смещение в пикселях (можно оставить 120 или увеличить)
  const MAX_OFFSET = 70;

  const [offsetX, setOffsetX] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentOffsetRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const handleStart = useCallback((clientX: number) => {
    startXRef.current = clientX;
    currentOffsetRef.current = offsetX;
    isDraggingRef.current = true;
  }, [offsetX]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDraggingRef.current) return;
    const diff = clientX - startXRef.current;
    
    // Добавляем сопротивление: умножаем diff на коэффициент < 1, чтобы движение было медленнее
    const RESISTANCE = 0.7; // чем меньше число, тем "тяжелее" двигать
    let newOffset = currentOffsetRef.current + diff * RESISTANCE;
    
    // Ограничиваем смещение симметрично от -MAX_OFFSET до MAX_OFFSET
    newOffset = Math.min(MAX_OFFSET, Math.max(newOffset, -MAX_OFFSET));
    setOffsetX(newOffset);
  }, []);

  const handleEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

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
    transition: isDraggingRef.current ? 'none' : 'transform 0.3s ease-out',
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      {...touchHandlers}
      {...mouseHandlers}
    >
      <div className={styles.bottomPanel}></div>

      <div
        className={styles.topPanel}
        style={topSectionStyle}
        onClick={onMoreClick}
      >
        <Panel mode="primary" className={styles.panelContent}>
          <Typography.Title variant="medium-strong">{name}</Typography.Title>
          <Typography.Body>Баллы: {points}</Typography.Body>
          <Flex gap={8} wrap="wrap" style={{ marginTop: 8 }}>
            {tags.map((tag, idx) => (
              <span key={idx} className={styles.tag}>
                🏷️ {tag}
              </span>
            ))}
          </Flex>
        </Panel>
      </div>
    </div>
  );
};