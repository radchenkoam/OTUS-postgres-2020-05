<div align="right"><h5> Занятие #6 - Домашнее задание - Вариант 1</h5></div>


<div align="center"><h2>Работа с базами данных PostgreSQL, </br>пользователями и правами</h2></div>

***
- Создал новый экземпляр бд PostgreSQL в Google Cloud SQL.
`SQL` -> `Выбрать PostgreSQL` 

:hammer_and_wrench: Параметр | :memo: Значение |:hammer_and_wrench: Параметр | :memo: Значение |
--------------:|---------------|--------------:|---------------|
| Идентификатор экземпляра | **`lesson-6-var-1`** | Регион | `us-central1 (Айова)` | 
| Пароль пользователя по умолчанию (postgres) | `123` | Зона | `us-central1-a` |
| Варианты конфигурации | _по умолчанию (всё включено)_ | Версия базы данных | `PostgreSQL 11` | 

-> `Создать`

- Настроил подключения к экземпляру бд _PostgreSQL_ в _Google Cloud SQL_:
    - открыл вкладку _Общая информация_ экземпляра (щелкнул на его имени).
    - в разделе _«Авторизованные сети»_ нажал _«+Добавить ресурс: сеть»_, ввел `0.0.0.0/0` (открыт доступ всем сетям). 
    _(правильно было ввести внешний адрес своей сети (http://ipv4.whatismyv6.com/)_
    - в терминале своего компьютера подключился к экземпляру:
     `psql "sslmode = disable dbname = postgres user = postgres hostaddr = 104.155.152.107"`
```bash
postgres=> \c
psql (12.2 (Ubuntu 12.2-4), server 11.6)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
You are now connected to database "postgres" as user "postgres".
```

- Создал БД: 
`create database testdb;`
```bash
postgres=> \l
                                                List of databases
     Name      |       Owner       | Encoding |  Collate   |   Ctype    |            Access privileges            
---------------+-------------------+----------+------------+------------+-----------------------------------------
 cloudsqladmin | cloudsqladmin     | UTF8     | en_US.UTF8 | en_US.UTF8 | 
 postgres      | cloudsqlsuperuser | UTF8     | en_US.UTF8 | en_US.UTF8 | 
 template0     | cloudsqladmin     | UTF8     | en_US.UTF8 | en_US.UTF8 | =c/cloudsqladmin                       +
               |                   |          |            |            | cloudsqladmin=CTc/cloudsqladmin
 template1     | cloudsqlsuperuser | UTF8     | en_US.UTF8 | en_US.UTF8 | =c/cloudsqlsuperuser                   +
               |                   |          |            |            | cloudsqlsuperuser=CTc/cloudsqlsuperuser
 testdb        | postgres          | UTF8     | en_US.UTF8 | en_US.UTF8 | 
(5 rows)

```

- Переключился на созданную БД: 
```sql
postgres=> \c testdb;
psql (12.2 (Ubuntu 12.2-4), server 11.6)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
You are now connected to database "testdb" as user "postgres".
testdb=> 
```
***
- создал схему командой: 
  `create schema testnm;`
```bash
testdb=> \dn
      List of schemas
  Name  |       Owner       
--------+-------------------
 public | cloudsqlsuperuser
 testnm | postgres
(2 rows)
```

> 6 создайте новую таблицу t1 с одной колонкой c1 типа integer

- по ходу задания необходимо создать таблицу без конкретного указания схемы, поэтому создал таблицу командой: 
`create table t1 (c1 integer);`
```bash
testdb=> select current_schema();
 current_schema 
----------------
 public
(1 row)
```

```bash
testdb=> \dt
        List of relations
 Schema | Name | Type  |  Owner   
--------+------+-------+----------
 public | t1   | table | postgres
(1 row)
```

- вставил данные: 
`insert into t1 (c1) values (1);`
```sql
testdb=> select * from t1;
 c1 
----
  1
(1 row)
```

- создал роль **readonly**: 
`create role readonly;`
```bash
testdb=> \du
                                                List of roles
         Role name         |                         Attributes                         |      Member of      
---------------------------+------------------------------------------------------------+---------------------
 cloudsqladmin             | Superuser, Create role, Create DB, Replication, Bypass RLS | {}
 cloudsqlagent             | Create role, Create DB                                     | {cloudsqlsuperuser}
 cloudsqliamserviceaccount | Cannot login                                               | {}
 cloudsqliamuser           | Cannot login                                               | {}
 cloudsqlimportexport      | Create role, Create DB                                     | {cloudsqlsuperuser}
 cloudsqlreplica           | Replication                                                | {}
 cloudsqlsuperuser         | Create role, Create DB                                     | {pg_monitor}
 postgres                  | Create role, Create DB                                     | {cloudsqlsuperuser}
 readonly                  | Cannot login                                               | {}
```

- дал новой роли право на подключение к базе данных _testdb_: 
`grant connect on database testdb to readonly;`
- дал новой роли право на использование схемы _testnm_: 
`grant usage on schema testnm to readonly;`
- дал новой роли право на select для всех таблиц схемы _testnm_: 
`grant select on all tables in schema testnm to readonly;`

- создал пользователя _testread_ с паролем `test123`: 
`create user testread with password 'test123' login;`
```bash
         Role name         |                         Attributes                         |      Member of      
---------------------------+------------------------------------------------------------+---------------------
 cloudsqladmin             | Superuser, Create role, Create DB, Replication, Bypass RLS | {}
 cloudsqlagent             | Create role, Create DB                                     | {cloudsqlsuperuser}
 cloudsqliamserviceaccount | Cannot login                                               | {}
 cloudsqliamuser           | Cannot login                                               | {}
 cloudsqlimportexport      | Create role, Create DB                                     | {cloudsqlsuperuser}
 cloudsqlreplica           | Replication                                                | {}
 cloudsqlsuperuser         | Create role, Create DB                                     | {pg_monitor}
 postgres                  | Create role, Create DB                                     | {cloudsqlsuperuser}
 readonly                  | Cannot login                                               | {}
 testread                  |                                                            | {}
```
- дал роль readonly пользователю _testread_: 
`grant readonly to testread;` 
***

- зашел под пользователем _testread_ в базу данных _testdb_: 
```bash
testdb=> \c testdb testread
Password for user testread: 
psql (12.2 (Ubuntu 12.2-4), server 11.6)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
You are now connected to database "testdb" as user "testread".
testdb=> 
```
- выполнил запрос `select * from t1;`
```bash
testdb=> select * from t1;
ERROR:  permission denied for table t1
```
> **Q:** 16 получилось? (могло если вы делали сами не по шпаргалке и не упустили один существенный момент про который позже) 

**A:** _Нет, не получилось, потому что права для роли раздавались для схемы _testnm_ в БД _testdb_ и затем логин _testread_ унаследовал эти права_.  

> **Q:** 17 напишите что именно произошло в тексте домашнего задания
> 18 у вас есть идеи почему? ведь права то дали?

**A:** _Потому что таблица _t1_ создана в схеме _public_ на которую у логина _testread_ нет прав._

> 19 посмотрите на список таблиц
```bash
testdb=> \dp
                            Access privileges
 Schema | Name | Type  | Access privileges | Column privileges | Policies 
--------+------+-------+-------------------+-------------------+----------
 public | t1   | table |                   |                   | 
(1 row)
```
> **Q:** 21 а почему так получилось с таблицей (если делали сами и без шпаргалки то может у вас все нормально)

 **A:** _Потому что если не указать схему явно при создании таблицы, то она создается по умолчанию в схеме public_. 

***

- подключился к бд _testdb_ под пользователем _postgres_: 
```bash
testdb=> \c testdb postgres
Password for user postgres: 
psql (12.2 (Ubuntu 12.2-4), server 11.6)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
You are now connected to database "testdb" as user "postgres".
```
- удалил таблицу t1: 
`drop table t1;`
- создал ее заново с явным указанием имени схемы _testnm_:
`create table testnm.t1 (c1 integer);`
- вставил данные: 
`insert into testnm.t1 (c1) values (1);`
- зашел под пользователем _testread_ в базу данных _testdb_: 
```bash
testdb=> \c testdb testread
Password for user testread: 
psql (12.2 (Ubuntu 12.2-4), server 11.6)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
You are now connected to database "testdb" as user "testread".
```
- выполнил запрос: 
```bash
testdb=> select * from testnm.t1;
ERROR:  permission denied for table t1
```
> **Q:** 28 получилось?
> 29 есть идеи почему? 

**A:** _Нет, не получилось, т.к. права были даны для таблиц которые существовали на тот момент, а таблицу _t1_ я пересоздал, и разрешения на нее утратились._

> **Q:** 30 как сделать так чтобы такое больше не повторялось?

**A:** _Необходимо изменить поведение по умолчанию для раздачи прав доступа. 
Для этого есть команда_ `alter default privileges`.

***

- выполнил команду (от имени пользователя _postgres_): 
`alter default privileges in schema testnm grant select on tables to readonly;`

- выполнил запрос (от имени _testdb_): 
```bash
testdb=> select * from testnm.t1;
ERROR:  permission denied for table t1
```
> **Q:** 32 получилось?
> 33 есть идеи почему?

**A:** _Нет, т.к. мы изменили поведение по умолчанию только для таблиц, создаваемых в будущем. А текущие права не трогали. Необходимо снова выполнить команду_ `grant select` _или пересоздать таблицу._

- выполнил снова команду (от имени _postgres_): 
`grant select on all tables in schema testnm to readonly;`

- проверил, снова выполнил запрос (от имени _testdb_): 
```bash
testdb=> select * from testnm.t1;
 c1 
----
  1
(1 row)
```
> **Q:** 32 получилось?

**A:** _Да, теперь всё ОК._
***
- выполнил команды (от имени _testread_): 
```bash
testdb=> create table t2 (c1 integer); insert into t2 values (2);
CREATE TABLE
INSERT 0 1
```
> **Q:** 35 а как так? нам же никто прав на создание таблиц и insert в них под ролью readonly?
> 36 есть идеи? если нет - смотрите шпаргалку

_Когда я создал нового пользователя _readonly_ ему по умолчанию раздалась роль _public_, а эта роль позволяет выполнять все действия в схеме _public_ в тех базах данных, к которым у пользователя есть доступ. 
Чтобы избежать такого поведения необходимо запретить будущее создание объектов в схеме _public_ и отозвать действующие права в схеме _public_._ 

- выполнил команды (от имени _postgres_): 
`revoke create on schema public from public;` 
`revoke all on database testdb from public;`

- проверил, выполнил команду (от имени _testread_): 
```bash
testdb=> create table t3 (c1 integer);
ERROR:  permission denied for schema public
LINE 1: create table t3 (c1 integer);
                     ^
```
Не получилось, т.к. права на создание новых объектов в схеме _public_ уже отозваны.

- вставить строку получилось: 
```bash
testdb=> insert into t2 values (2);
INSERT 0 1
```
***
**Вот мое расследование по этому поводу:**
я посмотрел на таблицу _t2_ повнимательнее: 
```bash
testdb=> \d
        List of relations
 Schema | Name | Type  |  Owner   
--------+------+-------+----------
 public | t2   | table | testread
(1 row)
```
Владельцем таблицы является _testread_. 

Тогда, я подумал, что возможно надо поменять владельца на _postgres_, например, и выполнить `revoke all on database testdb from public;` еще раз. 

Решил, что в _Cloud SQL_ создается юзер _postgres_ не с правами _superuser_, и поэтому забрать права, которые дал не он (косвенные права владельца созданной таблицы) он не может.

На команду от имени _postgres_ я получил ошибку:
```bash
testdb=> alter table t2 owner to postgres;
ERROR:  must be owner of table t2
```
На команду от имени _testread_ получил ошибку:
```bash
testdb=> alter table t2 owner to postgres;
ERROR:  must be member of role "postgres"
```

Дальше, я посмотрел права для роли _postgres_:
```bash
testdb=> select * from pg_roles where rolname = 'postgres';
 rolname  | rolsuper | rolinherit | rolcreaterole | rolcreatedb | rolcanlogin | rolreplication | rolconnlimit | rolpassword | rolvaliduntil | rolbypassrls | rolconfig |  oid  
----------+----------+------------+---------------+-------------+-------------+----------------+--------------+-------------+---------------+--------------+-----------+-------
 postgres | f        | t          | t             | t           | t           | f              |           -1 | ********    |               | f            |           | 16389
(1 row)
```
Увидел, что, действительно, - rolsuper = f, т.е. _postgres_ не является суперпользователем в _CloudSQL_, и до конца забрать права у _testread_ он не смог, что и позволило выполнить вставку _testread_ в таблицу _public.t2_ после команды `revoke all on database testdb from public;`.


