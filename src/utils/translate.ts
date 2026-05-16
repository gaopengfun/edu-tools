interface TranslateItem {
  word: string;
  translatedText: string;
  success: boolean;
  message: string | null;
}

interface TranslateResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

const ENDPOINT = '/api-blog/translate/batch';
const BATCH_LIMIT = 50;
const REQUEST_TIMEOUT_MS = 10000;

async function callTranslateBatch(words: string[]): Promise<TranslateItem[]> {
  const token = import.meta.env.VITE_APP_X_TOKEN;
  if (!token) {
    throw new Error('VITE_APP_X_TOKEN is not set');
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Token': token
    },
    body: JSON.stringify({ words }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`translate request failed: ${response.status}`);
  }

  const result = (await response.json()) as TranslateResponse<TranslateItem[]>;
  if (!result.success || !Array.isArray(result.data)) {
    throw new Error(result.message ?? 'translate request failed');
  }
  return result.data;
}

export async function batchTranslate(words: string[]): Promise<string[]> {
  if (words.length === 0) return [];

  const results: string[] = [];
  for (let i = 0; i < words.length; i += BATCH_LIMIT) {
    const chunk = words.slice(i, i + BATCH_LIMIT);
    try {
      const data = await callTranslateBatch(chunk);
      results.push(
        ...chunk.map((_, j) => {
          const item = data[j];
          return item && item.success ? item.translatedText : '';
        })
      );
    } catch (error) {
      console.error('翻译请求失败:', error);
      results.push(...chunk.map(() => ''));
    }
  }
  return results;
}

export async function translateWord(word: string): Promise<string> {
  if (!word.trim()) return '';
  const [translation] = await batchTranslate([word]);
  return translation || '';
}
