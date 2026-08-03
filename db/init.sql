DROP TABLE IF EXISTS users;

-- CREATE TABLE users (
--     id SERIAL PRIMARY KEY,
--     username VARCHAR(50) UNIQUE NOT NULL,
--     email VARCHAR(100) UNIQUE NOT NULL,
--     hashed_password VARCHAR(255) NOT NULL,
--     is_active BOOLEAN DEFAULT TRUE,
--     is_two_factor_enabled BOOLEAN DEFAULT FALSE,
--     two_factor_secret VARCHAR(100),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- INSERT INTO users (username, email, hashed_password)
-- VALUES (
--     'test_user', 
--     'test@example.com', 
--     '$2b$12$EixZaYVK1fsY1Z.y2H.A4O.vK/9Nl2k83lB1F8Uhy6XWjFfSgXeKW'
-- );