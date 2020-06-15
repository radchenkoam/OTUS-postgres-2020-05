<div align="right"><h5> Занятие #4 - Домашнее задание - Вариант 2</h5></div>


<div align="center"><h2>Установка и настройка PostgreSQL<br/>в контейнере Docker</h2></div>

***
<div align="center"><h4>1. Создание виртуальной машины и установка Docker Engine</h4></div>

***

- Создал новый проект **`andrey-radchenko-19731204-04`**
- Добавил пользователя `postgres202005@gmail.com` в проект с правами _Редактор_
- Включил _Compute Engine API_
- Перешел в _Compute Engine_ и создал новую виртуальную машину:
[`Google Cloud Platform`](https://cloud.google.com/ "Google Cloud") -> `Compute Engine` -> `Экземпляры ВМ` -> `Создать экземпляр`

:hammer_and_wrench: Параметр | :memo: Значение |:hammer_and_wrench: Параметр | :memo: Значение |
--------------:|---------------|--------------:|---------------|
| Название ВМ | **`lesson-4-hw-var-2`** | Операционная система | `Ubuntu` |
| Регион | `us-central1 (Айова)` | Версия операционной системы | `Ubuntu 18.04 LTS` | 
| Зона | `us-central1-a` | Тип загрузочного диска | `Стандартный постоянный диск` | 
| Серия | `N1` | Размер (Гб) загрузочного диска | `10` |
| Тип машины | `n1-standart-1` | Брандмауэр | :ballot_box_with_check: `Разрешить трафик HTTP`
| | | | :ballot_box_with_check: `Разрешить трафик HTTPS` |

- Подключился к новой ВМ по _ssh_
- Установил _Docker Engine_: 
    - обновил существующий перечень пакетов: `sudo apt update`
    - установил необходимые пакеты, которые позволяют `apt` использовать пакеты по _HTTPS_: 
    ```bash
    $ sudo apt install apt-transport-https ca-certificates curl software-properties-common
    ```
    - добавил в систему ключ _GPG_ официального репозитория _Docker_: 
    ```bash
    $ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    ```
    - добавил репозиторий _Docker_ в список источников пакетов _APT_:
    ```bash
    $ sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
    ```
    - обновил базу данных пакетов информацией о пакетах Docker из вновь добавленного репозитория: `sudo apt update`
    - убедился, что будет установлен _Docker_ из репозитория _Docker_, а не из репозитория по умолчанию _Ubuntu_: `apt-cache policy docker-ce`
        
    ```bash
    docker-ce:
  Installed: (none)
  Candidate: 5:19.03.11~3-0~ubuntu-bionic
  Version table:
     5:19.03.11~3-0~ubuntu-bionic 500
        500 https://download.docker.com/linux/ubuntu bionic/stable amd64 Packages
    ```
    > **https://download.docker.com** - ОК
    - установил _Docker_: `sudo apt install docker-ce`
    проверка: `sudo systemctl status docker`
    
    ```bash
    ● docker.service - Docker Application Container Engine
       Loaded: loaded (/lib/systemd/system/docker.service; enabled; vendor preset: enabled)
       Active: active (running) since Thu 2020-06-11 11:44:00 UTC; 1min 28s ago
         Docs: https://docs.docker.com
     Main PID: 4803 (dockerd)
        Tasks: 8
       CGroup: /system.slice/docker.service
               └─4803 /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
    ```
   > все в порядке: **_Docker_ установлен и запущен**

***
<div align="center"><h4>2. Запуск контейнеров с сервером и клиентом PostgreSQL 11 </h4></div>

***

- Создал каталог **/var/lib/postgres**: `$ sudo mkdir -p /var/lib/postgres`
- Создал docker-сеть **pg_net**: `$ sudo docker network create pg-net`
- Запустил контейнер _PostgreSQL 11_ с доступом в сеть **pg_net**: 
`$ sudo docker run --name pg-docker --network pg-net -e POSTGRES_PASSWORD=postgres -d -p 5432:5432 -v /var/lib/postgres:/var/lib/postgresql/data postgres:11`

    ```bash
    Unable to find image 'postgres:11' locally
    11: Pulling from library/postgres
    7d2977b12acb: Pull complete 
    0189767a99c6: Pull complete 
    2ac96eba8c9d: Pull complete 
    8b4f0db1ff6e: Pull complete 
    9e30cfe22768: Pull complete 
    8c90c3e75b96: Pull complete 
    5ddcc5e296f9: Pull complete 
    fd42372a1ee8: Pull complete 
    db53e89e9aa9: Pull complete 
    90d820846158: Pull complete 
    07f8ae023b87: Pull complete 
    66523f120c51: Pull complete 
    31944359dec5: Pull complete 
    c6c4e5d2f560: Pull complete 
    Digest: sha256:495de69cd2f7be2e6363c980e2ddf99fb1bef997a51d800c1f72be2b35648b3b
    Status: Downloaded newer image for postgres:11
    6e139f053f17894701c16b0a7f9c588bbe21efac3a5be733fce31c15eb7fd29f
    ```
    Проверка: `$ sudo docker ps -a`
    ```bash
    CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                    NAMES
    6e139f053f17        postgres:11         "docker-entrypoint.s…"   2 minutes ago       Up 2 minutes        0.0.0.0:5432->5432/tcp   pg-docker
    ```
    > _контейнер с postgres скачан и запущен нормально_

- Запустил отдельный контейнер с клиентом в общей сети с БД: 
`$ sudo docker run -it --rm --network pg-net --name pg-client postgres:11 psql -h pg-docker -U postgres`
    ```bash
    Password for user postgres: 
    psql (11.8 (Debian 11.8-1.pgdg90+1))
    Type "help" for help.

    postgres=# 
    ```
- Создал тестовую таблицу, вставил две строки:
    ```sql
    create table test (id int, "name" text);
    insert into test (id, "name") values (1, 'Yuri Gagarin'), (2, 'German Titov');
    ```
    Проверка:
    ```sql
    postgres=# select * from test;
     id |     name     
    ----+--------------
      1 | Yuri Gagarin
      2 | German Titov
    (2 rows)
    ```
    > _таблица создана, данные есть_

***
<div align="center"><h4>3. Подключение к контейнеру с сервером PostgreSQL снаружи</h4></div>

***

- Попробовал подключиться без дополнительной настройки: 
    `psql -h 35.193.92.39 -p 5432 -U postgres`

    ```bash
    psql: error: could not connect to server: could not connect to server: Время ожидания соединения истекло
    	Is the server running on host "35.193.92.39" and accepting
    	TCP/IP connections on port 5432?
    ```
    > _нет подключения_
- Немного настроил: 
    - создал правило брандмауэра, в _GCP_: 

    `Cеть VPC` -> `Брандмауэр` -> `СОЗДАТЬ ПРАВИЛО БРАНДМАУЭРА`:

    :hammer_and_wrench: Параметр | :memo: Значение |:hammer_and_wrench: Параметр | :memo: Значение |
    --------------:|---------------|--------------:|---------------|
    | Название | **`lesson-4-hw-var-2-postgres-allow-5432`** | Целевые экземпляры | `Все экземпляры в сети` | 
    | Журналы | :radio_button: `Выкл.` | Фильтр источника | `Диапазоны IP-адресов` | 
    | Сеть | `default` | Диапазоны IP-адресов источников | `0.0.0.0/0` | 
    | Приоритет | `1000` | Дополнительный фильтр источника | `Нет` |
    | Направление трафика | :radio_button: `Входящий трафик` | Протоколы и порты | :radio_button:  `Указанные протоколы и порты` |
    | Действие | :radio_button: `Разрешить` | | :ballot_box_with_check: `tcp: 5432` |

- Снова попробовал подключиться: 
    `psql -h 35.193.92.39 -p 5432 -U postgres`

    ```bash
    Password for user postgres: 
    psql (12.2 (Ubuntu 12.2-4), server 11.8 (Debian 11.8-1.pgdg90+1))
    Type "help" for help.
    
    postgres=# select * from test;
     id |     name     
    ----+--------------
      1 | Yuri Gagarin
      2 | German Titov
    (2 rows)
    ```
    Проверка:
    ```bash
    postgres=# select inet_client_addr();
     inet_client_addr 
    ------------------
     185.215.60.178
    (1 row)
    ```
    > _при проверке - вижу свой внешний адрес, значит подключение снаружи к контейнеру с сервером PostgreSQL 11 прошло успешно_

***
<div align="center"><h4>4. Пересоздание контейнера с сервером PostgreSQL</h4></div>

***

- Остановил контейнер: `$ sudo docker stop pg-docker`
    Проверка: `$ sudo docker ps -a`

    ```bash
    CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS                          PORTS               NAMES
    6e139f053f17        postgres:11         "docker-entrypoint.s…"   14 hours ago        Exited (0) About a minute ago                       pg-docker

    ```
    > STATUS - _Exited_, контейнер остановлен
- Удалил контейнер с сервером PostgreSQL: `$ sudo docker rm pg-docker`
    Проверка: `$ sudo docker ps -a`
    ```bash
    CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
    ```
    > Контейнеров в списке нет, удален нормально
- Для чистоты эксперимента запустим новый контейнер с измененными параметрами:
    `--name pg-docker-second`, `-p 15432:5432`

    ```bash
    $ sudo docker run --name pg-docker-second --network pg-net -e POSTGRES_PASSWORD=postgres -d -p 15432:5432 -v /var/lib/postgres:/var/lib/postgresql/data postgres:11
    ```
    Проверка: `$ sudo docker ps -a`
    ```bash
    CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                     NAMES
    7294daeeac4d        postgres:11         "docker-entrypoint.s…"   10 minutes ago      Up 10 minutes       0.0.0.0:15432->5432/tcp   pg-docker-second
    ````
    > контейнер **pg-docker-second** с наружным портом **15432** в статусе - **Up**

- Немного изменил правило **`lesson-4-hw-var-2-postgres-allow-5432`** брандмауэра:
    :hammer_and_wrench: Параметр | :memo: Значение |:hammer_and_wrench: Параметр | :memo: Значение |
    --------------:|---------------|--------------:|---------------|
    | Направление трафика | :radio_button: `Входящий трафик` | Протоколы и порты | :radio_button:  `Указанные протоколы и порты` |
    | Действие | :radio_button: `Разрешить` | | :ballot_box_with_check: `tcp:` **15432** |

- Подключился с новым портом снаружи: `$ psql -h 35.193.92.39 -p 15432 -U postgres`
    Проверка:
    ```sql
    postgres=# select * from test;
     id |     name     
    ----+--------------
      1 | Yuri Gagarin
      2 | German Titov
    (2 rows)
    ```
:exclamation: **Итог:** _Сначала я создал docker-контейнер с сервером PostgreSQL 11, разместив данные на хостовом диске. После настройки брандмауэра подключился к контейнеру с сервером postgres снаружи. Затем удалил этот контейнер, запустил новый с немного измененными параметрами. В результате - новый контейнер стартовал в штатном режиме и данные, созданные в старом контейнере сохранились и стали доступны в новом. Эксперимент прошел удачно._
