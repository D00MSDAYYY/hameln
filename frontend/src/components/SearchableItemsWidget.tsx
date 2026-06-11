import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button, IconButton, Input, Panel, Typography } from '@maxhub/max-ui';
import styles from './SearchableItemsWidget.module.css';

interface SearchableItemsWidgetProps<T> {
  items?: T[] | null;
  buttonLabel: string;
  title: string;
  searchPlaceholder: string;
  emptyText: string;
  noResultsText?: string;
  getItemLabel: (item: T) => string;
  getItemKey?: (item: T, index: number) => string | number;
  getItemSearchText?: (item: T) => string;
  onItemClick?: (item: T) => void;
  renderItem?: (item: T) => ReactNode;
}

export function SearchableItemsWidget<T>({
  items,
  buttonLabel,
  title,
  searchPlaceholder,
  emptyText,
  noResultsText = 'Ничего не найдено',
  getItemLabel,
  getItemKey,
  getItemSearchText,
  onItemClick,
  renderItem,
}: SearchableItemsWidgetProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const itemsList = items ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = normalizedSearch
    ? itemsList.filter((item) => {
        const searchText = getItemSearchText?.(item) ?? getItemLabel(item);
        return searchText.toLowerCase().includes(normalizedSearch);
      })
    : itemsList;

  const closeModal = () => {
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={styles.container}>
      <Button
        mode="secondary"
        stretched
        onClick={() => setIsOpen(true)}
        className={styles.toggleButton}
      >
        {buttonLabel}
      </Button>

      {isOpen && (
        <div className={styles.overlay} onClick={closeModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="searchable-items-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.header}>
              <Typography.Title
                id="searchable-items-title"
                variant="medium-strong"
                className={styles.title}
              >
                {title}
              </Typography.Title>
              <IconButton mode="tertiary" onClick={closeModal}>
                <span className={styles.closeIcon}>×</span>
              </IconButton>
            </div>

            <Panel mode="secondary" className={styles.searchPanel}>
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </Panel>

            <div className={styles.content}>
              {filteredItems.length > 0 ? (
                <div className={styles.list}>
                  {filteredItems.map((item, index) => (
                    <span
                      key={getItemKey?.(item, index) ?? index}
                      className={
                        onItemClick
                          ? `${styles.item} ${styles.clickableItem}`
                          : styles.item
                      }
                      onClick={() => onItemClick?.(item)}
                    >
                      {renderItem?.(item) ?? getItemLabel(item)}
                    </span>
                  ))}
                </div>
              ) : (
                <Typography.Body className={styles.empty}>
                  {itemsList.length > 0 ? noResultsText : emptyText}
                </Typography.Body>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
