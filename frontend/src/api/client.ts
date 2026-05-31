type RequestOptions = RequestInit & {
  parseAs?: 'json' | 'blob' | 'text' | 'empty';
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const readErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    return data.detail || data.message || 'Ошибка запроса';
  } catch {
    return 'Ошибка запроса';
  }
};

export const apiRequest = async <T>(
  path: string,
  { parseAs = 'json', headers, ...options }: RequestOptions = {},
): Promise<T> => {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (parseAs === 'empty') return undefined as T;
  if (parseAs === 'blob') return (await response.blob()) as T;
  if (parseAs === 'text') return (await response.text()) as T;

  return response.json() as Promise<T>;
};
