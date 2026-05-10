-- Runs on first Postgres boot (mounted to /docker-entrypoint-initdb.d/).
-- Creates the two databases used by the stack: one for the app, one for Keycloak.
-- Both share the POSTGRES_USER created by the postgres image.

CREATE DATABASE blueprint_app;
CREATE DATABASE keycloak;
