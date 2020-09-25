<div align="right"><h5> Занятие #26 - PostgreSQL и Azure, GCP, AWS - Домашнее задание - Вариант 2</h5></div>

<div align="center"><h2>Установка одного экземпляра сервера PostgreSQL </br>в кластере Kubernetes с помощью Google Cloud Marketplace</h2></div>

***

<div align="center"><h3>Архитектура</h3></div>

![image](https://user-images.githubusercontent.com/29423304/94195322-86ac4e00-febb-11ea-9014-ef910be98c04.png)

***
<div align="center"><h4>1. Кластер GKE</h4></div>

***
- создал кластер Kubernetes
```bash
$ export CLUSTER=postgresql-cluster
$ export ZONE=us-west1-a
$ gcloud container clusters create "$CLUSTER" --zone "$ZONE"
```

- сконфигурировал `kubectl` для подключения к созданному кластеру
```bash
$ gcloud container clusters get-credentials "$CLUSTER" --zone "$ZONE"
```

- проверил - :+1: 
```bash
$ gcloud container clusters list
NAME                LOCATION    MASTER_VERSION  MASTER_IP       MACHINE_TYPE   NODE_VERSION    NUM_NODES  STATUS
postgresql-cluster  us-west1-a  1.15.12-gke.20  35.247.113.222  n1-standard-1  1.15.12-gke.20  3          RUNNING

$ kubectl get all
NAME                 TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.23.240.1   <none>        443/TCP   8m11s

$ kubectl cluster-info all
Kubernetes master is running at https://35.247.113.222
GLBCDefaultBackend is running at https://35.247.113.222/api/v1/namespaces/kube-system/services/default-http-backend:http/proxy
Heapster is running at https://35.247.113.222/api/v1/namespaces/kube-system/services/heapster/proxy
KubeDNS is running at https://35.247.113.222/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
Metrics-server is running at https://35.247.113.222/api/v1/namespaces/kube-system/services/https:metrics-server:/proxy

$ kubectl get storageclasses
NAME                 PROVISIONER            AGE
standard (default)   kubernetes.io/gce-pd   9m4s
```

- клонировал репозиторий `GoogleCloudPlatform/click-to-deploy`
```bash
$ git clone --recursive https://github.com/GoogleCloudPlatform/click-to-deploy.git
```

- настроил кластер для работы с ресурсами приложения 
```bash
$ kubectl apply -f "https://raw.githubusercontent.com/GoogleCloudPlatform/marketplace-k8s-app-tools/master/crd/app-crd.yaml"
```
> :memo: _ресурс приложения (application resource) - это набор отдельных компонентов Kubernetes, таких как службы (services), развертывания (deployments) и т.д., которыми можно управлять как группой_

:link: [Apps Special Interest Group](https://github.com/kubernetes/community/tree/master/sig-apps "Ctrl+click -> new tab") :link: [Kubernetes Applications](https://github.com/kubernetes-sigs/application#kubernetes-applications "Ctrl+click -> new tab")

***
<div align="center"><h4>2. Установка приложения</h4></div>

***

- перешел в каталог `postgresql`
```bash
$ cd click-to-deploy/k8s/postgresql
```

- указал имя экземпляра и пространство имен для приложения
```bash
$ export APP_INSTANCE_NAME=postgresql-1
$ export NAMESPACE=default
```

- на этом шаге можно задать имя `StorageClass` :link: [Создать новый StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/#the-storageclass-resource "Ctlr+click -> new tab")
```bash
$ kubectl get storageclass
NAME                 PROVISIONER            AGE
standard (default)   kubernetes.io/gce-pd   33m
```

- я оставил `standart` по умолчанию, задал размер `persistent disk's`
```bash
$ export DEFAULT_STORAGE_CLASS="standard"
$ export PERSISTENT_DISK_SIZE="10Gi"
```

- нашел в [Marketplace](https://console.cloud.google.com/marketplace) последний [образ PostgreSQL 11](https://console.cloud.google.com/marketplace/details/google/postgresql11 "Ctrl+click -> new tab"), там указана ссылка на [путь в хранилище образов](https://console.cloud.google.com/gcr/images/cloud-marketplace/GLOBAL/google/postgresql11?gcrImageListsize=30 "Ctrl+click -> new tab"), где можно выбрать необходимый образ, я выбрал `latest`
```bash
$ export TAG="latest"
```

- таким же образом я нашел [PostgreSQL Exporter для 11 версии](https://console.cloud.google.com/marketplace/details/google/postgresql-exporter0 "Ctrl+click -> new tab"), подходящий для `click-to-deploy`, его последний образ также имеет тег `latest` :link: [PostgreSQL Server Exporter github](https://github.com/wrouesnel/postgres_exporter "Ctrl+click")

- для них я указал ссылки на образы контейнеров
```bash
$ export IMAGE_POSTGRESQL="gcr.io/cloud-marketplace/google/postgresql11"
$ export IMAGE_POSTGRESQL_EXPORTER="gcr.io/cloud-marketplace/google/postgresql-exporter0:${TAG}"
```
- затем, нашел [Prometheus & Grafana](https://console.cloud.google.com/marketplace/details/google/prometheus "Ctrl+click -> new tab"), последняя версия контейнера там `2.11`, в надежде, что всё это взлетит - я прописал и эту ссылку
```bash
$ export IMAGE_METRICS_EXPORTER="gcr.io/cloud-marketplace/google/prometheus:2.11"
```
- сгенерировал рандомный пароль
```bash
$ export POSTGRESQL_DB_PASSWORD="$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 20 | head -n 1 | tr -d '\n')"
$ echo $POSTGRESQL_DB_PASSWORD
6P8guxg2DfWCA6N1jJAu
```
- запретил доступ снаружи к сервису
```bash
$ export EXPOSE_PUBLIC_SERVICE=false
```

- для внешнего доступа нужен сертификат TLS для PostgreSQL, на всякий случай сделал
```bash
$ openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /tmp/tls.key \
    -out /tmp/tls.crt \
    -subj "/CN=postgresql/O=postgresql"
$ export TLS_CERTIFICATE_KEY="$(cat /tmp/tls.key | base64)"
```

- создал новую сервисную учетную запись
```bash
$ export POSTGRESQL_SERVICE_ACCOUNT="${APP_INSTANCE_NAME}-postgresql-sa"
$ kubectl create serviceaccount ${POSTGRESQL_SERVICE_ACCOUNT} --namespace ${NAMESPACE}
serviceaccount/postgresql-1-postgresql-sa created
```

- чтобы импортировать метрики в [Мониторинг](https://console.cloud.google.com/monitoring "Ctrl+click -> new tab") :link: [Cloud Monitoring documentation](https://cloud.google.com/monitoring/docs "Ctrl+click -> new tab")
```bash
$ export METRICS_EXPORTER_ENABLED=true
```

- выполнил `helm template` чтобы собрать файл манифеста
```bash
helm template chart/postgresql \
  --name-template "$APP_INSTANCE_NAME" \
  --namespace "$NAMESPACE" \
  --set postgresql.serviceAccount="$POSTGRESQL_SERVICE_ACCOUNT" \
  --set postgresql.image.repo="$IMAGE_POSTGRESQL" \
  --set postgresql.image.tag="$TAG" \
  --set postgresql.exposePublicService="$EXPOSE_PUBLIC_SERVICE" \
  --set postgresql.persistence.storageClass="${DEFAULT_STORAGE_CLASS}" \
  --set postgresql.persistence.size="${PERSISTENT_DISK_SIZE}" \
  --set db.password="$POSTGRESQL_DB_PASSWORD" \
  --set metrics.image="$IMAGE_METRICS_EXPORTER" \
  --set metrics.exporter.enabled="$METRICS_EXPORTER_ENABLED" \
  --set exporter.image="$IMAGE_POSTGRESQL_EXPORTER" \
  --set tls.base64EncodedPrivateKey="$TLS_CERTIFICATE_KEY" \
  --set tls.base64EncodedCertificate="$TLS_CERTIFICATE_CRT" \
  > "${APP_INSTANCE_NAME}_manifest.yaml"
```

- применил манифест к кластеру - :+1: 
```bash
$ kubectl apply -f "${APP_INSTANCE_NAME}_manifest.yaml" --namespace "${NAMESPACE}"
secret/postgresql-1-secret created
secret/postgresql-1-tls created
service/postgresql-1-postgresql-svc created
service/postgresql-1-postgres-exporter-svc created
statefulset.apps/postgresql-1-postgresql created
application.app.k8s.io/postgresql-1 created
```

- почти всё стартануло нормально
```bash
$ kubectl get all
NAME                            READY   STATUS             RESTARTS   AGE
pod/postgresql-1-postgresql-0   2/3     CrashLoopBackOff   7          12m

NAME                                         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/kubernetes                           ClusterIP   10.23.240.1     <none>        443/TCP    4h6m
service/postgresql-1-postgres-exporter-svc   ClusterIP   10.23.248.220   <none>        9187/TCP   12m
service/postgresql-1-postgresql-svc          ClusterIP   10.23.240.43    <none>        5432/TCP   12m

NAME                                       READY   AGE
statefulset.apps/postgresql-1-postgresql   0/1     12m
```
:exclamation: не взлетел Prometheus & Grafana - с ним надо разбираться отдельно

- подключение к PostgreSQL - :+1:
```bash
$ kubectl port-forward --namespace default postgresql-1-postgresql-0 5432
$ psql -U postgres -h 127.0.0.1
psql (12.4 (Ubuntu 12.4-0ubuntu0.20.04.1), server 11.9 (Debian 11.9-1.pgdg90+1))
Type "help" for help.

postgres=# \l
                                 List of databases
   Name    |  Owner   | Encoding |  Collate   |   Ctype    |   Access privileges   
-----------+----------+----------+------------+------------+-----------------------
 postgres  | postgres | UTF8     | en_US.utf8 | en_US.utf8 | 
 template0 | postgres | UTF8     | en_US.utf8 | en_US.utf8 | =c/postgres          +
           |          |          |            |            | postgres=CTc/postgres
 template1 | postgres | UTF8     | en_US.utf8 | en_US.utf8 | =c/postgres          +
           |          |          |            |            | postgres=CTc/postgres
(3 rows)
```

- проверил _Postgres exporter_ - :+1: 
```bash
kubectl port-forward --namespace default postgresql-1-postgresql-0 9187
Forwarding from 127.0.0.1:9187 -> 9187
Forwarding from [::1]:9187 -> 9187
Handling connection for 9187
```
<pre><details><summary>http://127.0.0.1:9187/metrics</summary>
# HELP go_gc_duration_seconds A summary of the GC invocation durations.
# TYPE go_gc_duration_seconds summary
go_gc_duration_seconds{quantile="0"} 0
go_gc_duration_seconds{quantile="0.25"} 0
go_gc_duration_seconds{quantile="0.5"} 0
go_gc_duration_seconds{quantile="0.75"} 0
go_gc_duration_seconds{quantile="1"} 0
go_gc_duration_seconds_sum 0
go_gc_duration_seconds_count 0
# HELP go_goroutines Number of goroutines that currently exist.
# TYPE go_goroutines gauge
go_goroutines 7
# HELP go_info Information about the Go environment.
# TYPE go_info gauge
go_info{version="go1.11"} 1
# HELP go_memstats_alloc_bytes Number of bytes allocated and still in use.
# TYPE go_memstats_alloc_bytes gauge
go_memstats_alloc_bytes 1.7912e+06
# HELP go_memstats_alloc_bytes_total Total number of bytes allocated, even if freed.
# TYPE go_memstats_alloc_bytes_total counter
go_memstats_alloc_bytes_total 1.7912e+06
# HELP go_memstats_buck_hash_sys_bytes Number of bytes used by the profiling bucket hash table.
# TYPE go_memstats_buck_hash_sys_bytes gauge
go_memstats_buck_hash_sys_bytes 1.443108e+06
# HELP go_memstats_frees_total Total number of frees.
# TYPE go_memstats_frees_total counter
go_memstats_frees_total 328
# HELP go_memstats_gc_cpu_fraction The fraction of this program's available CPU time used by the GC since the program started.
# TYPE go_memstats_gc_cpu_fraction gauge
go_memstats_gc_cpu_fraction 0
# HELP go_memstats_gc_sys_bytes Number of bytes used for garbage collection system metadata.
# TYPE go_memstats_gc_sys_bytes gauge
go_memstats_gc_sys_bytes 2.234368e+06
# HELP go_memstats_heap_alloc_bytes Number of heap bytes allocated and still in use.
# TYPE go_memstats_heap_alloc_bytes gauge
go_memstats_heap_alloc_bytes 1.7912e+06
# HELP go_memstats_heap_idle_bytes Number of heap bytes waiting to be used.
# TYPE go_memstats_heap_idle_bytes gauge
go_memstats_heap_idle_bytes 6.4503808e+07
# HELP go_memstats_heap_inuse_bytes Number of heap bytes that are in use.
# TYPE go_memstats_heap_inuse_bytes gauge
go_memstats_heap_inuse_bytes 2.342912e+06
# HELP go_memstats_heap_objects Number of allocated objects.
# TYPE go_memstats_heap_objects gauge
go_memstats_heap_objects 4720
# HELP go_memstats_heap_released_bytes Number of heap bytes released to OS.
# TYPE go_memstats_heap_released_bytes gauge
go_memstats_heap_released_bytes 0
# HELP go_memstats_heap_sys_bytes Number of heap bytes obtained from system.
# TYPE go_memstats_heap_sys_bytes gauge
go_memstats_heap_sys_bytes 6.684672e+07
# HELP go_memstats_last_gc_time_seconds Number of seconds since 1970 of last garbage collection.
# TYPE go_memstats_last_gc_time_seconds gauge
go_memstats_last_gc_time_seconds 0
# HELP go_memstats_lookups_total Total number of pointer lookups.
# TYPE go_memstats_lookups_total counter
go_memstats_lookups_total 0
# HELP go_memstats_mallocs_total Total number of mallocs.
# TYPE go_memstats_mallocs_total counter
go_memstats_mallocs_total 5048
# HELP go_memstats_mcache_inuse_bytes Number of bytes in use by mcache structures.
# TYPE go_memstats_mcache_inuse_bytes gauge
go_memstats_mcache_inuse_bytes 1728
# HELP go_memstats_mcache_sys_bytes Number of bytes used for mcache structures obtained from system.
# TYPE go_memstats_mcache_sys_bytes gauge
go_memstats_mcache_sys_bytes 16384
# HELP go_memstats_mspan_inuse_bytes Number of bytes in use by mspan structures.
# TYPE go_memstats_mspan_inuse_bytes gauge
go_memstats_mspan_inuse_bytes 20216
# HELP go_memstats_mspan_sys_bytes Number of bytes used for mspan structures obtained from system.
# TYPE go_memstats_mspan_sys_bytes gauge
go_memstats_mspan_sys_bytes 32768
# HELP go_memstats_next_gc_bytes Number of heap bytes when next garbage collection will take place.
# TYPE go_memstats_next_gc_bytes gauge
go_memstats_next_gc_bytes 4.473924e+06
# HELP go_memstats_other_sys_bytes Number of bytes used for other system allocations.
# TYPE go_memstats_other_sys_bytes gauge
go_memstats_other_sys_bytes 531412
# HELP go_memstats_stack_inuse_bytes Number of bytes in use by the stack allocator.
# TYPE go_memstats_stack_inuse_bytes gauge
go_memstats_stack_inuse_bytes 262144
# HELP go_memstats_stack_sys_bytes Number of bytes obtained from system for stack allocator.
# TYPE go_memstats_stack_sys_bytes gauge
go_memstats_stack_sys_bytes 262144
# HELP go_memstats_sys_bytes Number of bytes obtained from system.
# TYPE go_memstats_sys_bytes gauge
go_memstats_sys_bytes 7.1366904e+07
# HELP go_threads Number of OS threads created.
# TYPE go_threads gauge
go_threads 4
# HELP pg_exporter_last_scrape_duration_seconds Duration of the last scrape of metrics from PostgresSQL.
# TYPE pg_exporter_last_scrape_duration_seconds gauge
pg_exporter_last_scrape_duration_seconds 6.001341558
# HELP pg_exporter_last_scrape_error Whether the last scrape of metrics from PostgreSQL resulted in an error (1 for error, 0 for success).
# TYPE pg_exporter_last_scrape_error gauge
pg_exporter_last_scrape_error 1
# HELP pg_exporter_scrapes_total Total number of times PostgresSQL was scraped for metrics.
# TYPE pg_exporter_scrapes_total counter
pg_exporter_scrapes_total 4
# HELP pg_up Whether the last scrape of metrics from PostgreSQL was able to connect to the server (1 for yes, 0 for no).
# TYPE pg_up gauge
pg_up 0
# HELP postgres_exporter_build_info A metric with a constant '1' value labeled by version, revision, branch, and goversion from which postgres_exporter was built.
# TYPE postgres_exporter_build_info gauge
postgres_exporter_build_info{branch="",goversion="go1.11",revision="",version="0.0.1"} 1
# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total 0.03
# HELP process_max_fds Maximum number of open file descriptors.
# TYPE process_max_fds gauge
process_max_fds 1.048576e+06
# HELP process_open_fds Number of open file descriptors.
# TYPE process_open_fds gauge
process_open_fds 7
# HELP process_resident_memory_bytes Resident memory size in bytes.
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 9.097216e+06
# HELP process_start_time_seconds Start time of the process since unix epoch in seconds.
# TYPE process_start_time_seconds gauge
process_start_time_seconds 1.60099275112e+09
# HELP process_virtual_memory_bytes Virtual memory size in bytes.
# TYPE process_virtual_memory_bytes gauge
process_virtual_memory_bytes 1.14688e+08
# HELP process_virtual_memory_max_bytes Maximum amount of virtual memory available in bytes.
# TYPE process_virtual_memory_max_bytes gauge
process_virtual_memory_max_bytes -1
# HELP promhttp_metric_handler_requests_in_flight Current number of scrapes being served.
# TYPE promhttp_metric_handler_requests_in_flight gauge
promhttp_metric_handler_requests_in_flight 1
# HELP promhttp_metric_handler_requests_total Total number of scrapes by HTTP status code.
# TYPE promhttp_metric_handler_requests_total counter
promhttp_metric_handler_requests_total{code="200"} 2
promhttp_metric_handler_requests_total{code="500"} 0
promhttp_metric_handler_requests_total{code="503"} 0
</details></pre>
