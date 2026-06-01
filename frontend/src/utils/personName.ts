export const isValidPersonName = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) return false;

  return Array.from(trimmed).every((char) => char === '-' || /^\p{L}$/u.test(char));
};
