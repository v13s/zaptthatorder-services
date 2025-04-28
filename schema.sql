-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS product_colors CASCADE;
DROP TABLE IF EXISTS product_sizes CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS loyalty_tier_perks CASCADE;
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS loyalty_tiers CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    description TEXT,
    image_url VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    loyalty_points INTEGER NOT NULL,
    stock INTEGER NOT NULL,
    rating DECIMAL(2,1),
    is_new BOOLEAN DEFAULT FALSE,
    is_sale BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Product Images Table
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE
);

-- Create Product Sizes Table
CREATE TABLE product_sizes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    size VARCHAR(50) NOT NULL,
    UNIQUE(product_id, size)
);

-- Create Product Colors Table
CREATE TABLE product_colors (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    name VARCHAR(50) NOT NULL,
    value VARCHAR(50) NOT NULL,
    UNIQUE(product_id, name)
);

-- Create Loyalty Tiers Table
CREATE TABLE loyalty_tiers (
    name VARCHAR(50) PRIMARY KEY,
    required_points INTEGER NOT NULL,
    multiplier DECIMAL(3,2) NOT NULL
);

-- Create Loyalty Tier Perks Table
CREATE TABLE loyalty_tier_perks (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(50) REFERENCES loyalty_tiers(name),
    perk VARCHAR(255) NOT NULL
);

-- Create Loyalty Transactions Table
CREATE TABLE loyalty_transactions (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Earned', 'Redeemed', 'Cancelled', 'Expired')),
    points INTEGER NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Completed', 'Pending'))
);

-- Create Coupons Table
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Percentage', 'Fixed')),
    source VARCHAR(50) NOT NULL CHECK (source IN ('Loyalty', 'Promotion', 'Birthday', 'Other')),
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- Create Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    is_loyalty_member BOOLEAN DEFAULT FALSE,
    social_links JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Carts Table
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    subtotal DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    estimated_loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Cart Items Table
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES carts(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    size VARCHAR(50),
    color VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Reviews Table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    user_name VARCHAR(255) NOT NULL,
    rating SMALLINT NOT NULL,
    comment TEXT NOT NULL,
    product_id INTEGER REFERENCES products(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Test Data from mockData.ts

-- Insert Products
INSERT INTO products (name, price, original_price, description, image_url, category, loyalty_points, stock, rating, is_new, is_sale) VALUES
('Classic Cotton T-Shirt', 24.99, NULL, 'A comfortable everyday classic t-shirt made from 100% cotton.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80', 'Clothing', 25, 50, 4.5, TRUE, FALSE),
('Slim Fit Jeans', 49.99, NULL, 'Modern slim fit jeans with a comfortable stretch fabric.', 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1026&q=80', 'Clothing', 50, 30, 4.2, FALSE, FALSE),
('Running Shoes', 89.99, 119.99, 'Lightweight running shoes with cushioned support.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80', 'Shoes', 90, 25, 4.8, FALSE, TRUE),
('Leather Tote Bag', 129.99, NULL, 'Spacious leather tote bag with multiple compartments.', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=876&q=80', 'Bags', 130, 15, 4.7, TRUE, FALSE),
('Gold Hoop Earrings', 34.99, NULL, 'Classic gold hoop earrings that go with any outfit.', 'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80', 'Accessories', 35, 40, 4.4, FALSE, FALSE),
('Summer Dress', 59.99, 79.99, 'Lightweight floral summer dress perfect for warm days.', 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=934&q=80', 'Clothing', 60, 20, 4.3, FALSE, TRUE),
('Polarized Sunglasses', 79.99, NULL, 'UV protective polarized sunglasses with durable frames.', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80', 'Accessories', 80, 35, 4.6, TRUE, FALSE),
('Casual Sneakers', 69.99, NULL, 'Comfortable everyday sneakers for casual wear.', 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1965&q=80', 'Shoes', 70, 45, 4.1, FALSE, FALSE),
('Crossbody Bag', 49.99, 69.99, 'Compact crossbody bag with adjustable strap.', 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1963&q=80', 'Bags', 50, 25, 4.4, FALSE, TRUE),
('Wool Blend Sweater', 89.99, NULL, 'Soft wool blend sweater for cooler weather.', 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80', 'Clothing', 90, 30, 4.5, FALSE, FALSE),
('Leather Wallet', 39.99, NULL, 'Genuine leather wallet with multiple card slots.', 'https://images.unsplash.com/photo-1627123424574-724758594e93?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80', 'Accessories', 40, 50, 4.2, FALSE, FALSE),
('Ankle Boots', 119.99, NULL, 'Stylish ankle boots with a small heel.', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80', 'Shoes', 120, 20, 4.7, TRUE, FALSE);

-- Insert Product Images
INSERT INTO product_images (product_id, image_url, is_primary) VALUES
(1, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80', TRUE),
(1, 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80', FALSE),
(1, 'https://images.unsplash.com/photo-1593726852644-42954344a7df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80', FALSE),
(2, 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1026&q=80', TRUE),
(3, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80', TRUE),
(4, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=876&q=80', TRUE),
(5, 'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80', TRUE),
(6, 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=934&q=80', TRUE),
(7, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80', TRUE),
(8, 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1965&q=80', TRUE),
(9, 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1963&q=80', TRUE),
(10, 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80', TRUE),
(11, 'https://images.unsplash.com/photo-1627123424574-724758594e93?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80', TRUE),
(12, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80', TRUE);

-- Insert Product Sizes
INSERT INTO product_sizes (product_id, size) VALUES
(1, 'XS'), (1, 'S'), (1, 'M'), (1, 'L'), (1, 'XL'),
(2, '28'), (2, '30'), (2, '32'), (2, '34'), (2, '36'),
(3, '7'), (3, '8'), (3, '9'), (3, '10'), (3, '11'),
(6, 'XS'), (6, 'S'), (6, 'M'), (6, 'L'),
(8, '7'), (8, '8'), (8, '9'), (8, '10'), (8, '11'),
(10, 'S'), (10, 'M'), (10, 'L'), (10, 'XL'),
(12, '6'), (12, '7'), (12, '8'), (12, '9');

-- Insert Product Colors
INSERT INTO product_colors (product_id, name, value) VALUES
(1, 'White', '#FFFFFF'), (1, 'Black', '#000000'), (1, 'Navy', '#000080'),
(2, 'Blue', '#0000FF'), (2, 'Black', '#000000'),
(3, 'Red', '#FF0000'), (3, 'Blue', '#0000FF'), (3, 'Black', '#000000'),
(4, 'Brown', '#964B00'), (4, 'Black', '#000000'),
(6, 'Floral', '#FF69B4'), (6, 'Blue', '#0000FF'),
(7, 'Black', '#000000'), (7, 'Tortoise', '#8B4513'),
(8, 'White', '#FFFFFF'), (8, 'Grey', '#808080'),
(9, 'Black', '#000000'), (9, 'Red', '#FF0000'), (9, 'Tan', '#D2B48C'),
(10, 'Cream', '#FFFDD0'), (10, 'Navy', '#000080'), (10, 'Burgundy', '#800020'),
(11, 'Brown', '#964B00'), (11, 'Black', '#000000'),
(12, 'Black', '#000000'), (12, 'Brown', '#964B00');

-- Insert Loyalty Tiers
INSERT INTO loyalty_tiers (name, required_points, multiplier) VALUES
('Bronze', 0, 1.00),
('Silver', 1000, 1.25),
('Gold', 5000, 1.50);

-- Insert Loyalty Tier Perks
INSERT INTO loyalty_tier_perks (tier_name, perk) VALUES
('Bronze', 'Earn 1 point per $1 spent'),
('Bronze', 'Birthday gift'),
('Bronze', 'Early access to sales'),
('Silver', 'Earn 1.25 points per $1 spent'),
('Silver', 'Birthday gift'),
('Silver', 'Early access to sales'),
('Silver', 'Free standard shipping'),
('Gold', 'Earn 1.5 points per $1 spent'),
('Gold', 'Premium birthday gift'),
('Gold', 'Early access to sales'),
('Gold', 'Free express shipping'),
('Gold', 'Exclusive events'),
('Gold', 'Personal shopping assistant');

-- Insert Loyalty Transactions
INSERT INTO loyalty_transactions (date, type, points, description, status) VALUES
('2025-04-25T14:30:00Z', 'Earned', 250, 'Purchase #12345', 'Completed'),
('2025-04-10T09:15:00Z', 'Redeemed', 500, 'Coupon: $5 off', 'Completed'),
('2025-04-01T16:45:00Z', 'Earned', 180, 'Purchase #12289', 'Completed'),
('2025-03-27T12:00:00Z', 'Earned', 320, 'Purchase #12100', 'Pending'),
('2025-03-15T10:30:00Z', 'Redeemed', 1000, 'Coupon: $10 off', 'Completed');

-- Insert Coupons
INSERT INTO coupons (code, value, type, source, expires_at, is_used) VALUES
('LOYALTY5', 5.00, 'Fixed', 'Loyalty', '2025-05-30T23:59:59Z', FALSE),
('LOYALTY10PCT', 10.00, 'Percentage', 'Promotion', '2025-05-15T23:59:59Z', FALSE),
('BIRTHDAY20', 20.00, 'Percentage', 'Birthday', '2025-06-01T23:59:59Z', FALSE);

-- Create Indexes for better query performance
-- These indexes will be added post-development based on query patterns
/*
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_loyalty_points ON products(loyalty_points);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_sizes_product_id ON product_sizes(product_id);
CREATE INDEX idx_product_colors_product_id ON product_colors(product_id);
CREATE INDEX idx_loyalty_transactions_date ON loyalty_transactions(date);
CREATE INDEX idx_coupons_expires_at ON coupons(expires_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
*/ 