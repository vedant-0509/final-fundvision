-- ============================================================
--  FundVision Pro — MySQL Schema
--  Version: 2.0  |  Engine: InnoDB  |  Charset: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS fundvision CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fundvision;

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    username      VARCHAR(80)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(120),
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    is_verified   TINYINT(1)   NOT NULL DEFAULT 0,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB;

-- ─── User Profiles (Financial) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id             INT UNSIGNED NOT NULL UNIQUE,
    -- Demographics
    age                 TINYINT UNSIGNED,
    occupation          VARCHAR(60),
    -- Income & Tax
    annual_income       DECIMAL(14,2),
    monthly_income      DECIMAL(14,2),
    annual_deductions   DECIMAL(14,2) DEFAULT 0,
    tax_bracket_pct     DECIMAL(5,2)  DEFAULT 0,
    -- Investment Profile
    risk_appetite       ENUM('very_low','low','medium','high','very_high') DEFAULT 'medium',
    investment_horizon  ENUM('short','medium','long','very_long') DEFAULT 'long',
    investment_goal     ENUM('wealth','retirement','education','tax','house','emergency') DEFAULT 'wealth',
    investment_style    ENUM('active','passive','hybrid') DEFAULT 'passive',
    -- Preferences
    preferred_sectors   JSON,          -- ["technology","banking","pharma"]
    excluded_sectors    JSON,
    -- Calculated Fields
    investable_monthly  DECIMAL(14,2),
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Refresh Tokens ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  DATETIME     NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- ─── Fund Master ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funds (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scheme_code     VARCHAR(20)  NOT NULL UNIQUE,  -- AMFI code
    name            VARCHAR(200) NOT NULL,
    fund_house      VARCHAR(100),
    category        ENUM('largecap','midcap','smallcap','flexicap','debt','hybrid','elss','index','sectoral') NOT NULL,
    asset_type      ENUM('equity','debt','hybrid') NOT NULL,
    -- Performance Metrics
    nav             DECIMAL(12,4),
    cagr_1y         DECIMAL(7,2),
    cagr_3y         DECIMAL(7,2),
    cagr_5y         DECIMAL(7,2),
    cagr_10y        DECIMAL(7,2),
    -- Risk Metrics
    sharpe_ratio    DECIMAL(6,3),
    sortino_ratio   DECIMAL(6,3),
    beta            DECIMAL(6,3),
    alpha           DECIMAL(6,3),
    std_deviation   DECIMAL(6,3),
    -- Fund Details
    aum_cr          DECIMAL(14,2),
    expense_ratio   DECIMAL(5,3),
    risk_level      ENUM('Low','Moderate','High','Very High') DEFAULT 'Moderate',
    star_rating     TINYINT UNSIGNED,
    exit_load       VARCHAR(60),
    lock_in_years   TINYINT UNSIGNED DEFAULT 0,
    -- Status
    is_active       TINYINT(1) DEFAULT 1,
    nav_date        DATE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_asset_type (asset_type),
    FULLTEXT idx_name (name)
) ENGINE=InnoDB;

-- ─── Portfolio Holdings ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    fund_id         INT UNSIGNED NOT NULL,
    -- Investment Details
    invested_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    units_held      DECIMAL(14,4) DEFAULT 0,
    avg_nav         DECIMAL(12,4),
    investment_type ENUM('sip','lumpsum') DEFAULT 'lumpsum',
    sip_amount      DECIMAL(12,2),          -- if SIP, monthly amount
    sip_date        TINYINT UNSIGNED,        -- day of month for SIP
    -- Tracking
    first_invested  DATE,
    last_invested   DATE,
    is_active       TINYINT(1) DEFAULT 1,
    notes           TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (fund_id) REFERENCES funds(id),
    UNIQUE KEY uq_user_fund (user_id, fund_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- ─── Transaction History ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    fund_id         INT UNSIGNED NOT NULL,
    txn_type        ENUM('buy','sell','sip') NOT NULL,
    amount          DECIMAL(14,2) NOT NULL,
    units           DECIMAL(14,4),
    nav_at_txn      DECIMAL(12,4),
    txn_date        DATE NOT NULL,
    notes           TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (fund_id) REFERENCES funds(id),
    INDEX idx_user_id (user_id),
    INDEX idx_txn_date (txn_date)
) ENGINE=InnoDB;

-- ─── AI Recommendation History ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    profile_snapshot JSON NOT NULL,           -- snapshot of profile at time of rec
    recommendations  JSON NOT NULL,           -- full rec payload
    ai_explanation   TEXT,
    model_used       VARCHAR(60) DEFAULT 'claude-sonnet-4-20250514',
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- ─── Portfolio Health Scores ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_scores (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id             INT UNSIGNED NOT NULL,
    overall_score       TINYINT UNSIGNED NOT NULL,    -- 0-100
    diversification     TINYINT UNSIGNED,
    return_quality      TINYINT UNSIGNED,
    risk_balance        TINYINT UNSIGNED,
    cost_efficiency     TINYINT UNSIGNED,
    rebalancing_advice  JSON,
    computed_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- ─── Calculator Sessions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calculator_sessions (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED,
    calc_type   ENUM('sip','lumpsum') NOT NULL,
    inputs      JSON NOT NULL,
    results     JSON NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── News & Sentiment Cache ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_sentiment (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    headline        VARCHAR(500) NOT NULL,
    source          VARCHAR(100),
    url             VARCHAR(500),
    sentiment       ENUM('positive','negative','neutral') DEFAULT 'neutral',
    sentiment_score DECIMAL(4,3),            -- -1.0 to +1.0
    keywords        JSON,
    published_at    DATETIME,
    fetched_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_published_at (published_at),
    INDEX idx_sentiment (sentiment)
) ENGINE=InnoDB;

-- ─── Seed: Fund Master Data ────────────────────────────────────────────────────
INSERT INTO funds (scheme_code,name,fund_house,category,asset_type,nav,cagr_1y,cagr_3y,cagr_5y,cagr_10y,sharpe_ratio,sortino_ratio,beta,alpha,aum_cr,expense_ratio,risk_level,star_rating,exit_load,lock_in_years) VALUES
('119551','Mirae Asset Large Cap Fund','Mirae Asset','largecap','equity',95.40,16.2,14.1,14.2,16.8,1.42,1.89,0.91,1.8,37820,0.54,'Low',5,'1% if <1yr',0),
('112090','Axis Bluechip Fund','Axis','largecap','equity',52.30,13.1,12.9,13.8,15.1,1.31,1.76,0.88,1.2,42100,0.63,'Low',5,'1% if <1yr',0),
('120503','ICICI Pru Bluechip Fund','ICICI Prudential','largecap','equity',88.70,14.4,13.2,12.9,15.8,1.28,1.71,0.93,0.9,51300,1.01,'Low',4,'1% if <1yr',0),
('100341','HDFC Top 100 Fund','HDFC','largecap','equity',910.20,17.8,16.5,13.6,14.9,1.19,1.62,0.96,1.1,28400,1.15,'Low',4,'1% if <1yr',0),
('112118','Kotak Emerging Equity Fund','Kotak','midcap','equity',112.40,24.3,22.1,19.4,21.3,1.54,2.08,0.89,3.2,39800,0.44,'High',5,'1% if <1yr',0),
('112065','Axis Midcap Fund','Axis','midcap','equity',89.20,20.1,18.4,21.2,22.8,1.62,2.21,0.82,4.1,22100,0.51,'High',5,'1% if <1yr',0),
('100270','HDFC Mid-Cap Opportunities','HDFC','midcap','equity',148.30,23.6,21.8,18.7,20.1,1.41,1.93,0.91,2.8,64200,0.97,'High',4,'1% if <1yr',0),
('125354','SBI Small Cap Fund','SBI','smallcap','equity',144.80,28.9,26.4,24.6,23.7,1.38,1.88,0.84,5.6,25600,0.68,'Very High',5,'1% if <1yr',0),
('118825','Nippon India Small Cap Fund','Nippon','smallcap','equity',178.20,31.2,29.1,26.1,25.4,1.45,1.97,0.88,6.2,47300,0.73,'Very High',4,'1% if <1yr',0),
('140251','Quant Small Cap Fund','Quant','smallcap','equity',218.50,34.1,31.4,28.3,24.9,1.52,2.04,0.94,7.8,18200,0.64,'Very High',4,'1% if <1yr',0),
('100663','SBI Magnum Gilt Fund','SBI','debt','debt',62.10,7.8,7.1,7.4,8.2,0.81,1.12,0.21,0.4,9800,0.44,'Low',4,'NIL',0),
('119823','HDFC Short Term Debt Fund','HDFC','debt','debt',28.40,7.9,7.5,7.9,8.6,0.86,1.18,0.18,0.5,14200,0.37,'Low',4,'NIL',0),
('128102','Axis Banking & PSU Debt Fund','Axis','debt','debt',23.80,7.6,7.2,7.2,8.1,0.79,1.09,0.19,0.3,8700,0.33,'Low',5,'NIL',0),
('120505','ICICI Pru Equity & Debt Fund','ICICI Prudential','hybrid','hybrid',302.40,19.1,18.4,15.3,16.8,1.22,1.68,0.71,2.1,28900,1.07,'Moderate',5,'1% if <1yr',0),
('119801','Mirae Asset Hybrid Equity Fund','Mirae Asset','hybrid','hybrid',28.70,17.8,17.1,14.8,15.4,1.18,1.61,0.69,1.8,9400,0.54,'Moderate',4,'1% if <1yr',0),
('120473','Canara Robeco Equity Hybrid','Canara Robeco','hybrid','hybrid',312.80,17.2,16.8,14.1,14.9,1.14,1.58,0.72,1.6,11200,0.55,'Moderate',4,'1% if <1yr',0),
('140633','Quant Tax Plan','Quant','elss','equity',318.40,33.4,30.2,27.4,24.1,1.58,2.14,0.97,8.9,7800,0.57,'High',5,'NIL',3),
('135781','Mirae Asset Tax Saver Fund','Mirae Asset','elss','equity',42.10,18.9,17.8,18.9,NULL,1.34,1.82,0.86,2.9,18400,0.50,'Moderate',5,'NIL',3),
('112087','Axis Long Term Equity Fund','Axis','elss','equity',74.80,14.8,14.1,16.2,18.9,1.19,1.64,0.84,1.7,32100,0.64,'Moderate',4,'NIL',3),
('120801','Parag Parikh Flexi Cap Fund','PPFAS','flexicap','equity',72.40,19.6,18.4,21.2,19.8,2.14,2.88,0.72,5.1,52400,0.74,'High',5,'2% if <365d',0);
