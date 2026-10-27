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
// The cart holds original totals; selected promo CODE is sent to /payments/create-session.
// The backend revalidates the code and applies a Stripe sandbox coupon. The client
// estimate is informational, not the authority for the amount charged.
const promoDialog = $('promo-dialog');
let promoPreview = null;

function showPromoPreview(currentCart) {
  const totals = $('cart-totals');
  totals.querySelectorAll('.promo-preview-row').forEach(row => row.remove());
  const originalRows = [...totals.querySelectorAll('.total-row')];
  const taxRow = originalRows[1], serverTotal = originalRows[2];
  if (taxRow) taxRow.firstChild.textContent = 'Tax';
  if (serverTotal) { serverTotal.classList.add('grand'); serverTotal.firstChild.textContent = 'Total'; }
  if (!promoPreview || !currentCart?.items?.length) return;
  const preview = createPromoPreview(currentCart, promoPreview);
  if (!preview) return;

  const discountRow = element('div', 'total-row promo-preview-row promo-discount-row');
  discountRow.append(element('span', '', `Promo (${promoPreview.code})`), element('strong', '', `−${money(preview.discount)}`));
  if (taxRow) taxRow.firstChild.textContent = 'Tax before promo';
  if (serverTotal) { serverTotal.classList.remove('grand'); serverTotal.firstChild.textContent = 'Total before promo'; }
  const taxAfterRow = element('div', 'total-row promo-preview-row');
  taxAfterRow.append(element('span', '', 'Tax after promo'), element('strong', '', money(preview.estimatedTax)));
  const totalRow = element('div', 'total-row grand promo-preview-row');
  totalRow.append(element('span', '', 'Estimated Stripe total'), element('strong', '', money(preview.estimatedTotal)));
  totals.append(discountRow, taxAfterRow, totalRow);
  $('promo-summary').textContent = `Promo ${promoPreview.code} will be applied in Stripe Checkout after server-side revalidation. Estimated savings: ${money(preview.discount)}.`;
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
    resultNode.textContent = `Applied: ${result.promotion.title}. Estimated savings: ${money(result.pricing.discountAmount)}. Stripe will apply this code after server validation.`;
  } catch (error) { resultNode.textContent = error.message; }
});
updatePromoCopy();

// Stripe Checkout works with the existing cart on both /home/ and /team-demo.html.
const stripeButton = $('checkout-stripe');
if (stripeButton) {
  stripeButton.addEventListener('click', () => safely(async () => {
    if (!cart.current()?.items?.length) {
      message('Add an item to the cart before checkout.', true);
      return;
    }
    stripeButton.disabled = true;
    stripeButton.textContent = 'Opening Stripe test checkout…';
    try {
      const result = await api.startCheckout(promoPreview?.code || null);
      if (!result?.url?.startsWith('https://checkout.stripe.com/')) {
        throw new Error('Stripe did not return a secure Checkout URL.');
      }
      window.location.assign(result.url);
    } finally {
      stripeButton.disabled = false;
      stripeButton.textContent = 'Pay with Stripe (TEST)';
    }
  }));
}

// Keep checkout feedback visible on the restaurant page, not only inside the cart.
function showCheckoutNotice(text, state = 'info') {
  const result = $('checkout-result');
  if (result) result.textContent = text;
  const notice = $('checkout-notice');
  if (notice) {
    notice.hidden = false;
    notice.dataset.state = state;
    notice.textContent = text;
  }
}

async function reportCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  const outcome = params.get('checkout');
  if (outcome !== 'success' && outcome !== 'cancel') return;

  if (outcome === 'cancel') {
    showCheckoutNotice('Stripe test checkout was cancelled. No payment was made.', 'info');
  } else {
    const sessionId = params.get('session_id');
    if (!sessionId) {
      showCheckoutNotice('Stripe returned to the restaurant, but no Checkout Session ID was provided. Check your Stripe sandbox payment history.', 'warning');
    } else {
      showCheckoutNotice('Verifying your Stripe sandbox payment…', 'info');
      try {
        const status = await api.completeCheckout(sessionId);
        if (status.paid) {
          const amount = Number.isInteger(status.amountTotal)
            ? ` for ${(status.amountTotal / 100).toLocaleString('en-US', { style: 'currency', currency: (status.currency || 'usd').toUpperCase() })}`
            : '';
          const promo = status.promoCode ? ` (promo ${status.promoCode} applied)` : '';
          const cartMessage = status.cartCleared
            ? ' Purchased items were removed from your cart.'
            : ' Your cart was left intact because it changed since checkout, was already cleared, or the server restarted.';
          showCheckoutNotice(`Payment confirmed${amount}${promo} in Stripe sandbox.${cartMessage} Test transaction only; no order was saved or fulfilled.`, 'success');
        } else {
          showCheckoutNotice(`Stripe returned, but payment has not been confirmed (${status.paymentStatus || 'unknown'}). Check the sandbox dashboard.`, 'warning');
        }
      } catch (error) {
        // A network/session error is NOT evidence that a payment failed.
        showCheckoutNotice(`Payment confirmation could not be verified in the app: ${error.message}. Check your Stripe sandbox payment history.`, 'warning');
      }
    }
  }
  // Do not leave the Stripe Session ID in the address bar after processing.
  window.history.replaceState(null, '', window.location.pathname + window.location.hash);
  // For alternate team demo pages without a top-level notice, reveal cart result.
  if (!$('checkout-notice')) openCart();
}

async function initialize() {
  // Payment verification must not depend on the restaurant menu/cart API succeeding.
  await reportCheckoutReturn();
  try {
    [menu] = await Promise.all([api.menu(), cart.load()]);
    renderMenu($('menu-content'), menu, selectItem);
  } catch (error) {
    $('menu-content').replaceChildren(element('p', '', 'Menu unavailable. Confirm the backend server is running, then refresh.'));
    message(error.message, true);
  }
}
initialize();
