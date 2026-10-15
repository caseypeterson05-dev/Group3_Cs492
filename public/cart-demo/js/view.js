/** Pure rendering helpers: designers may replace this file's markup. */
import { siteContent } from './site-content.js';

export const money = amount => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export function element(tag, className, content = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = String(content);
  return node;
}

export function makeButton(label, onClick, className = 'button button-subtle') {
  const button = element('button', className, label);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}

export function renderMenu(container, menu, onSelect) {
  container.replaceChildren();
  for (const category of menu.categories) {
    const heading = element('h3', 'category-heading', category.name);
    const grid = element('div', 'menu-grid');
    for (const item of category.items) {
      const card = element('article', 'menu-card');
      card.append(
        element('div', 'pizza-mark', item.categoryId === 'pizzas' ? '🍕' : item.categoryId === 'drinks' ? '🥤' : '✦'),
        element('h3', '', item.name),
        element('p', '', item.description),
        element('span', 'price', `From ${money(item.basePrice)}`),
        makeButton(item.customizable ? 'Customize & add' : 'Add to cart', () => onSelect(item), 'button button-primary')
      );
      grid.append(card);
    }
    container.append(heading, grid);
  }
}

export function renderCart(itemsNode, totalsNode, countNode, cart, actions) {
  itemsNode.replaceChildren();
  totalsNode.replaceChildren();
  const quantity = cart.items.reduce((total, line) => total + line.quantity, 0);
  countNode.textContent = `(${quantity})`;
  if (!cart.items.length) itemsNode.append(element('p', 'empty-cart', siteContent.emptyCartText));
  for (const line of cart.items) {
    const row = element('article', 'cart-line');
    const parts = [line.customization.sizeId, line.customization.crustId, ...line.customization.toppingIds].filter(Boolean);
    const controls = element('div', 'line-controls');
    controls.append(
      makeButton('−', () => actions.changeQuantity(line.lineId, line.quantity - 1), ''),
      element('strong', '', line.quantity),
      makeButton('+', () => actions.changeQuantity(line.lineId, line.quantity + 1), ''),
      makeButton('Remove', () => actions.remove(line.lineId), 'remove')
    );
    // The backend accepts 1..99 for updates. Use removal for a quantity of zero.
    controls.children[0].disabled = line.quantity <= 1;
    controls.children[2].disabled = line.quantity >= 99;
    row.append(element('h3', '', line.name), element('p', '', parts.join(' · ') || 'Standard'), element('strong', '', money(line.lineTotal)), controls);
    itemsNode.append(row);
  }
  for (const [label, value, isGrand] of [['Subtotal', cart.subtotal], ['Tax', cart.tax], ['Total', cart.total, true]]) {
    const row = element('div', `total-row${isGrand ? ' grand' : ''}`);
    row.append(element('span', '', label), element('span', '', money(value)));
    totalsNode.append(row);
  }
}
