import sqlite3
for row in sqlite3.connect('test.db').execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall(): print(row)
