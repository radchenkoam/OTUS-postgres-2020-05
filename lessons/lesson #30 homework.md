<div align="right"><h5> Занятие #30 - Веб-приложение с UI и БД - Домашнее задание</h5></div>


<div align="center"><h2>Разработка собственного приложения для работы с кластером</h2></div>


***
<div align="center"><h3>1. Кластер GKE</h3></div>

***

- развернул командой `gcloud`
<pre><details><summary>cluster-1</summary>
gcloud beta container --project "andrey-radchenko-19731204-04" clusters create "cluster-1" 
   --zone "europe-north1-c" 
   --no-enable-basic-auth 
   --cluster-version "1.17.9-gke.1504" 
   --release-channel "regular" 
   --machine-type "n1-standard-1" 
   --image-type "COS" 
   --disk-type "pd-ssd" 
   --disk-size "100" 
   --metadata disable-legacy-endpoints=true 
   --scopes "https://www.googleapis.com/auth/cloud-platform" 
   --num-nodes "3" 
   --enable-stackdriver-kubernetes 
   --enable-ip-alias 
   --network "projects/andrey-radchenko-19731204-04/global/networks/default" 
   --subnetwork "projects/andrey-radchenko-19731204-04/regions/europe-north1/subnetworks/default" 
   --default-max-pods-per-node "110" 
   --no-enable-master-authorized-networks 
   --addons HorizontalPodAutoscaling,HttpLoadBalancing 
   --enable-autoupgrade 
   --enable-autorepair 
   --max-surge-upgrade 1 
   --max-unavailable-upgrade 0</details></pre>


***
<div align="center"><h3>2. Кластер PostgreSQL</h3></div>

***

:link: [Kubernetes Native PostgreSQL-as-a-Service от Crunchy Data](https://github.com/radchenkoam/OTUS-postgres-2020-05/blob/dev/lessons/Crunchy%20PostgreSQL%20%D0%B4%D0%BB%D1%8F%20Kubernetes.md "Ctrl+click->new tab")

- установил :link: [Crunchy PostgreSQL for GKE](https://console.cloud.google.com/marketplace/details/crunchydata/crunchy-postgresql-operator "Ctrl+click->new tab") в Google Kubernetes Engine cluster используя Google Cloud Marketplace  

<pre><details><summary>проверил</summary>
$ kubectl get deployments,pods
NAME                                READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/postgres-operator   1/1     1            1           9h

NAME                                               READY   STATUS      RESTARTS   AGE
pod/crunchy-postgresql-operator-1-deployer-vdthf   0/1     Completed   0          9h
pod/install-postgres-operator-7v56x                0/1     Completed   0          9h
pod/postgres-operator-6f96d7ddf8-zw4px             4/4     Running     1          9h
</summary></pre>

- установил TLS-ключи пользователя PostgreSQL Operator, используемые для защиты API REST
```bash
$ kubectl get secret pgo.tls -o 'go-template={{ index .data "tls.crt" | base64decode }}' > /tmp/client.crt
$ kubectl get secret pgo.tls -o 'go-template={{ index .data "tls.key" | base64decode }}' > /tmp/client.key
```

- настроил пользователя PostgreSQL Operator
    - создал файл `${HOME?}/.pgo/<operatornamespace>/pgouser`, вставил имя пользователя и пароль, который указал при развертывании оператора PostgreSQL через GCP Marketplace

    ```yaml
    admin:Qwerty@12345
    ```

> :exclamation: _Оператор PostgreSQL реализует свою собственную систему управления доступом на основе ролей (RBAC) для аутентификации и авторизации доступа пользователей Оператора PostgreSQL к его REST API. Пользователь-оператор PostgreSQL по умолчанию (также известный как «pgouser») создается как часть установки Marketplace (эти учетные данные устанавливаются во время рабочего процесса развертывания Marketplace)._

- настроил переменные окружения
```bash
$ export PGOUSER="${HOME?}/.pgo/pgo/pgouser"  && 
export PGO_CA_CERT="/tmp/client.crt" && 
export PGO_CLIENT_CERT="/tmp/client.crt" && 
export PGO_CLIENT_KEY="/tmp/client.key" && 
export PGO_APISERVER_URL='https://127.0.0.1:8443' && 
export PGO_NAMESPACE=default
```
> :exclamation: _Клиент PostgreSQL Operator использует несколько переменных окружения, чтобы упростить взаимодействие с PostgreSQL Operator._

- скачал новый клиент PostgreSQL Operator - **pgo** (v4.5.0)
```bash
$ wget https://github.com/CrunchyData/postgres-operator/releases/download/v4.5.0/pgo
$ sudo mv pgo /usr/local/bin/pgo
$ sudo chmod +x /usr/local/bin/pgo
```
- проверил версию - :+1: 
```
$ kubectl port-forward --namespace 'default' service/postgres-operator 8443
$ pgo version
pgo client version 4.5.0
pgo-apiserver version 4.5.0
```

- установил PostgreSQL Operator Мониторинг

```bash
$ kubectl create namespace pgo
$ kubectl apply -f https://raw.githubusercontent.com/CrunchyData/postgres-operator/v4.5.0/installers/metrics/kubectl/postgres-operator-metrics.yml
```

- создал кластер PostgreSQL с именем **gw** (graduation work), при указании `--metrics` разворачиваются также инструменты мониторинга
```bash
$ pgo create cluster --metrics gw
created cluster: gw
workflow id: 6f4e8e61-9db5-4d8c-8078-36ee9e40d503
database name: gw
users:
	username: testuser password: 1VoNHvW@bzdW2qq-;}[]YVm@
```
<pre><details><summary>проверил</summary>
$ kubectl get all
NAME                                               READY   STATUS      RESTARTS   AGE
pod/backrest-backup-gw-7jv9n                       0/1     Completed   0          6m8s
pod/crunchy-postgresql-operator-1-deployer-vdthf   0/1     Completed   0          12h
pod/gw-6fc99b96f9-rwtqr                            2/2     Running     0          7m15s
pod/gw-backrest-shared-repo-69b8f85fcc-k6txp       1/1     Running     0          7m37s
pod/gw-stanza-create-9dbpj                         0/1     Completed   0          6m20s
pod/install-postgres-operator-7v56x                0/1     Completed   0          12h
pod/postgres-operator-6f96d7ddf8-zw4px             4/4     Running     1          12h

NAME                              TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)                                        AGE
service/gw                        LoadBalancer   10.3.245.111   35.228.2.44   9187:30270/TCP,2022:31514/TCP,5432:30997/TCP   7m37s
service/gw-backrest-shared-repo   ClusterIP      10.3.254.176   <none>        2022/TCP                                       7m37s
service/kubernetes                ClusterIP      10.3.240.1     <none>        443/TCP                                        12h
service/postgres-operator         ClusterIP      10.3.240.7     <none>        8443/TCP,4171/TCP,4150/TCP                     12h

NAME                                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/gw                        1/1     1            1           7m38s
deployment.apps/gw-backrest-shared-repo   1/1     1            1           7m38s
deployment.apps/postgres-operator         1/1     1            1           12h

NAME                                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/gw-6fc99b96f9                        1         1         1       7m38s
replicaset.apps/gw-backrest-shared-repo-69b8f85fcc   1         1         1       7m38s
replicaset.apps/postgres-operator-6f96d7ddf8         1         1         1       12h

NAME                                               COMPLETIONS   DURATION   AGE
job.batch/backrest-backup-gw                       1/1           15s        6m9s
job.batch/crunchy-postgresql-operator-1-deployer   1/1           2m34s      12h
job.batch/gw-stanza-create                         1/1           11s        6m21s
job.batch/install-postgres-operator                1/1           2m5s       12h

NAME                                                   TYPE                          VERSION   OWNER   READY   AGE
application.app.k8s.io/crunchy-postgresql-operator-1   Crunchy PostgreSQL Operator   4.5.0             3/3     12h

$ kubectl -n pgo get all -o wide
NAME                                        READY   STATUS      RESTARTS   AGE     IP         NODE                                       NOMINATED NODE   READINESS GATES
pod/crunchy-alertmanager-56d4446d77-zpkl4   1/1     Running     0          9m30s   10.0.0.7   gke-cluster-1-default-pool-0d8b175f-m3jg   <none>           <none>
pod/crunchy-grafana-d6dc9cb95-7jgcg         1/1     Running     0          9m6s    10.0.0.8   gke-cluster-1-default-pool-0d8b175f-m3jg   <none>           <none>
pod/crunchy-prometheus-6dd7cff4dc-sjhq5     1/1     Running     0          9m20s   10.0.1.8   gke-cluster-1-default-pool-0d8b175f-rq2f   <none>           <none>
pod/pgo-metrics-deploy-292qc                0/1     Completed   0          10m     10.0.1.7   gke-cluster-1-default-pool-0d8b175f-rq2f   <none>           <none>

NAME                           TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE     SELECTOR
service/crunchy-alertmanager   ClusterIP   10.3.253.62    <none>        9093/TCP   9m32s   name=crunchy-alertmanager
service/crunchy-grafana        ClusterIP   10.3.244.104   <none>        3000/TCP   9m7s    name=crunchy-grafana
service/crunchy-prometheus     ClusterIP   10.3.249.184   <none>        9090/TCP   9m21s   name=crunchy-prometheus

NAME                                   READY   UP-TO-DATE   AVAILABLE   AGE     CONTAINERS     IMAGES                      SELECTOR
deployment.apps/crunchy-alertmanager   1/1     1            1           9m31s   alertmanager   prom/alertmanager:v0.21.0   app.kubernetes.io/name=postgres-operator-monitoring,name=crunchy-alertmanager
deployment.apps/crunchy-grafana        1/1     1            1           9m6s    grafana        grafana/grafana:6.7.4       app.kubernetes.io/name=postgres-operator-monitoring,name=crunchy-grafana
deployment.apps/crunchy-prometheus     1/1     1            1           9m20s   prometheus     prom/prometheus:v2.20.0     app.kubernetes.io/name=postgres-operator-monitoring,name=crunchy-prometheus

NAME                                              DESIRED   CURRENT   READY   AGE     CONTAINERS     IMAGES                      SELECTOR
replicaset.apps/crunchy-alertmanager-56d4446d77   1         1         1       9m30s   alertmanager   prom/alertmanager:v0.21.0   app.kubernetes.io/name=postgres-operator-monitoring,name=crunchy-alertmanager,pod-template-hash=56d4446d77
replicaset.apps/crunchy-grafana-d6dc9cb95         1         1         1       9m6s    grafana        grafana/grafana:6.7.4       app.kubernetes.io/name=postgres-operator-monitoring,name=crunchy-grafana,pod-template-hash=d6dc9cb95
replicaset.apps/crunchy-prometheus-6dd7cff4dc     1         1         1       9m20s   prometheus     prom/prometheus:v2.20.0     app.kubernetes.io/name=postgres-operator-monitoring,name=crunchy-prometheus,pod-template-hash=6dd7cff4dc

NAME                           COMPLETIONS   DURATION   AGE   CONTAINERS           IMAGES                                                                       SELECTOR
job.batch/pgo-metrics-deploy   1/1           2m7s       10m   pgo-metrics-deploy   registry.developers.crunchydata.com/crunchydata/pgo-deployer:centos7-4.5.0   controller-uid=6d3221f1-1417-4868-859f-7e8fe895fd33</details></pre>


- подключился по внешнему IP LoadBalancer`a - :+1: 
```bash
$ export PGPASSWORD='1VoNHvW@bzdW2qq-;}[]YVm@'
$ psql -h 35.228.2.44 -p 5432 -U testuser -d gw
psql (12.4 (Ubuntu 12.4-0ubuntu0.20.04.1))
Type "help" for help.

gw=> select version();
                                                 version                                                 
---------------------------------------------------------------------------------------------------------
 PostgreSQL 12.4 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 4.8.5 20150623 (Red Hat 4.8.5-39), 64-bit
(1 row)
```

***
<div align="center"><h3>3. Приложение Person-app</h3></div>

***
:link: [**person-app github**](https://github.com/radchenkoam/OTUS-postgres-2020-05/tree/dev/person-app "Ctrl+click->new tab") :link: [**person-app api docs**](https://documenter.getpostman.com/view/12962384/TVRoZ6oy "Ctrl+click->new tab") 
- приложение называется просто :link: [**person-app**](https://github.com/radchenkoam/OTUS-postgres-2020-05/tree/dev/person-app "Ctrl+click->new tab"), разработано на `node.js` с использованием фреймворка `express`

- реализованы следующие методы
    - `GET /person` - возвращает все записи Person
    - `GET /person?` - возвращает записи по запросу с параметрами, например: `id=1`
    - `GET /person/nnn` - где nnn - требуемый идентификатор Person, возвращает запись с указанным идентификатором
    - `POST /person` - добавляет Person со случайно сгенерированными именем и возрастом
    - `POST /person --header 'Content-Type: application/json' --data-raw '{"name": "Анатолий Вассерман", "age": 67}'` - добавляет Person с указанным именем и возрастом
    - `DELETE /person/nnn`- где nnn - требуемый идентификатор Person, удаляет запись с указанным идентификатором
    - `GET /persons/total` - возвращает общее количество Person
    > _для служебных целей реализованы еще несколько методов (очистка, создание и удаление таблицы person)_

- запустил приложение локально
```bash
$ node index.js
🚀 are live on 5000
```

***
<div align="center"><h3>4. Yandex.Tank</h3></div>

***

- для запуска [Yandex.Tank](https://yandextank.readthedocs.io/en/latest/index.html "Ctrl+click->new tab") установил [Docker](https://docs.docker.com/engine/install/ubuntu/ "Ctrl+click->newtab")

- добавил конфиги Yandex.Tank, тестирование проводится на методе POST, добавляющем случайные записи Person, в течение 5 минут со скоростью 1000 rps
<pre><details><summary>load.yaml</summary>
phantom:
  address: 127.0.0.1:5000 
  instances: 50
  load_profile:
    load_type: rps 
    schedule: const(1000, 5m)
  ammofile: /var/loadtest/ammo_local.txt
  ammo_type: uripost
console:
  enabled: true
telegraf:
  enabled: false
</details></pre>

<pre><details><summary>ammo_local.txt</summary>
[Host: 127.0.0.1:5000]
[Connection: keep-alive]
[User-Agent: Tank]
[Content-Type: application/json]
0 /person
</details></pre>

- запустил, перейдя в каталог с файлами конфигурации
```bash
$ sudo docker run -v $(pwd):/var/loadtest --rm --net host -it direvius/yandex-tank
```


***
<div align="center"><h3>5. Мониторинг</h3></div>

***

- сделал небольшой дашборд в Grafana для более наглядного отображения процесса
- прокинул порт на локальный компьютер для запуска мониторинга в браузере
```bash
$ kubectl -n pgo port-forward service/crunchy-grafana 3000
Forwarding from 127.0.0.1:3000 -> 3000
Forwarding from [::1]:3000 -> 3000
```

- процесс пошел
![image](https://user-images.githubusercontent.com/29423304/96723890-d21d2380-13b7-11eb-9f30-217172fed019.png)


- в Grafana также видно работу приложения
![image](https://user-images.githubusercontent.com/29423304/96724173-350eba80-13b8-11eb-9273-e92e04a57daf.png)

мой дашборд показывает общее количество записей в таблице person, текущее количество TPS, и последних 10 добавленных Person


- один из дашбордов от Crunchy - **PostgreSQLDetails**
![image](https://user-images.githubusercontent.com/29423304/96724640-ba926a80-13b8-11eb-8855-bdc45726c5c2.png)
целиком не поместился :)

- в Postman можно подергать ручки

![image](https://user-images.githubusercontent.com/29423304/96725800-f7129600-13b9-11eb-8846-a4b0feab0f08.png)

![image](https://user-images.githubusercontent.com/29423304/96725574-a7cc6580-13b9-11eb-8a38-dc37c1fe939f.png)

![image](https://user-images.githubusercontent.com/29423304/96725652-bf0b5300-13b9-11eb-8617-4fe8b0465d00.png)


:+1: все работает нормально
