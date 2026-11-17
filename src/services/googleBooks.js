const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';
const searchCache = new Map();
const inFlightSearches = new Map();
let dailyQuotaReached = false;

export class GoogleBooksApiError extends Error {
  constructor(message, { code, status } = {}) {
    super(message);
    this.name = 'GoogleBooksApiError';
    this.code = code;
    this.status = status;
  }
}

function getApiKey() {
  return process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY || '';
}

function normalizeVolume(volume) {
  const info = volume.volumeInfo || {};
  const imageLinks = info.imageLinks || {};
  const identifiers = info.industryIdentifiers || [];
  const isbn = identifiers.find((identifier) => identifier.type === 'ISBN_13')
    || identifiers.find((identifier) => identifier.type === 'ISBN_10');

  return {
    googleVolumeId: volume.id,
    title: info.title || 'Título não informado',
    subtitle: info.subtitle || '',
    author: Array.isArray(info.authors) ? info.authors.join(', ') : 'Autor não informado',
    publisher: info.publisher || '',
    publishedDate: info.publishedDate || '',
    description: info.description || '',
    pageCount: Number.isInteger(info.pageCount) ? info.pageCount : 0,
    categories: Array.isArray(info.categories) ? info.categories : [],
    isbn: isbn?.identifier || '',
    thumbnail: (imageLinks.thumbnail || imageLinks.smallThumbnail || '').replace('http://', 'https://'),
    previewLink: info.previewLink || '',
  };
}

async function requestGoogleBooks(url) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const apiError = payload.error || {};
    const reasons = (apiError.errors || []).map((item) => item.reason?.toLowerCase());
    const apiMessage = apiError.message || '';
    const combinedError = `${apiMessage} ${reasons.join(' ')}`.toLowerCase();
    const isQuotaError = response.status === 429
      || reasons.some((reason) => reason?.includes('quota') || reason?.includes('dailylimit'))
      || combinedError.includes('quota exceeded')
      || combinedError.includes('queries per day');

    if (isQuotaError) {
      dailyQuotaReached = true;
      throw new GoogleBooksApiError(
        'A cota diária de buscas do projeto Google Cloud foi atingida. Confira Google Books API > Quotas e tente novamente quando a cota for renovada.',
        { code: 'GOOGLE_BOOKS_QUOTA_EXCEEDED', status: response.status },
      );
    }

    if (response.status === 400 && combinedError.includes('api key')) {
      throw new GoogleBooksApiError(
        'A chave do Google Books não foi aceita. Confira a variável EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY em .env.local e as restrições da chave.',
        { code: 'GOOGLE_BOOKS_INVALID_API_KEY', status: response.status },
      );
    }

    const message = apiMessage || `A busca no Google Books falhou (${response.status}).`;
    throw new GoogleBooksApiError(message, { code: 'GOOGLE_BOOKS_REQUEST_FAILED', status: response.status });
  }
  return payload;
}

/** Search public Google Books volume metadata by title, author, or ISBN. */
export async function searchGoogleBooks(query, { maxResults = 10, startIndex = 0 } = {}) {
  const cleanedQuery = query.trim();
  if (!cleanedQuery) return [];

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new GoogleBooksApiError(
      'Configure EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY em .env.local antes de pesquisar no catálogo.',
      { code: 'GOOGLE_BOOKS_API_KEY_MISSING' },
    );
  }

  const safeMaxResults = Math.max(1, Math.min(40, maxResults));
  const safeStartIndex = Math.max(0, startIndex);
  const cacheKey = `${cleanedQuery.toLocaleLowerCase()}|${safeMaxResults}|${safeStartIndex}`;
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey).map((item) => ({ ...item }));
  if (inFlightSearches.has(cacheKey)) return inFlightSearches.get(cacheKey);
  if (dailyQuotaReached) {
    throw new GoogleBooksApiError(
      'A cota diária do Google Books já foi atingida nesta sessão. Confira o uso no Google Cloud e tente novamente após a renovação da cota.',
      { code: 'GOOGLE_BOOKS_QUOTA_EXCEEDED' },
    );
  }

  const params = [
    `q=${encodeURIComponent(cleanedQuery)}`,
    `maxResults=${safeMaxResults}`,
    `startIndex=${safeStartIndex}`,
    'printType=books',
    `key=${encodeURIComponent(apiKey)}`,
  ];

  const request = requestGoogleBooks(`${GOOGLE_BOOKS_API_URL}?${params.join('&')}`)
    .then((payload) => {
      const results = (payload.items || []).map(normalizeVolume);
      searchCache.set(cacheKey, results);
      // Keep this in-memory cache small; repeated searches won't spend more daily quota.
      if (searchCache.size > 40) searchCache.delete(searchCache.keys().next().value);
      return results.map((item) => ({ ...item }));
    })
    .finally(() => inFlightSearches.delete(cacheKey));
  inFlightSearches.set(cacheKey, request);
  return request;
}

/** Fetch one public Google Books volume by its Google volume ID. */
export async function getGoogleBookById(volumeId) {
  if (!volumeId?.trim()) throw new Error('Informe o identificador do livro do Google Books.');
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new GoogleBooksApiError(
      'Configure EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY em .env.local antes de buscar um volume.',
      { code: 'GOOGLE_BOOKS_API_KEY_MISSING' },
    );
  }
  const keyParam = `?key=${encodeURIComponent(apiKey)}`;
  const volume = await requestGoogleBooks(`${GOOGLE_BOOKS_API_URL}/${encodeURIComponent(volumeId)}${keyParam}`);
  return normalizeVolume(volume);
}
