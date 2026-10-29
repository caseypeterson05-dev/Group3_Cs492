/*
 * Task 6.1: "Specials" section on the homepage (Story 6, View Promotions).
 *
 * Loads current deals from GET /api/promotions (Task 6.2) and shows each one
 * as a coupon. "See terms" opens the deal's terms and promo code, which covers
 * Story 6's acceptance criterion "Clicking promotion explains the terms."
 *
 * All API text is written with textContent, never innerHTML (Task 4.1, Rule 2).
 */

"use strict";

(function () {
    const list = document.getElementById("specials-list");

    if (!list) {
        return;
    }

    function money(amount) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: Number.isInteger(amount) ? 0 : 2
        }).format(amount);
    }

    /** "20% off" or "$5 off", from the promotion's type and value. */
    function headline(promo) {
        const value = Number(promo.value);

        if (!Number.isFinite(value)) {
            return "Special";
        }

        return promo.type === "percent" ? `${value}% off` : `${money(value)} off`;
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);

        if (className) {
            node.className = className;
        }

        if (text !== undefined) {
            node.textContent = String(text);
        }

        return node;
    }

    async function copyCode(code, button) {
        const original = button.textContent;

        try {
            await navigator.clipboard.writeText(code);
            button.textContent = "Copied";
        } catch (error) {
            button.textContent = `Code: ${code}`;
        }

        setTimeout(() => {
            button.textContent = original;
        }, 2000);
    }

    function renderCoupon(promo, index) {
        const termsId = `special-terms-${index}`;
        const item = el("li", "coupon");

        const stub = el("div", "coupon-stub");
        stub.append(el("p", "coupon-value", headline(promo)));

        const body = el("div", "coupon-body");
        body.append(
            el("h3", "coupon-title", promo.title),
            el("p", "coupon-description", promo.description)
        );

        const toggle = el("button", "coupon-toggle", "See terms");
        toggle.type = "button";
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-controls", termsId);

        const terms = el("div", "coupon-terms");
        terms.id = termsId;
        terms.hidden = true;

        terms.append(el("p", "coupon-terms-text", promo.terms || "No extra terms."));

        const codeRow = el("div", "coupon-code-row");
        const codeLabel = el("p", "coupon-code-label", "Promo code");
        const code = el("p", "coupon-code", promo.code);
        const copy = el("button", "coupon-copy", "Copy code");
        copy.type = "button";
        copy.setAttribute("aria-label", `Copy promo code ${promo.code}`);
        copy.addEventListener("click", () => copyCode(promo.code, copy));
        codeRow.append(codeLabel, code, copy);

        terms.append(
            codeRow,
            el("p", "coupon-how", "Add items to your cart, choose \"Have a promo code?\", and enter this code.")
        );

        toggle.addEventListener("click", () => {
            const open = toggle.getAttribute("aria-expanded") === "true";
            toggle.setAttribute("aria-expanded", String(!open));
            toggle.textContent = open ? "See terms" : "Hide terms";
            terms.hidden = open;
            item.classList.toggle("is-open", !open);
        });

        body.append(toggle, terms);
        item.append(stub, body);
        return item;
    }

    function showMessage(text) {
        list.replaceChildren(el("li", "specials-message", text));
    }

    async function loadSpecials() {
        try {
            const response = await fetch("/api/promotions", {
                headers: { Accept: "application/json" }
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const body = await response.json();
            const promos = Array.isArray(body.data) ? body.data.filter((p) => p.active !== false) : [];

            if (!promos.length) {
                showMessage("No specials right now. Check back soon.");
                return;
            }

            list.replaceChildren(...promos.map(renderCoupon));
        } catch (error) {
            console.error("Could not load specials:", error);
            showMessage("Specials couldn't load. Refresh the page to try again.");
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadSpecials);
    } else {
        loadSpecials();
    }
})();
