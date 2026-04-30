import { useState } from 'react';
import { Typography, Panel, Flex, Button, Input, Switch } from '@maxhub/max-ui';
import type { EventDetail } from '../../api/types';
import TagSelector from './TagSelector/TagSelector'

interface EventFormPanelProps {
    initial?: Partial<EventDetail>;
    onSave: (data: Record<string, any>) => void;
    onCancel: () => void;
}

export const EventFormPanel = ({ initial, onSave, onCancel }: EventFormPanelProps) => {
    const [name, setName] = useState(initial?.name || '');
    const [description, setDescription] = useState(initial?.description || '');
    const [points, setPoints] = useState(String(initial?.points ?? 0));
    const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 16) : '');
    const [link, setLink] = useState(initial?.link || '');
    const [isArchived, setIsArchived] = useState(initial?.is_archived ?? false);

    const tagsFromInitial = initial?.tags || [];
    const [selectedTags, setSelectedTags] = useState<string[]>(tagsFromInitial);

    const handleSubmit = () => {
        if (!name.trim()) return;
        const body = {
            name,
            description: description || null,
            tags: selectedTags,
            points: parseInt(points, 10) || 0,
            date: new Date(date).toISOString(),
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
                    <Input placeholder="Введите название" value={name} onChange={(e) => setName(e.target.value)} />
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
                        onChange={(newTags) => setSelectedTags(newTags)}
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
                    <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
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

            <Flex gap={12} justify="flex-end" style={{ marginTop: 20 }}>
                <Button mode="secondary" onClick={onCancel}>Отмена</Button>
                <Button mode="primary" onClick={handleSubmit}>Сохранить</Button>
            </Flex>
        </div>
    );
};