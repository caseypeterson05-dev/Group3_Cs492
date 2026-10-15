/** API adapter. If backend routes change, edit THIS file, not the design. */
const BASE = '/api';
const STORAGE_KEY = 'pizza-parlor-demo-cart-id';

function getCartId() {
  let id = sessionStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

async function request(path, options = {}) {
  const response = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Cart-Id': getCartId(),
      ...options.headers
    }
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }
  return path === '/promotions/validate' ? result : result.data;
}

export const api = {
  menu: () => request('/menu'),
  restaurant: () => request('/restaurant'),
  promotions: () => request('/promotions'),
  validatePromo: (code, subtotal) => request('/promotions/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) }),
  cart: () => request('/cart'),
  add: (itemId, customization, quantity) => request('/cart/items', {
    method: 'POST', body: JSON.stringify({ itemId, customization, quantity })
  }),
  quantity: (lineId, quantity) => request(`/cart/items/${encodeURIComponent(lineId)}`, {
    method: 'PATCH', body: JSON.stringify({ quantity })
  }),
  remove: lineId => request(`/cart/items/${encodeURIComponent(lineId)}`, { method: 'DELETE' }),
  clear: () => request('/cart', { method: 'DELETE' })
};
