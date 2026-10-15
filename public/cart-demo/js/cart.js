/** Reusable cart state: NO HTML, NO CSS. UI can be replaced independently. */
import { api } from './api.js';

export function createCartController(onChange) {
  let cart = null;
  let busy = false;

  async function run(action) {
    if (busy) return;
    busy = true;
    try {
      cart = await action();
      onChange(cart);
    } finally {
      busy = false;
    }
  }

  return {
    load: () => run(() => api.cart()),
    add: (itemId, customization, quantity) => run(() => api.add(itemId, customization, quantity)),
    changeQuantity: (lineId, quantity) => run(() => api.quantity(lineId, quantity)),
    remove: lineId => run(() => api.remove(lineId)),
    clear: () => run(() => api.clear()),
    current: () => cart
  };
}
