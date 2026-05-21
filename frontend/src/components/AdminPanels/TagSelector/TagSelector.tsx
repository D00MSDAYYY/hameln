// TagSelector.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Input, Flex, Panel, Typography, IconButton, Spinner } from '@maxhub/max-ui';
import type { TagInfoResponse } from '../../../api/types';

interface TagSelectorProps {
  selected: TagInfoResponse[];
  onChange: (tags: TagInfoResponse[]) => void;
}

export const TagSelector = ({ selected, onChange }: TagSelectorProps) => {
  const [query, setQuery] = useState('');
  const [allTags, setAllTags] = useState<TagInfoResponse[]>([]);
  const [results, setResults] = useState<TagInfoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Загрузка всех тегов с сервера
  useEffect(() => {
    console.log('[TagSelector] Загружаю теги с /user/tags ...');
    fetch('/api/user/tags', { credentials: 'include' })
      .then(async res => {
        console.log('[TagSelector] Статус ответа:', res.status);
        if (!res.ok) {
          console.log('[TagSelector] Ответ не ok, читаю текст ошибки...');
          const text = await res.text();
          console.log('[TagSelector] Текст ответа:', text);
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        console.log('[TagSelector] Получены теги:', data);
        setAllTags(data || []);
      })
      .catch(err => {
        console.error('[TagSelector] Ошибка загрузки тегов:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Фильтрация при вводе
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      if (value.trim().length === 0) {
        setResults([]);
        return;
      }
      const lower = value.toLowerCase();
      console.log('[TagSelector] allTags:', allTags);
      const filtered = allTags.filter(
        tag =>
          tag.title?.toLowerCase().startsWith(lower) &&
          !selected.some(s => s.title === tag.title)
      );
      console.log('[TagSelector] После фильтрации:', filtered);
      setResults(filtered);
    },
    [allTags, selected]
  );

  // Добавление тега (существующего или созданного)
  const addTag = useCallback(
    (tag: TagInfoResponse) => {
      console.log('[TagSelector] Добавляю тег:', tag);
      if (!selected.some(s => s.title === tag.title)) {
        onChange([...selected, tag]);
      }
      setQuery('');
      setResults([]);
      inputRef.current?.focus();
    },
    [selected, onChange]
  );

  // Создать новый тег, если не найден
  const createAndAddTag = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    console.log('[TagSelector] Enter нажат, создаю/добавляю тег:', trimmed);
    // Ищем точное совпадение среди предложенных результатов
    const exactMatch = results.find(
      r => r.title?.toLowerCase() === trimmed.toLowerCase()
    );
    if (exactMatch) {
      addTag(exactMatch);
    } else {
      addTag({ title: trimmed });
    }
  }, [query, results, addTag]);

  const removeTag = (tagTitle: string) => {
    console.log('[TagSelector] Удаляю тег:', tagTitle);
    onChange(selected.filter(t => t.title !== tagTitle));
  };

  // Обработка Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createAndAddTag();
    }
  };

  if (loading) {
    return <Spinner size={20} />;
  }

  return (
    <Flex direction="column" gap={12}>
      {/* Поиск / добавление */}
      <Flex direction="column" gap={8}>
        <Input
          mode="secondary"
          placeholder="Введите тег..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          style={{ width: '100%' }}
        />
        {results.length > 0 && (
          <Flex direction="column" gap={4}>
            {results.map(tag => (
              <Panel
                key={tag.title}
                mode="secondary"
                style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}
                onClick={() => addTag(tag)}
              >
                <Typography.Body>{tag.title}</Typography.Body>
              </Panel>
            ))}
          </Flex>
        )}
      </Flex>

      {/* Выбранные теги */}
      {selected.length > 0 ? (
        <Flex direction="column" gap={8}>
          {selected.map(tag => (
            <Panel
              key={tag.title}
              mode="secondary"
              style={{ padding: '8px 12px', borderRadius: 8 }}
            >
              <Flex justify="space-between" align="center">
                <Typography.Body>{tag.title}</Typography.Body>
                <IconButton
                  mode="tertiary"
                  size="small"
                  onClick={() => removeTag(tag.title!)}
                >
                  <span>✕</span>
                </IconButton>
              </Flex>
            </Panel>
          ))}
        </Flex>
      ) : (
        <Typography.Body variant="small" style={{ color: 'var(--text-secondary)' }}>
          Теги пока не добавлены
        </Typography.Body>
      )}
    </Flex>
  );
};

export default TagSelector;