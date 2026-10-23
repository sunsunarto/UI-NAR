DROP TABLE IF EXISTS master_data_pemilik;
CREATE TABLE master_data_pemilik (
  id INT(11) NOT NULL AUTO_INCREMENT,
  no_ktp CHAR(16) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  lantai VARCHAR(30) DEFAULT NULL,
  ppjb VARCHAR(50) DEFAULT NULL,
  luas_m2 DECIMAL(10,2) DEFAULT NULL,
  harga_unit DECIMAL(15,2) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_no_ktp (no_ktp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS NPP_voting;
CREATE TABLE NPP_voting (
  id INT(11) NOT NULL AUTO_INCREMENT,
  no_ktp CHAR(16) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  unit VARCHAR(150) DEFAULT NULL,
  ppjb VARCHAR(255) DEFAULT NULL,
  total_luas DECIMAL(10,2) DEFAULT NULL,
  total_harga DECIMAL(15,2) DEFAULT NULL,
  total_npp DECIMAL(7,4) DEFAULT NULL,
  npp_efektif DECIMAL(7,4) DEFAULT NULL,
  isVoted1 TINYINT(1) DEFAULT 0,
  candidate1 VARCHAR(100) DEFAULT NULL,
  isVoted2 TINYINT(1) DEFAULT 0,
  candidate2 VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY idx_no_ktp (no_ktp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS admin_users;
CREATE TABLE admin_users (
  id INT(11) NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- UPDATE NPP_voting
-- SET total_npp = ROUND((total_luas / 50000) * 100, 4),
--     npp_efektif = LEAST(ROUND((total_luas / 50000) * 100, 4), 20)
-- WHERE total_luas IS NOT NULL AND total_luas > 0;

CREATE TABLE web_admins (
  id INT(11) NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  permission_module VARCHAR(255) NOT NULL COMMENT 'daftar modul dipisah koma, mis. absensi,hasil_voting',
  jobdesk VARCHAR(255) DEFAULT NULL,
  totp_secret VARCHAR(64) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  added_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;