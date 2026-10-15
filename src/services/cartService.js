const { randomUUID } = require("crypto");
const config = require("../config");
const menuService = require("./menuService");

const carts = new Map();
const MAX_CART_LINES = 50;

function normalizeCartId(value) {
    if (typeof value !== "string" || !value.trim()) {
        return "demo";
    }

    return value.trim().slice(0, 100);
}

function getCart(cartId) {
    const id = normalizeCartId(cartId);

    if (!carts.has(id)) {
        carts.set(id, {
            id,
            items: []
        });
    }

    return carts.get(id);
}

function calculateTotals(cart) {
    const subtotal = cart.items.reduce(
        (sum, item) => sum + item.lineTotal,
        0
    );

    const tax = subtotal * config.taxRate;
    const total = subtotal + tax;

    return {
        subtotal: Number(subtotal.toFixed(2)),
        taxRate: config.taxRate,
        tax: Number(tax.toFixed(2)),
        total: Number(total.toFixed(2))
    };
}

function serializeCart(cart) {
    return {
        id: cart.id,
        items: cart.items.map(item => ({
            ...item,
            customization: {
                ...item.customization,
                toppingIds: [...item.customization.toppingIds]
            }
        })),
        ...calculateTotals(cart)
    };
}

function canonicalCustomization(pricing) {
    return {
        sizeId: pricing.selected.size?.id || null,
        crustId: pricing.selected.crust?.id || null,
        toppingIds: pricing.selected.toppings
            .map(topping => topping.id)
            .sort()
    };
}

function sameConfiguration(line, itemId, customization) {
    if (line.itemId !== itemId) {
        return false;
    }

    if (line.customization.sizeId !== customization.sizeId) {
        return false;
    }

    if (line.customization.crustId !== customization.crustId) {
        return false;
    }

    const left = [...line.customization.toppingIds].sort();
    const right = [...customization.toppingIds].sort();

    return (
        left.length === right.length &&
        left.every((value, index) => value === right[index])
    );
}

function addItem(cartId, payload) {
    const cart = getCart(cartId);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return { valid: false, message: "Cart item must be an object." };
    }

    const quantity = payload.quantity ?? 1;

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return {
            valid: false,
            message: "Quantity must be an integer between 1 and 99."
        };
    }

    if (typeof payload.itemId !== "string" || !payload.itemId.trim()) {
        return { valid: false, message: "A valid itemId is required." };
    }

    if (payload.customization !== undefined && (
        !payload.customization ||
        typeof payload.customization !== "object" ||
        Array.isArray(payload.customization) ||
        (payload.customization.toppingIds !== undefined &&
            !Array.isArray(payload.customization.toppingIds))
    )) {
        return { valid: false, message: "Invalid customization format." };
    }

    const pricing = menuService.calculateUnitPrice(
        payload.itemId,
        payload.customization || {}
    );

    if (!pricing.valid) {
        return pricing;
    }

    const customization = canonicalCustomization(pricing);

    const existing = cart.items.find(line =>
        sameConfiguration(
            line,
            pricing.item.id,
            customization
        )
    );

    if (existing) {
        const combinedQuantity = existing.quantity + quantity;

        if (combinedQuantity > 99) {
            return {
                valid: false,
                message:
                    "The combined quantity for an identical cart item cannot exceed 99."
            };
        }

        existing.quantity = combinedQuantity;
        existing.lineTotal = Number(
            (existing.unitPrice * combinedQuantity).toFixed(2)
        );

        return {
            valid: true,
            merged: true,
            line: existing,
            cart: serializeCart(cart)
        };
    }

    if (cart.items.length >= MAX_CART_LINES) {
        return {
            valid: false,
            message: `A cart cannot contain more than ${MAX_CART_LINES} distinct items.`
        };
    }

    const line = {
        lineId: randomUUID(),
        itemId: pricing.item.id,
        name: pricing.item.name,
        quantity,
        customization,
        unitPrice: pricing.unitPrice,
        lineTotal: Number((pricing.unitPrice * quantity).toFixed(2))
    };

    cart.items.push(line);

    return {
        valid: true,
        merged: false,
        line,
        cart: serializeCart(cart)
    };
}

function updateItem(cartId, lineId, quantityValue) {
    const cart = getCart(cartId);
    const line = cart.items.find(item => item.lineId === lineId);

    if (!line) {
        return {
            valid: false,
            notFound: true,
            message: "Cart item not found."
        };
    }

    const quantity = quantityValue;

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return {
            valid: false,
            message: "Quantity must be an integer between 1 and 99."
        };
    }

    line.quantity = quantity;
    line.lineTotal =
        Number((line.unitPrice * quantity).toFixed(2));

    return {
        valid: true,
        line,
        cart: serializeCart(cart)
    };
}

function removeItem(cartId, lineId) {
    const cart = getCart(cartId);
    const index = cart.items.findIndex(item => item.lineId === lineId);

    if (index === -1) {
        return {
            valid: false,
            notFound: true,
            message: "Cart item not found."
        };
    }

    const [removed] = cart.items.splice(index, 1);

    return {
        valid: true,
        removed,
        cart: serializeCart(cart)
    };
}

function clearCart(cartId) {
    const cart = getCart(cartId);
    cart.items = [];
    return serializeCart(cart);
}

function resetAllCarts() {
    carts.clear();
}

module.exports = {
    getCart,
    serializeCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    resetAllCarts
};
