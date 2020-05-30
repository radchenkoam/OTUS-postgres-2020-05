### Занятие #2
***
SQL и реляционные СУБД. Введение в PostgreSQL
---
***
### Домашнее задание
1. Зарегистрировался в [GCP](https://cloud.google.com/).
2. Создал новый проект в [GCP](https://cloud.google.com/) - [postgres-2020-05-19731204](https://console.cloud.google.com/home/dashboard?organizationId=0&project=postgres-2020-05-19731204).
3. Дал доступ к проекту пользователю postgres202005@gmail.com с ролью *Project Editor*.
4. Создал и запустил виртуальную машину **pg-test-01** c *Ubuntu 18.04 LTS (bionic)* в *GCE* типа *n1-standard-1* в *us-central1-a*.
5. Добавил *ssh-ключ* в *GCE Метаданные*.
6. Зашел со своего компа через терминал по *ssh* на вм **pg-test-01**.
7. Установил *postgresql-12*:
```bash
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt -y install postgresql-12 postgresql-client-12
```
проверка:
```bash
am@pg-test-01:~$ sudo -u postgres pg_lsclusters
Ver Cluster Port Status Owner    Data directory              Log file
12  main    5433 online postgres /var/lib/postgresql/12/main /var/log/postgresql/postgresql-12-main.log
```
8. Зашел на ВМ **pg-test-01** второй ssh-сессией.
9. Переключился на пользователя *postgres* `sudo su postgres`.
10. Запустил в обеих сессиях *psql*.
11. Отключил в обеих сессиях автокоммит `\set AUTOCOMMIT off`.
проверка: `\set` (AUTOCOMMIT = 'off')
12. Сделал в первой сессии новую таблицу, наполнил ее данными:
```sql
create table persons(id serial, first_name text, second_name text);
insert into persons(first_name, second_name) values('ivan', 'ivanov');
insert into persons(first_name, second_name) values('petr', 'petrov');
commit;
```
проверка: `\d`
```bash
               List of relations
 Schema |      Name      |   Type   |  Owner   
--------+----------------+----------+----------
 public | persons        | table    | postgres
 public | persons_id_seq | sequence | postgres
(2 rows)
```

```bash
postgres=# select * from persons;
 id | first_name | second_name 
----+------------+-------------
  1 | ivan       | ivanov
  2 | petr       | petrov
(2 rows)
```
13. Проверил текущий уровень изоляции транзакций (в обеих сессиях одинаковый):
```bash
postgres=# show transaction isolation level;
 transaction_isolation 
-----------------------
 read committed
(1 row)
```
***
### read committed
***
14.  Начал транзакцию в обеих сессиях:
```bash
postgres=# begin transaction;
BEGIN
```
15. В первой сессии добавил запись:
```bash
postgres=# insert into persons(first_name, second_name) values('sergey', 'sergeev');
INSERT 0 1
```
Проверка новой записи во второй сессии (в обеих сессиях открыты транзакции):
```bash
postgres=# select * from persons;
 id | first_name | second_name 
----+------------+-------------
  1 | ivan       | ivanov
  2 | petr       | petrov
(2 rows)
```
**Q: Видите ли вы новую запись и если да то почему?**
*A: Новую запись не видно.*

16. Завершил транзакцию в первой сессии:
```bash
postgres=# commit;
COMMIT
```
Проверка новой записи во второй сессии  (в первой сессии - транзакция закрыта, во второй - открыта):
```bash
postgres=# select * from persons;
 id | first_name | second_name 
----+------------+-------------
  1 | ivan       | ivanov
  2 | petr       | petrov
  3 | sergey     | sergeev
(3 rows)
```
**Q: Видите ли вы новую запись и если да то почему?**
*A: Да, запись видно, т.к. текущий уровень изоляции транзакции **read committed** видит только те данные, которые были зафиксированы до момента начала транзакции или зафиксированы параллельными транзакциями в процессе выполнения текущей транзакции.*

17. Зафиксировал транзакцию во второй сессии:
```bash
postgres=# commit;
COMMIT
```
***
### repeatable read
***
18. Начал **repeatable read-транзакции** в обеих сессиях:
```bash
postgres=# begin transaction isolation level repeatable read;
BEGIN
```
Проверка:
```bash
postgres=# show transaction isolation level;
 transaction_isolation 
-----------------------
 repeatable read
(1 row)
```
19. В первой сессии вставил данные:
```bash
postgres=# insert into persons(first_name, second_name) values('sveta', 'svetova');
INSERT 0 1
```
Проверка новой записи (в первой сессии):
```bash
postgres=# select * from persons;
 id | first_name | second_name 
----+------------+-------------
  1 | ivan       | ivanov
  2 | petr       | petrov
  3 | sergey     | sergeev
  4 | sveta      | svetova
(4 rows)
```

Проверка новой записи (во второй сессии):
```bash
postgres=# select * from persons;
 id | first_name | second_name 
----+------------+-------------
  1 | ivan       | ivanov
  2 | petr       | petrov
  3 | sergey     | sergeev
(3 rows)
```

**Q: Видите ли вы новую запись и если да то почему?**
*A: Нет, новой записи не видно.*

20. Зафиксировал транзакцию в первой сессии:
```bash
postgres=# commit;
COMMIT
```
21.  Еще проверка новой записи во второй сессии:
```bash
postgres=# select * from persons;
 id | first_name | second_name 
----+------------+-------------
  1 | ivan       | ivanov
  2 | petr       | petrov
  3 | sergey     | sergeev
(3 rows)
```
**Q: Видите ли вы новую запись и если да то почему?**
*A: Нет, новой записи не видно.*

22. Зафиксировал транзакцию во второй сессии:
```bash
postgres=# commit;
COMMIT
```
23. Снова проверил новую запись во второй сессии:
```bash
postgres=# select * from persons;
 id | first_name | second_name 
----+------------+-------------
  1 | ivan       | ivanov
  2 | petr       | petrov
  3 | sergey     | sergeev
  4 | sveta      | svetova
(4 rows)
```
**Q: Видите ли вы новую запись и если да то почему?**
*A: Да, теперь новая запись стала видна, т.к. текущий уровень изоляции транзакций **repeatable read**, видит только те данные, которые были зафиксированы **ДО** начала текущей транзакции и не видит незафиксированные данные и изменения, произведённые другими транзакциями в процессе выполнения данной транзакции (до ее фиксации).*

24. Остановил ВМ.