
# --- !Ups

CREATE SEQUENCE device_id_seq;
CREATE SEQUENCE location_id_seq;

CREATE TABLE device (
    id integer NOT NULL DEFAULT nextval('device_id_seq'),
    name varchar(255),
    deviceId varchar(255) unique,
    locationId int DEFAULT NULL,
    osType varchar(255)
);

CREATE TABLE location (
    id integer NOT NULL DEFAULT nextval('location_id_seq'),
    name varchar(255) unique
);

# --- !Downs

DROP TABLE device;
DROP TABLE location;

DROP SEQUENCE device_id_seq;
DROP SEQUENCE locaiton_id_seq;