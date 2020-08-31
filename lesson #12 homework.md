<div align="right"><h5> Занятие #12 - Домашнее задание</h5></div>

<div align="center"><h2>Работа с большим объемом реальных данных</h2></div>

***
<div align="center"><h4>1. Подготовка виртуальных машин</h4></div>

***

- в проекте `andrey-radchenko-19731204-04` создал 3 виртуальные машины _GCP_ командами _gcloud_  

    <pre><details><summary>les-12-mysql8...</summary>
    gcloud beta compute 
      --project=andrey-radchenko-19731204-04 instances create les-12-mysql8 
      --zone=us-central1-a 
      --machine-type=e2-standard-2 
      --subnet=default 
      --network-tier=PREMIUM 
      --maintenance-policy=MIGRATE 
      --service-account=1027982933386-compute@developer.gserviceaccount.com 
      --scopes=https://www.googleapis.com/auth/cloud-platform 
      --image=ubuntu-1804-bionic-v20200821a 
      --image-project=ubuntu-os-cloud 
      --boot-disk-size=50GB 
      --boot-disk-type=pd-ssd 
      --boot-disk-device-name=les-12-mysql8 
      --no-shielded-secure-boot 
      --shielded-vtpm 
      --shielded-integrity-monitoring 
      --reservation-affinity=any
    </details></pre>

    <pre><details><summary>les-12-pgsql12...</summary>
    gcloud beta compute 
      --project=andrey-radchenko-19731204-04 instances create les-12-pgsql12 
      --zone=us-central1-a 
      --machine-type=e2-standard-2 
      --subnet=default 
      --network-tier=PREMIUM 
      --maintenance-policy=MIGRATE 
      --service-account=1027982933386-compute@developer.gserviceaccount.com 
      --scopes=https://www.googleapis.com/auth/cloud-platform 
      --image=ubuntu-1804-bionic-v20200821a 
      --image-project=ubuntu-os-cloud 
      --boot-disk-size=50GB 
      --boot-disk-type=pd-ssd 
      --boot-disk-device-name=les-12-pgsql12 
      --no-shielded-secure-boot 
      --shielded-vtpm 
      --shielded-integrity-monitoring 
      --reservation-affinity=any
    </details></pre>

    <pre><details><summary>les-12-pgsql12tsdb...</summary>
    gcloud beta compute 
      --project=andrey-radchenko-19731204-04 instances create les-12-pgsql12tsdb 
      --zone=us-central1-a 
      --machine-type=e2-standard-2 
      --subnet=default 
      --network-tier=PREMIUM 
      --maintenance-policy=MIGRATE 
      --service-account=1027982933386-compute@developer.gserviceaccount.com 
      --scopes=https://www.googleapis.com/auth/cloud-platform 
      --image=ubuntu-1804-bionic-v20200821a 
      --image-project=ubuntu-os-cloud 
      --boot-disk-size=50GB 
      --boot-disk-type=pd-ssd 
      --boot-disk-device-name=les-12-pgsql12tsdb 
      --no-shielded-secure-boot 
      --shielded-vtpm 
      --shielded-integrity-monitoring 
      --reservation-affinity=any
    </details></pre>

    ***
<div align="center"><h4>2. Подготовка файлов для загрузки</h4></div>

***

- создал сегмент `les-12-data` 20гб в Google Cloud Storage
- экспортировал на него набор данных из BigQuery `bigquery-public-data.new_york_311.311_service_requests` в csv-файлы, указал название файлов `311_service_requests_*.csv` 
- подключился к ВМ по _ssh_
- проверил результат `gsutil ls -l gs://les-12-data` - получилось 47 файлов общим объемом 11,93 Гб

***
<div align="center"><h4>3. Монтирование сегмента Google Cloud Storage в файловую систему ВМ</h4></div>

***

**На всех ВМ**
- установил [Cloud Storage FUSE](https://cloud.google.com/storage/docs/gcs-fuse "Ctrl+click -> new tab")

    - добавил URL-адрес распространения _gcsfuse_ в качестве источника пакетов и импортировал его открытый ключ
        ```bash
        $ export GCSFUSE_REPO=gcsfuse-`lsb_release -c -s`
        $ echo "deb http://packages.cloud.google.com/apt $GCSFUSE_REPO main" | sudo tee /etc/apt/sources.list.d/gcsfuse.list
        $ curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
        ```
    - обновил список доступных пакетов и установил _gcsfuse_
        ```bash
        $ sudo apt-get update && sudo apt-get install gcsfuse
        ```
- создал каталог для монтирования данных
    ```bash
    $ sudo mkdir /mnt/les-12-data
    ```

- смонтировал бакет в созданный каталог
    ```bash
    $ sudo gcsfuse les-12-data /mnt/les-12-data
    Using mount point: /mnt/les-12-data
    Opening GCS connection...
    Opening bucket...
    Mounting file system...
    File system has been successfully mounted.   
    ```

- проверил
    ```bash
    $ sudo ls /mnt/les-12-data -l
    total 12505266
    -rw-r--r-- 1 am am 273083084 Aug 28 15:06 311_service_requests_000000000000.csv
    -rw-r--r-- 1 am am 271585487 Aug 28 15:06 311_service_requests_000000000001.csv
    -rw-r--r-- 1 am am 272575596 Aug 28 15:06 311_service_requests_000000000002.csv
    -rw-r--r-- 1 am am 273318712 Aug 28 15:06 311_service_requests_000000000003.csv
    ...
    ```

🔗 [github.gcs-fuse](https://github.com/GoogleCloudPlatform/gcsfuse "Ctrl+click -> new tab")

***
<div align="center"><h4>4. Установка и настройка MySQL 8.0</h4></div>

***

**На ВМ `les-12-mysql8`**
- добавил репозиторий MySQL
    ```bash
    $ wget https://dev.mysql.com/get/mysql-apt-config_0.8.15-1_all.deb && sudo dpkg -i mysql-apt-config_0.8.15-1_all.deb
    ```

- обновил пакеты и установил MySQL-сервер
    ```bash
    $ sudo apt update && sudo apt install mysql-server
    ```
    > ❗ пароль _root_: root$123

- проверил версию
    <pre><details><summary>$ apt policy mysql-server</summary>
    mysql-server:
      Installed: 8.0.21-1ubuntu18.04
      Candidate: 8.0.21-1ubuntu18.04
      Version table:
     *** 8.0.21-1ubuntu18.04 500
            500 http://repo.mysql.com/apt/ubuntu bionic/mysql-8.0 amd64 Packages
            100 /var/lib/dpkg/status
         5.7.31-0ubuntu0.18.04.1 500
            500 http://us-central1.gce.archive.ubuntu.com/ubuntu bionic-updates/main amd64 Packages
            500 http://security.ubuntu.com/ubuntu bionic-security/main amd64 Packages
         5.7.21-1ubuntu1 500
            500 http://us-central1.gce.archive.ubuntu.com/ubuntu bionic/main amd64 Packages
        </details></pre>

    > 👍 версия - 8.0.21

- проверил статус
    <pre><details><summary>$ systemctl  status  mysql</summary>
    ● mysql.service - MySQL Community Server
       Loaded: loaded (/lib/systemd/system/mysql.service; enabled; vendor preset: enabled)
       Active: active (running) since Fri 2020-08-28 16:53:10 UTC; 1min 39s ago
         Docs: man:mysqld(8)
               http://dev.mysql.com/doc/refman/en/using-systemd.html
     Main PID: 5899 (mysqld)
       Status: "Server is operational"
        Tasks: 38 (limit: 4369)
       CGroup: /system.slice/mysql.service
               └─5899 /usr/sbin/mysqld
    
    Aug 28 16:53:09 les-12-mysql8 systemd[1]: Starting MySQL Community Server...
    Aug 28 16:53:10 les-12-mysql8 systemd[1]: Started MySQL Community Server.
    </details></pre>

- скачал утилиту для тюнинга MySQL
    ```bash
    $ cd /opt/
    $ sudo wget http://mysqltuner.pl/ -O mysqltuner.pl
    ```
- сделал скрипт исполняемым
    ```bash
    $ sudo chmod +x mysqltuner.pl
    ```
- запустил скрипт
    ```bash
    $ ./mysqltuner.pl
    ```

👍 Сервер MySQL установлен и функционирует нормально

***
<div align="center"><h4>5. Установка и настройка PostgreSQL 12</h4></div>

***

**На ВМ `les-12-pgsql12` и `les-12-pgsql12tsdb`**

- импортировал GPG-ключ репозитория: 
    ```bash
    $ wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    ````
- добавил содержимое репозитория в систему
    ```bash
    $ echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" | sudo tee  /etc/apt/sources.list.d/pgdg.list
    ```
- обновил списки APT-пакетов и установил серверную и клиентскую часть 
    ```bash
    $ sudo apt -y update && sudo apt -y install postgresql-12 postgresql-client-12
    ```
- проверил: 
    ```bash
    $ sudo -u postgres pg_lsclusters
    Ver Cluster Port Status Owner    Data directory              Log file
    12  main    5432 online postgres /var/lib/postgresql/12/main /var/log/postgresql/postgresql-12-main.log
    ```
- для настройки **`les-12-pgsql12`** воспользовался сайтом [PGTune](https://pgtune.leopard.in.ua/#/ "Ctrl+click -> new tab")  

    <pre><details><summary>рекомендации</summary>
    # DB Version: 12
    # OS Type: linux
    # DB Type: oltp
    # Total Memory (RAM): 8 GB
    # CPUs num: 2
    # Connections num: 20
    # Data Storage: ssd

    max_connections = 20
    shared_buffers = 2GB
    effective_cache_size = 6GB
    maintenance_work_mem = 512MB
    checkpoint_completion_target = 0.9
    wal_buffers = 16MB
    default_statistics_target = 100
    random_page_cost = 1.1
    effective_io_concurrency = 200
    work_mem = 104857kB
    min_wal_size = 2GB
    max_wal_size = 8GB
    max_worker_processes = 2
    max_parallel_workers_per_gather = 1
    max_parallel_workers = 2
    max_parallel_maintenance_workers = 1
    </details></pre>

    - добавил параметры в конец файла `/etc/postgresql/12/main/postgresql.conf`

- перегрузил кластер  
    ```bash
    $ sudo pg_ctlcluster 12 main restart
    ```  

👍 Сервера PostgreSQL установлены и функционируют нормально

***
<div align="center"><h4>6. Установка и настройка TimescaleDB</h4></div>

***

**На ВМ `les-12-pgsql12tsdb`**

- добавил репозитории TimescaleDB и обновил список пакетов 
    ```bash
    $ sudo add-apt-repository ppa:timescale/timescaledb-ppa && sudo apt-get update
    ```

- установил TimescaleDB
    ```bash
    $ sudo apt install timescaledb-postgresql-12
    ```

- запустил мастер настройки конфигурации TimescaleDB `timescaledb-tune`
    ```bash
    $ sudo timescaledb-tune
    ```
    -  подтвердил путь к файлу конфигурации PostgreSQL
        ```bash
        Using postgresql.conf at this path:
        /etc/postgresql/12/main/postgresql.conf
        
        Is this correct? [(y)es/(n)o]: y
        ```

    - изменил переменную _shared_preload_libraries_ для предварительной загрузки модуля TimescaleDB после запуска сервера PostgreSQL
        ```bash
        shared_preload_libraries needs to be updated
        Current:
        #shared_preload_libraries = ''
        Recommended:
        shared_preload_libraries = 'timescaledb'
        Is this okay? [(y)es/(n)o]: y
        success: shared_preload_libraries will be updated
        ```
    - согласился на тонкую настройку параметров
        ```bash
        Tune memory/parallelism/WAL and other settings? [(y)es/(n)o]: y
        Recommendations based on 7.77 GB of available memory and 2 CPUs for PostgreSQL 12
        
        Memory settings recommendations
        Current:
        shared_buffers = 128MB
        #effective_cache_size = 4GB
        #maintenance_work_mem = 64MB
        #work_mem = 4MB
        Recommended:
        shared_buffers = 1990MB
        effective_cache_size = 5971MB
        maintenance_work_mem = 1019062kB
        work_mem = 10190kB
        Is this okay? [(y)es/(s)kip/(q)uit]: y
        success: memory settings will be updated
        ```

    - с рекомендациями по настройке параллелизма
        ```bash
        Parallelism settings recommendations
        Current:
        missing: timescaledb.max_background_workers
        #max_worker_processes = 8
        #max_parallel_workers_per_gather = 2
        #max_parallel_workers = 8
        Recommended:
        timescaledb.max_background_workers = 8
        max_worker_processes = 13
        max_parallel_workers_per_gather = 1
        max_parallel_workers = 2
        Is this okay? [(y)es/(s)kip/(q)uit]: y
        success: parallelism settings will be updated
        ```

    - с рекомендациями по настройке журнала предварительной записи (WAL)
        ```bash
        WAL settings recommendations
        Current:
        #wal_buffers = -1
        min_wal_size = 80MB
        Recommended:
        wal_buffers = 16MB
        min_wal_size = 512MB
        Is this okay? [(y)es/(s)kip/(q)uit]: y
        success: WAL settings will be updated
        ```
    - с настройками дополнительных параметров
        ```bash
        Miscellaneous settings recommendations
        Current:
        #default_statistics_target = 100
        #random_page_cost = 4.0
        #checkpoint_completion_target = 0.5
        #max_locks_per_transaction = 64
        #autovacuum_max_workers = 3
        #autovacuum_naptime = 1min
        #effective_io_concurrency = 1
        Recommended:
        default_statistics_target = 500
        random_page_cost = 1.1
        checkpoint_completion_target = 0.9
        max_locks_per_transaction = 64
        autovacuum_max_workers = 10
        autovacuum_naptime = 10
        effective_io_concurrency = 200
        Is this okay? [(y)es/(s)kip/(q)uit]: y
        success: miscellaneous settings will be updated
        Saving changes to: /etc/postgresql/12/main/postgresql.conf
        ```

    - перегрузил сервер для применения новой конфигурации
        ```bash
        $ sudo pg_ctlcluster 12 main restart
        ```

    - проверил 
        ```bash
        $ sudo pg_lsclusters 12 main
        Ver Cluster Port Status Owner    Data directory              Log file
        12  main    5432 online postgres /var/lib/postgresql/12/main /var/log/postgresql/postgresql-12-main.log
        ```

👍 всё ок, сервер работает

***
<div align="center"><h4>7. Подготовка баз данных и таблиц</h4></div>

***

- на всех инстансах создал БД `test_db`: `create database test_db;`
- на инстансе `les-12-pgsql12tsdb` дополнительно в БД `test_db` выполнил команду для подключения расширения _TimescaleDB_
    ```bash
    test_db=# create extension if not exists timescaledb cascade;
    WARNING:
    WELCOME TO
     _____ _                               _     ____________
    |_   _(_)                             | |    |  _  \ ___ \
      | |  _ _ __ ___   ___  ___  ___ __ _| | ___| | | | |_/ /
      | | | |  _ ` _ \ / _ \/ __|/ __/ _` | |/ _ \ | | | ___ \
      | | | | | | | | |  __/\__ \ (_| (_| | |  __/ |/ /| |_/ /
      |_| |_|_| |_| |_|\___||___/\___\__,_|_|\___|___/ \____/
                   Running version 1.7.3
    For more information on TimescaleDB, please visit the following links:
    
     1. Getting started: https://docs.timescale.com/getting-started
     2. API reference documentation: https://docs.timescale.com/api
     3. How TimescaleDB is designed: https://docs.timescale.com/introduction/architecture
    
    Note: TimescaleDB collects anonymous reports to better understand and assist our users.
    For more information and how to disable, please see our docs https://docs.timescaledb.com/using-timescaledb/telemetry.
    
    CREATE EXTENSION
    ```

- создал в каждой БД таблицу `service_requests` 
    <pre><details><summary>MySQL</summary>
    create table service_requests (
      unique_key int primary key,
      created_date timestamp not null,
      closed_date timestamp null,
      agency text null,
      agency_name text null,
      complaint_type text null,
      descriptor text null,
      location_type text null,
      incident_zip text null,
      incident_address text null,
      street_name text null,
      cross_street_1 text null,
      cross_street_2 text null,
      intersection_street_1 text null,
      intersection_street_2 text null,
      address_type text null,
      city text null,
      landmark text null,
      facility_type text null,
      status text null,
      due_date timestamp null,
      resolution_description text null,
      resolution_action_updated_date timestamp null,
      community_board text null,
      borough text null,
      x_coordinate int null,
      y_coordinate int null,
      park_facility_name text null,
      park_borough text null,
      bbl int null,
      open_data_channel_type text null,
      vehicle_type text null,
      taxi_company_borough text null,
      taxi_pickup_location text null,
      bridge_highway_name text null,
      bridge_highway_direction text null,
      road_ramp text null,
      bridge_highway_segment text null,
      latitude float null,
      longitude float null,
      location text
    ) engine=InnoDB;
    </details></pre>

    <pre><details><summary>PostgreSQL</summary>
    create table if not exists public.service_requests (
      unique_key int primary key,
      created_date timestamp not null,
      closed_date timestamp null,
      agency text null,
      agency_name text null,
      complaint_type text null,
      descriptor text null,
      location_type text null,
      incident_zip text null,
      incident_address text null,
      street_name text null,
      cross_street_1 text null,
      cross_street_2 text null,
      intersection_street_1 text null,
      intersection_street_2 text null,
      address_type text null,
      city text null,
      landmark text null,
      facility_type text null,
      status text null,
      due_date timestamp null,
      resolution_description text null,
      resolution_action_updated_date timestamp null,
      community_board text null,
      borough text null,
      x_coordinate int null,
      y_coordinate int null,
      park_facility_name text null,
      park_borough text null,
      bbl bigint null,
      open_data_channel_type text null,
      vehicle_type text null,
      taxi_company_borough text null,
      taxi_pickup_location text null,
      bridge_highway_name text null,
      bridge_highway_direction text null,
      road_ramp text null,
      bridge_highway_segment text null,
      latitude float null,
      longitude float null,
      location text
    );
    </details></pre>

    <pre><details><summary>TimescaleDB</summary>
    create table if not exists public.service_requests (
      unique_key int not null,
      created_date timestamp not null,
      closed_date timestamp null,
      agency text null,
      agency_name text null,
      complaint_type text null,
      descriptor text null,
      location_type text null,
      incident_zip text null,
      incident_address text null,
      street_name text null,
      cross_street_1 text null,
      cross_street_2 text null,
      intersection_street_1 text null,
      intersection_street_2 text null,
      address_type text null,
      city text null,
      landmark text null,
      facility_type text null,
      status text null,
      due_date timestamp null,
      resolution_description text null,
      resolution_action_updated_date timestamp null,
      community_board text null,
      borough text null,
      x_coordinate int null,
      y_coordinate int null,
      park_facility_name text null,
      park_borough text null,
      bbl bigint null,
      open_data_channel_type text null,
      vehicle_type text null,
      taxi_company_borough text null,
      taxi_pickup_location text null,
      bridge_highway_name text null,
      bridge_highway_direction text null,
      road_ramp text null,
      bridge_highway_segment text null,
      latitude float null,
      longitude float null,
      location text, 
      constraint service_requests_pk primary key (unique_key, created_date)
    );

    select create_hypertable('public.service_requests', 'created_date');
    </details></pre>

    ***
<div align="center"><h4>8. Загрузка данных в MySQL</h4></div>

***

На ВМ `les-12-mysql8`
- изменил конфигурационный файл MySQL
    ```bash
    $ sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
    ```
    - добавил в конец строку `secure_file_priv= ""`

- перегрузил mysql
    ```bash
    $ systemctl restart mysql
    ```
- установил параметр `local_infile = 'on';`
    ```sql
    set global local_infile = 'on';
    ```
    <pre><details><summary>проверка</summary>
    mysql> SHOW GLOBAL VARIABLES LIKE 'local_infile';
    +---------------+-------+
    | Variable_name | Value |
    +---------------+-------+
    | local_infile  | OFF   |
    +---------------+-------+
    1 row in set (0.01 sec)</details></pre>


- загрузил данные с помощью команды (выполнение - около 5 часов)
    ```bash
    $ cd /mnt/les-12-data
    $ for f in *.csv
      do
        mysql -e "load data local infile '"$f"' into table service_requests fields terminated by ',' lines terminated by '\n'ignore 1 rows;" -u root --password='root$123' test_db --local-infile
      done
    ```
- проверил
    ```bash
    mysql> select count(*) from service_requests;
    +----------+
    | count(*) |
    +----------+
    | 23753400 |
    +----------+
    1 row in set (11 min 29.09 sec)
    ```

- посмотрел размер загруженных данных в БД
    ```sql
    select table_schema as "database name", 
           round(sum(data_length + index_length) / 1024 / 1024, 2) as "size in (mb)" 
    from information_schema.tables
    where table_schema = "test_db" 
    group by table_schema;
    ```
    ```bash
    +---------------+--------------+
    | database name | size in (mb) |
    +---------------+--------------+
    | test_db       |     18472.89 |
    +---------------+--------------+
    1 row in set (0.05 sec)
    ```

⚠️ 🔗 [secure_file_priv](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_secure_file_priv "Ctrl+click -> new tab")  🔗 [local_infile](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_local_infile "Ctrl+click -> new tab")  🔗 [load data](https://dev.mysql.com/doc/refman/8.0/en/load-data.html "Ctrl+click -> new tab")

***
<div align="center"><h4>9. Загрузка данных PostgreSQL</h4></div>

***

**На ВМ `les-12-pgsql12` и `les-12-pgsql12tsdb`**

- на время загрузки поменял метод аутентификации для пользователя _postgres_ на `trust`, чтобы не указывать пароль при 
загрузке каждого файла
    ```bash
    $ sudo nano /etc/postgresql/12/main/pg_hba.conf
    ```
    ```yaml
    # Database administrative login by Unix domain socket
    local   all             postgres                                trust
    ```

- на время загрузки изменил параметры сервера `sudo nano /etc/postgresql/12/main/postgresql.conf` 
    (дописал в конец файла)
    ```yaml
    maintenance_work_mem = 2GB
    max_wal_size = 2GB
    wal_level = minimal
    archive_mode = off
    max_wal_senders = 0
    ```

- перезагрузил кластер
    ```bash
    $ sudo pg_ctlcluster 12 main restart
    ```

- переключил в терминале пользователя на `root`, чтобы отдельно не настраивать доступ к csv-файлам `sudo -i`

- запустил загрузку данных из csv-файлов
    ```bash
    $ cd /mnt/les-12-data
    $ for f in *.csv
      do
        psql -d test_db -U postgres -c "\copy public.service_requests from '"$f"' with delimiter as ',' csv header;"
      done
    ```

- время загрузки на `les-12-pgsql12` и `les-12-pgsql12tsdb` - около 40 минут

- после загрузки убрал временные настройки из файлов конфигурации и перегрузил кластера

- включил тайминг, чтобы видеть время выполнения запросов
    ```bash
    test_db=# \timing
    Timing is on.
    ```

- посчитал все строки в таблице `service_requests;`
    - **les-12-pgsql12**
        ```sql
        test_db=# select count(*) from service_requests;
        -[ RECORD 1 ]---
        count | 23753400
        
        Time: 448990.082 ms (07:28.990)
        ```
    - **les-12-pgsql12tsdb**
        ```sql
        test_db=# select count(*) from service_requests;
        -[ RECORD 1 ]---
        count | 23753400
        
        Time: 322043.314 ms (05:22.043)
        ```

- посмотрел размер БД `test_db`
    - **les-12-pgsql12**
        ```sql
        test_db=# select round(pg_database_size('test_db') / 1024 / 1024, 2) as size_in_mb;
        -[ RECORD 1 ]--------
        size_in_mb | 12475.00
        ```
    - **les-12-pgsql12tsdb**
        ```sql
        postgres=# select round(pg_database_size('test_db') / 1024 / 1024, 2) as size_in_mb;
        -[ RECORD 1 ]--------
        size_in_mb | 13601.00
        ```

⚠️ 🔗 [Оптимизация производительности](https://postgrespro.ru/docs/postgrespro/12/populate "Ctrl+click -> new tab") 

***
<div align="center"><h4>10. Сравнение производительности запросов</h4></div>

***

#### Запрос 1

- **MySQL & PostgreSQL**
    ```sql
    select extract(year from created_date) as year, extract(month from created_date) as month, count(*) as cnt from service_requests group by year, month order by year, month;
    ```

- **BigQuery**
    ```sql
    select extract(year from created_date) as year, extract(month from created_date) as month, count(*) as cnt from `bigquery-public-data.new_york_311.311_service_requests` group by year, month order by year, month;
    ```

#### Результаты

| СУБД | Размер БД | время count(*) | время Запрос 1 |
|---------:|:---------------:|:--------------------:|:---------------------:|
| **MySQL без индекса** | 18472.89 Mb | 11 min 29.09 sec | 11 min 3.17 sec |
| **MySQL с индеском** | 18472.89 Mb | 10 min 39.41 sec | **26.56 sec** |
| **PostgreSQL без индекса** | 12475.00 Mb | 07 min 28.99 sec | 07 min 49.60 sec |
| **PostgreSQL с индексом** | 12984.00 Mb | 07 min 28.95 sec |  07 min 28.88 sec |
| **PostgeSQL + TimescaleDB** | 13601.00 MB | 05 min 22.04 sec | 05 min 03.14 sec |
| **BigQuery** | --- | 0.6 sec | 1.8 sec |

> :memo: Индекс: `create index service_requests_created_date_idx on service_requests (created_date);`
:warning: _PostgeSQL + TimescaleDB не проверял с индексом, так как этот индекс был создан автоматически при определении гипертаблицы_