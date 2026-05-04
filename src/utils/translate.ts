const API_BASE_URL = import.meta.env.VITE_BLOG_API_BASE_URL || 'http://localhost:8080';
const INTERNAL_TOKEN = import.meta.env.VITE_TRANSLATE_INTERNAL_TOKEN || '';

// Validate configuration on module load
if (!INTERNAL_TOKEN) {
  console.warn(
    '[translate] VITE_TRANSLATE_INTERNAL_TOKEN is not configured. ' +
    'Translation requests will fail authentication. ' +
    'Please set this variable in your .env.local file.'
  );
}

export async function translateWord(word: string): Promise<string> {
  if (!word.trim()) {
    return '';
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api-blog/translate/word`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify({ word }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error('[translate] translateWord failed:', {
        word,
        status: response.status,
        statusText: response.statusText
      });
      return '';
    }

    const data = await response.json();

    // Validate response structure
    if (typeof data !== 'object' || data === null) {
      console.error('[translate] Invalid response format:', { word, data });
      return '';
    }

    if (!('translation' in data)) {
      console.error('[translate] Missing translation field in response:', { word, data });
      return '';
    }

    return data.translation || '';
  } catch (error) {
    console.error('[translate] translateWord error:', { word, error });
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
  if (words.length === 0) {
    return [];
  }

  const chunks = chunkArray(words, 50);
  const results: string[] = [];

  for (const chunk of chunks) {
    try {
      const response = await fetch(`${API_BASE_URL}/api-blog/translate/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN
        },
        body: JSON.stringify({ words: chunk }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        console.error('[translate] batchTranslate failed:', {
          wordCount: chunk.length,
          status: response.status,
          statusText: response.statusText
        });
        results.push(...chunk.map(() => ''));
        continue;
      }

      const data = await response.json();

      // Validate response structure
      if (typeof data !== 'object' || data === null) {
        console.error('[translate] Invalid batch response format:', {
          wordCount: chunk.length,
          data
        });
        results.push(...chunk.map(() => ''));
        continue;
      }

      if (!('translations' in data) || !Array.isArray(data.translations)) {
        console.error('[translate] Missing or invalid translations field in batch response:', {
          wordCount: chunk.length,
          data
        });
        results.push(...chunk.map(() => ''));
        continue;
      }

      results.push(...data.translations);
    } catch (error) {
      console.error('[translate] batchTranslate error:', {
        wordCount: chunk.length,
        error
      });
      results.push(...chunk.map(() => ''));
    }
  }

  return results;
}


