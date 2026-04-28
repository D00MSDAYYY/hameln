import { useState } from 'react';
import { Typography, Panel, CellList, CellSimple, Flex, IconButton, Button } from '@maxhub/max-ui';
import type { EventItem } from '../../api/types';

// Моковые данные мероприятий (можно вынести в общий файл)
const mockAdminEvents: EventInfo[] = [
  {
    name: 'Конференция по React',
    tags: ['React', 'Frontend'],
    is_registered: false,
    points: 150,
    date: '25 мая 2025, 10:00',
  },
  {
    name: 'Воркшоп по FastAPI',
    tags: ['Python', 'Backend', 'API'],
    is_registered: true,
    points: 200,
    date: '27 мая 2025, 14:00',
  },
  {
    name: 'Встреча сообщества VK Mini Apps',
    tags: ['VK', 'Mini Apps', 'Сообщество'],
    is_registered: false,
    points: 75,
    date: '30 мая 2025, 18:30',
  },
  // ... остальные можно добавить при необходимости
];

const EditEventsPanel = ({ onBack }: { onBack: () => void }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Panel
      mode="primary"
      style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12, borderRadius: 16, overflow: 'hidden' }}
    >
      {/* Шапка с заголовком и стрелкой назад */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <IconButton mode="tertiary" onClick={onBack}>
          <span style={{ fontSize: 20 }}>←</span>
        </IconButton>
        <Typography.Title variant="medium-strong">Редактирование</Typography.Title>
        <div style={{ width: 48 }} />
      </Flex>

      {/* Прокручиваемый список мероприятий */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {mockAdminEvents.map((event, idx) => (
          <Panel key={idx} mode="secondary" style={{ padding: 12, borderRadius: 12, marginBottom: 8 }}>
            <Flex justify="space-between" align="center">
              <Typography.Body style={{ flex: 1 }}>{event.name}</Typography.Body>
              <Typography.Body style={{ flex: 1, textAlign: 'center', color: 'var(--text-secondary)' }}>
                {event.date}
              </Typography.Body>
              <Flex gap={8} style={{ flexShrink: 0 }}>
                <Button mode="tertiary" size="small" onClick={() => console.log('Редактировать', event.name)}>
                  ✏️
                </Button>
                <Button mode="tertiary" size="small" onClick={() => console.log('Удалить', event.name)}>
                  🗑️
                </Button>
              </Flex>
            </Flex>
          </Panel>
        ))}
      </div>
    </Panel>
  </div>
);

export default EditEventsPanel;