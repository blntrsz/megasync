-- Up Migration
CREATE TABLE logs (
    id TEXT,
    updated_at TIMESTAMPTZ,

    data JSONB,
    operation TEXT,
    PRIMARY KEY (id, updated_at)
);
SELECT create_hypertable('logs', 'updated_at');


-- Down Migration
DROP TABLE IF EXISTS logs;
