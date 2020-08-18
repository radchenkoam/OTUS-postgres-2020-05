### Занятие #2
***
SQL и реляционные СУБД. Введение в PostgreSQL
---
***
### Краткая инструкция по созданию инстанса в GCP

- зарегистрируйтесь в [GCP](https://cloud.google.com/)
- создайте виртуальную машину c *Ubuntu 18.04 LTS (bionic)* в *GCE* типа
*n1-standard-1* в default *VPC* в любом регионе и зоне, например *us-central1-a*
- запустите инстанс
- на своей машиине создаем каталог: `mkdir $HOME\.ssh`
- даем права на него: `chown $HOME\.ssh 0700`
- генерируем ssh ключ: `ssh-keygen имя`
- добавляем его: `ssh-add имя`
- добавить свой *ssh ключ* в *GCE metadata*
- заходим со своего хоста: `ssh имя@ip созданной ВМ`
- устанавливаем *postgresql* и *postgresql-contrib* через `apt`
- проверьте что кластер запущен через `sudo -u postgres pg_lsclusters`
***
### Домашнее задание
#### Работа с уровнями изоляции транзакции в PostgreSQL
**Цель:** _Научиться работать с Google Cloud Platform на уровне Google Compute Engine (IaaS) - научиться управлять уровнем изолции транзации в PostgreSQL, и понимать особенность работы уровней read committed и repeatable read_
- создать новый проект в *Google Cloud Platform*, например postgres2020-<yyyymmdd>, где yyyymmdd год, месяц и день вашего рождения (имя проекта должно быть уникально на уровне *GCP*)
- дать возможность доступа к этому проекту пользователю postgres202005@gmail.com с ролью *Project Editor*
- далее создать инстанс виртуальной машины *Compute Engine* с дефолтными параметрами
- добавить свой *ssh ключ* в *GCE metadata*
- зайти удаленным *ssh* (первая сессия), не забывайте про `ssh-add`
- поставить *PostgreSQL*
- зайти вторым *ssh* (вторая сессия)
- запустить везде *psql* из под пользователя *postgres*
- выключить *auto commit*
- сделать в первой сессии новую таблицу и наполнить ее данными
```sql
create table persons(id serial, first_name text, second_name text);
insert into persons(first_name, second_name) values('ivan', 'ivanov');
insert into persons(first_name, second_name) values('petr', 'petrov');
commit;
```
- посмотреть текущий уровень изоляции: `show transaction isolation level`
- начать новую транзакцию в обоих сессиях с дефолтным (не меняя) уровнем изоляции
- в первой сессии добавить новую запись
```sql
insert into persons(first_name, second_name) values('sergey', 'sergeev');
```
- сделать `select * from persons` во второй сессии
- видите ли вы новую запись и если да то почему?
- завершить первую транзакцию - `commit;`
- сделать `select * from persons` во второй сессии
- видите ли вы новую запись и если да то почему?
- завершите транзакцию во второй сессии
- начать новые но уже *repeatable read*-транзакции 
```sql
set transaction isolation level repeatable read;
```
- в первой сессии добавить новую запись

```sql
insert into persons(first_name, second_name) values('sveta', 'svetova');
```
- сделать `select * from persons` во второй сессии
- видите ли вы новую запись и если да то почему?
- завершить первую транзакцию - `commit;`
- сделать `select * from persons` во второй сессии
- видите ли вы новую запись и если да то почему?
- завершить вторую транзакцию
- сделать `select * from persons` во второй сессии
- видите ли вы новую запись и если да то почему?
- остановите виртуальную машину но не удаляйте ее




