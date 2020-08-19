
<div align="right"><h5> Занятие #11 - Домашнее задание - Вариант 1</h5></div>


<div align="center"><h2>Нагрузочное тестирование и тюнинг PostgreSQL</h2></div>

***
<div align="center"><h4>1. Создание виртуальной машины</h4></div>

***

- В проекте `andrey-radchenko-19731204-04` перешел в _Compute Engine_ и создал новую виртуальную машину: 

[`Google Cloud Platform`](https://cloud.google.com/ "Google Cloud") -> `Compute Engine` -> `Экземпляры ВМ` -> `Создать экземпляр`

:hammer_and_wrench: Параметр | :memo: Значение |:hammer_and_wrench: Параметр | :memo: Значение |
--------------:|---------------|--------------:|---------------|
| Название ВМ | **`lesson-11-v-1`** | Операционная система | `Ubuntu` |
| Регион | `us-central1 (Айова)` | Версия операционной системы | `Ubuntu 18.04 LTS` | 
| Зона | `us-central1-a` | Тип загрузочного диска | `Постоянный SSD-диск` | 
| Серия | `N1` | Размер (Гб) загрузочного диска | `25` |
| Тип машины | `n1-standart-1` | Брандмауэр | :ballot_box_with_check: `Разрешить трафик HTTP`
| | | | :ballot_box_with_check: `Разрешить трафик HTTPS` |

- Подключился к новой ВМ по _ssh_

***
<div align="center"><h4>2. Установка PostgreSQL 11</h4></div>

***
  - импортировал GPG-ключ репозитория: 
    ```bash
    $ wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    ````
  - добавил содержимое репозитория в систему (через переменную RELEASE, подойдет для Ubuntu 20.04/18.04/16.04) 
    ```bash
    $ RELEASE=$(lsb_release -cs)
    $ echo "deb http://apt.postgresql.org/pub/repos/apt/ ${RELEASE}"-pgdg main | sudo tee /etc/apt/sources.list.d/pgdg.list
    ```
  - обновил списки APT-пакетов и установил серверную и клиентскую часть 
    ```bash
    $ sudo apt -y update && sudo apt -y install postgresql-11 postgresql-client-11
    ```
  - проверил: 
      <pre>$ sudo -u postgres pg_lsclusters
    Ver Cluster Port Status Owner    Data directory              Log file
    <font color="#4E9A06">11  main    5432 online postgres /var/lib/postgresql/11/main /var/log/postgresql/postgresql-11-main.log</font>
</pre>

***
<div align="center"><h4>3. Установка sysbench-tpcc и подготовка тестовых данных</h4></div>

***
- установил [sysbench](https://github.com/akopytov/sysbench#linux "Ctrl+click -> new tab")
```bash
$ curl -s https://packagecloud.io/install/repositories/akopytov/sysbench/script.deb.sh | sudo bash
$ sudo apt -y install sysbench
```  
- клонировал репозиторий [sysbench-tpcc](https://github.com/Percona-Lab/sysbench-tpcc "Ctrl+click -> new tab")
```bash
$ git clone https://github.com/Percona-Lab/sysbench-tpcc
```  

- изменил метод аутентификации в `pg_hba.conf` на `trust` (чтобы можно было запустить тесты без авторизации):
```bash
postgres=# show hba_file;
-[ RECORD 1 ]---------------------------------
hba_file | /etc/postgresql/11/main/pg_hba.conf
```
```yaml
# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
```  
- перегрузил сервер: 
```bash
$ sudo pg_ctlcluster 11 main restart
```  
- создал базу данных `sbtest`: `create database sbtest;`
- проверил размер новой бд:
```bash
postgres=# select datname, pg_size_pretty(pg_database_size(datname)) as "DB_Size" from pg_stat_database where datname = 'sbtest';
-[ RECORD 1 ]----
datname | sbtest
DB_Size | 7693 kB
```  
- подготовил данные для теста:
```bash
$ ./tpcc.lua --pgsql-user=postgres --pgsql-db=sbtest --time=120 --report-interval=1 --tables=10 --scale=10 --use_fk=0 --trx_level=RC --db-driver=pgsql prepare
```
> --time - период генерации одной порции данных
--report-interval - временной интервал одной строки
--scale - количество хранилищ 
--tables - количество таблиц

- проверил еще раз размер бд:
```bash
sbtest=# select datname, pg_size_pretty(pg_database_size(datname)) as "DB_Size" from pg_stat_database where datname = 'sbtest';
-[ RECORD 1 ]----
datname | sbtest
DB_Size | 7299 MB
```
***
<div align="center"><h4>4. Запуск тестов производительности</h4></div>

***  
- на дефолтной конфигурации сервера запустил бенчмарк:
```bash
$ ./tpcc.lua --pgsql-user=postgres --pgsql-db=sbtest --time=600 --report-interval=1 --tables=10 --scale=10 --use_fk=0 --trx_level=RC --db-driver=pgsql run
```  
- результат:
```yaml
SQL statistics:
    queries performed:
        read:                            192861
        write:                           200163
        other:                           29616
        total:                           422640
    transactions:                        14807  (24.68 per sec.)
    queries:                             422640 (704.35 per sec.)
    ignored errors:                      51     (0.08 per sec.)
    reconnects:                          0      (0.00 per sec.)

General statistics:
    total time:                          600.0419s
    total number of events:              14807

Latency (ms):
         min:                                    0.66
         avg:                                   40.52
         max:                                 5294.55
         95th percentile:                      112.67
         sum:                               599947.17

Threads fairness:
    events (avg/stddev):           14807.0000/0.00
    execution time (avg/stddev):   599.9472/0.00
```  
- поправил конфиг `/etc/postgresql/11/main/postgresql.conf`:  

| раздел | параметр | новое значение | дефолтное значение PG11 |
|:----------|:--------------|-----------------------:|--------------------------------------:|
| Память | :link: [maintenance_work_mem](https://postgrespro.ru/docs/postgrespro/11/runtime-config-resource#GUC-MAINTENANCE-WORK-MEM "Ctrl+click -> new tab") | 2GB | 64MB |  
| Память | :link: [shared_buffers](https://postgrespro.ru/docs/postgrespro/11/runtime-config-resource#GUC-SHARED-BUFFERS "Ctrl+click -> new tab") | 3GB | 128MB |  
| Память | :link: [work_mem](https://postgrespro.ru/docs/postgrespro/11/runtime-config-resource#GUC-WORK-MEM "Ctrl+click -> new tab") | 16MB | 4MB |  
| Контрольные точки | :link: [checkpoint_completion_target](https://postgrespro.ru/docs/postgrespro/11/runtime-config-wal#GUC-CHECKPOINT-COMPLETION-TARGET "Ctrl+click -> new tab") | 0.9 | 0.5 |  
| Контрольные точки | :link: [checkpoint_timeout](https://postgrespro.ru/docs/postgrespro/11/runtime-config-wal#GUC-CHECKPOINT-TIMEOUT "Ctrl+click -> new tab") | 1h | 5min |  
| Контрольные точки | :link: [min_wal_size](https://postgrespro.ru/docs/postgrespro/11/runtime-config-wal#GUC-MIN-WAL-SIZE "Ctrl+click -> new tab") | 1GB | 80MB |  
| Контрольные точки | :link: [max_wal_size](https://postgrespro.ru/docs/postgrespro/11/runtime-config-wal#GUC-MAX-WAL-SIZE "Ctrl+click -> new tab") | 10GB | 80MB |  
| Фоновая запись | :link: [bgwriter_lru_maxpages](https://postgrespro.ru/docs/postgrespro/11/runtime-config-resource#GUC-BGWRITER-LRU-MAXPAGES "Ctrl+click -> new tab") | 1000 | 100 |  
| Фоновая запись | :link: [bgwriter_lru_multiplier](https://postgrespro.ru/docs/postgrespro/11/runtime-config-resource#GUC-BGWRITER-LRU-MULTIPLIER "Ctrl+click -> new tab") | 10.0 | 2.0 |  
| Планировщик | :link: [effective_cache_size](https://postgrespro.ru/docs/postgrespro/11/runtime-config-query#GUC-EFFECTIVE-CACHE-SIZE "Ctrl+click -> new tab") | 20GB | 4GB |  
| Планировщик | :link: [random_page_cost](https://postgrespro.ru/docs/postgrespro/11/runtime-config-query#GUC-RANDOM-PAGE-COST "Ctrl+click -> new tab") | 1.0 | 4.0 |  
| Параметры | :link: [wal_compression](https://postgrespro.ru/docs/postgrespro/11/runtime-config-wal#GUC-WAL-COMPRESSION "Ctrl+click -> new tab") | on | off |  
| Параметры | :link: [fsync](https://postgrespro.ru/docs/postgrespro/11/runtime-config-wal#GUC-FSYNC "Ctrl+click -> new tab") | off | on |  
| Параметры | :link: [full_page_writes](https://postgrespro.ru/docs/postgrespro/11/runtime-config-wal#GUC-FULL-PAGE-WRITES "Ctrl+click -> new tab") | off | on |  
| Параметры | :link: [synchronous_commit](https://postgrespro.ru/docs/postgrespro/11/runtime-config-wal#GUC-SYNCHRONOUS-COMMIT "Ctrl+click -> new tab") | off | on |  

<details>
<summary>Конфиг</summary> 
<pre>shared_buffers = 3GB
work_mem = 16MB
maintenance_work_mem = 2GB
random_page_cost = 1
max_wal_senders = 3
seq_page_cost = 1
max_wal_size = 10GB
checkpoint_timeout = 1h
checkpoint_completion_target = 0.9
effective_cache_size = 20GB
min_wal_size = 1GB
bgwriter_lru_maxpages = 1000
bgwriter_lru_multiplier = 10.0
wal_compression = on
synchronous_commit = off
full_page_writes = off
fsync = off
</pre></details>

:link: [PGTune](https://pgtune.leopard.in.ua/#/ "Ctrl+click -> new tab")
:link: [Cybertec PostgreSQL Configurator](http://pgconfigurator.cybertec.at/ "Ctrl+click -> new tab")

- перегрузил сервер:
```bash
$ sudo pg_ctlcluster 11 main restart
```

- выполнил вручную VACUUM ANALYZE:
```bash
$ /usr/lib/postgresql/11/bin/vacuumdb -d sbtest -z
```

- снова запустил тест на 10 минут:
```bash
$ ./tpcc.lua --pgsql-user=postgres --pgsql-db=sbtest --time=600 --report-interval=1 --tables=10 --scale=10 --use_fk=0 --trx_level=RC --db-driver=pgsql run
```

- результат:
```yaml
SQL statistics:
    queries performed:
        read:                            576012
        write:                           597999
        other:                           89438
        total:                           1263449
    transactions:                        44718  (74.52 per sec.)
    queries:                             1263449 (2105.60 per sec.)
    ignored errors:                      186    (0.31 per sec.)
    reconnects:                          0      (0.00 per sec.)

General statistics:
    total time:                          600.0421s
    total number of events:              44718

Latency (ms):
         min:                                    0.61
         avg:                                   13.41
         max:                                  292.47
         95th percentile:                       33.72
         sum:                               599860.83

Threads fairness:
    events (avg/stddev):           44718.0000/0.00
    execution time (avg/stddev):   599.8608/0.00
```  
:+1: _виден прирост около 200% по всем показателям: чтение, запись, tps_

> :exclamation:  _ход моих размышлений по поводу улучшения производительности был такой: максимально ограничить нагрузку на диск хотя бы на время теста, и отключить параметры, влияющие на надежность системы_
