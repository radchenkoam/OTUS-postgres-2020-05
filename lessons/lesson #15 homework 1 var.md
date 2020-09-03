<div align="right"><h5> Занятие #15 - Домашнее задание - Вариант 1</h5></div>

<div align="center"><h2>Работа с индексами</h2></div>

***
<div align="center"><h4>1. Подготовка виртуальной машины</h4></div>

***

- в проекте `andrey-radchenko-19731204-04` создал виртуальную машину _GCP_ командами _gcloud_  

    <pre><details><summary>les-15-v1...</summary>
    gcloud beta compute \
      --project=andrey-radchenko-19731204-04 instances create les-15-v1 \
      --zone=us-central1-a \
      --machine-type=e2-standard-2 \
      --subnet=default \
      --network-tier=PREMIUM \
      --maintenance-policy=MIGRATE \
      --service-account=1027982933386-compute@developer.gserviceaccount.com \
      --scopes=https://www.googleapis.com/auth/cloud-platform \
      --image=ubuntu-1804-bionic-v20200821a \
      --image-project=ubuntu-os-cloud \
      --boot-disk-size=50GB \
      --boot-disk-type=pd-ssd \
      --boot-disk-device-name=les-15-v1 \
      --no-shielded-secure-boot \
      --shielded-vtpm \
      --shielded-integrity-monitoring \
      --reservation-affinity=any
    </details></pre>

- подключился по _ssh_ к созданной ВМ

***
<div align="center"><h4>2. Установка и настройка PostgreSQL 12</h4></div>

***

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
- для настройки воспользовался сайтом [PGTune](https://pgtune.leopard.in.ua/#/ "Ctrl+click -> new tab")  

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

👍 Сервер PostgreSQL установлен и функционирует нормально

***
<div align="center"><h4>3. Подготовка файлов для загрузки</h4></div>

***

- создал сегмент `les-data` 10GB в [Google Cloud Storage](https://console.cloud.google.com/storage/browser?project=andrey-radchenko-19731204-04 "Ctrl+click -> new tab") с указанием местоположения - `eu`, :warning: так как данные в BigQuery, которые я планирую загрузить лежат на европейских серверах :warning: 

- создал на нем папку `london_bicycles`

- экспортировал в эту папку набор данных из BigQuery `bigquery-public-data:london_bicycles` в csv-файлы, указал название файлов `hire_*.csv`, `stations_*.csv` соответственно 

- проверил результат `gsutil ls -l gs://les-data` - получилось 7 файлов общим объемом 3,12GB

- установил на ВМ [Cloud Storage FUSE](https://cloud.google.com/storage/docs/gcs-fuse "Ctrl+click -> new tab") (описание установки -> [здесь]( "Crtl+click -> new tab"))

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
    $ sudo mkdir /mnt/les-data
    ```

- смонтировал сегмент _GCS_ в созданный каталог
    ```bash
    $ sudo gcsfuse les-data /mnt/les-data
    Using mount point: /mnt/les-data
    Opening GCS connection...
    Opening bucket...
    Mounting file system...
    File system has been successfully mounted.
    ```

- проверил
    ```bash
    $ sudo ls /mnt/les-data/london_bicycles -l
    total 3272678
    -rw-r--r-- 1 root root 440858889 Sep  2 08:49 hire_000000000000.csv
    -rw-r--r-- 1 root root 705406855 Sep  2 08:49 hire_000000000001.csv
    -rw-r--r-- 1 root root 705867863 Sep  2 08:49 hire_000000000002.csv
    -rw-r--r-- 1 root root 705959401 Sep  2 08:49 hire_000000000003.csv
    -rw-r--r-- 1 root root 793050948 Sep  2 08:49 hire_000000000004.csv
    -rw-r--r-- 1 root root     77296 Sep  2 08:51 stations_000000000000.csv
    ```

***
<div align="center"><h4>4. Создание БД и загрузка данных</h4></div>

***

- в _PostgreSQL_ создал базу данных `create database lb;`

- создал таблицы 
    <pre><details><summary>public.hire...</summary>
    create table if not exists public.hire ( 
      rental_id int primary key, 
      duration int null, 
      bike_id int null, 
      end_date timestamptz null, 
      end_station_id int null, 
      end_station_name text null, 
      start_date timestamptz null, 
      start_station_id int null, 
      start_station_name text null, 
      end_station_logical_terminal int null, 
      start_station_logical_terminal int null, 
      end_station_priority_id int null
    );</details></pre>

    <pre><details><summary>public.stations...</summary>
    create table if not exists public.stations ( 
      id int primary key, 
      installed bool null, 
      latitude float null, 
      locked text null, 
      longitude float null, 
      name text null, 
      bikes_count int null, 
      docks_count int null, 
      nbEmptyDocks int null, 
      temporary bool null, 
      terminal_name text null, 
      install_date date null, 
      removal_date date null
    );</details></pre>

- на время загрузки поставил пользователю _postgres_ аутентификацию `trust` в `pg_hba.conf`
- от имени `root` загрузил csv-файлы
    ```bash
    root@les-15-v1:~# psql -d lb -U postgres -c "\copy public.hire from '/mnt/les-data/london_bicycles/hire_000000000000.csv'  with delimiter as ',' csv header;"
    root@les-15-v1:~# psql -d lb -U postgres -c "\copy public.hire from '/mnt/les-data/london_bicycles/hire_000000000001.csv'  with delimiter as ',' csv header;"
    root@les-15-v1:~# psql -d lb -U postgres -c "\copy public.hire from '/mnt/les-data/london_bicycles/hire_000000000002.csv'  with delimiter as ',' csv header;"
    root@les-15-v1:~# psql -d lb -U postgres -c "\copy public.hire from '/mnt/les-data/london_bicycles/hire_000000000003.csv'  with delimiter as ',' csv header;"
    root@les-15-v1:~# psql -d lb -U postgres -c "\copy public.hire from '/mnt/les-data/london_bicycles/hire_000000000004.csv'  with delimiter as ',' csv header;"
    root@les-15-v1:~# psql -d lb -U postgres -c "\copy public.stations from '/mnt/les-data/london_bicycles/stations_000000000000.csv' with delimiter as ',' csv header;"
    ```
- проверил
    ```sql
     lb=# select count(*) from public.hire;
    -[ RECORD 1 ]---
    count | 24369201

    Time: 16356.114 ms (00:16.356) 
    ```
    ```sql
    lb=# select count(*) from public.stations;
    -[ RECORD 1 ]
    count | 777
    
    Time: 0.902 ms
    ```
    > :+1: _количество загруженных строк в таблицах совпадает с количеством строк в BigQuery_

- вернул аутентификацию `peer` пользователю _postgres_ в `pg_hba.conf`

***
<div align="center"><h4>5. Работа с индексами</h4></div>

***
:link: [Postgres EXPLAIN Visualizer (Pev)](https://tatiyants.com/pev/#/ "Ctrl+click -> new tab")
:link: [explain.depesz.com](https://explain.depesz.com/ "Ctrl+click -> new tab")

#### Простой индекс

- есть запрос, который возвращает записи о прокате велосипедов за определенное время
    ```sql
    select rental_id, start_date, start_station_name, end_date, end_station_name 
    from public.hire 
    where start_date = '2017-06-13 12:02:00+00'::timestamptz;
    ```

- возвращает 30 строк

    <pre><details><summary>вывод</summary>
     rental_id |       start_date       |            start_station_name             |        end_date        |              end_station_name               
    -----------+------------------------+-------------------------------------------+------------------------+---------------------------------------------
      66037325 | 2017-06-13 12:02:00+00 | Brunswick Square, Bloomsbury              | 2017-06-13 12:07:00+00 | Margery Street, Clerkenwell
      66037334 | 2017-06-13 12:02:00+00 | Elizabeth Bridge, Victoria                | 2017-06-13 12:23:00+00 | Coomer Place, West Kensington
      66037341 | 2017-06-13 12:02:00+00 | Northumberland Avenue, Strand             | 2017-06-13 12:31:00+00 | Wellington Arch, Hyde Park
      66037328 | 2017-06-13 12:02:00+00 | Northumberland Avenue, Strand             | 2017-06-13 13:01:00+00 | Albert Gate, Hyde Park
      66037338 | 2017-06-13 12:02:00+00 | Northumberland Avenue, Strand             | 2017-06-13 13:01:00+00 | Albert Gate, Hyde Park
      66037313 | 2017-06-13 12:02:00+00 | Woodstock Grove, Shepherd's Bush          | 2017-06-13 12:12:00+00 | Argyll Road, Kensington
      66037330 | 2017-06-13 12:02:00+00 | Parsons Green Station, Parsons Green      | 2017-06-13 12:04:00+00 | Chesilton Road, Fulham
      66037327 | 2017-06-13 12:02:00+00 | Frith Street, Soho                        | 2017-06-13 12:16:00+00 | Hop Exchange, The Borough
      66037321 | 2017-06-13 12:02:00+00 | Frith Street, Soho                        | 2017-06-13 12:16:00+00 | Hop Exchange, The Borough
      66037329 | 2017-06-13 12:02:00+00 | Grosvenor Square, Mayfair                 | 2017-06-13 12:20:00+00 | Gloucester Road (Central), South Kensington
      66037320 | 2017-06-13 12:02:00+00 | Norton Folgate, Liverpool Street          | 2017-06-13 12:21:00+00 | High Holborn , Covent Garden
      66037326 | 2017-06-13 12:02:00+00 | West Smithfield Rotunda, Farringdon       | 2017-06-13 12:15:00+00 | Old Street Station, St. Luke's
      66037316 | 2017-06-13 12:02:00+00 | Prince of Wales Drive, Battersea Park     | 2017-06-13 13:09:00+00 | Wellington Street , Strand
      66037323 | 2017-06-13 12:02:00+00 | Little Argyll Street, West End            | 2017-06-13 12:27:00+00 | Wenlock Road , Hoxton
      66037333 | 2017-06-13 12:02:00+00 | Duke Street Hill, London Bridge           | 2017-06-13 12:19:00+00 | Breams Buildings, Holborn
      66037340 | 2017-06-13 12:02:00+00 | British Museum, Bloomsbury                | 2017-06-13 12:26:00+00 | Westminster University, Marylebone
      66037337 | 2017-06-13 12:02:00+00 | Blythe Road West, Shepherd's Bush         | 2017-06-13 12:05:00+00 | Woodstock Grove, Shepherd's Bush
      66037309 | 2017-06-13 12:02:00+00 | Houghton Street, Strand                   | 2017-06-13 12:13:00+00 | Rathbone Street, Fitzrovia
      66037311 | 2017-06-13 12:02:00+00 | Abyssinia Close, Clapham Junction         | 2017-06-13 12:30:00+00 | Cadogan Place, Knightsbridge
      66037317 | 2017-06-13 12:02:00+00 | Northumberland Avenue, Strand             | 2017-06-13 12:30:00+00 | Wellington Arch, Hyde Park
      66037314 | 2017-06-13 12:02:00+00 | Blackfriars Road, Southwark               | 2017-06-13 12:09:00+00 | Swan Street, The Borough
      66037319 | 2017-06-13 12:02:00+00 | Wellington Arch, Hyde Park                | 2017-06-13 14:14:00+00 | Hyde Park Corner, Hyde Park
      66037331 | 2017-06-13 12:02:00+00 | Ontario Street, Elephant & Castle         | 2017-06-13 12:20:00+00 | Holborn Circus, Holborn
      66037324 | 2017-06-13 12:02:00+00 | Godliman Street, St. Paul's               | 2017-06-13 12:16:00+00 | Waterloo Place, St. James's
      66037342 | 2017-06-13 12:02:00+00 | Gloucester Street, Pimlico                | 2017-06-13 12:10:00+00 | Kennington Lane Rail Bridge, Vauxhall
      66037322 | 2017-06-13 12:02:00+00 | Hyde Park Corner, Hyde Park               | 2017-06-13 12:23:00+00 | Irene Road, Parsons Green
      66037318 | 2017-06-13 12:02:00+00 | Gloucester Road Station, South Kensington | 2017-06-13 12:20:00+00 | Hyde Park Corner, Hyde Park
      66037339 | 2017-06-13 12:02:00+00 | Frith Street, Soho                        | 2017-06-13 12:18:00+00 | Hop Exchange, The Borough
      66037332 | 2017-06-13 12:02:00+00 | Gloucester Road Station, South Kensington | 2017-06-13 12:20:00+00 | Hyde Park Corner, Hyde Park
      66037336 | 2017-06-13 12:02:00+00 | Palace Gardens Terrace, Notting Hill      | 2017-06-13 13:11:00+00 | Black Lion Gate, Kensington Gardens
    (30 rows)
    </details></pre>

    <pre><details><summary>действительный план выполнения без индекса</summary>
                                                            QUERY PLAN                                                        
    --------------------------------------------------------------------------------------------------------------------------
     Gather  (cost=1000.00..598964.29 rows=40 width=76) (actual time=2425.161..2470.056 rows=0 loops=1)
       Workers Planned: 1
       Workers Launched: 1
       ->  Parallel Seq Scan on hire  (cost=0.00..597960.29 rows=24 width=76) (actual time=2410.966..2410.967 rows=0 loops=2)
             Filter: (start_date = '2017-06-14 12:02:00+00'::timestamp with time zone)
             Rows Removed by Filter: 12184600
     Planning Time: 0.074 ms
     JIT:
       Functions: 8
       Options: Inlining true, Optimization true, Expressions true, Deforming true
       Timing: Generation 1.975 ms, Inlining 81.432 ms, Optimization 129.223 ms, Emission 76.969 ms, Total 289.599 ms
     Execution Time: 2470.929 ms
    (12 rows)

    Time: 2471.452 ms (00:02.471)
    </details></pre>

    > _время выполнения 2,471 сек_

> :warning: видно (Parallel Seq Scan on hire...), что оптимизатор не использует индексы, а последовательно сканирует таблицу

- создал индекс
    ```sql
    create index hire_start_date_idx on public.hire (start_date);
    ```

    <pre><details><summary>действительный план выполнения с индексом</summary>
                                                              QUERY PLAN                                                          
    ------------------------------------------------------------------------------------------------------------------------------
     Index Scan using hire_start_date_idx on hire  (cost=0.56..46.36 rows=40 width=76) (actual time=0.144..0.463 rows=30 loops=1)
       Index Cond: (start_date = '2017-06-13 12:02:00+00'::timestamp with time zone)
     Planning Time: 0.627 ms
     Execution Time: 0.487 ms
    (4 rows)
    
    Time: 2.080 ms
    </details></pre>

    > _время выполнения около 2 миллисекунд_

> :warning: оптимизатор использует _Index Scan_ по индексу _hire_start_date_idx_ 

:+1: _производительность запроса выросла, вместо 2,5 секунд он теперь выполняется за миллисекунды_

#### Индекс для полнотекстового поиска

- запрос без индекса
    ```sql
    select 
      rental_id, start_date, start_station_name,
      end_date, end_station_name
    from public.hire 
    where to_tsvector(start_station_name) @@ to_tsquery('Northumberland');
    ```

- возвращает 46700 строк

    <pre><details><summary>действительный план выполнения без индекса</summary>
                                                                QUERY PLAN                                                             
    -----------------------------------------------------------------------------------------------------------------------------------
     Gather  (cost=1000.00..7778556.66 rows=121846 width=76) (actual time=135.686..169702.232 rows=46700 loops=1)
       Workers Planned: 1
       Workers Launched: 1
       ->  Parallel Seq Scan on hire  (cost=0.00..7765372.06 rows=71674 width=76) (actual time=175.646..169594.623 rows=23350 loops=2)
             Filter: (to_tsvector(start_station_name) @@ to_tsquery('Northumberland'::text))
             Rows Removed by Filter: 12161250
     Planning Time: 0.158 ms
     JIT:
       Functions: 8
       Options: Inlining true, Optimization true, Expressions true, Deforming true
       Timing: Generation 2.248 ms, Inlining 94.341 ms, Optimization 154.276 ms, Emission 89.255 ms, Total 340.121 ms
     Execution Time: 169716.135 ms
    (12 rows)

    Time: 169716.900 ms (02:49.717)
    </details></pre>

    > _время выполнения 2 мин 50 сек_

> :warning: видно (Parallel Seq Scan on hire...), что оптимизатор не использует индексы, а последовательно сканирует таблицу

- создал индекс
    ```sql
    create index hire_ft_idx on public.hire using gin (to_tsvector('english', start_station_name));
    ```

- для использования полнотекстового поиска немного изменил запрос

    ```sql
    select 
      rental_id, start_date, start_station_name,
      end_date, end_station_name
    from public.hire 
    where to_tsvector('english', start_station_name) @@ to_tsquery('Northumberland');
    ```
    <pre><details><summary>действительный план выполнения с индексом</summary>
                                                                   QUERY PLAN                                                               
    ----------------------------------------------------------------------------------------------------------------------------------------
     Gather  (cost=1995.16..162560.88 rows=121846 width=76) (actual time=38.549..143.799 rows=46700 loops=1)
       Workers Planned: 1
       Workers Launched: 1
       ->  Parallel Bitmap Heap Scan on hire  (cost=995.16..149376.28 rows=71674 width=76) (actual time=30.032..101.457 rows=23350 loops=2)
             Recheck Cond: (to_tsvector('english'::regconfig, start_station_name) @@ to_tsquery('Northumberland'::text))
             Heap Blocks: exact=25827
             ->  Bitmap Index Scan on hire_ft_idx  (cost=0.00..964.69 rows=121846 width=0) (actual time=28.250..28.251 rows=46700 loops=1)
                   Index Cond: (to_tsvector('english'::regconfig, start_station_name) @@ to_tsquery('Northumberland'::text))
     Planning Time: 0.118 ms
     JIT:
       Functions: 10
       Options: Inlining false, Optimization false, Expressions true, Deforming true
       Timing: Generation 1.984 ms, Inlining 0.000 ms, Optimization 1.341 ms, Emission 17.829 ms, Total 21.154 ms
     Execution Time: 148.159 ms
    (14 rows)
    
    Time: 148.867 ms
    </details></pre>

    > _время выполнения около 149 миллисекунд_

> :warning: оптимизатор использует _Bitmap Index Scan_ по индексу _hire_ft_idx_ 

:+1: _производительность запроса выросла, вместо почти 3-х минут он теперь выполняется за миллисекунды_

- :exclamation: можно получить еще лучшие результаты, если создать отдельный столбец типа _tsvector_, в котором сохранить результат to_tsvector

#### Индекс на столбец с функцией для полнотекстового поиска  

- удалил созданный ранее индекс
    ```
    drop index hire_ft_idx;
    ```

- создал [сгенерированный столбец](https://postgrespro.ru/docs/postgrespro/12/ddl-generated-columns "Ctrl+click -> new tab") типа [tsvector](https://postgrespro.ru/docs/postgresql/9.6/datatype-textsearch#datatype-tsvector "Ctrl+click -> new tab") использующий функцию [to_tsvector](https://postgrespro.ru/docs/postgrespro/12/functions-textsearch "Ctrl+click -> new tab")
    ```sql
    alter table public.hire
      add column textsearchable_start_station_name tsvector
        generated always as (to_tsvector('english', coalesce(start_station_name, ''))) stored;
    ```
- снова создал индекс для полнотекстового поиска, использовав новый столбец
    ```sql
    create index hire_ft_idx on public.hire using gin (textsearchable_start_station_name);
    ```

- изменил запрос для использования созданного индекса
    ```sql
    select 
      rental_id, start_date, start_station_name,
      end_date, end_station_name
    from public.hire 
    where textsearchable_start_station_name @@ to_tsquery('Northumberland');
    ```

    <pre><details><summary>действительный план выполнения с индексом по столбцу</summary>
                                                              QUERY PLAN                                                            
    ---------------------------------------------------------------------------------------------------------------------------------
    Bitmap Heap Scan on hire  (cost=995.16..149648.26 rows=121846 width=76) (actual time=23.291..84.504 rows=46700 loops=1)
    Recheck Cond: (textsearchable_start_station_name @@ to_tsquery('Northumberland'::text))
    Heap Blocks: exact=44840
    ->  Bitmap Index Scan on hire_ft_idx  (cost=0.00..964.69 rows=121846 width=0) (actual time=14.820..14.821 rows=46700 loops=1)
            Index Cond: (textsearchable_start_station_name @@ to_tsquery('Northumberland'::text))
    Planning Time: 0.106 ms
    JIT:
      Functions: 5
      Options: Inlining false, Optimization false, Expressions true, Deforming true
      Timing: Generation 0.813 ms, Inlining 0.000 ms, Optimization 0.376 ms, Emission 5.576 ms, Total 6.765 ms
    Execution Time: 87.745 ms
   (11 rows)
       
   Time: 88.293 ms
   </details></pre>

    > _время выполнения около 88 миллисекунд_

:+1:  :warning: _за счет использования индекса для полнотекстового поиска на столбец скорость выполнения запроса улучшилась еще, но увеличился и размер таблицы `public.hire` с **3273 MB** до **4595 MB** (**+1322 MB**), индекс `hire_ft_idx` от использования столбца вместо выражения вырос немного ->  +8 MB_

#### Индекс на несколько полей ([составной индекс](https://postgrespro.ru/docs/postgrespro/12/indexes-multicolumn "Ctrl+click"))

- запрос без индекса
    ```sql
    select 
      rental_id, start_date, start_station_name,
      end_date, end_station_name
    from public.hire 
    where start_station_name = 'York Hall, Bethnal Green' and end_station_name = 'Wardour Street, Soho';    
    ```

    <pre><details><summary>действительный план выполнения без индекса</summary>
                                                               QUERY PLAN                                                            
    ---------------------------------------------------------------------------------------------------------------------------------
     Gather  (cost=1000.00..804236.55 rows=52 width=76) (actual time=132.670..3405.512 rows=7 loops=1)
       Workers Planned: 1
       Workers Launched: 1
       ->  Parallel Seq Scan on hire  (cost=0.00..803231.35 rows=31 width=76) (actual time=1125.211..3372.177 rows=4 loops=2)
             Filter: ((start_station_name = 'York Hall, Bethnal Green'::text) AND (end_station_name = 'Wardour Street, Soho'::text))
             Rows Removed by Filter: 12184597
     Planning Time: 0.103 ms
     JIT:
       Functions: 8
       Options: Inlining true, Optimization true, Expressions true, Deforming true
       Timing: Generation 2.233 ms, Inlining 107.806 ms, Optimization 143.371 ms, Emission 88.175 ms, Total 341.586 ms
     Execution Time: 3406.356 ms
    (12 rows)
    
    Time: 3406.913 ms (00:03.407)
   </details></pre>

    > _время выполнения 3.41 секунды_

- создал составной индекс
    ```sql
    create index hire_stations_idx on public.hire (start_station_name, end_station_name);
    ```
    <pre><details><summary>действительный план выполнения с индексом</summary>
                                                              QUERY PLAN                                                           
    -------------------------------------------------------------------------------------------------------------------------------
     Index Scan using hire_stations_idx on hire  (cost=0.56..59.90 rows=52 width=76) (actual time=0.033..0.046 rows=7 loops=1)
       Index Cond: ((start_station_name = 'York Hall, Bethnal Green'::text) AND (end_station_name = 'Wardour Street, Soho'::text))
     Planning Time: 0.130 ms
     Execution Time: 0.064 ms
    (4 rows)

    Time: 0.548 ms
    </details></pre>

    > _время выполнения около 0.5 миллисекунды_

> :warning: оптимизатор использует _Index Scan_ по индексу _hire_stations_idx_ 

:+1: _производительность запроса выросла, вместо 3.4 секунд он теперь выполняется за половину миллисекунды_

**Итог**: _правильно созданные и используемые индексы могут существенно увеличить производительность базы данных и приложений, работающих с ними_

