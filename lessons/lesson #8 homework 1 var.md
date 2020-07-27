<div align="right"><h5> Занятие #8 - Домашнее задание - Вариант 1</h5></div>


<div align="center"><h2>Работа с журналами, механизм блокировок</h2></div>

***

- создал новую виртуальную машину `lesson-8-variant-1` 
- установил _PostgreSQL 11_ 
- проверил параметр конфигурации [checkpoint_timeout](https://postgrespro.ru/docs/postgrespro/11/runtime-config-wal#RUNTIME-CONFIG-WAL-CHECKPOINTS "Ctrl+click -> new tab"):  

    `show checkpoint_timeout;` 
    ```sql
    -[ RECORD 1 ]------+----
    checkpoint_timeout | 5min
    ``` 
    `select context from pg_settings where name = 'checkpoint_timeout';` 
    ```sql
    -[ RECORD 1 ]---+---------------------------------------------------------
    context         | sighup
    ```
- проверил параметр конфигурации [log_checkpoints](https://postgrespro.ru/docs/postgrespro/11/runtime-config-logging#RUNTIME-CONFIG-LOGGING-WHAT "Ctrl+click -> new tab"): 

    `show log_checkpoints;` 
    ```sql
    -[ RECORD 1 ]------+----
    log_checkpoints | off
    ``` 
    `select context from pg_settings where name = 'log_checkpoints';` 
    ```sql
    -[ RECORD 1 ]---+---------------------------------------------------------
    context         | sighup
    ```

    > **_context_ параметров - ["_sighup_"](https://postgrespro.ru/docs/postgrespro/11/view-pg-settings "Ctrl+click -> new tab"), это означает, что после изменения параметра рестарта сервера не требуется, достаточно перечитать файл конфигурации** 

- изменил параметры согласно условиям домашнего задания: 
    `alter system set checkpoint_timeout = 30;`
    `alter system set log_checkpoints = on;`
- перечитал файл конфигурации: `select pg_reload_conf();`
- проверил: 

    `show checkpoint_timeout;` 
    ```sql
    -[ RECORD 1 ]------+----
    checkpoint_timeout | 30s
    ``` 
    `show log_checkpoints;` 
    ```sql
    -[ RECORD 1 ]---+---
    log_checkpoints | on
    ```
    :+1: **новое значение параметров применено**  

    *** 
- подготовил _pgbench_: `pgbench -i postgres;`

- проверил текущий [LSN](https://postgrespro.ru/docs/postgrespro/11/wal-internals "Ctrl+click -> new tab") (Log Sequence Number):  

    `select pg_current_wal_insert_lsn();`
    
    ```sql  
    -[ RECORD 1 ]-------------+----------  
    pg_current_wal_insert_lsn | 0/D267A2D8  
    ```  

- засек количество выполненных до текущего момента контрольных точек: 

    `select checkpoints_timed from pg_stat_bgwriter;` 

    ```sql
    -[ RECORD 1 ]-------------+----------
    checkpoints_timed | 650
    ```
- запустил _pgbench_: `pgbench -c 8 -P 60 -T 600 -U postgres postgres`

- после отработки _pgbench_: 
    - контрольных точек: 670 
    - значение LSN: 0/F4B2D678 

- вычислим число байт между этими двумя позициями (до теста и после) в [журнале предзаписи](https://postgrespro.ru/docs/postgrespro/11/wal-intro "Ctrl+click -> new tab") (WAL) в результате выполнения _pgbench_: 
    `select '0/F4B2D678'::pg_lsn - '0/D267A2D8'::pg_lsn as byte_size;` 
    ```sql
    -[ RECORD 1 ]--------
    byte_size | 575353760
    ```
- количество выполненных контрольных точек за 600 секунд = 670 - 650 -> 20  

    :heavy_check_mark: :heavy_division_sign: **на одну контрольную точку приходится 28 767 688 байт (~28 093 Kb = ~27,4 Mb)**

- проверил записи о выполнении контрольных точек в журнале: 
    `tail -n 100 /var/log/postgresql/postgresql-11-main.log | grep checkpoint`

    <details>
        <summary>Лог</summary>  

        2020-07-11 16:43:26.711 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:43:41.084 UTC [1179] LOG:  checkpoint complete: wrote 2154 buffers (13.1%); 0 WAL file(s) added, 0 removed, 2 recycled; write=14.346 s, sync=0.010 s, total=14.373 s; sync files=21, longest=0.003 s, average=0.000 s; distance=26775 kB, estimate=26775 kB
        2020-07-11 16:43:56.099 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:44:11.087 UTC [1179] LOG:  checkpoint complete: wrote 2321 buffers (14.2%); 0 WAL file(s) added, 0 removed, 1 recycled; write=14.953 s, sync=0.012 s, total=14.987 s; sync files=16, longest=0.003 s, average=0.000 s; distance=27927 kB, estimate=27927 kB
        2020-07-11 16:44:26.099 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:44:41.081 UTC [1179] LOG:  checkpoint complete: wrote 2172 buffers (13.3%); 0 WAL file(s) added, 0 removed, 2 recycled; write=14.947 s, sync=0.009 s, total=14.982 s; sync files=7, longest=0.005 s, average=0.001 s; distance=28741 kB, estimate=28741 kB
        2020-07-11 16:44:56.095 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:45:11.069 UTC [1179] LOG:  checkpoint complete: wrote 2511 buffers (15.3%); 0 WAL file(s) added, 0 removed, 2 recycled; write=14.952 s, sync=0.007 s, total=14.973 s; sync files=15, longest=0.003 s, average=0.000 s; distance=28697 kB, estimate=28736 kB
        2020-07-11 16:45:26.083 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:45:41.060 UTC [1179] LOG:  checkpoint complete: wrote 2134 buffers (13.0%); 0 WAL file(s) added, 0 removed, 1 recycled; write=14.949 s, sync=0.005 s, total=14.977 s; sync files=8, longest=0.003 s, average=0.000 s; distance=27522 kB, estimate=28615 kB
        2020-07-11 16:45:56.075 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:46:11.060 UTC [1179] LOG:  checkpoint complete: wrote 2475 buffers (15.1%); 0 WAL file(s) added, 0 removed, 2 recycled; write=14.951 s, sync=0.007 s, total=14.984 s; sync files=14, longest=0.003 s, average=0.000 s; distance=27866 kB, estimate=28540 kB
        2020-07-11 16:46:26.071 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:46:41.052 UTC [1179] LOG:  checkpoint complete: wrote 2129 buffers (13.0%); 0 WAL file(s) added, 0 removed, 2 recycled; write=14.949 s, sync=0.006 s, total=14.981 s; sync files=8, longest=0.003 s, average=0.000 s; distance=27489 kB, estimate=28435 kB
        2020-07-11 16:46:56.067 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:47:11.039 UTC [1179] LOG:  checkpoint complete: wrote 2489 buffers (15.2%); 0 WAL file(s) added, 0 removed, 2 recycled; write=14.951 s, sync=0.006 s, total=14.971 s; sync files=14, longest=0.002 s, average=0.000 s; distance=28177 kB, estimate=28409 kB
        2020-07-11 16:47:26.051 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:47:41.035 UTC [1179] LOG:  checkpoint complete: wrote 2114 buffers (12.9%); 0 WAL file(s) added, 0 removed, 1 recycled; write=14.950 s, sync=0.007 s, total=14.984 s; sync files=8, longest=0.004 s, average=0.000 s; distance=27272 kB, estimate=28295 kB
        2020-07-11 16:47:56.047 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:48:11.033 UTC [1179] LOG:  checkpoint complete: wrote 2408 buffers (14.7%); 0 WAL file(s) added, 0 removed, 2 recycled; write=14.951 s, sync=0.009 s, total=14.986 s; sync files=13, longest=0.003 s, average=0.000 s; distance=26120 kB, estimate=28078 kB
        2020-07-11 16:48:26.047 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:48:41.023 UTC [1179] LOG:  checkpoint complete: wrote 2101 buffers (12.8%); 0 WAL file(s) added, 0 removed, 1 recycled; write=14.947 s, sync=0.005 s, total=14.976 s; sync files=9, longest=0.002 s, average=0.000 s; distance=27398 kB, estimate=28010 kB
        2020-07-11 16:48:56.035 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:49:11.021 UTC [1179] LOG:  checkpoint complete: wrote 2411 buffers (14.7%); 0 WAL file(s) added, 0 removed, 2 recycled; write=14.954 s, sync=0.004 s, total=14.986 s; sync files=13, longest=0.002 s, average=0.000 s; distance=27582 kB, estimate=27967 kB
        2020-07-11 16:49:26.035 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:49:41.117 UTC [1179] LOG:  checkpoint complete: wrote 2047 buffers (12.5%); 0 WAL file(s) added, 0 removed, 2 recycled; write=15.048 s, sync=0.005 s, total=15.081 s; sync files=9, longest=0.004 s, average=0.000 s; distance=27122 kB, estimate=27883 kB
        2020-07-11 16:49:56.131 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:50:11.115 UTC [1179] LOG:  checkpoint complete: wrote 2428 buffers (14.8%); 0 WAL file(s) added, 0 removed, 1 recycled; write=14.951 s, sync=0.008 s, total=14.984 s; sync files=16, longest=0.004 s, average=0.000 s; distance=27714 kB, estimate=27866 kB
        2020-07-11 16:50:26.127 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:50:41.114 UTC [1179] LOG:  checkpoint complete: wrote 2048 buffers (12.5%); 0 WAL file(s) added, 0 removed, 2 recycled; write=14.947 s, sync=0.008 s, total=14.987 s; sync files=8, longest=0.004 s, average=0.001 s; distance=26927 kB, estimate=27772 kB
        2020-07-11 16:50:56.127 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:51:11.113 UTC [1179] LOG:  checkpoint complete: wrote 2380 buffers (14.5%); 0 WAL file(s) added, 0 removed, 2 recycled; write=14.951 s, sync=0.009 s, total=14.985 s; sync files=14, longest=0.006 s, average=0.000 s; distance=26715 kB, estimate=27666 kB
        2020-07-11 16:51:26.127 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:51:41.099 UTC [1179] LOG:  checkpoint complete: wrote 2028 buffers (12.4%); 0 WAL file(s) added, 0 removed, 1 recycled; write=14.949 s, sync=0.007 s, total=14.971 s; sync files=8, longest=0.004 s, average=0.000 s; distance=26760 kB, estimate=27575 kB
        2020-07-11 16:51:56.111 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:52:11.084 UTC [1179] LOG:  checkpoint complete: wrote 2400 buffers (14.6%); 0 WAL file(s) added, 0 removed, 2 recycled; write=14.950 s, sync=0.007 s, total=14.972 s; sync files=16, longest=0.004 s, average=0.000 s; distance=27384 kB, estimate=27556 kB
        2020-07-11 16:52:26.095 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:52:41.078 UTC [1179] LOG:  checkpoint complete: wrote 2025 buffers (12.4%); 0 WAL file(s) added, 0 removed, 2 recycled; write=14.948 s, sync=0.007 s, total=14.982 s; sync files=8, longest=0.004 s, average=0.000 s; distance=26920 kB, estimate=27493 kB
        2020-07-11 16:52:56.091 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:53:11.097 UTC [1179] LOG:  checkpoint complete: wrote 2413 buffers (14.7%); 0 WAL file(s) added, 0 removed, 1 recycled; write=14.970 s, sync=0.007 s, total=15.005 s; sync files=14, longest=0.003 s, average=0.000 s; distance=26811 kB, estimate=27424 kB
        2020-07-11 16:53:56.143 UTC [1179] LOG:  checkpoint starting: time
        2020-07-11 16:54:11.023 UTC [1179] LOG:  checkpoint complete: wrote 1817 buffers (11.1%); 0 WAL file(s) added, 0 removed, 1 recycled; write=14.864 s, sync=0.003 s, total=14.880 s; sync files=12, longest=0.003 s, average=0.000 s; distance=13955 kB, estimate=26078 kB
    </details>



:question: **Q:** _Проверьте данные статистики: все ли контрольные точки выполнялись точно по расписанию. Почему так произошло?_
:exclamation: **A:** _Из лога видно, что фиксация контрольной точки стартует, и выполняется только через 15 секунд, это происходит от того, что отрабатывают установки параметра ["_checkpoint_completion_target_"](https://postgrespro.ru/docs/postgrespro/11/runtime-config-wal#RUNTIME-CONFIG-WAL-CHECKPOINTS "Ctrl+click -> new tab")_:  

`show checkpoint_completion_target;` 

```sql
-[ RECORD 1 ]----------------+----
checkpoint_completion_target | 0.5
```

:exclamation: _его значение обозначает целевое время для завершения процедуры контрольной точки, как коэффициент для общего времени между контрольными точками => 0.5 * 30 секунд (checkpoint_timeout) = 15 секунд_

:link: https://temofeev.ru/info/articles/wal-v-postgresql-3-kontrolnaya-tochka/  
:link: https://habr.com/ru/company/postgrespro/blog/460423/  

- проверил tps в режиме **синхронной** фиксации транзакций:  

    ```bash
    postgres@lesson-8-variant-1:/home/am$ pgbench -c 8 -P 60 -T 600 -U postgres postgres
    starting vacuum...end.
    progress: 60.0 s, 941.0 tps, lat 8.497 ms stddev 1.587
    progress: 120.0 s, 948.3 tps, lat 8.436 ms stddev 1.516
    progress: 180.0 s, 930.5 tps, lat 8.597 ms stddev 1.652
    progress: 240.0 s, 951.4 tps, lat 8.409 ms stddev 1.533
    progress: 300.0 s, 894.0 tps, lat 8.949 ms stddev 1.766
    progress: 360.0 s, 951.3 tps, lat 8.410 ms stddev 1.533
    progress: 420.0 s, 948.1 tps, lat 8.437 ms stddev 1.556
    progress: 480.0 s, 924.3 tps, lat 8.656 ms stddev 1.690
    progress: 540.0 s, 936.3 tps, lat 8.544 ms stddev 1.595
    progress: 600.0 s, 913.7 tps, lat 8.756 ms stddev 1.745
    transaction type: <builtin: TPC-B (sort of)>
    scaling factor: 1
    query mode: simple
    number of clients: 8
    number of threads: 1
    duration: 600 s
    number of transactions actually processed: 560337
    latency average = 8.566 ms
    latency stddev = 1.627 ms
    tps = 933.858774 (including connections establishing)
    tps = 933.863795 (excluding connections establishing)
    ```

- для замера tps в режиме **асинхронной** фиксации транзакций изменил параметр `synchronous_commit = off`, изменил файл конфигурации `postgresql.conf`: `sudo nano /etc/postgresql/11/main/postgresql.conf`: , и перезапустил сервер: `sudo systemctl restart postgresql`  

    проверил: `show syncronous_commit;`  

    ```sql
    -[ RECORD 1 ]------+----
    synchronous_commit | off
    ```
    👍 **успешно**

- подготовил _pgbench_: `pgbench -i postgres;`
- запустил проверку в режиме асинхронной фиксации транзакций: 

    `pgbench -c 8 -P 60 -T 600 -U postgres postgres`

```bash
starting vacuum...end.
progress: 60.0 s, 1611.9 tps, lat 4.961 ms stddev 0.592
progress: 120.0 s, 1618.0 tps, lat 4.944 ms stddev 1.284
progress: 180.0 s, 1586.8 tps, lat 5.042 ms stddev 0.573
progress: 240.0 s, 1607.1 tps, lat 4.978 ms stddev 0.582
progress: 300.0 s, 1623.9 tps, lat 4.926 ms stddev 0.564
progress: 360.0 s, 1605.7 tps, lat 4.982 ms stddev 0.561
progress: 420.0 s, 1601.1 tps, lat 4.997 ms stddev 0.592
progress: 480.0 s, 1607.4 tps, lat 4.977 ms stddev 0.582
progress: 540.0 s, 1616.1 tps, lat 4.950 ms stddev 0.574
progress: 600.0 s, 1605.8 tps, lat 4.982 ms stddev 0.548
transaction type: <builtin: TPC-B (sort of)>
scaling factor: 1
query mode: simple
number of clients: 8
number of threads: 1
duration: 600 s
number of transactions actually processed: 965036
latency average = 4.974 ms
latency stddev = 0.681 ms
tps = 1608.340352 (including connections establishing)
tps = 1608.348409 (excluding connections establishing)
``` 

👍  **мы видим почти двукратный прирост _tps_ по сравнению с синхронным режимом фиксации транзакций**

:question: **Q:** _Сравните tps в синхронном/асинхронном режиме утилитой pgbench. Объясните полученный результат._

:exclamation: **A:** _Это происходит оттого, что серверу не надо ждать пока записи из WAL сохранятся на диске, прежде чем сообщить клиенту об успешном завершении операции. И все накладные расходы, связанные с этим процессом не оказывают влияния на результат._

***
Кластер с включенной контрольной суммой страниц ([data-checksums](https://postgrespro.ru/docs/postgresql/11/app-initdb "Ctrl+click -> new tab"))
---
- остановил текущий кластер:  

   `sudo pg_ctlcluster 11 main stop`  

    ```bash
    Ver Cluster Port Status Owner    Data directory              Log file
    11  main    5432 down   postgres /var/lib/postgresql/11/main /var/log/postgresql/postgresql-11-main.log
    ````
- создал новый кластер с включенной контрольной суммой страниц с помощью утилиты _pg_createcluster_:  

    `sudo pg_createcluster 11 second -- --data-checksums`

    <details>
        <summary>Терминал</summary>  

        Creating new PostgreSQL cluster 11/second ...  
        /usr/lib/postgresql/11/bin/initdb -D /var/lib/postgresql/11/second --auth-local peer --auth-host md5 --data-checksums
        The files belonging to this database system will be owned by user "postgres".
        This user must also own the server process.
        
        The database cluster will be initialized with locale "C.UTF-8".
        The default database encoding has accordingly been set to "UTF8".
        The default text search configuration will be set to "english".
        
        Data page checksums are enabled.
        
        fixing permissions on existing directory /var/lib/postgresql/11/second ... ok
        creating subdirectories ... ok
        selecting default max_connections ... 100
        selecting default shared_buffers ... 128MB
        selecting default timezone ... Etc/UTC
        selecting dynamic shared memory implementation ... posix
        creating configuration files ... ok
        running bootstrap script ... ok
        performing post-bootstrap initialization ... ok
        syncing data to disk ... ok
        
        Success. You can now start the database server using:
        
            pg_ctlcluster 11 second start
        
        Ver Cluster Port Status Owner    Data directory                Log file
        11  second  5433 down   postgres /var/lib/postgresql/11/second /var/log/postgresql/postgresql-11-second.log
    </details>

    :checkered_flag: :+1: **новый кластер создался нормально, порт подключения - 5433**

- запустил новый кластер : `sudo pg_ctlcluster 11 second start`  
    подключился к нему: `sudo su postgres`  `psql -p 5433`  

- проверил применение параметра `data-checksums`:  
    
    `show data_checksums;`

    ```bash
    -[ RECORD 1 ]--+---
    data_checksums | on
    ```

- создал новую БД: `create database testdb;`  
- в ней создал новую таблицу: `create table space_users (id int, "name" text);`  
- вставил данные: `insert into test (id, "name") values (1, 'Yuri Gagarin'), (2, 'German Titov');`  
- проверил:  
    
    `select * from space_users;`

    ```sql
    -[ RECORD 1 ]------
    id   | 1
    name | Yuri Gagarin
    -[ RECORD 2 ]------
    id   | 2
    name | German Titov
    ```
- определил местонахождение файла таблицы _space_users_: 

    `select pg_relation_filepath('space_users');`  

    ```sql
    -[ RECORD 1 ]--------+-----------------
    pg_relation_filepath | base/16384/16391
    ```  
- остановил кластер: `sudo pg_ctlcluster 11 second stop`  

- сделал изменения в файле таблицы (стер из заголовка LSN последней журнальной записи):

    `sudo dd if=/dev/zero of=/var/lib/postgresql/11/second/base/16384/16391 oflag=dsync conv=notrunc bs=1 count=8`  

    ```bash
    8+0 records in
    8+0 records out
    8 bytes copied, 0.00747059 s, 1.1 kB/s    
    ```
- запустил кластер: `sudo pg_ctlcluster 11 second start`, стартовал нормально  
- проверил данные: `select * from space_users;`  

    ```sql
    WARNING:  page verification failed, calculated checksum 1573 but expected 59617
    ERROR:  invalid page in block 0 of relation base/16384/16391
    ```
:question: **Q:** _Что и почему произошло? Как проигнорировать ошибку и продолжить работу?_
:exclamation: **A:** _Транзакция была прервана, данные прочитать не удалось, потому что были обнаружены ошибки контрольных сумм файла таблицы. Игнорировать ошибку поможет параметр [ignore_checksum_failure](https://postgrespro.ru/docs/postgresql/11/runtime-config-developer "Ctrl+click -> new tab"), установленный в значение true._

- проверил значение параметра _ignore_checksum_failure_:  

    `show ignore_checksum_failure;`

    ```sql
    -[ RECORD 1 ]-----------+----
    ignore_checksum_failure | off
    ```
    - и его контекст: `select context from pg_settings where name = 'checkpoint_timeout';`  

        ```sql
        -[ RECORD 1 ]------
        context | superuser
        ```

        > контекст _superuser_, значит его изменение будет действовать в рамках сеанса

- установил новое значение параметра _ignore_checksum_failure_: `set ignore_checksum_failure = on;`  
- проверил:  

    `show ignore_checksum_failure;`  

    ```sql
    -[ RECORD 1 ]-----------+---
    ignore_checksum_failure | on
    ```
    :+1: параметр изменен удачно

- снова попробовал прочитать данные из таблицы _space_users_:  
    
    `select * from space_users;`  

    ```sql  
    WARNING:  page verification failed, calculated checksum 1573 but expected 59617
    -[ RECORD 1 ]------
    id   | 1
    name | Yuri Gagarin
    -[ RECORD 2 ]------
    id   | 2
    name | German Titov
    ```

:+1: Данные прочитаны, так как заголовок блока с данными уцелел. При повреждении заголовка, была бы выдана ошибка, даже при включенном параметре _ignore_checksum_failure_.

