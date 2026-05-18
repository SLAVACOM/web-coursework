SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS garden_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE garden_inventory;

CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50)  NOT NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,
  role            ENUM('admin','storekeeper','user') NOT NULL DEFAULT 'user',
  is_super_admin  BOOLEAN NOT NULL DEFAULT FALSE,
  first_name      VARCHAR(100),
  last_name       VARCHAR(100),
  gender          ENUM('М','Ж','Другое'),
  department      VARCHAR(100),
  phone           VARCHAR(20),
  photo           VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tools (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  category_id   INT,
  quantity      INT          NOT NULL DEFAULT 1,
  `condition`   ENUM('отличное','хорошее','удовлетворительное','плохое') NOT NULL DEFAULT 'хорошее',
  purchase_date DATE,
  price         DECIMAL(10,2),
  description   TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tool_images (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  tool_id   INT NOT NULL,
  filename  VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
  INDEX (tool_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  tool_id    INT NOT NULL,
  quantity   INT NOT NULL DEFAULT 1,
  status     ENUM('pending','approved','issued','returned','rejected') NOT NULL DEFAULT 'pending',
  note       TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


INSERT INTO categories (name) VALUES
  ('Лопаты'),
  ('Грабли'),
  ('Шланги и полив'),
  ('Ножницы и секаторы'),
  ('Тяпки и мотыги'),
  ('Прочее');

INSERT INTO tools (name, category_id, quantity, `condition`, purchase_date, price, description) VALUES
  ('Лопата штыковая',        1, 5, 'хорошее',           '2023-03-15', 850.00,  'Стандартная штыковая лопата'),
  ('Лопата совковая',        1, 3, 'удовлетворительное', '2021-04-10', 720.00,  'Для пересыпки сыпучих материалов'),
  ('Грабли металлические',   2, 4, 'отличное',           '2024-04-01', 650.00,  'Грабли с 12 металлическими зубьями'),
  ('Шланг поливочный 25 м',  3, 2, 'хорошее',           '2022-05-10', 1200.00, 'Армированный шланг для полива'),
  ('Дождеватель круговой',   3, 3, 'отличное',           '2024-03-20', 480.00,  'Автоматический круговой полив'),
  ('Секатор садовый',        4, 8, 'отличное',           '2024-02-14', 420.00,  'Для обрезки кустарников до 25 мм'),
  ('Ножницы для травы',      4, 4, 'хорошее',           '2023-06-01', 350.00,  'Длинные ручки, удобный хват'),
  ('Тяпка широкая',          5, 6, 'хорошее',           '2022-08-20', 390.00,  'Ширина полотна 15 см'),
  ('Мотыга трёхзубая',       5, 3, 'плохое',            '2020-05-05', 310.00,  'Требует заточки'),
  ('Тачка садовая',          6, 2, 'хорошее',           '2023-09-12', 3500.00, 'Объём кузова 80 л, пневмоколесо');
