import sys
sys.path.insert(0, '.')
from helpers.database import engine
from sqlalchemy import inspect

insp = inspect(engine)
for t in sorted(insp.get_table_names()):
    for fk in insp.get_foreign_keys(t):
        if fk.get('referred_table') == 'users':
            print(f"{t}.{fk['constrained_columns']} -> users.{fk['referred_columns']}")
