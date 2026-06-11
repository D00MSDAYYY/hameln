import { useEffect, useMemo, useState } from 'react';
import { Input, Typography } from '@maxhub/max-ui';
import type { CSSProperties } from 'react';
import type { CompanySuggestionResponse } from '../api/types';
import { userApi } from '../api/user';
import styles from './CompanyInput.module.css';

interface CompanyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}

export const CompanyInput = ({
  value,
  onChange,
  placeholder = 'Введите компанию',
  style,
}: CompanyInputProps) => {
  const [suggestions, setSuggestions] = useState<CompanySuggestionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const query = value.trim();

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      try {
        setSuggestions(await userApi.suggestCompanies(query));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const visibleSuggestions = useMemo(
    () => suggestions.filter((suggestion) => suggestion.name),
    [suggestions]
  );

  const showSuggestions = isFocused && visibleSuggestions.length > 0;

  return (
    <div className={styles.container}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
        style={style}
      />

      {loading && (
        <Typography.Body className={styles.status}>
          Поиск компаний...
        </Typography.Body>
      )}

      {showSuggestions && (
        <div className={styles.suggestions}>
          {visibleSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.inn ?? suggestion.name}-${index}`}
              type="button"
              className={styles.suggestion}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(suggestion.name);
                setIsFocused(false);
              }}
            >
              <span className={styles.name}>{suggestion.name}</span>
              {(suggestion.inn || suggestion.address) && (
                <span className={styles.meta}>
                  {[suggestion.inn && `ИНН ${suggestion.inn}`, suggestion.address]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
