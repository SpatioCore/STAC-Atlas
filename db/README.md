# provisionally STAC Database Init Scripts

All SQL scripts in this folder (will happen, when the database is finished) are automatically executed on the first start
of the database.

## Execution Order
The numbering ensures a guaranteed execution order:

1. 01_extensions.sql  
2. 02_tables_catalog.sql  
3. 03_tables_collection.sql  
4. 04_relation_tables.sql  
5. 05_indexes.sql  