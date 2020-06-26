<div align="right"><h5> Занятие #6 - Домашнее задание - Вариант 2</h5></div>


<div align="center"><h2>Настройка autovacuum с учетом </br>оптимальной производительности</h2></div>

***

<div align="center"><h4>1. Создание новой виртуальной машины</h4></div>

***

- Перешел в _Compute Engine_ и создал новую виртуальную машину: 

[`Google Cloud Platform`](https://cloud.google.com/ "Google Cloud") -> `Compute Engine` -> `Экземпляры ВМ` -> `Создать экземпляр`

:hammer_and_wrench: Параметр | :memo: Значение |:hammer_and_wrench: Параметр | :memo: Значение |
--------------:|---------------|--------------:|---------------|
| Название ВМ | **`lesson-6-var-2`** | Операционная система | `Ubuntu` |
| Регион | `us-central1 (Айова)` | Версия операционной системы | `Ubuntu 18.04 LTS` | 
| Зона | `us-central1-a` | Тип загрузочного диска | `Стандартный постоянный диск` | 
| Серия | `N1` | Размер (Гб) загрузочного диска | `10` |
| Тип машины | `n1-standart-1` | Брандмауэр | :ballot_box_with_check: `Разрешить трафик HTTP`
| | | | :ballot_box_with_check: `Разрешить трафик HTTPS` |

- Подключился к новой ВМ по _ssh_

***
<div align="center"><h4>2. Установка PostgreSQL 11</h4></div>

***
  - импортировал GPG-ключ репозитория: 
    `wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -`
  - добавил содержимое репозитория в систему (через переменную RELEASE, подойдет для Ubuntu 20.04/18.04/16.04) 
  
    `RELEASE=$(lsb_release -cs)` 

    `echo "deb http://apt.postgresql.org/pub/repos/apt/ ${RELEASE}"-pgdg main | sudo tee /etc/apt/sources.list.d/pgdg.list`

  - обновил списки APT-пакетов
  `sudo apt update`
  - установил серверную и клиентскую часть _PostgreSQL 11_
  `sudo apt -y install postgresql-11 postgresql-client-11`
  - проверил: 
    ```bash
    am@lesson-6-var-2:~$ sudo -u postgres pg_lsclusters
    Ver Cluster Port Status Owner    Data directory              Log file
    11  main    5432 online postgres /var/lib/postgresql/11/main /var/log/postgresql/postgresql-11-main.log
    ```

***
<div align="center"><h4>3. Настройка PostgreSQL 11</h4></div>

***
Сделал настройку файла конфигурации `/etc/postgresql/11/main/postgresql.conf` согласно параметрам домашнего задания. _Заодно, в качестве **дополнительной тренировки**, сделал возможность подключения к инстансу снаружи._

- убедился, что доступ открыт только для _localhost (127.0.0.1:5432)_: `sudo ss -tunelp | grep 5432`

    ```bash
    am@lesson-6-var-2:~$ sudo ss -tunelp | grep 5432
    tcp   LISTEN  0        128                127.0.0.1:5432          0.0.0.0:*      users:(("postgres",pid=5509,fd=5)) uid:112 ino:37455 sk:7 <->    
    ```
- переписал файл конфигурации `postgresql.conf` согласно следующим параметрам: 
    `sudo nano /etc/postgresql/11/main/postgresql.conf` 

    :hammer_and_wrench: [Параметр (кликабелен)](https://postgrespro.ru/docs/postgresql/11/bookindex "Ctrl+click -> new tab") | :memo: Значение |:hammer_and_wrench: Строка конфигурации | 
    --------------:|---------------|--------------:| 
    [listen_addresses](https://postgrespro.ru/docs/postgresql/11/runtime-config-connection#RUNTIME-CONFIG-CONNECTION-SETTINGS "Ctrl+click -> new tab") | '*' | listen_addresses = '*' | 
    [max_connections](https://postgrespro.ru/docs/postgresql/11/runtime-config-connection#RUNTIME-CONFIG-CONNECTION-SETTINGS "Ctrl+click -> new tab") | 40 | max_connections = 40 | 
    [shared_buffers](https://postgrespro.ru/docs/postgresql/11/runtime-config-resource#GUC-SHARED-BUFFERS "Ctrl+click -> new tab") | 1GB | shared_buffers = 1GB | 
    [effective_cache_size](https://postgrespro.ru/docs/postgresql/11/runtime-config-query#RUNTIME-CONFIG-QUERY-CONSTANTS "Ctrl+click -> new tab") | 3GB | effective_cache_size = 3GB | 
    [maintenance_work_mem](https://postgrespro.ru/docs/postgresql/11/runtime-config-resource#RUNTIME-CONFIG-RESOURCE-MEMORY "Ctrl+click -> new tab") | 512MB | maintenance_work_mem = 512MB | 
    [checkpoint_completion_target](https://postgrespro.ru/docs/postgresql/11/runtime-config-wal#RUNTIME-CONFIG-WAL-CHECKPOINTS "Ctrl+click -> new tab") | 0.9 | checkpoint_completion_target = 0.9 | 
    [wal_buffers](https://postgrespro.ru/docs/postgresql/11/runtime-config-wal#RUNTIME-CONFIG-WAL-SETTINGS "Ctrl+click -> new tab") | 16MB | wal_buffers = 16MB | 
    [default_statistics_target](https://postgrespro.ru/docs/postgresql/11/runtime-config-query#RUNTIME-CONFIG-QUERY-OTHER "Ctrl+click -> new tab") | 500 | default_statistics_target = 500 | 
    [random_page_cost](https://postgrespro.ru/docs/postgresql/11/runtime-config-query#RUNTIME-CONFIG-QUERY-CONSTANTS "Ctrl+click -> new tab")  | 4 | random_page_cost = 4 | 
    [effective_io_concurrency](https://postgrespro.ru/docs/postgresql/11/runtime-config-resource#RUNTIME-CONFIG-RESOURCE-ASYNC-BEHAVIOR "Ctrl+click -> new tab") | 2 | effective_io_concurrency = 2 | 
    [work_mem](https://postgrespro.ru/docs/postgresql/11/runtime-config-resource#RUNTIME-CONFIG-RESOURCE-MEMORY "Ctrl+click -> new tab") | 6553kB | work_mem = 6553kB | 
    [min_wal_size](https://postgrespro.ru/docs/postgresql/11/runtime-config-wal#RUNTIME-CONFIG-WAL-CHECKPOINTS "Ctrl+click -> new tab") | 4GB | min_wal_size = 4GB | 
    [max_wal_size](https://postgrespro.ru/docs/postgresql/11/runtime-config-wal#RUNTIME-CONFIG-WAL-CHECKPOINTS "Ctrl+click -> new tab") | 16GB | max_wal_size = 16GB | 

- проверил, что фаервол _ufw_ неактивен `sudo ufw status`: 

    ```bash
    am@lesson-6-var-2:~$ sudo ufw status
    Status: inactive
    ```
    > в случае, если _ufw_ включен, необходимо открыть порт _postgres_: 
    `sudo ufw allow 5432/tcp` 

- изменил пользователю _postgres_ пароль: 
    `sudo su - postgres`
    `psql -c "alter user postgres with password '1qaz2wsx'"`

- в файл конфигурации `pg_hba.conf` внес изменения 
    `sudo nano /etc/postgresql/11/main/pg_hba.conf` 

    ```bash
    # IPv4 local connections:
    host    all             all             127.0.0.1/32            md5
    ```
    заменил на:

    ```bash
    # IPv4 local connections:
    host    all             all             0.0.0.0/0               md5
    ```
- перезапустил _postgres_: 
    `sudo systemctl restart postgresql` 

    проверка:
    `sudo -u postgres pg_lsclusters` 
    `sudo ss -tunelp | grep 5432` 

    ```bash
    am@lesson-6-var-2:~$ sudo -u postgres pg_lsclusters
    Ver Cluster Port Status Owner    Data directory              Log file
    11  main    5432 online postgres /var/lib/postgresql/11/main /var/log/postgresql/postgresql-11-main.log
    am@lesson-6-var-2:~$ sudo ss -tunelp | grep 5432
    tcp   LISTEN  0        104                  0.0.0.0:5432          0.0.0.0:*      users:(("postgres",pid=18911,fd=5)) uid:112 ino:57103 sk:a <->                 
    tcp   LISTEN  0        104                     [::]:5432             [::]:*      users:(("postgres",pid=18911,fd=6)) uid:112 ino:57104 sk:b v6only:1 <->    
    ```

    :+1: _postgres стартанул, всё ОК_

    - создал правило брандмауэра, в _GCP_: 

    `Cеть VPC` -> `Брандмауэр` -> `СОЗДАТЬ ПРАВИЛО БРАНДМАУЭРА`: 

    :hammer_and_wrench: Параметр | :memo: Значение |:hammer_and_wrench: Параметр | :memo: Значение |
    --------------:|---------------|--------------:|---------------|
    | Название | **`lesson-6-hw-var-2-postgres-allow-5432`** | Целевые экземпляры | `Все экземпляры в сети` | 
    | Журналы | :radio_button: `Выкл.` | Фильтр источника | `Диапазоны IP-адресов` | 
    | Сеть | `default` | Диапазоны IP-адресов источников | `0.0.0.0/0` | 
    | Приоритет | `1000` | Дополнительный фильтр источника | `Нет` |
    | Направление трафика | :radio_button: `Входящий трафик` | Протоколы и порты | :radio_button:  `Указанные протоколы и порты` |
    | Действие | :radio_button: `Разрешить` | | :ballot_box_with_check: `tcp: 5432` |

- подключился снаружи: 
    `psql -h 35.238.59.108 -p 5432 -U postgres`

    Проверка:
    ```bash
    postgres=# select inet_client_addr();
     inet_client_addr 
    ------------------
     45.81.203.133
    (1 row)
    ``` 

    :+1: _при проверке - вижу свой внешний адрес, значит подключение снаружи к серверу PostgreSQL 11 прошло успешно_ 

    - снова подключился к хосту с _postgres_ по _ssh_ и выполнил команду `pgbench -i postgres` от имени пользователя _postgres_: 
    
    ```bash
    am@lesson-6-var-2:~$ sudo su postgres
    postgres@lesson-6-var-2:/home/am$ pgbench -i postgres
    dropping old tables...
    NOTICE:  table "pgbench_accounts" does not exist, skipping
    NOTICE:  table "pgbench_branches" does not exist, skipping
    NOTICE:  table "pgbench_history" does not exist, skipping
    NOTICE:  table "pgbench_tellers" does not exist, skipping
    creating tables...
    generating data...
    100000 of 100000 tuples (100%) done (elapsed 0.11 s, remaining 0.00 s)
    vacuuming...
    creating primary keys...
    done.
    ```
    :link: [pgbench](https://postgrespro.ru/docs/postgrespro/11/pgbench "Ctrl+click -> new tab")

- запустил команду `pgbench -c8 -P 60 -T 3600 -U postgres postgres`
    и зафиксировал среднее значение tps в последней ⅙ части работы (727.73):
    ```bash
    ...
    progress: 3060.0 s, 733.4 tps, lat 10.908 ms stddev 2.695
    progress: 3120.0 s, 695.3 tps, lat 11.507 ms stddev 2.974
    progress: 3180.0 s, 712.0 tps, lat 11.237 ms stddev 2.841
    progress: 3240.0 s, 734.9 tps, lat 10.886 ms stddev 2.311
    progress: 3300.0 s, 745.8 tps, lat 10.726 ms stddev 2.196
    progress: 3360.0 s, 719.5 tps, lat 11.119 ms stddev 2.625
    progress: 3420.0 s, 775.2 tps, lat 10.319 ms stddev 2.065
    progress: 3480.0 s, 688.6 tps, lat 11.617 ms stddev 3.116
    progress: 3540.0 s, 760.7 tps, lat 10.517 ms stddev 2.264
    progress: 3600.0 s, 711.9 tps, lat 11.237 ms stddev 2.465
    transaction type: <builtin: TPC-B (sort of)>
    scaling factor: 1
    query mode: simple
    number of clients: 8
    number of threads: 1
    duration: 3600 s
    number of transactions actually processed: 2637399
    latency average = 10.920 ms
    latency stddev = 3.124 ms
    tps = 732.605003 (including connections establishing)
    tps = 732.605820 (excluding connections establishing)
    ```

*** 
<div align="center"><h4>4. Тюнинг autovacuum</h4></div> 

*** 
- произвел настройку _autovacuum_:
    `sudo nano /etc/postgresql/11/main/postgresql.conf` 

    :hammer_and_wrench: [Параметр (кликабелен)](https://postgrespro.ru/docs/postgresql/11/bookindex "Ctrl+click -> new tab")        | :memo: Значение |:hammer_and_wrench: Строка конфигурации | 
    --------------:|---------------|--------------:| 
    | [autovacuum](https://postgrespro.ru/docs/postgresql/11/runtime-config-autovacuum#GUC-AUTOVACUUM "Ctrl+click -> new tab") | on | autovacuum = on | 
    | [track_counts](https://postgrespro.ru/docs/postgresql/11/runtime-config-statistics#GUC-TRACK-COUNTS "Ctrl+click -> new tab") | on | track_counts = on | 
    | [log_autovacuum_min_duration](https://postgrespro.ru/docs/postgresql/11/runtime-config-autovacuum "Ctrl+click -> new tab") | -1 | log_autovacuum_min_duration = -1 | 
    | [autovacuum_max_workers](https://postgrespro.ru/docs/postgresql/11/runtime-config-autovacuum "Ctrl+click -> new tab") | 2 | autovacuum_max_workers = 2 | 
    | [autovacuum_naptime](https://postgrespro.ru/docs/postgresql/11/runtime-config-autovacuum "Ctrl+click -> new tab") | 5s | autovacuum_naptime = 5s | 
    | [autovacuum_vacuum_threshold](https://postgrespro.ru/docs/postgresql/11/runtime-config-autovacuum "Ctrl+click -> new tab") | 25 | autovacuum_vacuum_threshold = 25 | 
    | [autovacuum_vacuum_scale_factor](https://postgrespro.ru/docs/postgresql/11/runtime-config-autovacuum "Ctrl+click -> new tab") | 0.05 | autovacuum_vacuum_scale_factor = 0.05 | 
    | [autovacuum_analyze_threshold](https://postgrespro.ru/docs/postgresql/11/runtime-config-autovacuum "Ctrl+click -> new tab") | 25 | autovacuum_analyze_threshold = 25 | 
    | [autovacuum_analyze_scale_factor](https://postgrespro.ru/docs/postgresql/11/runtime-config-autovacuum "Ctrl+click -> new tab") | 0.1 | autovacuum_analyze_scale_factor = 0.1 |
    | [autovacuum_vacuum_cost_delay](https://postgrespro.ru/docs/postgresql/11/runtime-config-autovacuum "Ctrl+click -> new tab") | 5ms | autovacuum_vacuum_cost_delay = 5ms | 
    | [autovacuum_vacuum_cost_limit](https://postgrespro.ru/docs/postgresql/11/runtime-config-autovacuum "Ctrl+click -> new tab") | 500 | autovacuum_vacuum_cost_limit = 500 | 

- "мягко" перегрузил конфигурацию: `sudo pg_ctlcluster 11 main reload`
    проверил:
    ```bash
    postgres@lesson-6-var-2:/home/am$ psql -c "select pg_reload_conf();"
     pg_reload_conf 
    ----------------
     t
    (1 row)
    ```
    :+1: _t (true) - конфигурация перегружена_

- снова запустил команды: 
    `pgbench -i postgres` 
    `pgbench -c8 -P 60 -T 3600 -U postgres postgres` 
    и снова зафиксировал среднее значение tps в последней ⅙ части работы (875.14): 

    ```bash
    progress: 3060.0 s, 897.8 tps, lat 8.911 ms stddev 1.716
    progress: 3120.0 s, 887.7 tps, lat 9.012 ms stddev 1.762
    progress: 3180.0 s, 867.9 tps, lat 9.218 ms stddev 1.962
    progress: 3240.0 s, 898.0 tps, lat 8.908 ms stddev 1.706
    progress: 3300.0 s, 854.6 tps, lat 9.361 ms stddev 1.956
    progress: 3360.0 s, 878.8 tps, lat 9.104 ms stddev 1.710
    progress: 3420.0 s, 877.9 tps, lat 9.112 ms stddev 1.733
    progress: 3480.0 s, 854.6 tps, lat 9.361 ms stddev 1.930
    progress: 3540.0 s, 873.9 tps, lat 9.155 ms stddev 1.830
    progress: 3600.0 s, 860.2 tps, lat 9.300 ms stddev 1.916
    transaction type: <builtin: TPC-B (sort of)>
    scaling factor: 1
    query mode: simple
    number of clients: 8
    number of threads: 1
    duration: 3600 s
    number of transactions actually processed: 3083103
    latency average = 9.341 ms
    latency stddev = 1.988 ms
    tps = 856.411286 (including connections establishing)
    tps = 856.411994 (excluding connections establishing)
    ```

:exclamation: _**Итог:** При новых настройках наблюдается значительный прирост производительности - увеличение tps (порядка 20%), значительное снижение задержек (latency)._

:+1: Эсперимент проведен удачно 🦆

:link: [PERCONA. Tuning Autovacuum in PostgreSQL and Autovacuum Internals](https://www.percona.com/blog/2018/08/10/tuning-autovacuum-in-postgresql-and-autovacuum-internals/ "Ctrl+click -> new tab")

:link: [MVCC-7. Автоочистка](https://habr.com/ru/company/postgrespro/blog/452762/ "Ctrl+click -> new tab")

:link: [AWS. A Case Study of Tuning Autovacuum in Amazon RDS for PostgreSQL](https://aws.amazon.com/ru/blogs/database/a-case-study-of-tuning-autovacuum-in-amazon-rds-for-postgresql/ "Ctrl+click -> new tab")

:link: [The Internals of PostgreSQL. Vacuum Processing](http://www.interdb.jp/pg/pgsql06.html "Ctrl+click -> new tab")

