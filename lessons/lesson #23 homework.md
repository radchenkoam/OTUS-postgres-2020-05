<div align="right"><h5> Занятие #23 - PostgreSQL и Kubernetes - Домашнее задание</h5></div>

<div align="center"><h2>Установка кластера PostgreSQL </br>от CrunchyData в Google Kubernetes Engine</h2></div>

***
<div align="center"><h4>1. Кластер GKE</h4></div>

***

- [создал GKE-кластер](https://cloud.google.com/kubernetes-engine/docs/how-to/creating-a-cluster "Ctrl-click -> new tab") командой :link: [gcloud container clusters create](https://cloud.google.com/sdk/gcloud/reference/container/clusters/create "Ctrl+click -> new tab")

<pre><details><summary>команда gcloud</summary>
$ gcloud beta container \
  --project "andrey-radchenko-19731204-04" clusters create "les-23" \
  --zone "us-central1-c" \
  --no-enable-basic-auth \
  --cluster-version "1.17.9-gke.1504" \
  --machine-type "e2-medium" \
  --image-type "COS" \
  --disk-type "pd-ssd" \
  --disk-size "100" \
  --metadata disable-legacy-endpoints=true \
  --scopes "https://www.googleapis.com/auth/cloud-platform" \
  --preemptible \
  --num-nodes "3" \
  --no-enable-stackdriver-kubernetes \
  --enable-ip-alias \
  --network "projects/andrey-radchenko-19731204-04/global/networks/default" \
  --subnetwork "projects/andrey-radchenko-19731204-04/regions/us-central1/subnetworks/default" \
  --default-max-pods-per-node "110" \
  --no-enable-master-authorized-networks \
  --addons HorizontalPodAutoscaling,HttpLoadBalancing \
  --enable-autoupgrade \
  --enable-autorepair \
  --max-surge-upgrade 1 \
  --max-unavailable-upgrade 0 \
  --no-shielded-integrity-monitoring
</details></pre>

- проверил - :+1: 
```bash
$ kubectl config get-contexts
CURRENT   NAME                                                    CLUSTER                                                 AUTHINFO                                                NAMESPACE
*         gke_andrey-radchenko-19731204-04_us-central1-c_les-23   gke_andrey-radchenko-19731204-04_us-central1-c_les-23   gke_andrey-radchenko-19731204-04_us-central1-c_les-23  

$ kubectl config current-context
gke_andrey-radchenko-19731204-04_us-central1-c_les-23

$ gcloud container clusters list
NAME    LOCATION       MASTER_VERSION   MASTER_IP       MACHINE_TYPE  NODE_VERSION     NUM_NODES  STATUS
les-23  us-central1-c  1.17.9-gke.1504  104.154.30.104  e2-medium     1.17.9-gke.1504  3          RUNNING

$ kubectl get all
NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.12.0.1    <none>        443/TCP   2m15s

$ kubectl config get-clusters
NAME
gke_andrey-radchenko-19731204-04_us-central1-c_les-23

$ kubectl cluster-info
Kubernetes master is running at https://104.154.30.104
GLBCDefaultBackend is running at https://104.154.30.104/api/v1/namespaces/kube-system/services/default-http-backend:http/proxy
KubeDNS is running at https://104.154.30.104/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
Metrics-server is running at https://104.154.30.104/api/v1/namespaces/kube-system/services/https:metrics-server:/proxy

$ kubectl get storageclasses
NAME                 PROVISIONER            RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
standard (default)   kubernetes.io/gce-pd   Delete          Immediate           true                   2m59s

```
:link: [kubectl commands](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands "Ctrl+click -> new tab")

***
<div align="center"><h4>2. Установка Crunchy PostgreSQL Operator от CrunchyData</h4></div>

***
:link: [Crunchy PostgreSQL Operator github](https://github.com/CrunchyData/postgres-operator "Ctrl+click -> new tab")
:link: [Crunchy PostgreSQL Operator documentation](https://access.crunchydata.com/documentation/postgres-operator/latest/ "Ctrl+click -> new tab")
:link: [install Crunchy PostgreSQL Operator in Google Cloud Platform](https://access.crunchydata.com/documentation/postgres-operator/4.4.1/quickstart/#google-cloud-platform-marketplace "Ctrl+click -> new tab")

- настроить и запустить _Crunchy PostgreSQL Operator for GKE_ можно сделать на :link: [этой странице](https://console.cloud.google.com/marketplace/details/crunchydata/crunchy-postgresql-operator "Ctrl+click -> new tab"), а можно (_в нашем случае - нужно_) вручную

- создал `namespace`
```bash
$ kubectl create namespace pgo
namespace/pgo created
```

- скачал файл манифеста развертывания _Crunchy PostgreSQL Operator for GKE_
```bash
$ sudo wget https://raw.githubusercontent.com/CrunchyData/postgres-operator/v4.4.1/installers/kubectl/postgres-operator.yml
```

:memo: в манифесте :link: [PersistentVolumes](https://cloud.google.com/kubernetes-engine/docs/concepts/persistent-volumes "Ctrl+click -> new tab") используют режим _ReadWriteMany_, но _PersistentVolumes_, которые поддерживаются постоянными дисками Google Compute Engine, не поддерживают этот режим доступа, поэтому требуется исправление

:memo: :exclamation: _кстати, вот [тут](https://medium.com/@Sushil_Kumar/readwritemany-persistent-volumes-in-google-kubernetes-engine-a0b93e203180 "Ctrl+click -> new tab") наш товарищ [Сушил Кумар](https://medium.com/@Sushil_Kumar "Ctrl+click -> new tab") советует, как это :point_up_2: ограничение обойти_

- немного исправил манифест :link: [настройка конфигурации](https://access.crunchydata.com/documentation/postgres-operator/4.4.1/installation/configuration/ "Ctrl+click -> new tab")
```yaml
...
storage1_access_mode: "ReadWriteOnce"
...
storage2_access_mode: "ReadWriteOnce"
...
storage3_access_mode: "ReadWriteOnce"
...
storage4_access_mode: "ReadWriteOnce"
...
```
> :exclamation: остальные параметры оставил по умолчанию - для тестовых целей сгодятся

- развернул _PostgreSQL Operator_
```
$ kubectl apply -f postgres-operator.yml
serviceaccount/pgo-deployer-sa created
clusterrole.rbac.authorization.k8s.io/pgo-deployer-cr created
configmap/pgo-deployer-cm created
clusterrolebinding.rbac.authorization.k8s.io/pgo-deployer-crb created
job.batch/pgo-deploy created
```

- проверил - :+1: 
```bash
$ kubectl -n pgo get deployments
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
postgres-operator   1/1     1            1           3m27s

$ kubectl -n pgo get pods
NAME                                 READY   STATUS      RESTARTS   AGE
pgo-deploy-zpjzq                     0/1     Completed   0          4m49s
postgres-operator-58f448cd8c-gjnr4   4/4     Running     1          3m42s
```

***
<div align="center"><h4>3. Установка и настройка клиента (pgo) Crunchy PostgreSQL Operator</h4></div>

***

:link: [PostgreSQL Operator (pgo) Client](https://access.crunchydata.com/documentation/postgres-operator/latest/installation/pgo-client/)

- установил ключи пользователя оператора _PostgreSQL_
```bash
$ kubectl get secret pgo.tls -n pgo -o jsonpath='{.data.tls\.key}' | base64 --decode > /tmp/client.key
$ kubectl get secret pgo.tls -n pgo -o jsonpath='{.data.tls\.crt}' | base64 --decode > /tmp/client.crt
```

- создал файл `${HOME?}/.pgo/pgo/pgouser` с содержимым `admin:examplepassword` (_значения по умолчанию в манифесте_)
```bash
$ cd ~
$ sudo mkdir .pgo
$ sudo mkdir .pgo/pgo
$ sudo nano ./.pgo/pgo/pgouser
$ cat ${HOME?}/.pgo/pgo/pgouser
```

- задал переменные среды для использования пары ключ/сертификат
```bash
$ export PGOUSER="${HOME?}/.pgo/pgo/pgouser" && \
  export PGO_CA_CERT="/tmp/client.crt" && \
  export PGO_CLIENT_CERT="/tmp/client.crt" && \
  export PGO_CLIENT_KEY="/tmp/client.key" && \
  export PGO_APISERVER_URL='https://127.0.0.1:8443' && \
  export PGO_NAMESPACE=pgo
```

- настроил переадресацию порта
```bash
$ kubectl -n pgo port-forward svc/postgres-operator 8443:8443
Forwarding from 127.0.0.1:8443 -> 8443
Forwarding from [::1]:8443 -> 8443
```
- проверил - :+1: 
```bash
$ pgo version
pgo client version 4.4.1
pgo-apiserver version 4.4.1

$ pgo show namespace --all
current local default namespace: pgo
pgo username: admin
namespace                useraccess          installaccess       
default                  no access           no access           
kube-node-lease          no access           no access           
kube-public              no access           no access           
kube-system              no access           no access           
pgo                      accessible          accessible 
```

- создал кластер PostgreSQL с названием `test` - :+1: 
```bash
$ pgo create cluster -n pgo test
created cluster: test
workflow id: a5125b14-e0cc-401e-8b07-7ec7d0d05d01
database name: test
users:
	username: testuser password: BloV2|87@Nz`*LUYw/D]@p(B
```

- проверил - :+1: 
```bash
$ pgo test -n pgo test

cluster : test
	Services
		primary (10.12.5.33:5432): UP
	Instances
		primary (test-c6479f55c-nfd4b): UP

$ pgo show cluster -n pgo test

cluster : test (crunchy-postgres-ha:centos7-12.4-4.4.1)
	pod : test-c6479f55c-nfd4b (Running) on gke-les-23-default-pool-1a64de20-fq77 (1/1) (primary)
		pvc: test (1Gi)
	resources : Memory: 128Mi
	deployment : test
	deployment : test-backrest-shared-repo
	service : test - ClusterIP (10.12.5.33)
	labels : name=test pg-cluster=test pg-pod-anti-affinity= pgo-version=4.4.1 workflowid=a5125b14-e0cc-401e-8b07-7ec7d0d05d01 autofail=true crunchy_collect=false deployment-name=test pgo-backrest=true pgouser=admin crunchy-pgbadger=false crunchy-pgha-scope=test 

$ kubectl -n pgo get deployments
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
postgres-operator           1/1     1            1           64m
test                        1/1     1            1           39m
test-backrest-shared-repo   1/1     1            1           39m

$ kubectl -n pgo get pods
NAME                                         READY   STATUS      RESTARTS   AGE
backrest-backup-test-vddqx                   0/1     Completed   0          38m
pgo-deploy-zpjzq                             0/1     Completed   0          66m
postgres-operator-58f448cd8c-gjnr4           4/4     Running     1          65m
test-backrest-shared-repo-84966555cd-fgf5l   1/1     Running     0          40m
test-c6479f55c-nfd4b                         1/1     Running     0          39m
test-stanza-create-469n2                     0/1     Completed   0          38m

$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                STORAGECLASS   REASON   AGE
pvc-06613aaa-694f-4d96-9387-284822aae517   1Gi        RWO            Delete           Bound    pgo/test-pgbr-repo   standard                45m
pvc-d9240d2f-9eb2-4023-8e4b-d1de3e85baa0   1Gi        RWO            Delete           Bound    pgo/test             standard                45m
```

- добавил 2 реплики в созданный кластер `test`
```bash
$ pgo scale test --replica-count=2
WARNING: Are you sure? (yes/no): y
created Pgreplica test-kubt
created Pgreplica test-qida
```

- проверил - :+1: 
```bash
$ pgo show cluster test

cluster : test (crunchy-postgres-ha:centos7-12.4-4.4.1)
	pod : test-c6479f55c-nfd4b (Running) on gke-les-23-default-pool-1a64de20-fq77 (1/1) (replica)
		pvc: test (1Gi)
	pod : test-ecgn-54d4c7b5f9-f8vf9 (Running) on gke-les-23-default-pool-1a64de20-fq77 (1/1) (primary)
		pvc: test-ecgn (1Gi)
	pod : test-gttn-65ddf9c9bc-sdzhh (Running) on gke-les-23-default-pool-1a64de20-5pdp (1/1) (replica)
		pvc: test-gttn (1Gi)
	pod : test-kubt-99598fbfd-lvq2z (Running) on gke-les-23-default-pool-1a64de20-31px (1/1) (replica)
		pvc: test-kubt (1Gi)
	pod : test-qida-968cf99c5-tvfdx (Running) on gke-les-23-default-pool-1a64de20-5pdp (1/1) (replica)
		pvc: test-qida (1Gi)
	resources : Memory: 128Mi
	deployment : test
	deployment : test-backrest-shared-repo
	deployment : test-ecgn
	deployment : test-gttn
	deployment : test-kubt
	deployment : test-qida
	service : test - ClusterIP (10.12.5.33)
	service : test-replica - ClusterIP (10.12.6.239)
	pgreplica : test-ecgn
	pgreplica : test-gttn
	pgreplica : test-kubt
	pgreplica : test-qida
	labels : name=test pg-cluster=test pg-pod-anti-affinity= pgo-backrest=true crunchy-pgbadger=false crunchy_collect=false deployment-name=test-gttn pgo-version=4.4.1 pgouser=admin workflowid=a5125b14-e0cc-401e-8b07-7ec7d0d05d01 autofail=true crunchy-pgha-scope=test 
```

- подключился к поду, который сейчас `primary`
    ```bash
    $ kubectl -n pgo port-forward pod/test-ecgn-54d4c7b5f9-f8vf9 5432:5432
    Forwarding from 127.0.0.1:5432 -> 5432
    Forwarding from [::1]:5432 -> 5432

    $ export PGPASSWORD='BloV2|87@Nz`*LUYw/D]@p(B'
    $ psql -h localhost -p 5432 -U testuser -d test
    ```
- проверил бд и создал таблицу
```bash
test=> \l
                                  List of databases
   Name    |  Owner   | Encoding |   Collate   |    Ctype    |   Access privileges   
-----------+----------+----------+-------------+-------------+-----------------------
 postgres  | postgres | UTF8     | en_US.utf-8 | en_US.utf-8 | 
 template0 | postgres | UTF8     | en_US.utf-8 | en_US.utf-8 | =c/postgres          +
           |          |          |             |             | postgres=CTc/postgres
 template1 | postgres | UTF8     | en_US.utf-8 | en_US.utf-8 | =c/postgres          +
           |          |          |             |             | postgres=CTc/postgres
 test      | postgres | UTF8     | en_US.utf-8 | en_US.utf-8 | =Tc/postgres         +
           |          |          |             |             | postgres=CTc/postgres+
           |          |          |             |             | testuser=CTc/postgres
(4 rows)

test=> create table public.ha_test as select generate_series(1,100000) ser_id;
SELECT 100000

test=> \dt+ public.
                      List of relations
 Schema |  Name   | Type  |  Owner   |  Size   | Description 
--------+---------+-------+----------+---------+-------------
 public | ha_test | table | testuser | 3544 kB | 
(1 row)

test=> select * from public.ha_test limit 10;
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
```

- отключился от `primary`, подключился к `replica`
```bash
$ kubectl -n pgo port-forward pod/test-c6479f55c-nfd4b 5432:5432
Forwarding from 127.0.0.1:5432 -> 5432
Forwarding from [::1]:5432 -> 5432

$ export PGPASSWORD='BloV2|87@Nz`*LUYw/D]@p(B'
$ psql -h localhost -p 5432 -U testuser -d test
```

- бд, таблица и данные на месте
```bash
test=> \l
                                  List of databases
   Name    |  Owner   | Encoding |   Collate   |    Ctype    |   Access privileges   
-----------+----------+----------+-------------+-------------+-----------------------
 postgres  | postgres | UTF8     | en_US.utf-8 | en_US.utf-8 | 
 template0 | postgres | UTF8     | en_US.utf-8 | en_US.utf-8 | =c/postgres          +
           |          |          |             |             | postgres=CTc/postgres
 template1 | postgres | UTF8     | en_US.utf-8 | en_US.utf-8 | =c/postgres          +
           |          |          |             |             | postgres=CTc/postgres
 test      | postgres | UTF8     | en_US.utf-8 | en_US.utf-8 | =Tc/postgres         +
           |          |          |             |             | postgres=CTc/postgres+
           |          |          |             |             | testuser=CTc/postgres
(4 rows)

test=> \dt+ public.
                      List of relations
 Schema |  Name   | Type  |  Owner   |  Size   | Description 
--------+---------+-------+----------+---------+-------------
 public | ha_test | table | testuser | 3568 kB | 
(1 row)

test=> select * from public.ha_test order by ser_id desc limit 10;
 ser_id 
--------
 100000
  99999
  99998
  99997
  99996
  99995
  99994
  99993
  99992
  99991
(10 rows)
```

- попробовал здесь вставить данные
```bash
test=> insert into public.ha_test (ser_id) values (100001);
ERROR:  cannot execute INSERT in a read-only transaction
```

:+1:  репликация работает нормально

- сделал ручной файловер
    - посмотрел состояние реплик
    ```bash
    $ pgo failover --query test
    
    Cluster: test
    REPLICA             	STATUS    	NODE      	REPLICATION LAG     	PENDING RESTART
    test                	running   	gke-les-23-default-pool-1a64de20-fq77	           0 MB     	          false
    test-gttn           	running   	gke-les-23-default-pool-1a64de20-5pdp	           0 MB     	          false
    test-kubt           	running   	gke-les-23-default-pool-1a64de20-31px	           0 MB     	          false
    test-qida           	running   	gke-les-23-default-pool-1a64de20-5pdp	           0 MB     	          false
    ```

    - продвинул реплику `test-kubt` в `primary`
    ```bash
    $ pgo failover test --target=test-kubt
    WARNING: Are you sure? (yes/no): y
    created Pgtask (failover) for cluster test
    ```

    - проверил :+1: под `test-kubt-99598fbfd-lvq2z` в состоянии `primary`
    ```bash
    $ pgo show cluster test

    cluster : test (crunchy-postgres-ha:centos7-12.4-4.4.1)
	    pod : test-c6479f55c-nfd4b (Running) on gke-les-23-default-pool-1a64de20-fq77 (1/1) (replica)
		    pvc: test (1Gi)
	    pod : test-ecgn-54d4c7b5f9-f8vf9 (Running) on gke-les-23-default-pool-1a64de20-fq77 (1/1) (replica)
		    pvc: test-ecgn (1Gi)
	    pod : test-gttn-65ddf9c9bc-sdzhh (Running) on gke-les-23-default-pool-1a64de20-5pdp (1/1) (replica)
		    pvc: test-gttn (1Gi)
	    pod : test-kubt-99598fbfd-lvq2z (Running) on gke-les-23-default-pool-1a64de20-31px (1/1) (primary)
		    pvc: test-kubt (1Gi)
	    pod : test-qida-968cf99c5-tvfdx (Running) on gke-les-23-default-pool-1a64de20-5pdp (1/1) (replica)
		    pvc: test-qida (1Gi)
	    resources : Memory: 128Mi
	    deployment : test
	    deployment : test-backrest-shared-repo
	    deployment : test-ecgn
	    deployment : test-gttn
	    deployment : test-kubt
	    deployment : test-qida
	    service : test - ClusterIP (10.12.5.33)
	    service : test-replica - ClusterIP (10.12.6.239)
	    pgreplica : test-ecgn
	    pgreplica : test-gttn
	    pgreplica : test-kubt
	    pgreplica : test-qida
	    labels : crunchy-pgbadger=false pgo-backrest=true pgouser=admin workflowid=a5125b14-e0cc-401e-8b07-7ec7d0d05d01 name=test pg-cluster=test pg-pod-anti-affinity= pgo-version=4.4.1 autofail=true crunchy-pgha-scope=test crunchy_collect=false deployment-name=test-kubt 
    ```

    - попробовал удалить реплику - :+1: - удалилась нормально
```bash
$ pgo failover --query test

Cluster: test
REPLICA             	STATUS    	NODE      	REPLICATION LAG     	PENDING RESTART
test                	running   	gke-les-23-default-pool-1a64de20-fq77	           0 MB     	          false
test-ecgn           	running   	gke-les-23-default-pool-1a64de20-fq77	           0 MB     	          false
test-gttn           	running   	gke-les-23-default-pool-1a64de20-5pdp	           0 MB     	          false
test-qida           	running   	gke-les-23-default-pool-1a64de20-5pdp	           0 MB     	          false

$ pgo scaledown test --target=test-qida
WARNING: Are you sure? (yes/no): y
deleted replica test-qida

$ pgo failover --query test

Cluster: test
REPLICA             	STATUS    	NODE      	REPLICATION LAG     	PENDING RESTART
test                	running   	gke-les-23-default-pool-1a64de20-fq77	           0 MB     	          false
test-ecgn           	running   	gke-les-23-default-pool-1a64de20-fq77	           0 MB     	          false
test-gttn           	running   	gke-les-23-default-pool-1a64de20-5pdp	           0 MB     	          false
```

- но `primary` удалить мне не удалось (_несильно погуглил - не нашел, в документации тоже нет_)
```bash
$ pgo show cluster test

cluster : test (crunchy-postgres-ha:centos7-12.4-4.4.1)
	pod : test-c6479f55c-nfd4b (Running) on gke-les-23-default-pool-1a64de20-fq77 (1/1) (replica)
		pvc: test (1Gi)
	pod : test-ecgn-54d4c7b5f9-f8vf9 (Running) on gke-les-23-default-pool-1a64de20-fq77 (1/1) (replica)
		pvc: test-ecgn (1Gi)
	pod : test-gttn-65ddf9c9bc-sdzhh (Running) on gke-les-23-default-pool-1a64de20-5pdp (1/1) (replica)
		pvc: test-gttn (1Gi)
	pod : test-kubt-99598fbfd-lvq2z (Running) on gke-les-23-default-pool-1a64de20-31px (1/1) (primary)
		pvc: test-kubt (1Gi)
	resources : Memory: 128Mi
	deployment : test
	deployment : test-backrest-shared-repo
	deployment : test-ecgn
	deployment : test-gttn
	deployment : test-kubt
	service : test - ClusterIP (10.12.5.33)
	service : test-replica - ClusterIP (10.12.6.239)
	pgreplica : test-ecgn
	pgreplica : test-gttn
	pgreplica : test-kubt
	labels : autofail=true crunchy-pgbadger=false pg-pod-anti-affinity= pgo-version=4.4.1 workflowid=a5125b14-e0cc-401e-8b07-7ec7d0d05d01 crunchy-pgha-scope=test crunchy_collect=false deployment-name=test-kubt name=test pg-cluster=test pgo-backrest=true pgouser=admin 
$ pgo scaledown test --target=test-kubt
WARNING: Are you sure? (yes/no): y
Error: Unable to find replica with name test-kubt
```

:link: [Мультикластерное развертывание (основной и резервный кластер)](https://access.crunchydata.com/documentation/postgres-operator/latest/architecture/high-availability/multi-cluster-kubernetes/ "Ctrl+click -> new tab")

:exclamation: **ИТОГ**: _Crunchy PostgreSQL Operator от CrunchyData вполне рабочий инструмент с неплохими возможностями, широкими возможностями настройки, несложно устанавливается, стабильно работает и хорошо поддерживается в GCP; мое мнение - он достоин более глубокого изучения_
