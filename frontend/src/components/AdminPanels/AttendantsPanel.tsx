import { useState } from 'react';
import { Typography, Panel, Flex, Button } from '@maxhub/max-ui';
import { AttendantsEditor } from './AttendantsEditor';
import type {  EventInfoResponse } from '../../api/types';

interface AttendantsPanelProps {
  event: EventInfoResponse;
  initialAttendants: UserSearchItem[];
  onSave: (attendantIds: number[]) => Promise<void>;
  onBack: () => void;
}

export const AttendantsPanel = ({
  event,
  initialAttendants,
  onSave,
  onBack,
}: AttendantsPanelProps) => {
  const [attendants, setAttendants] = useState<UserSearchItem[]>(initialAttendants);

  const handleSave = async () => {
    const ids = attendants.map((u) => u.id);
    await onSave(ids);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Panel mode="primary" style={{ flex: 1, padding: 12, borderRadius: 16, overflow: 'hidden' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
          <Button mode="tertiary" onClick={onBack}>
            ← Назад
          </Button>
          <Typography.Title variant="medium-strong">
            Посетители: {event.title}
          </Typography.Title>
          <div style={{ width: 48 }} />
        </Flex>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Блок посетителей в стиле EventFormPanel */}
          <div>
            <Typography.Title variant="small-strong">Посетители</Typography.Title>
            <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
              <AttendantsEditor value={attendants} onChange={setAttendants} />
            </Panel>
          </div>
        </div>

        <Flex justify="flex-end" gap={8} style={{ marginTop: 20 }}>
          <Button mode="secondary" onClick={onBack}>
            Отмена
          </Button>
          <Button mode="primary" onClick={handleSave}>
            Сохранить
          </Button>
        </Flex>
      </Panel>
    </div>
  );
};