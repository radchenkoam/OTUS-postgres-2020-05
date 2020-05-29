Занятие #2
--
Краткая инструкция по созданию инстанса в GCP
- зарегистрируйтесь в GCP
- создайте виртуальную машину c Ubuntu 18.04 LTS (bionic) в GCE типа
n1-standard-1 в default VPC в любом регионе и зоне, например us-central1-a
- запустите инстанс
- на своей машиине создаем каталог: mkdir $HOME\.ssh
- даем права на него: chown $HOME\.ssh 0700
- генерируем ssh ключ: ssh-keygen имя
- добавляем его: ssh-add имя
- добавить свой ssh ключ в GCE metadata
- заходим со своего хоста: ssh имя@ip созданной ВМ
- устанавливаем postgresql и postgresql-contrib через apt
- проверьте что кластер запущен через sudo -u postgres pg_lsclusters