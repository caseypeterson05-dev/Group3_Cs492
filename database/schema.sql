-- Pizza Pie Parlor database schema
-- This schema is intentionally portable SQL and can be adapted for SQLite,
-- PostgreSQL, or MySQL by the teammate implementing the final database layer.

CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE menu_items (
    id VARCHAR(80) PRIMARY KEY,
    category_id VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
    customizable BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE pizza_sizes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_modifier DECIMAL(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE pizza_crusts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_modifier DECIMAL(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE toppings (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_modifier DECIMAL(10, 2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE promotions (
    code VARCHAR(50) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(500) NOT NULL,
    terms VARCHAR(500) NOT NULL,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value >= 0),
    minimum_subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Do not create columns for raw card numbers, CVV/CVC, or full magnetic-
-- stripe/payment credentials. Secure checkout should use gateway tokens.
