
async function loadRestaurant() {

    const status = document.getElementById("restaurant-status");

    try {

        const response = await fetch("/api/restaurant");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error("Restaurant API request failed.");
        }

        const restaurant = result.data;

        document.getElementById("restaurant-name").textContent =
            restaurant.name;

        document.getElementById("restaurant-description").textContent =
            restaurant.description;

        document.getElementById("restaurant-address").textContent =
            restaurant.address;

        document.getElementById("restaurant-phone").textContent =
            restaurant.phone;


        const hoursList =
            document.getElementById("restaurant-hours");

        hoursList.innerHTML = "";

        for (const [day, hours] of Object.entries(restaurant.hours)) {

            const item = document.createElement("li");

            item.textContent =
                `${capitalize(day)}: ${hours}`;

            hoursList.appendChild(item);
        }


        document.getElementById("restaurant-raw").textContent =
            JSON.stringify(result, null, 2);

        markSuccess(status);

    } catch (error) {

        markFailure(status);

        document.getElementById("restaurant-raw").textContent =
            error.message;
    }
}



async function loadPromotions() {

    const status =
        document.getElementById("promotions-status");

    const promotionList =
        document.getElementById("promotion-list");

    try {

        const response =
            await fetch("/api/promotions");

        const result =
            await response.json();

        if (!response.ok || !result.success) {
            throw new Error("Promotions API request failed.");
        }

        promotionList.innerHTML = "";

        for (const promotion of result.data) {

            const card =
                document.createElement("article");

            card.className =
                "promotion";

            card.innerHTML = `
                <h3>${escapeHtml(promotion.title)}</h3>

                <p>
                    ${escapeHtml(promotion.description)}
                </p>

                <p>
                    <strong>Code:</strong>
                    <code>${escapeHtml(promotion.code)}</code>
                </p>

                <p>
                    <strong>Minimum order:</strong>
                    $${Number(
                        promotion.minimumSubtotal
                    ).toFixed(2)}
                </p>
            `;

            promotionList.appendChild(card);
        }


        document.getElementById("promotions-raw").textContent =
            JSON.stringify(result, null, 2);

        markSuccess(status);

    } catch (error) {

        markFailure(status);

        promotionList.textContent =
            "Unable to load promotions.";

        document.getElementById("promotions-raw").textContent =
            error.message;
    }
}



async function validatePromotion(event) {

    event.preventDefault();

    const status =
        document.getElementById("validation-status");

    const resultBox =
        document.getElementById("validation-result");

    const code =
        document.getElementById("promo-code").value;

    const subtotal =
        Number(
            document.getElementById("subtotal").value
        );

    status.textContent =
        "Testing...";

    status.className =
        "status";


    try {

        const response =
            await fetch(
                "/api/promotions/validate",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        code,
                        subtotal
                    })
                }
            );


        const result =
            await response.json();


        document.getElementById("validation-raw").textContent =
            JSON.stringify(result, null, 2);


        if (!result.valid) {

            status.textContent =
                "Rejected";

            status.className =
                "status failure";

            resultBox.className =
                "validation-result failure-box";

            resultBox.innerHTML = `
                <strong>Promotion not applied</strong>
                <p>${escapeHtml(result.message)}</p>
            `;

            return;
        }


        markSuccess(status);


        resultBox.className =
            "validation-result success-box";


        resultBox.innerHTML = `
            <h3>Promotion Applied</h3>

            <div class="price-grid">

                <span>Code</span>
                <strong>
                    ${escapeHtml(result.promotion.code)}
                </strong>

                <span>Original subtotal</span>
                <strong>
                    $${result.pricing.originalSubtotal.toFixed(2)}
                </strong>

                <span>Discount</span>
                <strong>
                    -$${result.pricing.discountAmount.toFixed(2)}
                </strong>

                <span>New subtotal</span>
                <strong>
                    $${result.pricing.discountedSubtotal.toFixed(2)}
                </strong>

            </div>
        `;

    } catch (error) {

        markFailure(status);

        resultBox.className =
            "validation-result failure-box";

        resultBox.textContent =
            error.message;
    }
}



function markSuccess(element) {

    element.textContent =
        "Working";

    element.className =
        "status success";
}



function markFailure(element) {

    element.textContent =
        "Failed";

    element.className =
        "status failure";
}



function capitalize(value) {

    return value.charAt(0).toUpperCase()
        + value.slice(1);
}



function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}



document
    .getElementById("promo-form")
    .addEventListener(
        "submit",
        validatePromotion
    );


loadRestaurant();

loadPromotions();