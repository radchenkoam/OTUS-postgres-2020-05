***
<div align="center"><h4>1. Подготовка</h4></div>

***

- для выполнения задания я использовал виртуальную машину с загруженными данными о прокате велосипедов в Лондоне из [предыдущего домашнего задания](https://github.com/radchenkoam/OTUS-postgres-2020-05/blob/dev/lessons/lesson%20%2315%20homework%201%20var.md#1-%D0%BF%D0%BE%D0%B4%D0%B3%D0%BE%D1%82%D0%BE%D0%B2%D0%BA%D0%B0-%D0%B2%D0%B8%D1%80%D1%82%D1%83%D0%B0%D0%BB%D1%8C%D0%BD%D0%BE%D0%B9-%D0%BC%D0%B0%D1%88%D0%B8%D0%BD%D1%8B "Ctrl+click -> new tab")

- создал новую таблицу `public.areas` в базе данных `lb`
    ```sql
    create table public.areas (id serial primary key, name text);
    ```

- загрузил в нее данные из таблицы `public.stations`, обрезав наименование станции проката велосипедов чтобы получилась область, район где она находится
    ```sql
    insert into public.areas ("name") 
    select distinct trim(both ' ' from replace(unnest(regexp_match("name", ', (.*)')), '. ', '.')) as "name" 
      from public.stations order by "name";
    ```
    <pre><details><summary>public.areas</summary>
     id  |             name             
    -----+------------------------------
       1 | Aldgate
       2 | Angel
       3 | Avondale
       4 | Bank
       5 | Bankside
       6 | Barbican
       7 | Battersea
       8 | Battersea Park
       9 | Bayswater
      10 | Belgravia
      11 | Bermondsey
      12 | Bethnal Green
      13 | Blackwall
      14 | Bloomsbury
      15 | Borough
      16 | Bow
      17 | Brixton
      18 | Brook Green
      19 | Camden Town
      20 | Canary Wharf
      21 | Chelsea
      22 | Clapham
      23 | Clapham Common
      24 | Clapham Junction
      25 | Clerkenwell
      26 | Covent Garden
      27 | Cubitt Town
      28 | De Beauvoir Town
      29 | Earl's Court
      30 | East Putney
      31 | Elephant & Castle
      32 | Euston
      33 | Farringdon
      34 | Finsbury
      35 | Fitzrovia
      36 | Fulham
      37 | Guildhall
      38 | Hackney Central
      39 | Hackney Wick
      40 | Haggerston
      41 | Hammersmith
      42 | Holborn
      43 | Holland Park
      44 | Hoxton
      45 | Hyde Park
      46 | Isley Court, Wandsworth Road
      47 | Kennington
      48 | Kensington
      49 | Kensington Gardens
      50 | King's Cross
      51 | Kings Cross
      52 | Knightsbridge
      53 | Ladbroke Grove
      54 | Limehouse
      55 | Lingham Street, Stockwell
      56 | Liverpool Street
      57 | London Bridge
      58 | Maida Vale
      59 | Marylebone
      60 | Mayfair
      61 | Mile End
      62 | Millwall
      63 | Monument
      64 | Moorgate
      65 | Nine Elms
      66 | North Kensington
      67 | Notting Hill
      68 | Old Ford
      69 | Olympia
      70 | Oval
      71 | Paddington
      72 | Parson's Green
      73 | Parsons Green
      74 | Pimlico
      75 | Poplar
      76 | Portobello
      77 | Putney
      78 | Queen Elizabeth Olympic Park
      79 | Sands End
      80 | Shad Thames
      81 | Shadwell
      82 | Shepherd's Bush
      83 | Shoreditch
      84 | Sloane Square
      85 | Soho
      86 | Somers Town
      87 | South Bank
      88 | South Kensington
      89 | Southwark
      90 | St Lukes
      91 | St Pauls
      92 | St.James's
      93 | St.John's Wood
      94 | St.Luke's
      95 | St.Paul's
      96 | Stepney
      97 | Stockwell
      98 | Strand
      99 | Stratford
     100 | Temple
     101 | The Borough
     102 | The Regent's Park
     103 | Tower
     104 | Vauxhall
     105 | Victoria
     106 | Victoria Park
     107 | Walham Green
     108 | Walworth
     109 | Wandsworth
     110 | Wandsworth Common
     111 | Wandsworth Road
     112 | Wapping
     113 | Waterloo
     114 | West Brompton
     115 | West Chelsea
     116 | West End
     117 | West Kensington
     118 | Westminster
     119 | White City
     120 | Whitechapel
    (120 rows)
    </details></pre>

- структура таблиц 
    <pre><details><summary>public.hire - прокат велосипедов</summary>
     table_name |            column_name            |        data_type         
    ------------+-----------------------------------+--------------------------
     hire       | rental_id                         | integer
     hire       | duration                          | integer
     hire       | bike_id                           | integer
     hire       | end_date                          | timestamp with time zone
     hire       | end_station_id                    | integer
     hire       | end_station_name                  | text
     hire       | start_date                        | timestamp with time zone
     hire       | start_station_id                  | integer
     hire       | start_station_name                | text
     hire       | end_station_logical_terminal      | integer
     hire       | start_station_logical_terminal    | integer
     hire       | end_station_priority_id           | integer
    (12 rows)
    </details></pre>

    <pre><details><summary>public.stations - станции проката велосипедов</summary>
     table_name |  column_name  |    data_type     
    ------------+---------------+------------------
     stations   | id            | integer
     stations   | installed     | boolean
     stations   | latitude      | double precision
     stations   | locked        | text
     stations   | longitude     | double precision
     stations   | name          | text
     stations   | bikes_count   | integer
     stations   | docks_count   | integer
     stations   | nbemptydocks  | integer
     stations   | temporary     | boolean
     stations   | terminal_name | text
     stations   | install_date  | date
     stations   | removal_date  | date
    (13 rows)
    </details></pre>

- добавил в таблицу `public.stations` столбец с идентификатором района
    ```sql
    alter table public.stations add column area_id int null;
    ```

    ***
<div align="center"><h4>2. Прямое соединение двух и более таблиц</h4></div>

*** 

- проставил `area_id` в `public.stations`
    ```sql
    update public.stations as s 
      set area_id = a."id" 
    from public.areas as a 
    where s."name" ~ (', ' || a."name");
    ```
    > :memo: **вариант соединения при `update`**
    _здесь обновляется ключ `area_id` в таблице `public.stations` идентификатором из таблицы `public.areas`, соединение в `where`_

- прямое соединение 3-х таблиц 
    ```sql
    select 
      h.rental_id, 
      h.start_station_name, 
      s."name" as station_name,
      a."name" as area_name
    from public.hire as h 
      inner join public.stations as s on h.start_station_id = s."id" 
      inner join public.areas as a on s.area_id = a."id" 
    where h.start_date::date = '2017-06-01'::date;
    ```
    > _запрос просто соединяет таблицу фактического проката велосипедов (начальная станция проката) с таблицей станций и с таблицей районов_

***
<div align="center"><h4>3. Левостороннее соединение двух и более таблиц</h4></div>

*** 
- запрос, соединяющий прокат и станции с целью узнать сколько и какие начальные станции отсутствуют в записях о прокате в определенную дату 
    ```sql
    select h.start_station_id, h.start_station_name, count(*) as cnt
    from public.hire as h
      left join public.stations as s on h.start_station_id = s."id"
    where s."id" is null and start_date::date = '2016-09-01'::date
    group by h.start_station_id, h.start_station_name;
    ```
    > _соединяем левосторонним соединением (left join), фильтруем отсутствующие станции (where s."id" is null)_

***
<div align="center"><h4>4. Кросс соединение двух или более таблиц</h4></div>

*** 
- например, для целей отчетности можно соединить все районы и сгенерированную сетку с датами
    ```sql
    select a."id", a."name", grid_date
    from public.areas as a
      cross join generate_series('2016-05-16'::date, '2016-05-22'::date, '1 day') as grid_date
    order by 2, 3;
    ```

***
<div align="center"><h4>5. Полное соединение двух или более таблиц</h4></div>

*** 
- можно сравнить таблицу с прокатом за 2017 год и таблицей с станциями, найти в них те станции, которые отсутствуют или там или там
    ```sql
    select s."name", h.station_name
    from public.stations as s
    full join (
      select distinct start_station_name as station_name from public.hire 
      where extract(year from start_date) = 2017
      union
      select distinct end_station_name from public.hire
      where extract(year from start_date) = 2017
    ) as h on s."name" = h.station_name
    where s."name" is null or h.station_name is null;
    ```
    > :memo: _я собрал уникальные записи о начальных станциях и конечных станциях в один датасет через `union`, исключающую повторения в обоих наборах, соединил таблицу станций через `full join` с полученным датасетом и отфильтровал результат условием `where s."name" is null or h.station_name is null` чтобы найти "потерянные станции"_

    ***
<div align="center"><h4>6. Разные типы соединений</h4></div>

*** 
- вот такой запрос, трудно сказать, что он на самом деле считает, просто составил его для демонстрации смешанных соединений
    ```sql
    select 
      a."name" as area_name, 
      s."name" as station_name, 
      grid_date, 
      sum(case when h.rental_id is null then 0 else 1 end)  as hire_sum,
      sum(case when h.rental_id is null then 1 else 0 end)  as null_sum
    from public.areas as a 
      inner join public.stations as s on a."id" = s.area_id
      cross join generate_series('2016-05-16'::date, '2016-05-22'::date, '1 day') as grid_date
      left join public.hire as h on s."name" = h.start_station_name and grid_date = h.start_date::date
    group by area_name, station_name, grid_date
    order by area_name, station_name, grid_date;
    ```
    > :memo: _сначала `inner join`-ом связываются районы и станции проката, затем к ним привязывается `cross join`-ом определенный период по дням, тем самым мы получаем сетку район-станция-дата и уже к ней привязывается аренда велосипедов из таблицы проката; в `hire_sum` идет подсчет количества сданных в аренду, а `null_sum` (если оно больше нуля) дополнительно характеризует, что в эту дату на этой станции в прокат велосипеды не сдавались_
