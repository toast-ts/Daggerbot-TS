-- This is for the slave.
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD '<password_here>';

-- This is for the master.
SELECT * FROM pg_create_physical_replication_slot('replication_slot_slave');
SELECT * FROM pg_replication_slots;

-- https://medium.com/swlh/postgresql-replication-with-docker-c6a904becf77
