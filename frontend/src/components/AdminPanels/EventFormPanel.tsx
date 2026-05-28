import { useState, useEffect, useMemo } from 'react';
import { Typography, Panel, Flex, Button, Input, Switch } from '@maxhub/max-ui';
import TagSelector from './TagSelector/TagSelector';
import type { EventInfoResponse, TagInfoResponse } from '../../api/types';

interface EventFormPanelProps {
  initial?: EventInfoResponse;
  onSave: (body: Record<string, any>) => void | Promise<void>;
  onCancel: () => void;
}

const safeToLocalDatetime = (raw?: string | null): string => {
  if (!raw) return '';
  const d = new Date(raw);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
};

const localToISO = (local: string): string | null => {
  if (!local) return null;
  const d = new Date(local);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

export const EventFormPanel = ({ initial, onSave, onCancel }: EventFormPanelProps) => {
  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 16), []);

  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [points, setPoints] = useState(String(initial?.points ?? 0));
  const [date, setDate] = useState(initial?.date ? safeToLocalDatetime(initial.date) : defaultDate);
  const [link, setLink] = useState(initial?.link || '');
  const [isArchived, setIsArchived] = useState(initial?.is_archived ?? false);
  const [selectedTags, setSelectedTags] = useState<TagInfoResponse[]>(initial?.tags || []);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title || '');
      setDescription(initial.description || '');
      setPoints(String(initial.points ?? 0));
      setDate(safeToLocalDatetime(initial.date) || defaultDate);
      setLink(initial.link || '');
      setIsArchived(initial.is_archived ?? false);
      setSelectedTags(initial.tags || []);
    } else {
      setTitle('');
      setDescription('');
      setPoints('0');
      setDate(defaultDate);
      setLink('');
      setIsArchived(false);
      setSelectedTags([]);
    }
  }, [initial, defaultDate]);

  const handleSubmit = () => {
    if (!title.trim()) return;

    const isoDate = localToISO(date);
    if (!isoDate) {
      setDateError('Некорректная дата');
      return;
    }
    setDateError(null);

    const body = {
      title,
      description: description || null,
      tags: selectedTags,
      points: parseInt(points, 10) || 0,
      date: isoDate,
      link: link || null,
      is_archived: isArchived,
    };
    onSave(body);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Typography.Title variant="small-strong">Название</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input placeholder="Введите название" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Описание</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input placeholder="Введите описание" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Теги</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <TagSelector
            selected={selectedTags}
            onChange={(newTags: TagInfoResponse[]) => setSelectedTags(newTags)}
          />
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Баллы</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input placeholder="150" type="number" value={points} onChange={(e) => setPoints(e.target.value)} />
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Дата и время</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input
            type="datetime-local"
            value={date}
            onChange={(e) => { setDate(e.target.value); setDateError(null); }}
          />
          {dateError && <Typography.Body style={{ color: 'red', marginTop: 4 }}>{dateError}</Typography.Body>}
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Ссылка</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input placeholder="https://example.com" value={link} onChange={(e) => setLink(e.target.value)} />
        </Panel>
      </div>

      {initial && (
        <div>
          <Typography.Title variant="small-strong">Архив</Typography.Title>
          <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
            <Flex justify="space-between" align="center">
              <Typography.Body>Поместить в архив</Typography.Body>
              <Switch checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)} />
            </Flex>
          </Panel>
        </div>
      )}

      <Flex gap={12} style={{ marginTop: 20 }}>
        <Button mode="primary" stretched onClick={handleSubmit}>Сохранить</Button>
      </Flex>
    </div>
  );
};

export default EventFormPanel;