-- CalTrack Database Schema + Seed Data
-- Run this in SQLiteCloud console to set up the database

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    daily_calorie_goal INTEGER DEFAULT 2000,
    daily_protein_goal FLOAT DEFAULT 50.0,
    daily_carbs_goal FLOAT DEFAULT 250.0,
    daily_fat_goal FLOAT DEFAULT 65.0,
    daily_water_goal_ml INTEGER DEFAULT 2000,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create foods table
CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    calories INTEGER NOT NULL,
    protein FLOAT DEFAULT 0,
    carbs FLOAT DEFAULT 0,
    fat FLOAT DEFAULT 0,
    unit VARCHAR DEFAULT '1 serving',
    barcode VARCHAR,
    is_preset BOOLEAN DEFAULT 0,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id)
);

-- Create meal_logs table
CREATE TABLE IF NOT EXISTS meal_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    meal_type VARCHAR NOT NULL,
    servings FLOAT DEFAULT 1.0,
    logged_at DATE DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(food_id) REFERENCES foods(id)
);

-- Create weight_logs table
CREATE TABLE IF NOT EXISTS weight_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    weight FLOAT NOT NULL,
    logged_at DATE DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Create water_logs table
CREATE TABLE IF NOT EXISTS water_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount_ml INTEGER NOT NULL,
    logged_at DATE DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Create meal_templates table
CREATE TABLE IF NOT EXISTS meal_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    meal_type VARCHAR NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Create meal_template_items table
CREATE TABLE IF NOT EXISTS meal_template_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    servings FLOAT DEFAULT 1.0,
    FOREIGN KEY(template_id) REFERENCES meal_templates(id),
    FOREIGN KEY(food_id) REFERENCES foods(id)
);

-- Seed preset foods (HK & Indian)
INSERT OR IGNORE INTO foods (name, category, calories, protein, carbs, fat, unit, is_preset) VALUES
-- HK Classics
('Pineapple Bun with Butter (Bolo Yau)', 'HK Classic', 360, 6, 45, 18, '1 piece', 1),
('HK-Style Milk Tea (Iced)', 'Beverage', 180, 3, 22, 8, '1 cup', 1),
('HK French Toast with Syrup', 'HK Classic', 520, 10, 58, 28, '1 plate', 1),
('Baked Pork Chop Rice', 'HK Classic', 780, 32, 85, 34, '1 plate', 1),
('Satay Beef Instant Noodles', 'HK Classic', 620, 22, 68, 28, '1 bowl', 1),
('Char Siu Rice (BBQ Pork Rice)', 'HK Classic', 680, 30, 82, 24, '1 plate', 1),
('Siu Mai (Pork & Shrimp Dim Sum)', 'HK Classic', 240, 14, 16, 12, '4 pieces', 1),
('Har Gow (Shrimp Dumplings)', 'HK Classic', 180, 10, 22, 5, '4 pieces', 1),
('Curry Fish Balls', 'HK Classic', 160, 8, 12, 9, '6 skewers', 1),
('Egg Tart', 'HK Classic', 220, 4, 24, 12, '1 piece', 1),
('Wonton Noodle Soup', 'HK Classic', 350, 18, 42, 10, '1 bowl', 1),
('Roast Goose Rice', 'HK Classic', 720, 35, 78, 28, '1 plate', 1),
('Congee with Pork', 'HK Classic', 280, 12, 38, 8, '1 bowl', 1),
('Cheung Fun (Rice Noodle Roll)', 'HK Classic', 200, 6, 32, 5, '1 plate', 1),
-- Packaged
('Vita Lemon Tea (250ml)', 'Packaged', 135, 0, 34, 0, '1 box', 1),
('Vitasoy Soymilk (250ml)', 'Packaged', 120, 6, 16, 3.5, '1 box', 1),
('Garden Life Bread (White)', 'Packaged', 150, 5, 28, 2, '2 slices', 1),
('Nissin Demae Icchio Noodles', 'Packaged', 470, 10, 62, 20, '1 pack', 1),
-- Indian
('Chicken Tikka Masala', 'Indian', 380, 28, 12, 24, '1 portion (200g)', 1),
('Butter Chicken', 'Indian', 440, 26, 14, 30, '1 portion (200g)', 1),
('Dal Makhani', 'Indian', 320, 12, 38, 14, '1 bowl', 1),
('Palak Paneer', 'Indian', 290, 14, 10, 22, '1 portion', 1),
('Garlic Naan', 'Indian', 230, 6, 38, 6, '1 piece', 1),
('Vegetable Biryani', 'Indian', 350, 8, 58, 10, '1 plate', 1),
('Chana Masala', 'Indian', 240, 10, 34, 7, '1 bowl', 1),
('Samosa (Potato & Pea)', 'Indian', 260, 4, 32, 13, '2 pieces', 1),
('Tandoori Chicken', 'Indian', 280, 32, 4, 14, '2 pieces', 1),
('Aloo Gobi', 'Indian', 180, 4, 24, 8, '1 portion', 1),
-- Beverages
('Masala Chai', 'Beverage', 90, 3, 12, 3, '1 cup', 1),
('Mango Lassi', 'Beverage', 210, 5, 36, 5, '1 glass', 1),
('Coca Cola (330ml)', 'Beverage', 139, 0, 35, 0, '1 can', 1),
('Coffee (Black)', 'Beverage', 5, 0, 0, 0, '1 cup', 1),
('Orange Juice', 'Beverage', 110, 2, 26, 0, '1 glass', 1);
