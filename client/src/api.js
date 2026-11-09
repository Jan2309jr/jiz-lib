const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

const json = (method, data) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const api = {
  getCategories: () => request('/categories'),
  addCategory: (name) => request('/categories', json('POST', { name })),
  renameCategory: (id, name) => request(`/categories/${id}`, json('PATCH', { name })),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  getBooks: () => request('/books'),
  uploadBook: (formData) => request('/books', { method: 'POST', body: formData }),
  updateBook: (id, data) => request(`/books/${id}`, json('PATCH', data)),
  deleteBook: (id) => request(`/books/${id}`, { method: 'DELETE' }),
};
