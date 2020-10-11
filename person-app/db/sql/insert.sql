/* Inserts a new User record. */
insert into ${tableName:name} (${values:name}) values (${values:csv}) ${returning:raw}