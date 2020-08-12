<div align="right"><h5> Занятие #8 - Домашнее задание - Вариант 2</h5></div>


<div align="center"><h3>Работа с механизмом блокировок объектов и строк</h3></div>

***
<div align=center><h4>1. Настройка сервера</h4></div>  

***
- создал виртуальную машину `lesson-8-variant-2` в _GCP Compute Enigine_  

- установил _PostgreSQL 11_  

- по условиям домашнего задания, необходимо настроить сервер так, чтобы в журнал сообщений сбрасывалась информация о блокировках, удерживаемых более 200 миллисекунд, проверил настройки сервера:
    - [log_lock_waits](https://postgrespro.ru/docs/postgrespro/11/runtime-config-logging#GUC-LOG-LOCK-WAITS "Ctrl+click -> new tab")  
    ```sql
    show log_lock_waits;  

    -[ RECORD 1 ]--+----
    log_lock_waits | off
    ```
    - [deadlock_timeout](https://postgrespro.ru/docs/postgrespro/11/runtime-config-locks#GUC-DEADLOCK-TIMEOUT "Ctrl+click -> new tab")  
    ```sql
    show deadlock_timeout;  

    -[ RECORD 1 ]----+---
    deadlock_timeout | 1s
    ```
    - посмотрел _context_ этих параметров: 
    ```sql
    select name, context from pg_settings where name in ('log_lock_waits', 'deadlock_timeout');

    -[ RECORD 1 ]-------------
    name    | deadlock_timeout
    context | superuser
    -[ RECORD 2 ]-------------
    name    | log_lock_waits
    context | superuser
    ```  

    > :warning: context -> [superuser](https://postgrespro.ru/docs/postgrespro/11/view-pg-settings "Ctrl+click -> new tab") в нашем случае означает то, чтобы не устанавливать эти параметры для каждого сеанса каждый раз, можно изменить их в файле конфигурации, и выполнить перезапуск сервера  

    - изменил параметры конфигурации сервера с помощью команды [alter system](https://postgrespro.ru/docs/postgresql/11/sql-altersystem "Ctrl+click -> new tab"):  

    ```sql
    alter system set deadlock_timeout = 200;  
    alter system set log_lock_waits = on;  
    ```  

    - перезапустил сервер: `sudo pg_ctlcluster 11 main restart`  

    - проверил:  
        ```sql
        show log_lock_waits;  

        -[ RECORD 1 ]--+---
        log_lock_waits | on
        ```  
        ```sql
        show deadlock_timeout;  

        -[ RECORD 1 ]----+------
        deadlock_timeout | 200ms
        ``` 
    > :+1: **новые параметры конфигурации установлены удачно**  

    ***
<div align=center><h4>2. Блокировки / Представление pg_locks</h4></div>  

***

- создал БД _locks_:  
    ```sql  
    create database locks;  
    ```

- в БД _locks_ создал таблицу _space_users_:  
    ```sql  
    create table space_users (id int, "name" text);`  

- вставил данные:  
    ```sql  
    insert into test (id, "name") values (1, 'Yuri Gagarin'), (2, 'German Titov');  
    ```
- открыл еще 2 терминала, подключился к серверу по _ssh_, переключился на БД _locks_

- во всех 3-х терминалах начал транзакцию `begin;` и попытался выполнить команду:  
    ```sql  
    update space_users set name = 'Yuri A. Gagarin' where id = 1;  
    ```
- выполнил запрос к представлению [pg_locks](https://postgrespro.ru/docs/postgrespro/11/view-pg-locks "Ctlr+click -> new tab"): 
    :link: [pg_backend_pid()](https://postgrespro.ru/docs/postgrespro/11/functions-info "Ctrl+click -> new tab")  
    ```sql
    select locktype, pid, relation::regclass, virtualxid as virtxid, 
           transactionid as xid, mode, granted 
    from pg_locks 
    where pid <> pg_backend_pid() 
    order by pid, locktype;

   nn |   locktype    |  pid  |  relation   | virtxid | xid |       mode       | granted 
    ---+---------------+-------+-------------+---------+-----+------------------+---------
     1 | virtualxid    | 15242 |             | 12/44   |     | ExclusiveLock    | t
     2 | transactionid | 15242 |             |         | 581 | ExclusiveLock    | t     
     3 | relation      | 15242 | space_users |         |     | RowExclusiveLock | t
    ---+---------------+-------+-------------+---------+-----+------------------+---------
     4 | virtualxid    | 15243 |             | 9/15    |     | ExclusiveLock    | t
     5 | transactionid | 15243 |             |         | 581 | ShareLock        | f
     6 | transactionid | 15243 |             |         | 582 | ExclusiveLock    | t
     7 | relation      | 15243 | space_users |         |     | RowExclusiveLock | t
     8 | tuple         | 15243 | space_users |         |     | ExclusiveLock    | t
    ---+---------------+-------+-------------+---------+-----+------------------+---------
     9 | virtualxid    | 15245 |             | 10/7    |     | ExclusiveLock    | t
   10 | transactionid | 15245 |             |         | 583 | ExclusiveLock    | t
   11 | relation      | 15245 | space_users |         |     | RowExclusiveLock | t
   12 | tuple         | 15245 | space_users |         |     | ExclusiveLock    | f
    ```  
    > :warning: _поделил на секции для удобочитаемости, и пронумеровал строки (1-2-3 терминал соответственно)_

- :question: что я увидел в [pg_locks](https://postgrespro.ru/docs/postgrespro/11/view-pg-locks "Ctrl+click -> new tab"):

    - когда транзакции стартовали, им были присвоены виртуальные идентификаторы _virtualxid_ => 12/44, 9/15, 10/7 (строки 1, 4, 9) и эти номера успешно (granted=t) заблокированы самими транзакциями в режиме исключительной блокировки (ExclusiveLock)

    - транзакции дополнительно получили физические номера _transactionid_ (xid) => 581, 582, 583 при попытке изменить данные командой _update_, и самостоятельно их удерживают (строки 2, 6, 10) в режиме _ExclusiveLock_

    - также из-за команды update появились блокировки с типом _relation_ - блокировки отношений (таблицы space_users), в режиме _RowExclusiveLock_ (строки 3, 7, 11), выданы (granted=t), и самостоятельно удерживаются транзакциями

    - вторая транзакция ожидает завершения первой транзакции - попыталась (granted=f) получить блокировку номера _transactionid_ = 581 (первой транзакции) в режиме _ShareLock_ (строка 5), и наложила (granted=t) блокировку _tuple_ (блокировка версии строки) на обновляемую строку в режиме _ExclusiveLock_ (строка 8)

    - третья транзакция тоже попыталась (granted=f) получить блокировку _tuple_ на обновляемую строку в режиме _ExclusiveMode_ (строка 12), но неудачно, так как вторая транзакция уже наложила такую блокировку  
    
    :exclamation: _ситуация в третьей транзакции изменится, когда завершится первая транзакция, третья транзакция, подобно второй, получит блокировку на обновляемую строку, и будет ждать завершения второй транзакции_


:link: [Хабр. Блокировки в PostgreSQL: 1. Блокировки отношений](https://habr.com/ru/company/postgrespro/blog/462877/ "Ctrl+click -> new tab")  
:link: [Хабр. Блокировки в PostgreSQL: 2. Блокировки строк](https://habr.com/ru/company/postgrespro/blog/463819/ "Ctrl+click -> new tab")  
:link: [Хабр. Блокировки в PostgreSQL: 3. Блокировки других объектов](https://habr.com/ru/company/postgrespro/blog/465263/ "Ctrl+click -> new tab")  
:link: [Хабр. Блокировки в PostgreSQL: 4. Блокировки в памяти](https://habr.com/ru/company/postgrespro/blog/466199/ "Ctrl+click -> new tab")  
:link: [Postgres Pro docs. Глава 13. Управление конкурентным доступом](https://postgrespro.ru/docs/postgrespro/11/explicit-locking "Ctrl+click -> new tab")  

***
<div align=center><h3>3. Взаимоблокировка трех транзакций</h3></div>  

***

- создал таблицу `public.cities` в бд `locks`:  
    ```sql
    create table public.cities (city_id integer, city_name text, population integer);  
    ```

- вставил данные: 
    ```sql
    insert into public.cities (city_id, city_name, population) 
    values 
      (1, 'Tokyo', 38505000),
      (2, 'Delhi', 28125000),
      (3, 'Shanghai', 22125000);
    ```  
- выполнил команды в трех терминалах (в хронологическом порядке):  

| транзакция 1 | транзакция 2 | транзакция 2 |
|:-------------------|:-------------------|:-------------------|
| begin; | | |
| update public.cities </br>set population = population + 100000 </br>where city_id = 1; | | | 
| | begin; | |
| | update public.cities </br>set population = population + 200000 </br>where city_id = 2; | | 
| | | begin; | 
| | | update public.cities </br>set population = population + 300000 </br>where city_id = 3; | 
| update public.cities </br>set population = population - 200000 </br>where city_id = 2; | | | 
| | update public.cities </br>set population = population - 300000 </br>where city_id = 3; | | 
| | | update public.cities </br>set population = population - 100000 </br>where city_id = 1; | 
| | | commit; | 
| | commit; | |
| commit; | | |  


в третьем терминале получил:  

```bash
ERROR:  deadlock detected
DETAIL:  Process 6585 waits for ShareLock on transaction 595; blocked by process 6569.
Process 6569 waits for ShareLock on transaction 596; blocked by process 6571.
Process 6571 waits for ShareLock on transaction 597; blocked by process 6585.
HINT:  See server log for query details.
CONTEXT:  while updating tuple (0,4) in relation "cities"
```

- посмотрел лог:  

```bash
$ tail -n 30 /var/log/postgresql/postgresql-11-main.log
```  

```bash
2020-08-12 17:54:34.587 UTC [6569] postgres@locks LOG:  process 6569 still waiting for ShareLock on transaction 596 after 200.184 ms
2020-08-12 17:54:34.587 UTC [6569] postgres@locks DETAIL:  Process holding the lock: 6571. Wait queue: 6569.
2020-08-12 17:54:34.587 UTC [6569] postgres@locks CONTEXT:  while updating tuple (0,8) in relation "cities"
2020-08-12 17:54:34.587 UTC [6569] postgres@locks STATEMENT:  update public.cities set population = population - 200000 where city_id = 2;
2020-08-12 17:55:04.432 UTC [6571] postgres@locks LOG:  process 6571 still waiting for ShareLock on transaction 597 after 200.147 ms
2020-08-12 17:55:04.432 UTC [6571] postgres@locks DETAIL:  Process holding the lock: 6585. Wait queue: 6571.
2020-08-12 17:55:04.432 UTC [6571] postgres@locks CONTEXT:  while updating tuple (0,7) in relation "cities"
2020-08-12 17:55:04.432 UTC [6571] postgres@locks STATEMENT:  update public.cities set population = population - 300000 where city_id = 3;
2020-08-12 17:55:31.003 UTC [6585] postgres@locks LOG:  process 6585 detected deadlock while waiting for ShareLock on transaction 595 after 200.418 ms
2020-08-12 17:55:31.003 UTC [6585] postgres@locks DETAIL:  Process holding the lock: 6569. Wait queue: .
2020-08-12 17:55:31.003 UTC [6585] postgres@locks CONTEXT:  while updating tuple (0,4) in relation "cities"
2020-08-12 17:55:31.003 UTC [6585] postgres@locks STATEMENT:  update public.cities set population = population - 100000 where city_id = 1;
2020-08-12 17:55:31.003 UTC [6585] postgres@locks ERROR:  deadlock detected
2020-08-12 17:55:31.003 UTC [6585] postgres@locks DETAIL:  Process 6585 waits for ShareLock on transaction 595; blocked by process 6569.
	Process 6569 waits for ShareLock on transaction 596; blocked by process 6571.
	Process 6571 waits for ShareLock on transaction 597; blocked by process 6585.
	Process 6585: update public.cities set population = population - 100000 where city_id = 1;
	Process 6569: update public.cities set population = population - 200000 where city_id = 2;
	Process 6571: update public.cities set population = population - 300000 where city_id = 3;
2020-08-12 17:55:31.003 UTC [6585] postgres@locks HINT:  See server log for query details.
2020-08-12 17:55:31.003 UTC [6585] postgres@locks CONTEXT:  while updating tuple (0,4) in relation "cities"
2020-08-12 17:55:31.003 UTC [6585] postgres@locks STATEMENT:  update public.cities set population = population - 100000 where city_id = 1;
2020-08-12 17:55:31.004 UTC [6571] postgres@locks LOG:  process 6571 acquired ShareLock on transaction 597 after 26771.858 ms
2020-08-12 17:55:31.004 UTC [6571] postgres@locks CONTEXT:  while updating tuple (0,7) in relation "cities"
2020-08-12 17:55:31.004 UTC [6571] postgres@locks STATEMENT:  update public.cities set population = population - 300000 where city_id = 3;
2020-08-12 17:55:49.112 UTC [6569] postgres@locks LOG:  process 6569 acquired ShareLock on transaction 596 after 74724.946 ms
2020-08-12 17:55:49.112 UTC [6569] postgres@locks CONTEXT:  while updating tuple (0,8) in relation "cities"
2020-08-12 17:55:49.112 UTC [6569] postgres@locks STATEMENT:  update public.cities set population = population - 200000 where city_id = 2;
```

> :exclamation: в ситуации разобраться можно, посмотрев внимательно лог. видно, что deadlock зафиксирован и все процессы до и после него тоже.

***
<div align=center><h3>4. Взаимоблокировка 2-х транзакций, выполняющих </br>UPDATE одной и той же таблицы (без where)</h3></div>

***

:warning:  _взаимоблокировка 2-х транзакций, выполняющих UPDATE одной и той же таблицы (без where) возможна, если одна команда будет обновлять строки таблицы в прямом порядке, а другая - в обратном_ :warning: 

_такое может произойти в реальной жизни (но это маловероятно), если для команд будут построены разные планы выполнения, например, одна будет читать таблицу последовательно, а другая - по индексу_

_продемонстрировать эту ситуацию можно с помощью курсоров, они дают возможность управлять порядком чтения_

- выполнил следующие команды в двух терминалах (в хронологическом порядке):

| транзакция 1 | транзакция 2 |
|:-------------------|:-------------------|
| begin; | |
| declare cur1 cursor for </br>select city_id, city_name, population from public.cities </br>order by city_id for update; | |
| | begin; | 
| | declare cur2 cursor for </br>select city_id, city_name, population from public.cities </br>order by city_id desc for update; | 
| fetch cur1; | | 
| | fetch cur2; |
| fetch cur1; | | 
| | fetch cur2; (ожидает блокировку) |
| fetch cur1; | | 

:exclamation: после последней команды `fetch cur1;` произошла взаимоблокировка:

```bash
ERROR:  deadlock detected
DETAIL:  Process 11173 waits for ShareLock on transaction 599; blocked by process 11275.
Process 11275 waits for ShareLock on transaction 598; blocked by process 11173.
HINT:  See server log for query details.
CONTEXT:  while locking tuple (0,12) in relation "cities"
```
