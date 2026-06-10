import { useState, useEffect } from 'react';
import { Flex, Panel, Typography, IconButton, Spinner } from '@maxhub/max-ui';
import type { TagInfoResponse } from '../../../api/types';
import { userApi } from '../../../api/user';
import { SearchableItemsWidget } from '../../SearchableItemsWidget';

interface TagSelectorProps {
  selected: TagInfoResponse[];
  onChange: (tags: TagInfoResponse[]) => void;
}

export const TagSelector = ({ selected, onChange }: TagSelectorProps) => {
  const [allTags, setAllTags] = useState<TagInfoResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi
      .getTags()
      .then((data) => {
        setAllTags(data || []);
      })
      .catch(err => {
        console.error('[TagSelector] Ошибка загрузки тегов:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const availableTags = allTags.filter(
    tag => !selected.some(s => s.title === tag.title)
  );

  const addTag = (tag: TagInfoResponse) => {
    if (!selected.some(s => s.title === tag.title)) {
      onChange([...selected, tag]);
    }
  };

  const removeTag = (tagTitle: string) => {
    onChange(selected.filter(t => t.title !== tagTitle));
  };

  if (loading) {
    return <Spinner size={20} />;
  }

  return (
    <Flex direction="column" gap={12}>
      <SearchableItemsWidget
        items={availableTags}
        buttonLabel="Выбрать тег"
        title="Теги"
        searchPlaceholder="Поиск по тегам"
        emptyText="Все теги добавлены"
        getItemLabel={(tag) => tag.title || 'Тег'}
        getItemKey={(tag, index) => tag.id ?? tag.title ?? index}
        onItemClick={addTag}
      />

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
