-- Initialize Alii Fish Market Database
-- This script sets up the initial database structure and sample data

-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sample menu items for Alii Fish Market
INSERT INTO menu_items (name, description, price, category, image_url, available, popular, spicy_level, preparation_time_minutes, current_stock, minimum_stock, calories, protein_grams, created_at, updated_at)
VALUES 
-- Poke Bowls
('Ahi Poke Bowl', 'Fresh sashimi-grade ahi tuna with traditional Hawaiian seasoning, served over rice with seaweed salad and edamame', 16.95, 'POKE_BOWLS', '/images/ahi-poke-bowl.jpg', true, true, 'MILD', 10, 25, 5, 420, 32, NOW(), NOW()),
('Salmon Poke Bowl', 'Wild-caught salmon with island-style marinade, cucumber, avocado, and pickled ginger over rice', 15.95, 'POKE_BOWLS', '/images/salmon-poke-bowl.jpg', true, false, 'MILD', 10, 20, 5, 380, 28, NOW(), NOW()),
('Spicy Ahi Bowl', 'Cubed ahi tuna with spicy mayo, sriracha, and jalapeños, topped with masago and green onions', 17.95, 'POKE_BOWLS', '/images/spicy-ahi-bowl.jpg', true, true, 'SPICY', 12, 18, 4, 450, 30, NOW(), NOW()),
('Mixed Fish Bowl', 'Combination of ahi and salmon with house ponzu sauce, mixed greens, and crispy garlic', 18.95, 'POKE_BOWLS', '/images/mixed-fish-bowl.jpg', true, false, 'MEDIUM', 15, 15, 3, 480, 35, NOW(), NOW()),

-- Fresh Fish
('Fresh Ahi Steak (1lb)', 'Sashimi-grade yellowfin tuna, perfect for searing or sashimi', 24.95, 'FRESH_FISH', '/images/fresh-ahi.jpg', true, true, null, 0, 8, 2, 0, 0, NOW(), NOW()),
('Whole Mahi Mahi (per lb)', 'Locally caught mahi mahi, cleaned and scaled', 19.95, 'FRESH_FISH', '/images/whole-mahi.jpg', false, false, null, 0, 0, 1, 0, 0, NOW(), NOW()),
('Opah Fillet (1lb)', 'Hawaiian moonfish with rich, buttery texture', 28.95, 'FRESH_FISH', '/images/opah-fillet.jpg', true, false, null, 0, 5, 1, 0, 0, NOW(), NOW()),
('Ono Steak (1lb)', 'Wahoo steak, firm white fish perfect for grilling', 22.95, 'FRESH_FISH', '/images/ono-steak.jpg', true, false, null, 0, 6, 2, 0, 0, NOW(), NOW()),

-- Prepared Foods
('Lomi Lomi Salmon', 'Traditional Hawaiian salted salmon with onions and tomatoes', 8.95, 'PREPARED_FOODS', '/images/lomi-lomi.jpg', true, false, 'MILD', 5, 12, 3, 180, 15, NOW(), NOW()),
('Pipi Kaula', 'Hawaiian beef jerky, perfect for snacking', 12.95, 'PREPARED_FOODS', '/images/pipi-kaula.jpg', true, false, null, 0, 20, 5, 220, 25, NOW(), NOW()),
('Kalua Pig', 'Traditional pit-roasted pork shoulder', 14.95, 'PREPARED_FOODS', '/images/kalua-pig.jpg', true, true, null, 8, 10, 2, 320, 28, NOW(), NOW()),

-- Sides
('White Rice', 'Steamed jasmine rice', 3.95, 'SIDES', '/images/white-rice.jpg', true, false, null, 5, 50, 10, 150, 3, NOW(), NOW()),
('Brown Rice', 'Organic brown rice', 4.95, 'SIDES', '/images/brown-rice.jpg', true, false, null, 8, 30, 8, 170, 4, NOW(), NOW()),
('Seaweed Salad', 'Fresh wakame seaweed with sesame dressing', 5.95, 'SIDES', '/images/seaweed-salad.jpg', true, true, null, 3, 25, 5, 45, 2, NOW(), NOW()),
('Edamame', 'Steamed soybeans with sea salt', 4.95, 'SIDES', '/images/edamame.jpg', true, false, null, 5, 40, 10, 120, 11, NOW(), NOW()),
('Macaroni Salad', 'Hawaiian-style creamy macaroni salad', 5.95, 'SIDES', '/images/mac-salad.jpg', true, true, null, 5, 15, 3, 280, 8, NOW(), NOW()),

-- Beverages
('POG Juice', 'Passion fruit, orange, and guava juice blend', 3.95, 'BEVERAGES', '/images/pog-juice.jpg', true, true, null, 2, 30, 8, 120, 0, NOW(), NOW()),
('Coconut Water', 'Fresh coconut water', 4.95, 'BEVERAGES', '/images/coconut-water.jpg', true, false, null, 1, 25, 6, 60, 0, NOW(), NOW()),
('Hawaiian Sun Drinks', 'Assorted local fruit drinks', 2.95, 'BEVERAGES', '/images/hawaiian-sun.jpg', true, false, null, 1, 40, 12, 80, 0, NOW(), NOW()),

-- Desserts
('Haupia', 'Traditional coconut pudding', 4.95, 'DESSERTS', '/images/haupia.jpg', true, true, null, 0, 20, 5, 160, 2, NOW(), NOW()),
('Malasadas', 'Portuguese donuts with sugar coating (3 pieces)', 6.95, 'DESSERTS', '/images/malasadas.jpg', true, false, null, 10, 15, 3, 320, 6, NOW(), NOW());

-- Add tags for menu items
INSERT INTO menu_item_tags (menu_item_id, tag) VALUES
(1, 'gluten-free'), (1, 'high-protein'), (1, 'local-favorite'),
(2, 'gluten-free'), (2, 'heart-healthy'), (2, 'omega-3'),
(3, 'spicy'), (3, 'high-protein'), (3, 'local-favorite'),
(4, 'premium'), (4, 'high-protein'), (4, 'chef-special'),
(5, 'sashimi-grade'), (5, 'premium'), (5, 'local-catch'),
(7, 'premium'), (7, 'local-catch'), (7, 'rare-find'),
(8, 'grilling'), (8, 'firm-texture'), (8, 'local-catch'),
(9, 'traditional'), (9, 'local-favorite'), (9, 'authentic'),
(10, 'snack'), (10, 'protein'), (10, 'traditional'),
(11, 'traditional'), (11, 'local-favorite'), (11, 'authentic'),
(13, 'healthy'), (13, 'fiber'), (13, 'organic'),
(14, 'superfood'), (14, 'minerals'), (14, 'local-favorite'),
(15, 'plant-based'), (15, 'protein'), (15, 'healthy'),
(16, 'local-favorite'), (16, 'comfort-food'), (16, 'creamy'),
(17, 'local-favorite'), (17, 'vitamin-c'), (17, 'tropical'),
(18, 'hydrating'), (18, 'natural'), (18, 'electrolytes'),
(20, 'traditional'), (20, 'coconut'), (20, 'local-favorite'),
(21, 'traditional'), (21, 'sweet'), (21, 'fried');

-- Add allergens for menu items that contain them
INSERT INTO menu_item_allergens (menu_item_id, allergen) VALUES
(16, 'eggs'), (16, 'gluten'),
(21, 'eggs'), (21, 'gluten'), (21, 'dairy');

-- Create sample staff members
INSERT INTO staff_members (name, email, role, active, created_at) VALUES
('Manager Mike', 'manager@aliifishmarket.com', 'MANAGER', true, NOW()),
('Cashier Ana', 'ana@aliifishmarket.com', 'CASHIER', true, NOW()),
('Kitchen Kai', 'kai@aliifishmarket.com', 'KITCHEN', true, NOW()),
('Admin Alice', 'admin@aliifishmarket.com', 'ADMIN', true, NOW());

-- Create business hours
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
(1, '06:00:00', '20:00:00', false), -- Monday
(2, '06:00:00', '20:00:00', false), -- Tuesday  
(3, '06:00:00', '20:00:00', false), -- Wednesday
(4, '06:00:00', '20:00:00', false), -- Thursday
(5, '06:00:00', '20:00:00', false), -- Friday
(6, '06:00:00', '20:00:00', false), -- Saturday
(0, '07:00:00', '19:00:00', false); -- Sunday

-- Create sample inventory items
INSERT INTO inventory_items (name, category, current_stock, minimum_stock, unit, price_per_unit, supplier, last_restocked, freshness, location) VALUES
('Ahi Tuna', 'Fresh Fish', 50, 10, 'lbs', 18.00, 'Pacific Fisheries', NOW() - INTERVAL '1 day', 'EXCELLENT', 'Main Display Case'),
('Salmon', 'Fresh Fish', 30, 8, 'lbs', 14.00, 'Alaska Seafood Co', NOW() - INTERVAL '1 day', 'EXCELLENT', 'Main Display Case'),
('Mahi Mahi', 'Fresh Fish', 0, 5, 'lbs', 16.00, 'Local Fisherman', NOW() - INTERVAL '3 days', 'EXPIRED', 'Not Available'),
('White Rice', 'Dry Goods', 100, 20, 'lbs', 2.00, 'Island Rice Supply', NOW() - INTERVAL '7 days', 'EXCELLENT', 'Dry Storage'),
('Seaweed', 'Produce', 25, 5, 'lbs', 8.00, 'Ocean Harvest', NOW() - INTERVAL '2 days', 'GOOD', 'Walk-in Cooler'),
('POG Juice', 'Beverages', 48, 12, 'bottles', 1.50, 'Hawaiian Beverage Co', NOW() - INTERVAL '1 day', 'EXCELLENT', 'Beverage Cooler');

-- Add some sample completed orders for analytics
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, order_type, status, payment_status, payment_method, subtotal, tax_amount, service_fee, total_amount, estimated_ready_time, created_at, updated_at, completed_at)
VALUES 
('ALI1704571200-A1B2', 'John Doe', 'john@example.com', '(808) 555-0123', 'PICKUP', 'COMPLETED', 'COMPLETED', 'NFC', 16.95, 0.80, 0.42, 18.17, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours'),
('ALI1704571300-C3D4', 'Jane Smith', 'jane@example.com', '(808) 555-0124', 'PICKUP', 'COMPLETED', 'COMPLETED', 'QR_CODE', 31.90, 1.50, 0.80, 34.20, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour'),
('ALI1704571400-E5F6', 'Mike Johnson', 'mike@example.com', '(808) 555-0125', 'PICKUP', 'READY', 'COMPLETED', 'VOICE', 24.95, 1.18, 0.62, 26.75, NOW() + INTERVAL '5 minutes', NOW() - INTERVAL '30 minutes', NULL);

-- Add order items for the sample orders
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal) VALUES
(1, 1, 1, 16.95, 16.95), -- Ahi Poke Bowl
(2, 1, 1, 16.95, 16.95), -- Ahi Poke Bowl  
(2, 2, 1, 15.95, 15.95), -- Salmon Poke Bowl
(3, 5, 1, 24.95, 24.95); -- Fresh Ahi Steak