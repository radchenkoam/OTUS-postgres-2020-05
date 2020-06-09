### Занятие #4
***
Установка PostgreSQL
---
***
### Домашнее задание. 1 вариант.

1. Создал ВМ (_Ubuntu 18.04 LTS (bionic) / n1-standard-1 / us-central1-a_). Название: **`lesson-4-hw-var-1`**

2. Подключился по _ssh_, установил _postgresql-10_ `sudo apt-get install postgresql`

3. Проверка: `sudo -u postgres pg_lsclusters`
```bash
Ver Cluster Port Status Owner    Data directory              Log file
10  main    5432 online postgres /var/lib/postgresql/10/main /var/log/postgresql/postgresql-10-main.log
```

4. Зашел под пользователем _postgres_ в _psql_ `sudo su postgres` `psql`

5. Создал таблицу _test_, добавил строку
```bash
postgres=# create table test(c1 text);
CREATE TABLE
postgres=# insert into test values('1');
INSERT 0 1
```

6. Остановил кластер _postgres_ через `sudo -u postgres pg_ctlcluster 10 main stop`:
```bash
am@lesson-4-hw-var-1:~$ sudo -u postgres pg_ctlcluster 10 main stop
Warning: stopping the cluster using pg_ctlcluster will mark the systemd unit as failed. Consider using systemctl:
  sudo systemctl stop postgresql@10-main
```
Поругался, но кластер остановил:
```bash
am@lesson-4-hw-var-1:~$ sudo -u postgres pg_lsclusters
Ver Cluster Port Status Owner    Data directory              Log file
10  main    5432 down   postgres /var/lib/postgresql/10/main /var/log/postgresql/postgresql-10-main.log
```

7. Создал новый _standard persistent_ диск через _Compute Engine -> Диски -> Создать диск_. Название: `lesson-4-hw-disk-1`. Размер: 10Gb

8. Добавил диск `lesson-4-hw-disk-1` к ВМ `lesson-4-hw-var-1`

9. Инициализация диска:
- Нашел новый диск:
```bash
am@lesson-4-hw-var-1:~$ lsblk
NAME    MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
loop0     7:0    0 93.9M  1 loop /snap/core/9066
loop1     7:1    0   55M  1 loop /snap/core18/1754
loop2     7:2    0  115M  1 loop /snap/google-cloud-sdk/133
sda       8:0    0   10G  0 disk 
├─sda1    8:1    0  9.9G  0 part /
├─sda14   8:14   0    4M  0 part 
└─sda15   8:15   0  106M  0 part /boot/efi
sdb       8:16   0   10G  0 disk 
```
- Указал _GPT partition_:
```bash
am@lesson-4-hw-var-1:~$ sudo parted /dev/sdb mklabel gpt
Warning: The existing disk label on /dev/sdb will be destroyed and all data on this disk will be lost.
Do you want to continue?
Yes/No? Yes                                                               
Information: You may need to update /etc/fstab.
```
- Создал раздел на весь диск:
```bash
am@lesson-4-hw-var-1:~$ sudo parted -a opt /dev/sdb mkpart primary ext4 0% 100%
Information: You may need to update /etc/fstab.
```
Проверка:
```bash
am@lesson-4-hw-var-1:~$ lsblk                                             
NAME    MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
loop0     7:0    0 93.9M  1 loop /snap/core/9066
loop1     7:1    0   55M  1 loop /snap/core18/1754
loop2     7:2    0  115M  1 loop /snap/google-cloud-sdk/133
sda       8:0    0   10G  0 disk 
├─sda1    8:1    0  9.9G  0 part /
├─sda14   8:14   0    4M  0 part 
└─sda15   8:15   0  106M  0 part /boot/efi
sdb       8:16   0   10G  0 disk 
└─sdb1    8:17   0   10G  0 part 
```
- Создал файловую систему:
```bash
am@lesson-4-hw-var-1:~$ sudo mkfs.ext4 -L datapartition /dev/sdb1
mke2fs 1.44.1 (24-Mar-2018)
Discarding device blocks: done                            
Creating filesystem with 2620928 4k blocks and 655360 inodes
Filesystem UUID: 5ef15eae-dd5b-4b9b-a934-ac503aef2a48
Superblock backups stored on blocks: 
	32768, 98304, 163840, 229376, 294912, 819200, 884736, 1605632

Allocating group tables: done                            
Writing inode tables: done                            
Creating journal (16384 blocks): done
Writing superblocks and filesystem accounting information: done 
```
- Изменил метку раздела:
```bash
am@lesson-4-hw-var-1:~$ sudo e2label /dev/sdb1 pg_data
```
Проверка:
```bash
am@lesson-4-hw-var-1:~$ lsblk --fs
NAME    FSTYPE   LABEL           UUID                                 MOUNTPOINT
loop0   squashfs                                                      /snap/core/9066
loop1   squashfs                                                      /snap/core18/1754
loop2   squashfs                                                      /snap/google-cloud-sdk/133
sda                                                                   
├─sda1  ext4     cloudimg-rootfs 984a2690-86ee-456d-84cf-9925d5bfed22 /mnt/data
├─sda14                                                               
└─sda15 vfat     UEFI            01D8-A677                            /boot/efi
sdb                                                                   
└─sdb1  ext4     pg_data         5ef15eae-dd5b-4b9b-a934-ac503aef2a48
```
> метка: _pg_data_, файловая система: _ext4_, всё ок
- Примонтировал новый диск:
```bash
am@lesson-4-hw-var-1:~$ sudo mkdir -p /mnt/data
am@lesson-4-hw-var-1:~$ sudo mount -o defaults /dev/sdb1 /mnt/data
```
Проверка:
```bash
am@lesson-4-hw-var-1:~$ df -h
Filesystem      Size  Used Avail Use% Mounted on
udev            1.8G     0  1.8G   0% /dev
tmpfs           369M  884K  368M   1% /run
/dev/sda1       9.6G  1.7G  7.9G  18% /
tmpfs           1.8G     0  1.8G   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
tmpfs           1.8G     0  1.8G   0% /sys/fs/cgroup
/dev/sda15      105M  3.6M  101M   4% /boot/efi
/dev/loop0       94M   94M     0 100% /snap/core/9066
/dev/loop1       55M   55M     0 100% /snap/core18/1754
/dev/loop2      115M  115M     0 100% /snap/google-cloud-sdk/133
tmpfs           369M     0  369M   0% /run/user/1001
/dev/sdb1       9.8G   37M  9.3G   1% /mnt/data
```
> _mountpoint_ у `/dev/sdb1` - `/mnt/data`, всё ок
- Для того, чтобы диск нормально монтировался после перезагрузки - делаем изменения в /etc/fstab:
```bash
am@lesson-4-hw-var-1:~$ cat /etc/fstab
LABEL=cloudimg-rootfs	/	 ext4	defaults	0 0
LABEL=UEFI	/boot/efi	vfat	defaults	0 0
#/dev/sdb1
UUID=5ef15eae-dd5b-4b9b-a934-ac503aef2a48 /mnt/data ext4  defaults 0 0
LABEL=pg_data   /mnt/data       ext4    defaults        0 0
```
Проверка:
```bash
am@lesson-4-hw-var-1:~$ sudo mount -a
am@lesson-4-hw-var-1:~$ lsblk -fs
NAME  FSTYPE   LABEL           UUID                                 MOUNTPOINT
loop0 squashfs                                                      /snap/core/9066
loop1 squashfs                                                      /snap/core18/1754
loop2 squashfs                                                      /snap/google-cloud-sdk/133
sda1  ext4     cloudimg-rootfs 984a2690-86ee-456d-84cf-9925d5bfed22 /mnt/data
└─sda                                                               
sda14                                                               
└─sda                                                               
sda15 vfat     UEFI            01D8-A677                            /boot/efi
└─sda                                                               
sdb1  ext4     pg_data         5ef15eae-dd5b-4b9b-a934-ac503aef2a48 /mnt/data
└─sdb  
```
> после перемонтирования всего, используя _fstab_ (`sudo mount -a`), всё прошло удачно и наш диск `sdb1` на своём месте.

10. Проверил доступность файловой системы нового диска:
```bash
am@lesson-4-hw-var-1:~$ df -h -x tmpfs -x devtmpfs
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       9.6G  1.7G  7.9G  18% /
/dev/sda15      105M  3.6M  101M   4% /boot/efi
/dev/loop0       94M   94M     0 100% /snap/core/9066
/dev/loop1       55M   55M     0 100% /snap/core18/1754
/dev/loop2      115M  115M     0 100% /snap/google-cloud-sdk/133
/dev/sdb1       9.8G   37M  9.3G   1% /mnt/data
```
> `dev/sdb1` - на месте

Проверка lost+found каталога
```bash
am@lesson-4-hw-var-1:~$ ls -l /mnt/data
total 16
drwx------ 2 root root 16384 Jun  6 21:29 lost+found
```
> lost+found (указывает на корень файловой системы Ext) - на месте

Записал тестовый файл:
```bash
am@lesson-4-hw-var-1:~$ echo "success" | sudo tee /mnt/data/test_file
success
```
Прочитал его:
```bash
am@lesson-4-hw-var-1:~$ cat /mnt/data/test_file
success
```
Удалил тестовый файл:
```bash
sudo rm /mnt/data/test_file
am@lesson-4-hw-var-1:~$ cat /mnt/data/test_file
cat: /mnt/data/test_file: No such file or directory
```
> **Вывод**: файловая система нового диска работает нормально.

11. Сделал пользователя _postgres_ владельцем `/mnt/data`:
```bash
am@lesson-4-hw-var-1:~$ sudo chown -R postgres:postgres /mnt/data/
am@lesson-4-hw-var-1:~$ ls -l /mnt/data
total 16
drwx------ 2 postgres postgres 16384 Jun  6 21:29 lost+found
```
> пользователь _postgres_ - владелец каталога `/mnt/data`, всё ок

12. Перенес содержимое `/var/lib/postgres/10` в `/mnt/data`:
```bash
am@lesson-4-hw-var-1:~$ sudo mv /var/lib/postgresql/10 /mnt/data
am@lesson-4-hw-var-1:~$ ls /mnt/data
10  lost+found
```

13. Попытался запустить кластер:
```bash
am@lesson-4-hw-var-1:~$ sudo -u postgres pg_ctlcluster 10 main start
Error: /var/lib/postgresql/10/main is not accessible or does not exist
```
**Q: Напишите получилось или нет и почему?** A: _Нет, не получилось, т.к. данные postgres-инстанса были пересены на новое место, о котором он пока не знает._

14. Открыл конфигурационный файл `/etc/postgresql/10/main/postgresql.conf`:
```bash
am@lesson-4-hw-var-1:~$ cd /etc/postgresql/10/main
am@lesson-4-hw-var-1:/etc/postgresql/10/main$ ls
conf.d  environment  pg_ctl.conf  pg_hba.conf  pg_ident.conf  postgresql.conf  start.conf
am@lesson-4-hw-var-1:/etc/postgresql/10/main$ sudo nano postgresql.conf
```
Изменил `data_directory = '/var/lib/postgresql/10/main'` на `data_directory = '/mnt/data/10/main'`

15. Запустил кластер:
```bash
am@lesson-4-hw-var-1:/etc/postgresql/10/main$ sudo -u postgres pg_ctlcluster 10 main start
Warning: the cluster will not be running as a systemd service. Consider using systemctl:
  sudo systemctl start postgresql@10-main
```
Проверка:
```bash
am@lesson-4-hw-var-1:/etc/postgresql/10/main$ sudo -u postgres pg_lsclusters
Ver Cluster Port Status Owner    Data directory    Log file
10  main    5432 online postgres /mnt/data/10/main /var/log/postgresql/postgresql-10-main.log
```
> кластер запущен, всё ок

16. Зашел в _psql_, проверил ранее созданную таблицу _test_:
```bash
am@lesson-4-hw-var-1:/etc/postgresql/10/main$ sudo su postgres
postgres@lesson-4-hw-var-1:/etc/postgresql/10/main$ psql
```
```sql
postgres=# select * from test;
 c1 
----
 1
(1 row)
```
> таблица на месте, данные на месте, всё ок



