const menu = require("../../data/menu.json");

function getActiveItems() {
    return menu.items.filter(item => item.active);
}

function getMenu() {
    const activeItems = getActiveItems();

    const categories = menu.categories
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(category => ({
            ...category,
            items: activeItems.filter(
                item => item.categoryId === category.id
            )
        }));

    return {
        categories,
        options: menu.options
    };
}

function getItem(itemId) {
    return getActiveItems().find(item => item.id === itemId) || null;
}

function findOption(list, id) {
    if (!id) {
        return null;
    }

    return list.find(option => option.id === id) || null;
}

function calculateUnitPrice(itemId, customization = {}) {
    const item = getItem(itemId);

    if (!item) {
        return {
            valid: false,
            message: "Menu item not found."
        };
    }

    let unitPrice = Number(item.basePrice);
    const selected = {
        size: null,
        crust: null,
        toppings: []
    };

    if (item.customizable) {
        const size = findOption(menu.options.sizes, customization.sizeId);
        const crust = findOption(menu.options.crusts, customization.crustId);

        if (customization.sizeId && !size) {
            return { valid: false, message: "Invalid size selection." };
        }

        if (customization.crustId && !crust) {
            return { valid: false, message: "Invalid crust selection." };
        }

        if (size) {
            unitPrice += Number(size.priceModifier);
            selected.size = size;
        }

        if (crust) {
            unitPrice += Number(crust.priceModifier);
            selected.crust = crust;
        }

        const toppingIds = Array.isArray(customization.toppingIds)
            ? [...new Set(customization.toppingIds)]
            : [];

        for (const toppingId of toppingIds) {
            const topping = menu.options.toppings.find(
                candidate =>
                    candidate.id === toppingId &&
                    candidate.active
            );

            if (!topping) {
                return {
                    valid: false,
                    message: `Invalid topping selection: ${toppingId}`
                };
            }

            unitPrice += Number(topping.priceModifier);
            selected.toppings.push(topping);
        }
    }

    return {
        valid: true,
        item,
        selected,
        unitPrice: Number(unitPrice.toFixed(2))
    };
}

module.exports = {
    getMenu,
    getItem,
    calculateUnitPrice
};
