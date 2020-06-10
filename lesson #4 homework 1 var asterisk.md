### Занятие #4
***
Установка PostgreSQL
---
***
### <u>Домашнее задание. 1 вариант. Задание со звездочкой.</u>
***
#### Создание виртуальной машины и установка postgresql-10
***
- Создал виртуальную машину:
[`Google Cloud Platform`](https://cloud.google.com/ "Google Cloud") -> `Compute Engine` -> `Экземпляры ВМ` -> `Создать экземпляр`

:hammer_and_wrench: Параметр | :memo: Значение |:hammer_and_wrench: Параметр | :memo: Значение |
--------------:|---------------|--------------:|---------------|
| Название ВМ | **`lesson-4-hw-var-1-asterisk`** | Операционная система | `Ubuntu` |
| Регион | `us-central1 (Айова)` | Версия операционной системы | `Ubuntu 18.04 LTS` | 
| Зона | `us-central1-a` | Тип загрузочного диска | `Стандартный постоянный диск` | 
| Серия | `N1` | Размер (Гб) загрузочного диска | `10` |
| Тип машины | `n1-standart-1` | Брандмауэр | :ballot_box_with_check: `Разрешить трафик HTTP`
| | | | :ballot_box_with_check: `Разрешить трафик HTTPS` |

- Запустил 
- Подключился по `ssh`
- Установил _postgresql-10_: `sudo apt-get install postgresql`
Проверка: `sudo -u postgres pg_lsclusters`
```console
Ver Cluster Port Status Owner    Data directory              Log file
10  main    5432 online postgres /var/lib/postgresql/10/main /var/log/postgresql/postgresql-10-main.log
```
> Работает

- Остановил кластер: `sudo -u postgres pg_ctlcluster 10 main stop`
Проверка: `sudo -u postgres pg_lsclusters`
```console
Ver Cluster Port Status Owner    Data directory              Log file
10  main    5432 down   postgres /var/lib/postgresql/10/main /var/log/postgresql/postgresql-10-main.log
```
> Остановлен
- Удалил файлы с данными: `sudo rm -r /var/lib/postgresql`
Проверка: `sudo ls /var/lib/postgresql`
```console
ls: cannot access '/var/lib/postgresql': No such file or directory
```
> файлы с данными postgres удалены

- Попробовал запустить кластер: `sudo -u postgres pg_ctlcluster 10 main start`
```console
Error: /var/lib/postgresql/10/main is not accessible or does not exist
```
> Кластер не работает
***

#### Перемонтирование жесткого диска на новую виртуальную машину
***
- Остановил виртуальную машину **`lesson-4-hw-var-1-asterisk`**
- Отключил внешний жесткий диск от ВМ **`lesson-4-hw-var-1`**:
`Compute Engine` -> `Экземпляры ВМ` -> `lesson-4-hw-var-1` -> `Изменить` -> `Удалил диск (в настройках удаления - Сохранить диск)` -> `Сохранить`
- Подключил внешний жесткий диск **`lesson-4-hw-disk-1`** к новой ВМ:
`Compute Engine` -> `Экземпляры ВМ` -> `lesson-4-hw-var-1-asterisk` -> `Изменить` -> `+Подключить существующий диск` -> `lesson-4-hw-disk-1` -> `Готово` -> `Сохранить`
- Запустил ВМ **`lesson-4-hw-var-1-asterisk`**, подключился по `ssh`
Проверка: `lsblk`
```console
NAME    MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
loop0     7:0    0  115M  1 loop /snap/google-cloud-sdk/133
loop1     7:1    0   55M  1 loop /snap/core18/1754
loop2     7:2    0 93.9M  1 loop /snap/core/9066
sda       8:0    0   10G  0 disk 
├─sda1    8:1    0  9.9G  0 part /
├─sda14   8:14   0    4M  0 part 
└─sda15   8:15   0  106M  0 part /boot/efi
sdb       8:16   0   10G  0 disk 
└─sdb1    8:17   0   10G  0 part
```
> новый диск видно
- Монтируем его: `sudo mkdir -p /mnt/data` `sudo mount -o defaults /dev/sdb1 /mnt/data`
Проверка: `df -h`
```console
Filesystem      Size  Used Avail Use% Mounted on
udev            1.8G     0  1.8G   0% /dev
tmpfs           369M  880K  368M   1% /run
/dev/sda1       9.6G  1.5G  8.1G  16% /
tmpfs           1.8G     0  1.8G   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
tmpfs           1.8G     0  1.8G   0% /sys/fs/cgroup
/dev/loop0      115M  115M     0 100% /snap/google-cloud-sdk/133
/dev/loop1       55M   55M     0 100% /snap/core18/1754
/dev/loop2       94M   94M     0 100% /snap/core/9066
/dev/sda15      105M  3.6M  101M   4% /boot/efi
tmpfs           369M     0  369M   0% /run/user/1001
/dev/sdb1       9.8G   75M  9.2G   1% /mnt/data
```
> Новый диск примонтирован успешно
- Смотрим содержимое и владельца: `ls -l /mnt/data`
```console
total 20
drwxr-xr-x 3 postgres postgres  4096 Jun  6 20:54 10
drwx------ 2 postgres postgres 16384 Jun  6 21:29 lost+found
```
- Владелец - _postgres_, но на всякий случай выполнил: `sudo chown -R postgres:postgres /mnt/data/`
- Посмотрел идентификатор диска: `lsblk --fs`
```console
NAME    FSTYPE   LABEL           UUID                                 MOUNTPOINT
loop0   squashfs                                                      /snap/google-cloud-sdk/133
loop1   squashfs                                                      /snap/core18/1754
loop2   squashfs                                                      /snap/core/9066
sda                                                                   
├─sda1  ext4     cloudimg-rootfs 984a2690-86ee-456d-84cf-9925d5bfed22 /
├─sda14                                                               
└─sda15 vfat     UEFI            01D8-A677                            /boot/efi
sdb                                                                   
└─sdb1  ext4     pg_data         5ef15eae-dd5b-4b9b-a934-ac503aef2a48 /mnt/data
```
> кстати, он не изменился (такой же как на другой ВМ)
- Внес изменения в /etc/fstab: `cat /etc/fstab`
```console
LABEL=cloudimg-rootfs	/	 ext4	defaults	0 0
LABEL=UEFI	/boot/efi	vfat	defaults	0 0
#/dev/sdb1
UUID=5ef15eae-dd5b-4b9b-a934-ac503aef2a48 /mnt/data ext4  defaults 0 0
LABEL=pg_data   /mnt/data       ext4    defaults        0 0
```
Проверка: `sudo mount -a` `lsblk --fs`
```console
NAME    FSTYPE   LABEL           UUID                                 MOUNTPOINT
loop0   squashfs                                                      /snap/google-cloud-sdk/133
loop1   squashfs                                                      /snap/core18/1754
loop2   squashfs                                                      /snap/core/9066
sda                                                                   
├─sda1  ext4     cloudimg-rootfs 984a2690-86ee-456d-84cf-9925d5bfed22 /
├─sda14                                                               
└─sda15 vfat     UEFI            01D8-A677                            /boot/efi
sdb                                                                   
└─sdb1  ext4     pg_data         5ef15eae-dd5b-4b9b-a934-ac503aef2a48 /mnt/data
```
> Всё в порядке - диск на месте

***
#### Изменение конфигурационного файла и запуск кластера
***
- Изменил конфигурационный файл `/etc/postgresql/10/main/postgresql.conf`:
`data_directory = '/var/lib/postgresql/10/main'` --> `data_directory = '/mnt/data/10/main'`
- Запустил кластер: `sudo -u postgres pg_ctlcluster 10 main start`
Проверка: `sudo -u postgres pg_lsclusters`
```console
Ver Cluster Port Status Owner     Data directory   Log file
10  main    5432 online <unknown> mnt/data/10/main /var/log/postgresql/postgresql-10-main.log
```
- Проверил в `psql`:
```sql
postgres=# select * from test;
 c1 
----
 1
(1 row)
```
:exclamation: <u>**Итог:**</u> _В результате отсоединения внешнего диска от старой ВМ и присоединения его к новой ВМ, с такими же настройками `postgres`, кластер стартовал на новой ВМ в штатном режиме, и данные со старого инстанса стали доступны на новом. Эксперимент прошел удачно._

