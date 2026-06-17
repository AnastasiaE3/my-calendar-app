const API_BASE = 'http://localhost:8080/api';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

async function safeFetchJson(url, options = {}, defaultValue = null) {
  try {
    const response = await fetch(url, options);
    if (!response || !response.ok) return defaultValue;
    const data = await response.json();
    return data == null ? defaultValue : data;
  } catch (error) {
    console.error(`API fetch failed for ${url}`, error);
    return defaultValue;
  }
}

export { API_BASE, jsonHeaders, safeFetchJson };