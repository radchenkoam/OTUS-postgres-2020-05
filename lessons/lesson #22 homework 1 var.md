<div align="right"><h5> Занятие #22 - Домашнее задание - Вариант 1</h5></div>

<div align="center"><h2>CockroachDB в Google Kubernetes Engine</h2></div>

***
<div align="center"><h4>1. Установка кластера CockroachDB в GKE</h4></div>

***
- [создал GKE-кластер](https://cloud.google.com/kubernetes-engine/docs/how-to/creating-a-cluster "Ctrl-click -> new tab") командой :link: [gcloud container clusters create](https://cloud.google.com/sdk/gcloud/reference/container/clusters/create "Ctrl+click -> new tab")
    ```bash
    $ gcloud beta container 
      --project "andrey-radchenko-19731204-04" clusters create "cockroachdb-cluster" 
      --zone "us-central1-c" 
      --no-enable-basic-auth 
      --cluster-version "1.15.12-gke.2" 
      --machine-type "e2-standard-2" 
      --image-type "COS" 
      --disk-type "pd-ssd" 
      --disk-size "100" 
      --metadata disable-legacy-endpoints=true 
      --scopes "https://www.googleapis.com/auth/cloud-platform" 
      --num-nodes "3" 
      --no-enable-stackdriver-kubernetes 
      --enable-ip-alias 
      --network "projects/andrey-radchenko-19731204-04/global/networks/default" 
      --subnetwork "projects/andrey-radchenko-19731204-04/regions/us-central1/subnetworks/default" 
      --default-max-pods-per-node "110" 
      --no-enable-master-authorized-networks 
      --addons HorizontalPodAutoscaling,HttpLoadBalancing 
      --enable-autoupgrade 
      --enable-autorepair 
      --max-surge-upgrade 1 
      --max-unavailable-upgrade 0
    ```
    - проверил - :+1: 
        ```bash
        $ gcloud container clusters list

        NAME                 LOCATION       MASTER_VERSION  MASTER_IP    MACHINE_TYPE   NODE_VERSION   NUM_NODES  STATUS
        cockroachdb-cluster  us-central1-c  1.15.12-gke.2   34.67.25.27  e2-standard-2  1.15.12-gke.2  3          RUNNING
        ```

- на всякий случай сделал соответствие между моей текущей учетной записью и админской учеткой гугла :link: [clusterrolebinding](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#kubectl-create-clusterrolebinding "Ctrl+click -> new tab")
    ```bash
    $ kubectl create clusterrolebinding $USER-cluster-admin-binding --clusterrole=cluster-admin --user=radchenkoam@gmail.com
    
    clusterrolebinding.rbac.authorization.k8s.io/am-cluster-admin-binding created
    ```
    > `$ gcloud info | grep Account`
Account: [radchenkoam@gmail.com]

- клонировал helm-чарт CockroachDB :link: [с гитхаба](https://github.com/cockroachdb/helm-charts "Ctrl+click -> new tab")
    ```bash
    $ git clone https://github.com/cockroachdb/helm-charts
    ```
- добавил Helm-репозиторий `cockroachdb` :link: [helm repo add](https://helm.sh/docs/helm/helm_repo_add/ "Ctrl+click -> new tab") и обновил 
    ```bash
    $ helm repo add cockroachdb https://charts.cockroachdb.com/
    $ helm repo update
    ```

- :exclamation: файл `my-values.yaml` :link: [Values Files](https://helm.sh/docs/chart_template_guide/values_files/ "Ctrl+click -> new tab") для перекрытия настроек по умолчанию делать не стал, теперь решил оставить как есть, было несколько неудачных попыток до этого (разворачивал кластер CockroachDB с кастомными настройками и на ВМ N1 - всё было плохо - нормально загрузить датасеты из BigQuery не удавалось) :exclamation: 

- развернул кластер CockroachDB с именем `test`
    ```bash
    $ cd ~/helm-charts/cockroachdb
    $ helm install test .
    ```

    <pre><details><summary>проверка</summary>
    $ kubectl get nodes

    NAME                                                 STATUS   ROLES    AGE   VERSION
    gke-cockroachdb-cluster-default-pool-41cd4e42-2rx8   Ready    <none>   11m   v1.15.12-gke.2
    gke-cockroachdb-cluster-default-pool-41cd4e42-2wn7   Ready    <none>   11m   v1.15.12-gke.2
    gke-cockroachdb-cluster-default-pool-41cd4e42-z559   Ready    <none>   11m   v1.15.12-gke.2


    $ kubectl get pods
    
    NAME                          READY   STATUS      RESTARTS   AGE
    test-cockroachdb-0            1/1     Running     0          2m5s
    test-cockroachdb-1            1/1     Running     0          2m5s
    test-cockroachdb-2            1/1     Running     0          2m5s
    test-cockroachdb-init-cc9cz   0/1     Completed   0          2m5s


    $ kubectl get pv

    NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                                STORAGECLASS   REASON   AGE
    pvc-2de2b802-81c5-4c94-abb8-d4e35d3c54a6   100Gi      RWO            Delete           Bound    default/datadir-test-cockroachdb-0   standard                2m37s
    pvc-8c537a17-07ea-4979-bcbd-44abe69bfe24   100Gi      RWO            Delete           Bound    default/datadir-test-cockroachdb-1   standard                2m38s
    pvc-c1b7f517-bc3a-45f3-93d0-7ce436a9e8a4   100Gi      RWO            Delete           Bound    default/datadir-test-cockroachdb-2   standard                2m38s


    $ gcloud compute disks list

    NAME                                                             LOCATION       LOCATION_SCOPE  SIZE_GB  TYPE         STATUS
    gke-cockroachdb-cluste-pvc-2de2b802-81c5-4c94-abb8-d4e35d3c54a6  us-central1-c  zone            100      pd-standard  READY
    gke-cockroachdb-cluste-pvc-8c537a17-07ea-4979-bcbd-44abe69bfe24  us-central1-c  zone            100      pd-standard  READY
    gke-cockroachdb-cluste-pvc-c1b7f517-bc3a-45f3-93d0-7ce436a9e8a4  us-central1-c  zone            100      pd-standard  READY
    gke-cockroachdb-cluster-default-pool-41cd4e42-2rx8               us-central1-c  zone            50       pd-ssd       READY
    gke-cockroachdb-cluster-default-pool-41cd4e42-2wn7               us-central1-c  zone            50       pd-ssd       READY
    gke-cockroachdb-cluster-default-pool-41cd4e42-z559               us-central1-c  zone            50       pd-ssd       READY
</details></pre>

- :memo: подключение через `psql` :link: [kubectl port-forward](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/ "Ctrl+click -> new tab")
    - сделал проброс порта в другом окне терминала
        ```bash
        $ kubectl port-forward test-cockroachdb-0 26257
        ```
    - подключился - :+1: 
        ```bash
        $ psql -h localhost -p 26257 -U root
    
        root=# show databases;
         database_name 
        ---------------
         defaultdb
         postgres
         system
        (3 rows)
        ```

- запустил [Admin UI](https://www.cockroachlabs.com/docs/v20.1/admin-ui-overview.html "Ctrl+click -> new tab")
    - прокинул порт 8080 с кластера на локальный компьютер
        ```bash
        $ kubectl port-forward service/test-cockroachdb-public 8080
        ```
    - открыл в браузере адрес `http://localhost:8080/` - :+1: 

***
<div align="center"><h4>2. Загрузка тестовых данных</h4></div>

***
- создал сегмент `les-data-1` 50гб в _Google Cloud Storage_ (eu)

- экспортировал на него набор данных из BigQuery `bigquery-public-data:new_york_311` :link: [bq command-line tool](https://cloud.google.com/bigquery/docs/bq-command-line-tool "Ctrl+click -> new tab")
    ```bash
    bq extract bigquery-public-data:new_york_311.311_service_requests 'gs://les-data-1/311/ny-311-*.csv'
    ```
    -  47 файлов объемом 12 GB за 35 секунд
        <pre><details><summary>$ gsutil ls -l gs://les-data-1/311/</summary>
         0  2020-09-13T10:46:29Z  gs://les-data-1/311/
         274278395  2020-09-13T11:06:09Z  gs://les-data-1/311/ny-311-000000000000.csv
         273295489  2020-09-13T11:05:59Z  gs://les-data-1/311/ny-311-000000000001.csv
         273712059  2020-09-13T11:06:01Z  gs://les-data-1/311/ny-311-000000000002.csv
        ...
         274129024  2020-09-13T11:06:06Z  gs://les-data-1/311/ny-311-000000000044.csv
         274946695  2020-09-13T11:06:06Z  gs://les-data-1/311/ny-311-000000000045.csv
         273850480  2020-09-13T11:06:11Z  gs://les-data-1/311/ny-311-000000000046.csv
        TOTAL: 48 objects, 12880657706 bytes (12 GiB)
        </details></pre>

- создал БД `ny311`
    ```sql
    create database ny311;
    ```

- создал таблицу `public.service_requests`
    ```sql
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
    ```

- загрузил данные из csv-файлов командой :link: [import into](https://www.cockroachlabs.com/docs/stable/import-into.html#import-into-an-existing-table-from-multiple-csv-files "Ctrl+click -> new tab")

    ```sql
    import into public.service_requests ( 
      unique_key, 
      created_date, 
      closed_date, 
      agency, 
      agency_name, 
      complaint_type, 
      descriptor, 
      location_type, 
      incident_zip, 
      incident_address, 
      street_name, 
      cross_street_1, 
      cross_street_2, 
      intersection_street_1, 
      intersection_street_2, 
      address_type,city, 
      landmark, 
      facility_type, 
      status,due_date, 
      resolution_description, 
      resolution_action_updated_date, 
      community_board, 
      borough, 
      x_coordinate, 
      y_coordinate, 
      park_facility_name, 
      park_borough, 
      bbl, 
      open_data_channel_type, 
      vehicle_type, 
      taxi_company_borough, 
      taxi_pickup_location, 
      bridge_highway_name, 
      bridge_highway_direction, 
      road_ramp, 
      bridge_highway_segment, 
      latitude, 
      longitude, 
      location 
    ) csv data (
        'gs://les-data-1/311/*.csv'
    ) with skip = '1', nullif = '';
    ```

    > за ходом выполнения задания удобно наблюдать на странице `http://localhost:8080/#/jobs`

- джоб выполнился за время чуть меньше 13 минут
    ```bash
    ny311=# show job 589823006006378497;

    job_id             | 589823006006378497
    job_type           | IMPORT
    description        | IMPORT INTO ...
    statement          | 
    user_name          | root
    status             | succeeded
    running_status     | 
    created            | 2020-09-14 07:54:56.66386
    started            | 2020-09-14 07:54:56.701476
    finished           | 2020-09-14 08:07:53.608221
    modified           | 2020-09-14 08:07:53.597784
    fraction_completed | 1
    error              | 
    coordinator_id     | 1
    ```
- проверил количество записей в таблице - :+1: всё ок - данные загружены нормально
    ```sql
    ny311=# select count(*) from public.service_requests;
      count   
    ----------
     23880138
    (1 row)
    
    Time: 16695,382 ms (00:16,695)
    ```

***
<div align="center"><h4>3. Сравнение производительности запросов к </br>БД в кластере CockroachDB и БД на одном инстансе PostgreSQL</h4></div>

***

- замеры скорости запросов на одном инстансе PostgreSQL я уже делал в [этом домашнем задании](https://github.com/radchenkoam/OTUS-postgres-2020-05/blob/dev/lessons/lesson%20%2312%20homework.md#%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%B0-%D1%81-%D0%B1%D0%BE%D0%BB%D1%8C%D1%88%D0%B8%D0%BC-%D0%BE%D0%B1%D1%8A%D0%B5%D0%BC%D0%BE%D0%BC-%D1%80%D0%B5%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D1%85-%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85 "Ctrl+click -> new tab") на аналогичной ВМ и с тем же датасетом, поэтому результаты взял оттуда

#### Запрос 1

- **CockroachDB**
    ```sql
    select extract(year from created_date) as year, extract(month from created_date) as month, count(*) as cnt from service_requests group by year, month order by year, month;
    ```
#### Результаты

| СУБД | Размер БД | время count(*) | время Запрос 1 |
|---------:|:---------------:|:--------------------:|:---------------------:|
| **PostgreSQL без индекса** | 12475.00 Mb | 07 min 28.99 sec | 07 min 49.60 sec |
| **PostgreSQL с индексом** | 12984.00 Mb | 07 min 28.95 sec |  07 min 28.88 sec |
| **CockroachDB без индекса** | 11800.00 MB | 12.3 sec |  23.54 sec |
| **CockroachDB с индексом** | 12400.00 MB | **5.41 sec** | **19.65 sec** |

- методика тестирования: 
    - время выполнения запроса -> лучшее время из 3-х подряд выполненных одинаковых запросов
    - сначала выполняются запросы без индекса, затем создается индекс
    - после выполнения команды на создание индекса - ждать 30 минут, затем продолжать тестирование

:memo: Индекс: `create index service_requests_created_date_idx on service_requests (created_date);`

**Итог:** _тестирование на БД в кластере CockroachDB производилось "из коробки", без дополнительных настроек производительности, и результаты довольно неплохие; создание индекса хоть и улучшило показатели, но не сказать, что оказало существенное влияние;_
