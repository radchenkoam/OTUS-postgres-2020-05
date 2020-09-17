<div align="right"><h5> Занятие #20 - Домашнее задание - Вариант 2</h5></div>

<div align="center"><h2>Работа с кластером высокой доступности =></br>=> pg_auto_failover от Citusdata</h2></div>

***
:memo: [**pg_auto_failover**](https://github.com/citusdata/pg_auto_failover "Ctrl+click -> new tab") это расширение PostgreSQL для автоматизированного аварийного переключения (_failover_) и высокой доступности (_high availability -> ha_)

:link: [**Citusdata**](https://www.citusdata.com/ "Ctrl+click -> new tab") 
:link: [**Lukas Fittl. Introducing pg_auto_failover**](https://cloudblogs.microsoft.com/opensource/2019/05/06/introducing-pg_auto_failover-postgresql-open-source-extension-automated-failover-high-availability/ "Ctrl+click -> new tab")
***

***
<div align="center"><h4>1. Подготовка</h4></div>

***
- создал виртуальную машину GCE
    <pre><details><summary>командой gcloud</summary>
    gcloud beta compute \
      --project=andrey-radchenko-19731204-04 instances create les-20-2 \
      --zone=us-central1-c \
      --machine-type=e2-standard-2 \
      --image=ubuntu-1804-bionic-v20200908 \
      --image-project=ubuntu-os-cloud \
      --boot-disk-type=pd-ssd 
    </details></pre>

- подключился по _ssh_

***
<div align="center"><h4>2. Установка pg_auto_failover PostgreSQL 12</h4></div>

***
- добавил репозиторий
    ```bash
    $ curl https://install.citusdata.com/community/deb.sh | sudo bash
    ```

    - установил pg_auto_failover
    ```bash
    $ sudo apt-get -y install postgresql-11-auto-failover-1.3
    ```

- проверил установку 
    ```bash
    $ pg_autoctl --version
    
    pg_autoctl version 1.3
    compiled with PostgreSQL 12.2 (Ubuntu 12.2-2.pgdg18.04+1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 7.4.0-1ubuntu1~18.04.1) 7.4.0, 64-bit
    compatible with Postgres 10, 11, and 12
    ```

***
<div align="center"><h4>3. Монитор</h4></div>

***
- установил и запустил монитор командой [`pg_autoctl`](https://pg-auto-failover.readthedocs.io/en/latest/ref/reference.html "Ctrl+click -> new tab")
    ```bash
    $ sudo su postgres
    $ cd ~
    $ pg_config --bindir
    $ pg_autoctl create monitor \
      --pgctl /usr/lib/postgresql/12/bin/pg_ctl \
      --pgdata ./monitor \
      --pgport 6000 \
      --nodename localhost \
      --auth trust \
      --ssl-self-signed 
    ```
    <pre><details><summary>вывод терминала</summary>
    07:34:05 INFO  Using default --ssl-mode "require"
    07:34:05 INFO  Using --ssl-self-signed: pg_autoctl will  create self-signed certificates, allowing for encrypted network traffic
    07:34:05 WARN  Self-signed certificates provide protection against eavesdropping; this setup does NOT protect against Man-In-The-Middle attacks nor Impersonation attacks.
    07:34:05 WARN  See https://www.postgresql.org/docs/current/libpq-ssl.html for details
    07:34:05 INFO  Initialising a PostgreSQL cluster at "./monitor"
    07:34:05 INFO   /usr/bin/openssl req -new -x509 -days 365 -nodes -text -out /var/lib/postgresql/monitor/server.crt -keyout /var/lib/postgresql/monitor/server.key -subj "/CN=localhost"
    07:34:06 INFO   /usr/lib/postgresql/12/bin/pg_ctl --pgdata /var/lib/postgresql/monitor --options "-p 6000" --options "-h *" --wait start
    07:34:06 INFO  Granting connection privileges on 127.0.0.0/8
    07:34:06 INFO  Your pg_auto_failover monitor instance is now ready on port 6000.
    07:34:06 INFO  Monitor has been succesfully initialized.
    07:34:06 INFO  pg_auto_failover monitor is ready at postgres://autoctl_node@localhost:6000/pg_auto_failover?sslmode=require
    </details></pre>

    > :bulb: `pg_config --bindir` покажет, где лежит `pg_ctl`

- строка подключения для узла монитора
    ```bash
    $ pg_autoctl show uri --monitor --pgdata ./monitor

    postgres://autoctl_node@localhost:6000/pg_auto_failover?sslmode=require
    ```

- монитор создан - :+1: установил его как службу с помощью `systemd`, чтобы он возобновил работу после перезапуска виртуальной машины
    - создал конфиг pgautofailover под пользователем _postgres_
        ```bash
        $ sudo su postgres
        $ cd ~
        $ pg_autoctl -q show systemd --pgdata ~postgres/monitor > pgautofailover.service
        ```
    - под root-учеткой
        ```bash
        $ sudo mv ~postgres/pgautofailover.service /etc/systemd/system
        $ sudo systemctl daemon-reload
        $ sudo systemctl enable pgautofailover
        $ sudo systemctl start pgautofailover
        ```

***
<div align="center"><h4>4. Ноды</h4></div>

***

- установил первую ноду
    ```bash
    $ export PGDATA=~postgres/ha-demo-1
    $ pg_autoctl create postgres \
      --pgctl /usr/lib/postgresql/12/bin/pg_ctl \
      --pgdata ~postgres/ha-demo-1 \
      --pghost localhost \
      --pgport 6001 \
      --username postgres \
      --dbname ha-demo \
      --nodename localhost \
      --monitor 'postgres://autoctl_node@localhost:6000/pg_auto_failover?sslmode=require' \
      --auth trust \
      --ssl-self-signed 
    ```
    > `--nodename localhost` так как устанавливается всё на одну вм

    <pre><details><summary>вывод терминала</summary>
    07:45:47 INFO  Using default --ssl-mode "require"
    07:45:47 INFO  Using --ssl-self-signed: pg_autoctl will  create self-signed certificates, allowing for encrypted network traffic
    07:45:47 WARN  Self-signed certificates provide protection against eavesdropping; this setup does NOT protect against Man-In-The-Middle attacks nor Impersonation attacks.
    07:45:47 WARN  See https://www.postgresql.org/docs/current/libpq-ssl.html for details
    07:45:47 INFO  Registered node localhost:6001 with id 1 in formation "default", group 0, state "single"
    07:45:47 INFO  Writing keeper state file at "/var/lib/postgresql/.local/share/pg_autoctl/var/lib/postgresql/ha-demo-1/pg_autoctl.state"
    07:45:47 INFO  Writing keeper init state file at     "/var/lib/postgresql/.local/share/pg_autoctl/var/lib/postgresql/ha-demo-1/pg_autoctl.init"
    07:45:47 INFO  Successfully registered as "single" to the monitor.
    07:45:47 INFO  FSM transition from "init" to "single": Start as a single node
    07:45:47 INFO  Initialising postgres as a primary
    07:45:47 INFO  Initialising a PostgreSQL cluster at "/var/lib/postgresql/ha-demo-1"
    07:45:47 INFO   /usr/bin/openssl req -new -x509 -days 365 -nodes -text -out     /var/lib/postgresql/ha-demo-1/server.crt -keyout /var/lib/postgresql/ha-demo-1/server.key -subj "/CN=localhost"
    07:45:48 INFO  Postgres is not running, starting postgres
    07:45:48 INFO   /usr/lib/postgresql/12/bin/pg_ctl --pgdata /var/lib/postgresql/ha-demo-1 --options "-p 6001" --options "-h *" --wait start
    07:45:48 INFO  The user "postgres" already exists, skipping.
    07:45:48 INFO  CREATE DATABASE ha-demo;
    07:45:48 INFO   /usr/bin/openssl req -new -x509 -days 365 -nodes -text -out /var/lib/postgresql/ha-demo-1/server.crt -keyout /var/lib/postgresql/ha-demo-1/server.key -subj "/CN=localhost"
    07:45:48 WARN  Contents of "/var/lib/postgresql/ha-demo-1/postgresql-auto-failover.conf" have changed, overwriting
    07:45:48 INFO  Transition complete: current state is now "single"
    07:45:48 INFO  Keeper has been succesfully initialized.
    </details></pre>

- проверил - :+1: 
    ```bash
    $ export PGDATA=~postgres/monitor && pg_autoctl show state
         Name |   Port | Group |  Node |     Current State |    Assigned State
    ----------+--------+-------+-------+-------------------+------------------
    localhost |   6001 |     0 |     1 |            single |            single
    ```

- ноду `ha-demo-2` установил аналогично
    ```bash
    $ export PGDATA=~postgres/ha-demo-2
    $ pg_autoctl create postgres \
      --pgctl /usr/lib/postgresql/12/bin/pg_ctl \
      --pgdata ~postgres/ha-demo-2 \
      --pghost localhost \
      --pgport 6002 \
      --username postgres \
      --dbname ha-demo \
      --nodename localhost \
      --monitor 'postgres://autoctl_node@localhost:6000/pg_auto_failover?sslmode=require' \
      --auth trust \
      --ssl-self-signed 
    ```
    :bulb: _я запустил как службу только монитор, поэтому в другом окне терминала запустил службу первой ноды вручную_
    ```
    $ export PGDATA=~postgres/ha-demo-1
    $ pg_autoctl run
    ```
    _и команда на создание `ha-demo-2` отработала_ - :+1: 

    <pre><details><summary>вывод терминала</summary>
    07:50:21 INFO  Using default --ssl-mode "require"
    07:50:21 INFO  Using --ssl-self-signed: pg_autoctl will  create self-signed certificates, allowing for encrypted network traffic
    07:50:21 WARN  Self-signed certificates provide protection against eavesdropping; this setup does NOT protect against Man-In-The-Middle attacks nor Impersonation attacks.
    07:50:21 WARN  See https://www.postgresql.org/docs/current/libpq-ssl.html for details
    07:50:21 INFO  Registered node localhost:6002 with id 2 in formation "default", group 0, state "wait_standby"
    07:50:21 INFO  Writing keeper state file at "/var/lib/postgresql/.local/share/pg_autoctl/var/lib/postgresql/ha-demo-2/pg_autoctl.state"
    07:50:21 INFO  Writing keeper init state file at "/var/lib/postgresql/.local/share/pg_autoctl/var/lib/postgresql/ha-demo-2/pg_autoctl.init"
    07:50:21 INFO  Successfully registered as "wait_standby" to the monitor.
    07:50:21 INFO  FSM transition from "init" to "wait_standby": Start following a primary
    07:50:21 INFO  Transition complete: current state is now "wait_standby"
    07:50:23 INFO  Still waiting for the monitor to drive us to state "catchingup"
    07:50:23 WARN  Please make sure that the primary node is currently running `pg_autoctl run` and contacting the monitor.
    07:52:40 INFO  FSM transition from "wait_standby" to "catchingup": The primary is now ready to accept a standby
    07:52:40 INFO  Initialising PostgreSQL as a hot standby
    07:52:40 INFO   /usr/lib/postgresql/12/bin/pg_basebackup -w -d 'application_name=pgautofailover_standby_2 host=localhost port=6001 user=pgautofailover_replicator sslmode=require' --pgdata /var/lib/postgresql/backup/localhost -U pgautofailover_replicator --max-rate 100M --wal-method=stream --slot pgautofailover_standby_2
    07:52:41 INFO  pg_basebackup: initiating base backup, waiting for checkpoint to complete
    07:52:41 INFO  pg_basebackup: checkpoint completed
    07:52:41 INFO  pg_basebackup: write-ahead log start point: 0/2000028 on timeline 1
    07:52:41 INFO  pg_basebackup: starting background WAL receiver
    07:52:41 INFO      0/32492 kB (0%), 0/1 tablespace (...ql/backup/localhost/backup_label)
    07:52:41 INFO  26144/32492 kB (80%), 0/1 tablespace (...backup/localhost/base/16384/2675)
    07:52:41 INFO  32501/32501 kB (100%), 0/1 tablespace (...ckup/localhost/global/pg_control)
    07:52:41 INFO  32501/32501 kB (100%), 1/1 tablespace                                         
    07:52:41 INFO  pg_basebackup: write-ahead log end point: 0/2000100
    07:52:41 INFO  pg_basebackup: waiting for background process to finish streaming ...
    07:52:41 INFO  pg_basebackup: syncing data to disk ...
    07:52:41 INFO  pg_basebackup: base backup completed
    07:52:41 INFO  Creating the standby signal file at "/var/lib/postgresql/ha-demo-2/standby.signal", and replication setup at "/var/lib/postgresql/ha-demo-2/postgresql-auto-failover-standby.conf"
    07:52:41 INFO   /usr/bin/openssl req -new -x509 -days 365 -nodes -text -out /var/lib/postgresql/ha-demo-2/server.crt -keyout /var/lib/postgresql/ha-demo-2/server.key -subj "/CN=localhost"
    07:52:41 WARN  Contents of "/var/lib/postgresql/ha-demo-2/postgresql-auto-failover.conf" have changed, overwriting
    07:52:41 INFO  Postgres is not running, starting postgres
    07:52:41 INFO   /usr/lib/postgresql/12/bin/pg_ctl --pgdata /var/lib/postgresql/ha-demo-2 --options "-p 6002" --options "-h *" --wait start
    07:52:41 INFO  PostgreSQL started on port 6002
    07:52:41 INFO  Transition complete: current state is now "catchingup"
    07:52:41 INFO  Keeper has been succesfully initialized.
    </details></pre>

- проверил - :+1: 
    ```bash
    $ export PGDATA=~postgres/monitor && pg_autoctl show state
         Name |   Port | Group |  Node |     Current State |    Assigned State
    ----------+--------+-------+-------+-------------------+------------------
    localhost |   6001 |     0 |     1 |      wait_primary |      wait_primary
    localhost |   6002 |     0 |     2 |        catchingup |        catchingup
    ```
    :link: [Wait_primary](https://pg-auto-failover.readthedocs.io/en/latest/failover-state-machine.html?#wait-primary "Ctrl+click -> new tab") :link: [Catchingup](https://pg-auto-failover.readthedocs.io/en/latest/failover-state-machine.html?#catchingup "Ctrl+click -> new tab")

- в новом окне терминала запустил вторую ноду
    ```bash
    $ export PGDATA=~postgres/ha-demo-2
    $ pg_autoctl run
    ```

- проверил - :+1: 
    ```bash
    $ export PGDATA=~postgres/monitor && pg_autoctl show state

         Name |   Port | Group |  Node |     Current State |    Assigned State
    ----------+--------+-------+-------+-------------------+------------------
    localhost |   6001 |     0 |     1 |           primary |           primary
    localhost |   6002 |     0 |     2 |         secondary |         secondary
    ```

:+1: состояние нод сменилось на `primary`,  `secondary` - это означает, что файловер готов работать в штатном режиме

***
<div align="center"><h4>4. Тестирование</h4></div>

***
- подключился на 6001 порт
    ```bash
    $ psql -U postgres -h localhost -p 6001
    psql (12.4 (Ubuntu 12.4-1.pgdg18.04+1))
    SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
    Type "help" for help.
    
    postgres=# \l
                                 List of databases
       Name    |  Owner   | Encoding  | Collate | Ctype |   Access privileges   
    -----------+----------+-----------+---------+-------+-----------------------
     ha-demo   | postgres | SQL_ASCII | C       | C     | 
     postgres  | postgres | SQL_ASCII | C       | C     | 
     template0 | postgres | SQL_ASCII | C       | C     | =c/postgres          +
               |          |           |         |       | postgres=CTc/postgres
     template1 | postgres | SQL_ASCII | C       | C     | =c/postgres          +
               |          |           |         |       | postgres=CTc/postgres
    (5 rows)
    ```
- создал тестовую таблицу в бд `ha-demo`
    ```sql
    ha-demo=# create table ha_test as select generate_series(1,1000000) ser_id;
    SELECT 1000000
    ```

    <pre><details><summary>select * from public.ha_test limit 10;</summary>
     ser_id 
    --------
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
    </details></pre>

- подключился на 6002 порт ко 2-ой ноде
    ```bash
    $ psql -U postgres -h localhost -p 6002
    psql (12.4 (Ubuntu 12.4-1.pgdg18.04+1))
    SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
    Type "help" for help.
    
    postgres=# \l
                                 List of databases
       Name    |  Owner   | Encoding  | Collate | Ctype |   Access privileges   
    -----------+----------+-----------+---------+-------+-----------------------
     ha-demo   | postgres | SQL_ASCII | C       | C     | 
     postgres  | postgres | SQL_ASCII | C       | C     | 
     template0 | postgres | SQL_ASCII | C       | C     | =c/postgres          +
               |          |           |         |       | postgres=CTc/postgres
     template1 | postgres | SQL_ASCII | C       | C     | =c/postgres          +
               |          |           |         |       | postgres=CTc/postgres
    (4 rows)
    
    postgres=# \c ha-demo
    SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
    You are now connected to database "ha-demo" as user "postgres".

    ha-demo=# \dt+
                         List of relations
     Schema |  Name   | Type  |  Owner   | Size  | Description 
    --------+---------+-------+----------+-------+-------------
     public | ha_test | table | postgres | 35 MB | 
    (1 row)
    ```

    <pre><details><summary>select * from public.ha_test order by ser_id desc limit 10;</summary>
     ser_id  
    ---------
     1000000
      999999
      999998
      999997
      999996
      999995
      999994
      999993
      999992
      999991
    (10 rows)
    </details></pre>

- попробовал вставить строку
    ```bash
    ha-demo=# insert into public.ha_test (ser_id) values (1000001);
    ERROR:  cannot execute INSERT in a read-only transaction
    ```
:+1: репликация работает нормально, данные на второй ноде появились, и вторая нода в режиме `read-only`

- сделал основной 2-ую ноду
    ```bash
    $ pg_autoctl perform switchover --pgdata ~postgres/monitor
    $ export PGDATA=~postgres/monitor && pg_autoctl show state
         Name |   Port | Group |  Node |     Current State |    Assigned State
    ----------+--------+-------+-------+-------------------+------------------
    localhost |   6001 |     0 |     1 |         secondary |         secondary
    localhost |   6002 |     0 |     2 |           primary |           primary
    ```
- снова подключился ко второй ноде, которая стала `primary` и попробовал вставить строку в таблицу `public.ha_test`
    ```bash
    ha-demo=# insert into public.ha_test (ser_id) values (1000001), (1000002), (1000003), (1000004), (1000005);
    INSERT 0 5
    ```
- подключился к первой ноде `secondary` и проверил поступление данных
    ```bash
    ha-demo=# select * from public.ha_test order by ser_id desc limit 5;
     ser_id  
    ---------
     1000005
     1000004
     1000003
     1000002
     1000001
    (5 rows)
    ```
:+1: _данные на месте - переключение нод работает нормально_

- попробовал "на лету" убить процесс второй ноды `primary`
    ```bash
    $ ps axu | grep ha-demo-2

    postgres  4382  0.0  0.0  14852  1064 pts/0    S+   09:42   0:00 grep ha-demo-2
    postgres  8364  0.1  0.3 317776 27348 ?        Ss   07:52   0:07 /usr/lib/postgresql/12/bin/postgres -D /var/lib/postgresql/ha-demo-2 -p 6002 -h *

    $ kill 8364
    ```
- и сразу проверил состояние
    ```bash
    $ export PGDATA=~postgres/monitor && pg_autoctl show state
         Name |   Port | Group |  Node |     Current State |    Assigned State
    ----------+--------+-------+-------+-------------------+------------------
    localhost |   6001 |     0 |     1 |      wait_primary |      wait_primary
    localhost |   6002 |     0 |     2 |           primary |           demoted
    ```
    :exclamation: _убийством процесса проверить аварийное переключение не удалось, ноды оставались в таком состоянии, пока я снова не запустил убитую ноду, только после этого ноды поменялись ролями_
    ```bash
    $ export PGDATA=~postgres/monitor && pg_autoctl show state
         Name |   Port | Group |  Node |     Current State |    Assigned State
    ----------+--------+-------+-------+-------------------+------------------
    localhost |   6001 |     0 |     1 |           primary |           primary
    localhost |   6002 |     0 |     2 |         secondary |         secondary
    ```
- попробовал еще раз с помощью команды `pg_autoctl stop`
    ```bash
    $ export PGDATA=~postgres/ha-demo-1 && pg_autoctl stop
    ```
    :exclamation: _в этом случае не произошло вообще ничего, запущенный сервис ноды просто прервал свою работу, статусы остались прежними_

- попробовал просто удалить ноду
    ```bash
    $ export PGDATA=~postgres/ha-demo-1 && pg_autoctl drop node
    $ export PGDATA=~postgres/monitor && pg_autoctl show state
         Name |   Port | Group |  Node |     Current State |    Assigned State
    ----------+--------+-------+-------+-------------------+------------------
    localhost |   6002 |     0 |     2 |            single |            single
    ```
    :exclamation: _вторая нода просто перешла в состояние `single`, после удаления просто запустить не удалось, требуется повторное создание_

:grey_exclamation: **ИТОГ** _для простоты демонстрации я разместил три сервиса на одном хосте, из-за этого не совсем удалось продемонстрировать аварийное переключение; наверное, более правильно было бы разместить все сервисы на разных ВМ, тогда была бы возможность выключения ВМ `primary` ноды и файловер был бы продемонстрирован; в целом - инструмент рабочий, и работает нормально_
