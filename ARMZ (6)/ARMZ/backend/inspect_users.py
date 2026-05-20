import sqlite3

conn = sqlite3.connect('db.sqlite3')
c = conn.cursor()

print('specific user:')
c.execute('SELECT email,is_active,role,is_superuser,password FROM accounts_user WHERE email=?', ('vigneshramesh.0509@gmail.com',))
print(c.fetchall())

print('admin/users:')
c.execute("SELECT email,is_active,role,is_superuser FROM accounts_user WHERE role='admin' OR is_superuser=1")
for row in c.fetchall():
    print(row)

conn.close()
