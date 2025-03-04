-- Up Migration
CREATE SCHEMA relationships;
CREATE SCHEMA article_manager;
CREATE SCHEMA comment_service;

-- Create relationships.relationships table
CREATE TABLE relationships.relationships (
    id SERIAL PRIMARY KEY,
    previous_domain_object_id INTEGER NOT NULL,
    next_domain_object_id INTEGER NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create relationships.domain_objects table
CREATE TABLE relationships.domain_objects (
    id SERIAL PRIMARY KEY,
    domain_object_type TEXT NOT NULL,
    domain_object_id INTEGER NOT NULL,
    name TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create article_manager.articles table
CREATE TABLE article_manager.articles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create comment_service.comments table
CREATE TABLE comment_service.comments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Down Migration
DROP TABLE IF EXISTS relationships.relationships;
DROP TABLE IF EXISTS relationships.domain_objects;
DROP TABLE IF EXISTS article_manager.articles;
DROP TABLE IF EXISTS comment_service.comments;
DROP SCHEMA IF EXISTS relationships CASCADE;
DROP SCHEMA IF EXISTS article_manager CASCADE;
DROP SCHEMA IF EXISTS comment_service CASCADE;
