-- Up Migration
CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA article_manager;
CREATE TABLE article_manager.articles (
    id SERIAL PRIMARY KEY,
    vector VECTOR(4096) NOT NULL
);

CREATE SCHEMA comment_service;
CREATE TABLE comment_service.comments (
    id SERIAL PRIMARY KEY,
    vector VECTOR(4096) NOT NULL
);

-- Down Migration
DROP TABLE IF EXISTS comment_service.comments;
DROP SCHEMA IF EXISTS comment_service;

DROP TABLE IF EXISTS article_manager.articles;
DROP SCHEMA IF EXISTS article_manager;

DROP EXTENSION IF EXISTS vector;
