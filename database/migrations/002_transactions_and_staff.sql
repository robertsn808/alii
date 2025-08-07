-- Staff Management
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'cashier', -- cashier, manager, admin
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL, -- TXN-timestamp-random
    receipt_number VARCHAR(20) NOT NULL,
    staff_id INTEGER REFERENCES staff(id),
    payment_method VARCHAR(20) NOT NULL, -- cash, card, nfc, qr
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    cash_received DECIMAL(10,2), -- Only for cash payments
    change_given DECIMAL(10,2), -- Only for cash payments
    status VARCHAR(20) DEFAULT 'completed', -- completed, refunded, voided
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT positive_amounts CHECK (
        subtotal >= 0 AND 
        tax_amount >= 0 AND 
        total_amount >= 0 AND
        (cash_received IS NULL OR cash_received >= 0) AND
        (change_given IS NULL OR change_given >= 0)
    )
);

-- Transaction Items table
CREATE TABLE IF NOT EXISTS transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_price DECIMAL(8,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    line_total DECIMAL(10,2) NOT NULL, -- item_price * quantity
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT positive_values CHECK (
        item_price >= 0 AND 
        quantity > 0 AND 
        line_total >= 0
    )
);

-- Daily Sales Summary table
CREATE TABLE IF NOT EXISTS daily_sales (
    id SERIAL PRIMARY KEY,
    sales_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    total_transactions INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    cash_sales DECIMAL(12,2) DEFAULT 0.00,
    card_sales DECIMAL(12,2) DEFAULT 0.00,
    nfc_sales DECIMAL(12,2) DEFAULT 0.00,
    qr_sales DECIMAL(12,2) DEFAULT 0.00,
    tax_collected DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff Daily Performance table
CREATE TABLE IF NOT EXISTS staff_daily_performance (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id),
    performance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transactions_processed INTEGER DEFAULT 0,
    total_sales DECIMAL(12,2) DEFAULT 0.00,
    cash_handled DECIMAL(12,2) DEFAULT 0.00,
    hours_worked DECIMAL(4,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(staff_id, performance_date)
);

-- Cash Drawer Operations table
CREATE TABLE IF NOT EXISTS cash_drawer_operations (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id),
    operation_type VARCHAR(20) NOT NULL, -- open, close, add_cash, remove_cash, count
    amount DECIMAL(10,2), -- For cash operations
    reason VARCHAR(255), -- For cash adds/removes
    opening_balance DECIMAL(10,2), -- For open/close operations
    closing_balance DECIMAL(10,2), -- For close operations
    expected_balance DECIMAL(10,2), -- For close operations
    variance DECIMAL(10,2), -- closing_balance - expected_balance
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_operation CHECK (
        operation_type IN ('open', 'close', 'add_cash', 'remove_cash', 'count')
    )
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_staff ON transactions(staff_id);
CREATE INDEX idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_daily_sales_date ON daily_sales(sales_date);
CREATE INDEX idx_staff_performance_date ON staff_daily_performance(performance_date);
CREATE INDEX idx_staff_performance_staff ON staff_daily_performance(staff_id);
CREATE INDEX idx_cash_drawer_staff ON cash_drawer_operations(staff_id);
CREATE INDEX idx_cash_drawer_date ON cash_drawer_operations(created_at);

-- Insert sample staff members
INSERT INTO staff (employee_id, first_name, last_name, email, role) VALUES 
('EMP001', 'Keoni', 'Nakamura', 'keoni@aliifishmarket.com', 'manager'),
('EMP002', 'Leilani', 'Tanaka', 'leilani@aliifishmarket.com', 'cashier'),
('EMP003', 'Koa', 'Williams', 'koa@aliifishmarket.com', 'cashier'),
('EMP004', 'Nalani', 'Santos', 'nalani@aliifishmarket.com', 'cashier');

-- Function to update daily sales summary
CREATE OR REPLACE FUNCTION update_daily_sales() 
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert daily sales summary
    INSERT INTO daily_sales (
        sales_date, 
        total_transactions, 
        total_revenue, 
        cash_sales, 
        card_sales, 
        nfc_sales, 
        qr_sales, 
        tax_collected
    )
    VALUES (
        NEW.transaction_date, 
        1, 
        NEW.total_amount,
        CASE WHEN NEW.payment_method = 'cash' THEN NEW.total_amount ELSE 0 END,
        CASE WHEN NEW.payment_method = 'card' THEN NEW.total_amount ELSE 0 END,
        CASE WHEN NEW.payment_method = 'nfc' THEN NEW.total_amount ELSE 0 END,
        CASE WHEN NEW.payment_method = 'qr' THEN NEW.total_amount ELSE 0 END,
        NEW.tax_amount
    )
    ON CONFLICT (sales_date) DO UPDATE SET
        total_transactions = daily_sales.total_transactions + 1,
        total_revenue = daily_sales.total_revenue + NEW.total_amount,
        cash_sales = daily_sales.cash_sales + CASE WHEN NEW.payment_method = 'cash' THEN NEW.total_amount ELSE 0 END,
        card_sales = daily_sales.card_sales + CASE WHEN NEW.payment_method = 'card' THEN NEW.total_amount ELSE 0 END,
        nfc_sales = daily_sales.nfc_sales + CASE WHEN NEW.payment_method = 'nfc' THEN NEW.total_amount ELSE 0 END,
        qr_sales = daily_sales.qr_sales + CASE WHEN NEW.payment_method = 'qr' THEN NEW.total_amount ELSE 0 END,
        tax_collected = daily_sales.tax_collected + NEW.tax_amount,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Update staff daily performance
    INSERT INTO staff_daily_performance (
        staff_id,
        performance_date,
        transactions_processed,
        total_sales,
        cash_handled
    )
    VALUES (
        NEW.staff_id,
        NEW.transaction_date,
        1,
        NEW.total_amount,
        CASE WHEN NEW.payment_method = 'cash' THEN NEW.total_amount ELSE 0 END
    )
    ON CONFLICT (staff_id, performance_date) DO UPDATE SET
        transactions_processed = staff_daily_performance.transactions_processed + 1,
        total_sales = staff_daily_performance.total_sales + NEW.total_amount,
        cash_handled = staff_daily_performance.cash_handled + CASE WHEN NEW.payment_method = 'cash' THEN NEW.total_amount ELSE 0 END,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic daily sales updates
CREATE TRIGGER transaction_daily_sales_trigger
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_sales();

-- Function to get daily transaction summary
CREATE OR REPLACE FUNCTION get_daily_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    date DATE,
    total_transactions BIGINT,
    total_revenue NUMERIC,
    cash_revenue NUMERIC,
    card_revenue NUMERIC,
    nfc_revenue NUMERIC,
    qr_revenue NUMERIC,
    tax_collected NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ds.sales_date,
        ds.total_transactions::BIGINT,
        ds.total_revenue,
        ds.cash_sales,
        ds.card_sales,
        ds.nfc_sales,
        ds.qr_sales,
        ds.tax_collected
    FROM daily_sales ds
    WHERE ds.sales_date = target_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get staff performance for a date range
CREATE OR REPLACE FUNCTION get_staff_performance(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    staff_name TEXT,
    employee_id VARCHAR,
    total_transactions BIGINT,
    total_sales NUMERIC,
    cash_handled NUMERIC,
    avg_transaction_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CONCAT(s.first_name, ' ', s.last_name) as staff_name,
        s.employee_id,
        SUM(sdp.transactions_processed)::BIGINT as total_transactions,
        SUM(sdp.total_sales) as total_sales,
        SUM(sdp.cash_handled) as cash_handled,
        CASE 
            WHEN SUM(sdp.transactions_processed) > 0 
            THEN SUM(sdp.total_sales) / SUM(sdp.transactions_processed)
            ELSE 0
        END as avg_transaction_amount
    FROM staff s
    LEFT JOIN staff_daily_performance sdp ON s.id = sdp.staff_id
    WHERE sdp.performance_date BETWEEN start_date AND end_date
    GROUP BY s.id, s.first_name, s.last_name, s.employee_id
    ORDER BY total_sales DESC;
END;
$$ LANGUAGE plpgsql;