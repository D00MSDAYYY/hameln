// TagSelector.tsx
import { useState, useEffect, useRef } from 'react';
import { Input, Flex, Button, Panel } from '@maxhub/max-ui';
import type { TagInfoResponse } from '../../../api/types';

interface TagSelectorProps {
  selected: TagInfoResponse[];
  onChange: (tags: TagInfoResponse[]) => void;
}

export const TagSelector = ({ selected, onChange }: TagSelectorProps) => {
  const [inputValue, setInputValue] = useState('');
  const [allTags, setAllTags] = useState<TagInfoResponse[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Получаем все существующие теги при монтировании
  useEffect(() => {
    fetch('/api/tags', { credentials: 'include' })
      .then(async res => {
        console.log('Статус:', res.status);
        const text = await res.text();
        console.log('Ответ сервера (первые 500 символов):', text.substring(0, 500));
        return JSON.parse(text);
      })
      .then(data => {
        console.log('Теги получены:', data);
        setAllTags(data || []);
      })
      .catch(err => console.error('Ошибка загрузки тегов:', err));
  }, []);

  // Фильтруем теги, исключая уже выбранные, и ищем по началу строки
  const filteredSuggestions = allTags.filter(
    tag =>
      !selected.some(s => s.title === tag.title) &&
      tag.title?.toLowerCase().startsWith(inputValue.toLowerCase())
  );

  // Проверяем, есть ли уже в точности такой тег (выбран или существует)
  const exactMatchExists = selected.some(s => s.title === inputValue.trim()) ||
    allTags.some(t => t.title === inputValue.trim());

  const addTag = (tag: TagInfoResponse) => {
    if (!selected.some(s => s.title === tag.title)) {
      onChange([...selected, tag]);
    }
    setInputValue('');
    setShowSuggestions(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  const addCustomTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const newTag: TagInfoResponse = { title: trimmed };
    addTag(newTag);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomTag();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0) {
        addTag(filteredSuggestions[highlightIndex]);
      } else {
        addCustomTag();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightIndex(-1);
    }
  };

  // Закрываем подсказки при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef}>
      <Flex gap={8} wrap="wrap" style={{ marginBottom: 8 }}>
        {selected.map(tag => (
          <Panel
            key={tag.title ?? tag.id}
            mode="secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 8,
            }}
          >
            <span>{tag.title}</span>
            <button
              onClick={() => onChange(selected.filter(t => t.title !== tag.title))}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
                padding: 0,
                marginLeft: 4,
              }}
              aria-label={`Удалить ${tag.title}`}
            >
              ×
            </button>
          </Panel>
        ))}
      </Flex>

      <div style={{ position: 'relative' }}>
        <Flex gap={8}>
          <Input
            ref={inputRef}
            placeholder="Введите тег"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => inputValue && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
          />
          <Button
            mode="secondary"
            onClick={addCustomTag}
            disabled={!inputValue.trim() || exactMatchExists}
          >
            Добавить
          </Button>
        </Flex>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 10,
              background: 'var(--background-primary, white)',
              border: '1px solid var(--border, #ccc)',
              borderRadius: 8,
              marginTop: 4,
              maxHeight: 200,
              overflowY: 'auto',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {filteredSuggestions.map((tag, index) => (
              <div
                key={tag.title ?? index}
                onClick={() => addTag(tag)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: index === highlightIndex ? 'var(--accent-light, #eef)' : 'transparent',
                  borderBottom: '1px solid var(--border-light, #eee)',
                }}
                onMouseEnter={() => setHighlightIndex(index)}
              >
                {tag.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagSelector;