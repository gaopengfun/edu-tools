import CryptoJS from 'crypto-js';

function generateSign(appKey: string, query: string, salt: string, appSecret: string): string {
  const str = appKey + query + salt + appSecret;
  return CryptoJS.MD5(str).toString();
}

export async function translateWord(word: string): Promise<string> {
  const appKey = import.meta.env.VITE_YOUDAO_APP_KEY;
  const appSecret = import.meta.env.VITE_YOUDAO_APP_SECRET;

  if (!appKey || !appSecret) {
    return '';
  }

  const salt = Date.now().toString();
  const sign = generateSign(appKey, word, salt, appSecret);

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        q: word,
        from: 'en',
        to: 'zh-CHS',
        appKey,
        salt,
        sign
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return '';
    }

    const data = await response.json();
    if (data.errorCode === '0' && data.translation && data.translation.length > 0) {
      return data.translation[0];
    }
    return '';
  } catch {
    return '';
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function batchTranslate(words: string[]): Promise<string[]> {
  const chunks = chunkArray(words, 50);
  const results: string[] = [];

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(word => translateWord(word))
    );
    results.push(...chunkResults);
  }

  return results;
}
