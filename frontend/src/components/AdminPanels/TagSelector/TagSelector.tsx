import { useState, useEffect, useRef } from 'react';
import { Input, Panel, Flex, Typography } from '@maxhub/max-ui';
import type { Tag } from '../../api/types';
import styles from './TagSelector.module.scss';

interface TagSelectorProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export const TagSelector = ({ selected, onChange }: TagSelectorProps) => {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [filter, setFilter] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/tags', { credentials: 'include' })
      .then(res => res.json())
      .then((data: Tag[]) => setAllTags(data))
      .catch(console.error);
  }, []);

  // Закрываем дропдаун при клике вне компонента
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, []);

  const filteredTags = allTags.filter(tag =>
    tag.name.toLowerCase().includes(filter.toLowerCase()) &&
    !selected.includes(tag.name)
  );

  const addTag = (tagName: string) => {
    if (!selected.includes(tagName)) {
      onChange([...selected, tagName]);
    }
    setFilter('');
    setShowDropdown(false);
  };

  const removeTag = (tagName: string) => {
    onChange(selected.filter(t => t !== tagName));
  };

  return (
    <div ref={containerRef} className={styles.tagSelector}>
      <Flex gap={4} wrap="wrap" className={styles.selectedTags}>
        {selected.map(tag => (
          <span key={tag} className={styles.tagBadge} onClick={() => removeTag(tag)}>
            {tag} ✕
          </span>
        ))}
      </Flex>
      <div className={styles.inputWrapper}>
        <Input
          placeholder={selected.length ? '' : 'Выберите теги...'}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
        />
      </div>
      {showDropdown && filteredTags.length > 0 && (
        <Panel mode="secondary" className={styles.dropdown}>
          {filteredTags.map(tag => (
            <div key={tag.id} className={styles.dropdownItem} onClick={() => addTag(tag.name)}>
              <Typography.Body>{tag.name}</Typography.Body>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
};


export default TagSelector;