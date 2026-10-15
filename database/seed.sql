INSERT INTO categories (id, name, sort_order) VALUES
('pizzas', 'Pizzas', 1),
('sides', 'Sides', 2),
('drinks', 'Drinks', 3);

INSERT INTO menu_items
(id, category_id, name, description, base_price, customizable, active)
VALUES
('classic-cheese', 'pizzas', 'Classic Cheese Pizza',
 'Pizza sauce, mozzarella, and parmesan.', 10.99, TRUE, TRUE),
('pepperoni', 'pizzas', 'Pepperoni Pizza',
 'Pizza sauce, mozzarella, and pepperoni.', 12.99, TRUE, TRUE),
('garlic-knots', 'sides', 'Garlic Knots',
 'Baked dough knots with garlic butter and parmesan.', 6.49, FALSE, TRUE),
('fountain-drink', 'drinks', 'Fountain Drink',
 'Choice of available fountain beverage.', 2.49, FALSE, TRUE);

INSERT INTO pizza_sizes (id, name, price_modifier) VALUES
('small', 'Small', 0.00),
('medium', 'Medium', 2.50),
('large', 'Large', 5.00);

INSERT INTO pizza_crusts (id, name, price_modifier) VALUES
('hand-tossed', 'Hand Tossed', 0.00),
('thin', 'Thin Crust', 0.00),
('stuffed', 'Stuffed Crust', 2.50);

INSERT INTO toppings (id, name, price_modifier, active) VALUES
('pepperoni', 'Pepperoni', 1.50, TRUE),
('mushrooms', 'Mushrooms', 1.00, TRUE),
('onions', 'Onions', 0.75, TRUE),
('olives', 'Black Olives', 1.00, TRUE);
