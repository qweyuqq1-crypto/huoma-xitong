-- ====================================================================
-- Postgraduate Multi-Tenant Live Routing Cache DB Schema (PostgreSQL 15+)
-- High Performance Domain Pooling & Analytics Systems
-- ====================================================================

-- 1. Tenants Table (Multi-customer Isolation)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(128) NOT NULL,
    contact_email VARCHAR(128) UNIQUE NOT NULL,
    current_tier VARCHAR(32) DEFAULT 'professional' CHECK (current_tier IN ('trial', 'professional', 'enterprise')),
    monthly_scan_quota INT DEFAULT 500000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant status queries
CREATE INDEX idx_tenants_status ON tenants(is_active);

-- 2. Tenant Administrators Table
CREATE TABLE tenant_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    email VARCHAR(128) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_tenant_admin UNIQUE (tenant_id, username)
);

-- Index for auth lookups
CREATE INDEX idx_admins_lookup ON tenant_admins(username, tenant_id);

-- 3. Dynamic QR Configurations (Campaigns)
CREATE TABLE dynamic_qr_configs (
    id VARCHAR(64) PRIMARY KEY, -- Unique routing keyword (e.g., summer_裂变)
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(256) NOT NULL,
    routing_type VARCHAR(16) NOT NULL DEFAULT 'group' CHECK (routing_type IN ('group', 'service')),
    force_wechat_browser BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_configs_tenant ON dynamic_qr_configs(tenant_id, is_active);

-- 4. QR Code Sub-Group Items (Actual Target QR code assets)
CREATE TABLE qr_group_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id VARCHAR(64) NOT NULL REFERENCES dynamic_qr_configs(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    qrcode_url TEXT NOT NULL,          -- base64 SVG or high performance CDN image URL
    max_scans INT NOT NULL DEFAULT 100, -- Maximum threshold before auto switching
    current_scans INT NOT NULL DEFAULT 0, -- Checked against atomic Redis counters
    weight INT NOT NULL DEFAULT 1,      -- Used for weighted load distribution
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_lookup ON qr_group_items(config_id, is_active);

-- 5. Time-routing Rules Configuration
CREATE TABLE time_split_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id VARCHAR(64) NOT NULL REFERENCES dynamic_qr_configs(id) ON DELETE CASCADE,
    start_time TIME NOT NULL, -- e.g. "09:00:00"
    end_time TIME NOT NULL,   -- e.g. "18:00:00"
    redirect_target UUID NOT NULL REFERENCES qr_group_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Region Geolocation Splits Table
CREATE TABLE region_split_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id VARCHAR(64) NOT NULL REFERENCES dynamic_qr_configs(id) ON DELETE CASCADE,
    province VARCHAR(64) NOT NULL, -- Target region e.g. "Guangdong"
    redirect_target UUID NOT NULL REFERENCES qr_group_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Domain Routing Pool (Saves Domain properties)
CREATE TABLE domain_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL, -- Can be global pool or tenant specific
    domain_address VARCHAR(128) NOT NULL UNIQUE,
    domain_type VARCHAR(16) NOT NULL CHECK (domain_type IN ('entrance', 'transit', 'landing')),
    status VARCHAR(16) NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'abnormal')),
    fail_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_domains_pool ON domain_pool(domain_type, status);

-- 8. Scan Access Telementry Logging Records (High-Performance Logging partitioned tables recommended in production)
CREATE TABLE scan_telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id VARCHAR(64) NOT NULL,
    target_qr_name VARCHAR(128) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    visitor_ip VARCHAR(45) NOT NULL,    -- Accommodates IPv6
    visitor_location VARCHAR(128) NOT NULL, -- IP Geolocation e.g. "Guangdong Shenzhen"
    device_model VARCHAR(128),              -- e.g., "iPhone 15 Pro Max"
    network_type VARCHAR(16),               -- WiFi, 5G, 4G, etc.
    user_stay_duration DECIMAL(6,2) DEFAULT 0.00, -- Real customer retention period on-page in seconds
    is_wechat_browser BOOLEAN DEFAULT TRUE,
    user_agent TEXT,
    referer_header TEXT,
    endpoint_domain VARCHAR(128) NOT NULL,
    is_attack_blocked BOOLEAN DEFAULT FALSE -- Flag for rate limited scanning blocks or crawling limits
);

CREATE INDEX idx_logs_aggregate ON scan_telemetry_logs(config_id, timestamp);
CREATE INDEX idx_logs_stay_ratio ON scan_telemetry_logs(user_stay_duration);

-- 9. Automatic System-Audit Alerts
CREATE TABLE system_audit_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(32) NOT NULL, -- "domain_blocked", "rate_limit_spam", "campaign_exhausted"
    alert_message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
