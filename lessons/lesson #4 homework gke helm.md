<div align="right"><h5> Занятие #4 - Домашнее задание - Доп вариант</h5></div>


<div align="center"><h2>Установка и настройка PostgreSQL<br/>в Google Kubernetes Engine с помощью Helm-chart</h2></div>

***

- Перешел в _Google Kubernetes Engine_
- Выбрал опцию "Мой первый кластер", там всё посоздавалось само по себе :)
- Сконфигурировал доступ _kubectl_ к проекту со своего компа:  
`gcloud container clusters get-credentials my-first-cluster-1 --zone us-central1-c --project andrey-radchenko-19731204-04`
```bash
Fetching cluster endpoint and auth data.
kubeconfig entry generated for my-first-cluster-1.
```
Проверка: '$ kubectl get nodes'
```bash
NAME                                                STATUS   ROLES    AGE   VERSION
gke-my-first-cluster-1-default-pool-1c7acfc7-6fbn   Ready    <none>   29m   v1.17.5-gke.9
gke-my-first-cluster-1-default-pool-1c7acfc7-bcr2   Ready    <none>   29m   v1.17.5-gke.9
gke-my-first-cluster-1-default-pool-1c7acfc7-xmwj   Ready    <none>   29m   v1.17.5-gke.9
```
- Добавил helm-репозиторий _bitnami_:  
`$ helm repo add bitnami https://charts.bitnami.com/bitnami`
- Нашел репозиторий _postgres_: `$ helm search repo`
- Установил _postgres_: `$ helm install my-postgres bitnami/postgresql`  
```bash
NAME: my-release
LAST DEPLOYED: Mon Jun 15 13:51:37 2020
NAMESPACE: default
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
** Please be patient while the chart is being deployed **

PostgreSQL can be accessed via port 5432 on the following DNS name from within your cluster:

    my-release-postgresql.default.svc.cluster.local - Read/Write connection

To get the password for "postgres" run:

    export POSTGRES_PASSWORD=$(kubectl get secret --namespace default my-release-postgresql -o jsonpath="{.data.postgresql-password}" | base64 --decode)

To connect to your database run the following command:

    kubectl run my-release-postgresql-client --rm --tty -i --restart='Never' --namespace default --image docker.io/bitnami/postgresql:11.8.0-debian-10-r19 --env="PGPASSWORD=$POSTGRES_PASSWORD" --command -- psql --host my-release-postgresql -U postgres -d postgres -p 5432



To connect to your database from outside the cluster execute the following commands:

    kubectl port-forward --namespace default svc/my-release-postgresql 5432:5432 &
    PGPASSWORD="$POSTGRES_PASSWORD" psql --host 127.0.0.1 -U postgres -d postgres -p 5432
```
- Выполнил экспорт пароля в переменную POSTGRES_PASSWORD:  
`export POSTGRES_PASSWORD=$(kubectl get secret --namespace default my-release-postgresql -o jsonpath="{.data.postgresql-password}" | base64 --decode)`
- Подключился:  
`kubectl port-forward --namespace default svc/my-release-postgresql 5432:5432 &
    PGPASSWORD="$POSTGRES_PASSWORD" psql --host 127.0.0.1 -U postgres -d postgres -p 5432`
- Создал таблицу, заполнил данными:
```sql
create table test (id int, "name" text);
insert into test (id, "name") values (1, 'Yuri Gagarin'), (2, 'German Titov');
```
Проверка:
```bash
postgres=# select * from test;
 id |     name     
----+--------------
  1 | Yuri Gagarin
  2 | German Titov
(2 rows)
```
