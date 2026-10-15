/** Page wiring. Read this file top to bottom to understand the shopping flow. */
import { api } from './api.js';
import { siteContent } from './site-content.js';
import { createCartController } from './cart.js';
import { element, money, renderCart, renderMenu } from './view.js';
import { createPromoPreview } from './promo-preview.js';

const $ = id => document.getElementById(id);
const panel = $('cart-panel');
const dialog = $('customize-dialog');
let selectedItem = null;
let menu = null;
let previousFocus = null;
let messageTimeout;

function message(text, isError = false) {
  clearTimeout(messageTimeout);
  $('message').textContent = text;
  $('message').classList.toggle('error', isError);
  messageTimeout = setTimeout(() => { $('message').textContent = ''; }, 4500);
}

async function safely(action) {
  try { await action(); }
  catch (error) { message(error.message, true); }
}

const cart = createCartController(next => {
  // A cart change invalidates the previous promo estimate.
  promoPreview = null;
  $('promo-summary').textContent = '';
  renderCart(
  $('cart-items'), $('cart-totals'), $('cart-count'), next, {
    changeQuantity: (id, quantity) => safely(() => cart.changeQuantity(id, quantity)),
    remove: id => safely(() => cart.remove(id))
  }
  );
  showPromoPreview(next);
});

function openCart() {
  previousFocus = document.activeElement;
  $('cart-overlay').hidden = false;
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  $('close-cart').focus();
}
function closeCart() {
  $('cart-overlay').hidden = true;
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  previousFocus?.focus();
}
$('open-cart').addEventListener('click', openCart);
$('hero-cart-open').addEventListener('click', openCart);
$('close-cart').addEventListener('click', closeCart);
$('cart-overlay').addEventListener('click', closeCart);
$('clear-cart').addEventListener('click', () => safely(() => cart.clear()));

// Keep keyboard focus inside the open cart, like a standard modal dialog.
panel.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const controls = [...panel.querySelectorAll('button:not(:disabled)')];
  if (!controls.length) return;
  const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (promoDialog.open) {
    event.preventDefault();
    closePromo();
  } else if (panel.classList.contains('is-open')) closeCart();
});

function optionSelect(label, name, options) {
  const labelNode = element('label', 'field-label', label);
  const select = document.createElement('select');
  select.name = name;
  for (const option of options) {
    const entry = document.createElement('option');
    entry.value = option.id;
    entry.textContent = `${option.name} (+${money(option.priceModifier)})`;
    select.append(entry);
  }
  labelNode.append(select);
  return labelNode;
}

function selectItem(item) {
  selectedItem = item;
  if (!item.customizable) {
    safely(async () => { await cart.add(item.id, {}, 1); message(`${item.name} added!`); openCart(); });
    return;
  }
  $('customize-title').textContent = item.name;
  $('customize-description').textContent = item.description;
  $('add-quantity').value = 1;
  const options = $('customize-options');
  options.replaceChildren(
    optionSelect('Size', 'sizeId', menu.options.sizes),
    optionSelect('Crust', 'crustId', menu.options.crusts)
  );
  const toppingGroup = element('div', 'toppings');
  for (const topping of menu.options.toppings.filter(t => t.active)) {
    const label = element('label');
    const input = document.createElement('input');
    input.type = 'checkbox'; input.name = 'toppingIds'; input.value = topping.id;
    label.append(input, document.createTextNode(` ${topping.name} (+${money(topping.priceModifier)})`));
    toppingGroup.append(label);
  }
  options.append(element('p', 'field-label', 'Extra toppings'), toppingGroup);
  dialog.showModal();
}
$('close-customize').addEventListener('click', () => dialog.close());
$('customize-form').addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const quantity = Number(values.get('quantity'));
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) { message('Choose a quantity between 1 and 99.', true); return; }
  const customization = { sizeId: values.get('sizeId'), crustId: values.get('crustId'), toppingIds: values.getAll('toppingIds') };
  safely(async () => { await cart.add(selectedItem.id, customization, quantity); dialog.close(); message('Added to your cart!'); openCart(); });
});


// ---- Promo-code modal and estimated savings display. ----
// The backend cart returns the authoritative subtotal, tax, and total.
// /api/promotions/validate only previews eligibility/discount; it does not
// persist a discount to the cart or change final order pricing.
const promoDialog = $('promo-dialog');
let promoPreview = null;

function showPromoPreview(currentCart) {
  // Cart amounts from /api/cart stay authoritative. The discount is only a
  // displayed estimate because the backend has no checkout promo application.
  const totals = $('cart-totals');
  totals.querySelectorAll('.promo-preview-row').forEach(row => row.remove());
  const serverTotal = totals.querySelector('.total-row:last-child');
  if (serverTotal && !promoPreview) { serverTotal.classList.add('grand'); serverTotal.firstChild.textContent = 'Total'; }
  if (!promoPreview || !currentCart?.items?.length) return;
  const preview = createPromoPreview(currentCart, promoPreview);
  if (!preview) return;

  const discountRow = element('div', 'total-row promo-preview-row promo-discount-row');
  discountRow.append(element('span', '', `Promo (${promoPreview.code})`), element('strong', '', `−${money(preview.discount)}`));
  // Rename the server total rather than showing two competing grand totals.
  if (serverTotal) { serverTotal.classList.remove('grand'); serverTotal.firstChild.textContent = 'Total before promo'; }
  const totalRow = element('div', 'total-row grand promo-preview-row');
  totalRow.append(element('span', '', 'Estimated total after promo'), element('strong', '', money(preview.estimatedTotal)));
  totals.append(discountRow, totalRow);
  $('promo-summary').textContent = `Estimated savings: ${money(preview.discount)}. Preview uses the current tax amount; checkout pricing is not implemented.`;
}
function updatePromoCopy() {
  $('cart-heading').textContent = siteContent.cartTitle;
  $('promo-title').textContent = siteContent.promoTitle;
  $('promo-description').textContent = siteContent.promoDescription;
  $('open-promo').textContent = siteContent.promoButton;
  $('promo-form').querySelector('[type=submit]').textContent = siteContent.promoValidateButton;
}
function openPromo() {
  if (!cart.current()?.items?.length) { message('Add an item before checking a promo code.', true); return; }
  $('promo-result').textContent = '';
  // Nonmodal dialog keeps the right-hand cart readable while the code is typed.
  // The existing cart overlay still dims the page behind both components.
  promoDialog.show();
  panel.setAttribute('aria-modal', 'false');
  $('promo-code').focus();
}
$('open-promo').addEventListener('click', openPromo);
function closePromo() {
  promoDialog.close();
  panel.setAttribute('aria-modal', 'true');
  if (panel.classList.contains('is-open')) $('open-promo').focus();
}
$('close-promo').addEventListener('click', closePromo);
$('promo-form').addEventListener('submit', async event => {
  event.preventDefault();
  const code = $('promo-code').value.trim();
  const currentCart = cart.current();
  if (!code || !currentCart?.items?.length) return;
  const resultNode = $('promo-result');
  resultNode.textContent = 'Checking promo code…';
  try {
    const result = await api.validatePromo(code, currentCart.subtotal);
    if (!result.valid) {
      promoPreview = null;
      showPromoPreview(currentCart);
      $('promo-summary').textContent = '';
      resultNode.textContent = result.message || 'Code is not valid.';
      return;
    }
    promoPreview = { code: result.promotion.code, pricing: result.pricing };
    showPromoPreview(currentCart);
    resultNode.textContent = `Valid: ${result.promotion.title}. Estimated savings: ${money(result.pricing.discountAmount)}. See the updated estimate in your cart. This is a preview only.`;
  } catch (error) { resultNode.textContent = error.message; }
});
updatePromoCopy();

async function initialize() {
  try {
    [menu] = await Promise.all([api.menu(), cart.load()]);
    renderMenu($('menu-content'), menu, selectItem);
  } catch (error) {
    $('menu-content').replaceChildren(element('p', '', 'Menu unavailable. Confirm the backend server is running, then refresh.'));
    message(error.message, true);
  }
}
initialize();
