<div align="right"><h5> Занятие #11 - Домашнее задание - Вариант 2</h5></div>


<div align="center"><h2>Виды и устройство репликации в PostgreSQL. Практика применения</h2></div>

***
<div align="center"><h3>Логическая репликация</h3></div>

***
<div align="center"><h4>1. Подготовка виртуальных машин</h4></div>

***

- в проекте `andrey-radchenko-19731204-04` создал 3 виртуальные машины `les-11-v2-1`, `les-11-v2-2`, `les-11-v2-3` командой _gcloud_  

    <details><summary>команда</summary><pre>
    gcloud compute 
      --project=andrey-radchenko-19731204-04 instances create les-11-v2-1 
      --zone=us-central1-a 
      --machine-type=n1-standard-1 
      --tags=http-server,https-server 
      --image=ubuntu-1804-bionic-v20200821a 
      --image-project=ubuntu-os-cloud 
      --boot-disk-size=10GB 
      --boot-disk-type=pd-ssd 
    </pre></details>

- проверил: `gcloud compute --project=andrey-radchenko-19731204-04 instances list`  

    ```bash
    NAME         ZONE           MACHINE_TYPE   PREEMPTIBLE  INTERNAL_IP  EXTERNAL_IP    STATUS
    les-11-v2-1  us-central1-a  n1-standard-1               10.128.0.16  34.121.114.37  RUNNING
    les-11-v2-2  us-central1-a  n1-standard-1               10.128.0.17  34.72.96.238   RUNNING
    les-11-v2-3  us-central1-a  n1-standard-1               10.128.0.18  34.70.33.172   RUNNING
    ```
- подключился по _ssh_ к созданным ВМ

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
<div align="center"><h4>3. Настройки серверов PostgreSQL</h4></div>

***

- для общения серверов между собой поднастроил файлы конфигурации
    - **/etc/postgresql/11/main/postgresql.conf** 
    ```yaml
    listen_addresses = '*'
    ```
    - **/etc/postgresql/11/main/pg_hba.conf**
    ```yaml
    # IPv4 local connections:
    host    all             all             10.128.0.0/24           trust
    ```

- проверил параметр сервера [wal_level](https://postgrespro.ru/docs/postgrespro/11/runtime-config-wal#RUNTIME-CONFIG-WAL-SETTINGS "Ctrl+click -> new tab")  
    на всех 3-х инстансах установлен в значение _replica_
    ```sql
    postgres=# show wal_level;
    -[ RECORD 1 ]------
    wal_level | replica
    ```
- везде изменил значение _wal_level_ на `logical`
    ```sql
    alter system set wal_level = logical;
    ```
- перегрузил инстансы
    ```bash
    sudo pg_ctlcluster 11 main restart
    ```
- проверил
    ```sql
    postgres=# show wal_level;
    -[ RECORD 1 ]------
    wal_level | logical
    ```
    :+1: параметр _wal_level_ изменен успешно

***
<div align="center"><h4>4. БД и таблицы</h4></div>

***

- **на всех ВМ**
    - создал БД _replica_test_ 
    ```sql
    create database replica_test;
    ```
    - создал по 2 таблицы _test_, _test2_
    ```sql
    create table public.test (i int);
    create table public.test2 (i int);
    ```

***
<div align="center"><h4>5. Публикации</h4></div>

***

- **на 1-ой ВМ**
    - создал публикацию таблицы _test_
    ```sql
    create publication test_pub for table public.test;
    ```
    - проверил `\dRp+`
    ```bash
                          Publication test_pub
      Owner   | All tables | Inserts | Updates | Deletes | Truncates
    ----------+------------+---------+---------+---------+-----------
     postgres | f          | t       | t       | t       | t
    Tables:
        "public.test"
    ```

- **на 2-ой ВМ**
    - создал публикацию таблицы _test2_
    ```sql
    create publication test_pub for table public.test2;
    ```
    - проверил `\dRp+` 
    ```bash
                          Publication test_pub
      Owner   | All tables | Inserts | Updates | Deletes | Truncates 
    ----------+------------+---------+---------+---------+-----------
     postgres | f          | t       | t       | t       | t
    Tables:
        "public.test2"
    ```  

***
<div align="center"><h4>6. Подписки</h4></div>

***

- **на 1-ой ВМ**
    - создал подписку на публикацию _test_pub_ 2-ого сервера 
    ```sql
    create subscription test_sub
    connection 'host=les-11-v2-2 port=5432 user=postgres dbname=replica_test'
    publication test_pub with (copy_data = false);
    ```
    ```bash
    replica_test=# \dRs+
                                                          List of subscriptions
       Name   |  Owner   | Enabled | Publication | Synchronous commit |                           Conninfo                           
    ----------+----------+---------+-------------+--------------------+--------------------------------------------------------------
     test_sub | postgres | t       | {test_pub}  | off                | host=les-11-v2-2 port=5432 user=postgres dbname=replica_test
    (1 row)
    ```

- **на 2-ой ВМ**
    - создал подписку на публикацию _test_pub_ 1-ого сервера 
    ```sql
    create subscription test_sub
    connection 'host=les-11-v2-1 port=5432 user=postgres dbname=replica_test'
    publication test_pub with (copy_data = false);
    ```
    ```bash
    replica_test=# \dRs+
                                                          List of subscriptions
       Name   |  Owner   | Enabled | Publication | Synchronous commit |                           Conninfo                           
    ----------+----------+---------+-------------+--------------------+--------------------------------------------------------------
     test_sub | postgres | t       | {test_pub}  | off                | host=les-11-v2-1 port=5432 user=postgres dbname=replica_test
    (1 row)
    ```  

- **на 3-ей ВМ**
    - создал подписку на публикацию _test_pub_ 1-ого сервера 
    ```sql
    create subscription test_sub1
    connection 'host=les-11-v2-1 port=5432 user=postgres dbname=replica_test'
    publication test_pub with (copy_data = false);
    ```
    - создал подписку на публикацию _test_pub_ 2-ого сервера 
    ```sql
    create subscription test_sub2
    connection 'host=les-11-v2-2 port=5432 user=postgres dbname=replica_test'
    publication test_pub with (copy_data = false);
    ```
    ```bash
    replica_test=# \dRs+
                                                          List of subscriptions
       Name    |  Owner   | Enabled | Publication | Synchronous commit |                           Conninfo                           
    -----------+----------+---------+-------------+--------------------+--------------------------------------------------------------
     test_sub1 | postgres | t       | {test_pub}  | off                | host=les-11-v2-1 port=5432 user=postgres dbname=replica_test
     test_sub2 | postgres | t       | {test_pub}  | off                | host=les-11-v2-2 port=5432 user=postgres dbname=replica_test
    (2 rows)
    ```  

***
<div align="center"><h4>7. Проверка</h4></div>

***

- вставил данные в таблицу _public.test_ на 1-ой ВМ
    ```sql
    insert into public.test (i) values (1), (2), (3), (4), (5), (6), (7), (8), (9), (10);
    ```
- вставил данные в таблицу _public.test2_ на 2-ой ВМ
    ```sql
    insert into public.test2 (i) values (11), (12), (13), (14), (15), (16), (17), (18), (19), (20);
    ```
- проверил
    - **1-й сервер**
    ```sql
    replica_test=# select * from public.test2;
     i  
    ----
     11
     12
     13
     14
     15
     16
     17
     18
     19
     20
    (10 rows)
    ```
    - **2-й сервер**
    ```sql
    replica_test=# select * from public.test;
     i  
    ----
      1
      2
      3
      4
      5
      6
      7
      8
      9
     10
    (10 rows)
    ```
- **3-й сервер**
    ```sql
    replica_test=# select * from public.test;
     i  
    ----
      1
      2
      3
      4
      5
      6
      7
      8
      9
     10
    (10 rows)
    ```
    ```sql
    replica_test=# select * from public.test2;
     i  
    ----
     11
     12
     13
     14
     15
     16
     17
     18
     19
     20
    (10 rows)
    ```

:+1: **Итог:** _логическая репликация настроена и работает нормально_