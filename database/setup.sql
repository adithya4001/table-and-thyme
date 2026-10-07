-- Run as a MySQL administrator in MySQL Workbench. Local academic use only.
CREATE DATABASE IF NOT EXISTS table_thyme CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'tablethyme'@'localhost' IDENTIFIED BY 'tablethyme_local';
GRANT ALL PRIVILEGES ON table_thyme.* TO 'tablethyme'@'localhost';
-- Spring Boot creates tables and seeds the menu on first startup.
