/*
 * Task 3.2: Live price in the "Customize pizza" pop-up (Story 3).
 *
 * Covers Story 3's acceptance criterion "Price updates dynamically."
 * Every time the customer changes the size, crust, toppings, or quantity, this
 * asks the server for the exact price (POST /api/menu/price-preview) and shows
 * it in the pop-up. The server does the math, so the price shown always matches
 * what the cart will charge.
 *
 * The pop-up itself is filled in by the shared /cart-demo/js/main.js, which is
 * used unchanged. This file only reads the form and writes the price line.
 * Text is written with textContent, never innerHTML (Task 4.1, Rule 2).
 */

"use strict";

(function () {
    const dialog = document.getElementById("customize-dialog");
    const form = document.getElementById("customize-form");
    const title = document.getElementById("customize-title");
    const quantityInput = document.getElementById("add-quantity");
    const unitNode = document.getElementById("live-price-unit");
    const totalNode = document.getElementById("live-price-total");

    if (!dialog || !form || !title || !unitNode || !totalNode) {
        return;
    }

    let itemIdsByName = null;
    let latestRequest = 0;

    const money = (amount) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

    /** The pop-up shows the item's name; look up its ID from the menu once. */
    async function loadItemIds() {
        if (itemIdsByName) {
            return itemIdsByName;
        }

        const response = await fetch("/api/menu", { headers: { Accept: "application/json" } });
        const body = await response.json();
        const map = new Map();

        for (const category of body.data?.categories || []) {
            for (const item of category.items || []) {
                map.set(item.name, item.id);
            }
        }

        itemIdsByName = map;
        return map;
    }

    function readCustomization() {
        const values = new FormData(form);

        return {
            sizeId: values.get("sizeId") || undefined,
            crustId: values.get("crustId") || undefined,
            toppingIds: values.getAll("toppingIds")
        };
    }

    function readQuantity() {
        const quantity = Number(quantityInput.value);
        return Number.isInteger(quantity) && quantity >= 1 && quantity <= 99 ? quantity : null;
    }

    async function updatePrice() {
        const requestId = ++latestRequest;
        unitNode.textContent = "Updating price";
        totalNode.textContent = "";

        try {
            const ids = await loadItemIds();
            const itemId = ids.get(title.textContent);

            if (!itemId) {
                throw new Error(`No menu item named "${title.textContent}"`);
            }

            const response = await fetch("/api/menu/price-preview", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ itemId, customization: readCustomization() })
            });
            const body = await response.json();

            if (!response.ok || !body.success) {
                throw new Error(body.message || `Request failed with status ${response.status}`);
            }

            // Ignore answers to older requests if the customer kept clicking.
            if (requestId !== latestRequest) {
                return;
            }

            const unitPrice = Number(body.data.unitPrice);
            const quantity = readQuantity();

            unitNode.textContent = `${money(unitPrice)} each`;
            totalNode.textContent = quantity
                ? `Total: ${money(unitPrice * quantity)}`
                : "Choose a quantity from 1 to 99";
        } catch (error) {
            if (requestId !== latestRequest) {
                return;
            }

            console.error("Could not update price:", error);
            unitNode.textContent = "Price unavailable right now";
            totalNode.textContent = "";
        }
    }

    // Any change to size, crust, toppings, or quantity updates the price.
    form.addEventListener("change", updatePrice);
    quantityInput.addEventListener("input", updatePrice);

    // The shared script opens the pop-up; update the price each time it opens.
    new MutationObserver(() => {
        if (dialog.open) {
            updatePrice();
        }
    }).observe(dialog, { attributes: true, attributeFilter: ["open"] });
})();
