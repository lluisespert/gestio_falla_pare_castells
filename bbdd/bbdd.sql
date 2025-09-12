create database  if not exists pare_castells;
use pare_castells;
create table fallers (
    id int auto_increment primary key,
    nom varchar(100) not null,
    cognoms varchar(100) not null,
    domicili varchar(200) not null,
    telefon varchar(15) not null,
    dni varchar(15) not null unique,
    data_naixement date not null,
    email varchar(100) not null unique,
    edat int not null,
    grup varchar(100) not null,
    colaborador boolean not null,
    data_alta date not null
    
);

create table pagaments (
    id int auto_increment primary key,
    id_faller int not null,
    data_pagament date not null,
    quantitat decimal(10,2) not null,
    metode_pagament varchar(50) not null,
    total_pagament decimal(10,2) not null,
    aportat_pagament decimal(10,2) not null,
    falta_per_aportar decimal(10,2) not null,
    data_aportacio date not null,
    comentaris text,
    foreign key (id_faller) references fallers(id)
);