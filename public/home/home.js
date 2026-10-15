/*
 * Task 1.1: Pizza Pie Parlor customer homepage.
 *
 * Loads restaurant details from GET /api/restaurant (Task 1.2) and fills in
 * the name, description, address, phone, and weekly hours. Everything is
 * written with textContent, never innerHTML, so API text can't inject markup
 * (see Story 4, XSS protection).
 *
 * The open/closed line uses the visitor's device clock. That matches the
 * restaurant's hours as long as the visitor is in the same time zone.
 */

"use strict";

const DAYS = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
];

// Show the board Monday first, the way a restaurant would post it.
const BOARD_ORDER = [1, 2, 3, 4, 5, 6, 0];

function byId(id) {
    return document.getElementById(id);
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

/** "11:00 AM" -> minutes after midnight (660). Returns null if unreadable. */
function parseClock(text) {
    const match = /^\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*$/i.exec(text);

    if (!match) {
        return null;
    }

    let hours = Number(match[1]) % 12;
    const minutes = Number(match[2] || 0);

    if (match[3].toUpperCase() === "PM") {
        hours += 12;
    }

    return hours * 60 + minutes;
}

/** "11:00 AM - 9:00 PM" -> { open: 660, close: 1260 } or null when closed. */
function parseRange(text) {
    if (typeof text !== "string") {
        return null;
    }

    const parts = text.split(/\s*[-–]\s*/);

    if (parts.length !== 2) {
        return null;
    }

    const open = parseClock(parts[0]);
    let close = parseClock(parts[1]);

    if (open === null || close === null) {
        return null;
    }

    // Closing after midnight, e.g. "5:00 PM - 1:00 AM".
    if (close <= open) {
        close += 24 * 60;
    }

    return { open, close };
}

/** 660 -> "11 AM", 690 -> "11:30 AM" */
function formatClock(totalMinutes) {
    const minutesInDay = ((totalMinutes % 1440) + 1440) % 1440;
    const hours24 = Math.floor(minutesInDay / 60);
    const minutes = minutesInDay % 60;
    const suffix = hours24 < 12 ? "AM" : "PM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    return minutes === 0
        ? `${hours12}\u00a0${suffix}`
        : `${hours12}:${String(minutes).padStart(2, "0")}\u00a0${suffix}`;
}

/** Work out the open/closed sentence for right now. */
function describeStatus(hours, now) {
    const today = now.getDay();
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    // Still open from a shift that started yesterday and runs past midnight.
    const yesterday = parseRange(hours[DAYS[(today + 6) % 7]]);

    if (yesterday && yesterday.close > 1440 && minutesNow < yesterday.close - 1440) {
        return { state: "open", text: `Open now. Closes at ${formatClock(yesterday.close)}.` };
    }

    const todayRange = parseRange(hours[DAYS[today]]);

    if (todayRange) {
        if (minutesNow >= todayRange.open && minutesNow < todayRange.close) {
            return { state: "open", text: `Open now. Closes at ${formatClock(todayRange.close)}.` };
        }

        if (minutesNow < todayRange.open) {
            return { state: "closed", text: `Closed now. Opens today at ${formatClock(todayRange.open)}.` };
        }
    }

    for (let offset = 1; offset <= 7; offset += 1) {
        const day = (today + offset) % 7;
        const range = parseRange(hours[DAYS[day]]);

        if (range) {
            const when = offset === 1 ? "tomorrow" : capitalize(DAYS[day]);
            return { state: "closed", text: `Closed now. Opens ${when} at ${formatClock(range.open)}.` };
        }
    }

    return { state: "closed", text: "Closed now." };
}

function renderStatus(hours) {
    const status = describeStatus(hours, new Date());
    byId("open-status").dataset.state = status.state;
    byId("open-status-text").textContent = status.text;
}

function renderHours(hours) {
    const body = byId("hours-rows");
    const today = new Date().getDay();

    body.replaceChildren();

    for (const index of BOARD_ORDER) {
        const day = DAYS[index];
        const range = parseRange(hours[day]);

        const row = document.createElement("tr");
        const dayCell = document.createElement("th");
        const timeCell = document.createElement("td");

        dayCell.scope = "row";
        dayCell.textContent = day.slice(0, 3);

        if (range) {
            timeCell.textContent = `${formatClock(range.open)} – ${formatClock(range.close)}`;
        } else {
            timeCell.textContent = typeof hours[day] === "string" ? hours[day] : "Closed";
        }

        if (index === today) {
            row.className = "is-today";

            const tag = document.createElement("span");
            tag.className = "today-tag";
            tag.textContent = "Today";
            dayCell.append(tag);
        }

        row.append(dayCell, timeCell);
        body.append(row);
    }
}

function renderContact(restaurant) {
    const phoneDigits = String(restaurant.phone || "").replace(/[^\d+]/g, "");
    const mapUrl = "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(restaurant.address || "");

    byId("restaurant-address").textContent = restaurant.address;
    byId("footer-address").textContent = restaurant.address;
    byId("footer-phone").textContent = restaurant.phone;

    const phoneLink = byId("restaurant-phone");
    phoneLink.textContent = restaurant.phone;
    phoneLink.href = `tel:${phoneDigits}`;

    const callButton = byId("call-button");
    callButton.textContent = `Call ${restaurant.phone}`;
    callButton.href = `tel:${phoneDigits}`;

    byId("map-link").href = mapUrl;
}

function render(restaurant) {
    if (restaurant.name) {
        byId("restaurant-name").textContent = restaurant.name;
        document.title = restaurant.name;
    }

    if (restaurant.description) {
        byId("restaurant-description").textContent = restaurant.description;
    }

    renderContact(restaurant);

    if (restaurant.hours) {
        renderHours(restaurant.hours);
        renderStatus(restaurant.hours);

        // Keep the open/closed line current if the page stays open.
        setInterval(() => renderStatus(restaurant.hours), 60 * 1000);
    }
}

function showError() {
    byId("load-error").hidden = false;
    byId("open-status-text").textContent = "Hours unavailable right now";
    byId("hours-rows").replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 2;
    cell.className = "board-message";
    cell.textContent = "Hours unavailable. Refresh to try again.";
    row.append(cell);
    byId("hours-rows").append(row);

    byId("restaurant-address").textContent = "Address unavailable";
    byId("restaurant-phone").textContent = "Phone unavailable";
}

async function loadRestaurant() {
    try {
        const response = await fetch("/api/restaurant", {
            headers: { Accept: "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const body = await response.json();

        if (!body.success || !body.data) {
            throw new Error("Unexpected response shape");
        }

        render(body.data);
    } catch (error) {
        console.error("Could not load restaurant details:", error);
        showError();
    }
}

document.addEventListener("DOMContentLoaded", loadRestaurant);
