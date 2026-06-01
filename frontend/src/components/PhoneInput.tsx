import type { CSSProperties } from 'react';
import { Input, Typography } from '@maxhub/max-ui';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}

export const PHONE_TAIL_LENGTH = 10;

export const getPhoneTail = (phone?: string | null) => {
  const digits = (phone || '').replace(/\D/g, '');

  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return digits.slice(1);
  }

  return digits.slice(0, PHONE_TAIL_LENGTH);
};

export const buildRussianPhone = (phoneTail: string) => `+7${getPhoneTail(phoneTail)}`;

export const isCompletePhoneTail = (phoneTail: string) =>
  getPhoneTail(phoneTail).length === PHONE_TAIL_LENGTH;

export const PhoneInput = ({
  value,
  onChange,
  placeholder = '0000000000',
  style,
}: PhoneInputProps) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <div
      style={{
        minWidth: 48,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--border-color, #d0d5dd)',
        borderRadius: 8,
        background: 'var(--background-secondary, #f7f7f8)',
      }}
    >
      <Typography.Body>+7</Typography.Body>
    </div>
    <Input
      type="tel"
      inputMode="numeric"
      placeholder={placeholder}
      value={getPhoneTail(value)}
      maxLength={PHONE_TAIL_LENGTH}
      onChange={(e) => onChange(getPhoneTail(e.target.value))}
      style={{ flex: 1, ...style }}
    />
  </div>
);
