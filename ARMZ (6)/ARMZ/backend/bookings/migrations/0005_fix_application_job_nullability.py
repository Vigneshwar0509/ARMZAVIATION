from django.db import migrations


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("bookings", "0004_alter_application_job_nullable"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                PRAGMA foreign_keys=off;
                BEGIN TRANSACTION;
                CREATE TABLE bookings_application_new (
                    id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                    status varchar(20) NOT NULL,
                    applied_at datetime NOT NULL,
                    job_id bigint REFERENCES services_job(id) DEFERRABLE INITIALLY DEFERRED,
                    user_id bigint NOT NULL REFERENCES accounts_user(id) DEFERRABLE INITIALLY DEFERRED,
                    internship_id bigint NULL REFERENCES services_internship(id) DEFERRABLE INITIALLY DEFERRED
                );
                INSERT INTO bookings_application_new (id, status, applied_at, job_id, user_id, internship_id)
                    SELECT id, status, applied_at, job_id, user_id, internship_id FROM bookings_application;
                DROP TABLE bookings_application;
                ALTER TABLE bookings_application_new RENAME TO bookings_application;
                CREATE INDEX bookings_application_job_id_772d0295 ON bookings_application (job_id);
                CREATE INDEX bookings_application_user_id_f3c2e757 ON bookings_application (user_id);
                CREATE INDEX bookings_application_internship_id_9a355386 ON bookings_application (internship_id);
                CREATE UNIQUE INDEX bookings_application_job_id_user_id_5b654edb_uniq ON bookings_application (job_id, user_id);
                CREATE UNIQUE INDEX bookings_application_internship_id_user_id_a8791c58_uniq ON bookings_application (internship_id, user_id);
                CREATE INDEX bookings_ap_job_id_389830_idx ON bookings_application (job_id);
                CREATE INDEX bookings_ap_user_id_bc5302_idx ON bookings_application (user_id);
                CREATE INDEX bookings_ap_applied_fe3898_idx ON bookings_application (applied_at);
                CREATE INDEX bookings_ap_internship_id_9a3e17_idx ON bookings_application (internship_id);
                PRAGMA foreign_keys=on;
                COMMIT;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
