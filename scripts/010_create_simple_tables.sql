-- Create users table with simple authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'waiter',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  table_number INTEGER NOT NULL,
  waiter_id INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  notes TEXT
);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@restaurant.com', '$2b$10$rQZ8kHWKtGY5uFJ4uFJ4uOKtGY5uFJ4uFJ4uOKtGY5uFJ4uFJ4uO', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category) VALUES
('Margherita Pizza', 'Fresh tomatoes, mozzarella, basil', 12.99, 'Pizza'),
('Caesar Salad', 'Romaine lettuce, parmesan, croutons', 8.99, 'Salads'),
('Grilled Chicken', 'Herb-seasoned chicken breast', 15.99, 'Main Course'),
('Chocolate Cake', 'Rich chocolate layer cake', 6.99, 'Desserts')
ON CONFLICT DO NOTHING;
