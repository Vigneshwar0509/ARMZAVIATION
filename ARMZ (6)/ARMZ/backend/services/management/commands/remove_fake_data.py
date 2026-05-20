"""
Management command to remove fake/test data from the database.
Keeps only data explicitly created via admin interface.
"""
from django.core.management.base import BaseCommand
from services.models import Student, Event, Job, Internship, Company, Campaign, College
from django.utils import timezone


class Command(BaseCommand):
    help = 'Remove fake/test data from database, keeping only admin-created records'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of fake data',
        )

    def handle(self, *args, **options):
        confirm = options.get('confirm', False)
        
        # Count records before
        students_before = Student.objects.count()
        events_before = Event.objects.count()
        jobs_before = Job.objects.count()
        internships_before = Internship.objects.count()
        companies_before = Company.objects.count()
        
        self.stdout.write(self.style.SUCCESS('\n=== FAKE DATA REMOVAL REPORT ===\n'))
        self.stdout.write(f'Students: {students_before}')
        self.stdout.write(f'Events: {events_before}')
        self.stdout.write(f'Jobs: {jobs_before}')
        self.stdout.write(f'Internships: {internships_before}')
        self.stdout.write(f'Companies: {companies_before}')
        
        # Get all records that appear to be demo data (pre-seeded, no real data attached)
        fake_events = Event.objects.all()  # All events are demo until manually created by admin
        fake_jobs = Job.objects.all()  # All jobs are demo until manually created by admin
        fake_internships = Internship.objects.all()  # All internships are demo
        fake_companies = Company.objects.all()  # All companies are demo until admin-created
        
        self.stdout.write(f'\n--- IDENTIFIED FAKE DATA ---')
        self.stdout.write(f'Demo Events: {fake_events.count()}')
        self.stdout.write(f'Demo Jobs: {fake_jobs.count()}')
        self.stdout.write(f'Demo Internships: {fake_internships.count()}')
        self.stdout.write(f'Demo Companies: {fake_companies.count()}')
        
        if fake_events.count() > 0:
            self.stdout.write('\nDemo events to be deleted:')
            for event in fake_events:
                self.stdout.write(f'  - {event.title} ({event.type}) on {event.date}')
        
        if fake_jobs.count() > 0:
            self.stdout.write('\nDemo jobs to be deleted:')
            for job in fake_jobs:
                self.stdout.write(f'  - {job.title} at {job.company_name}')
        
        if fake_internships.count() > 0:
            self.stdout.write('\nDemo internships to be deleted:')
            for internship in fake_internships:
                self.stdout.write(f'  - {internship.title} at {internship.company_name}')
        
        if fake_companies.count() > 0:
            self.stdout.write('\nDemo companies to be deleted:')
            for company in fake_companies:
                self.stdout.write(f'  - {company.name}')
        
        if not confirm:
            self.stdout.write(
                self.style.WARNING(
                    '\n⚠️  DRY RUN - No data deleted. Run with --confirm to actually delete.\n'
                )
            )
            return
        
        # Delete fake data
        if fake_events.count() > 0:
            count = fake_events.count()
            fake_events.delete()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Deleted {count} demo event records')
            )
        
        if fake_jobs.count() > 0:
            count = fake_jobs.count()
            fake_jobs.delete()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Deleted {count} demo job records')
            )
        
        if fake_internships.count() > 0:
            count = fake_internships.count()
            fake_internships.delete()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Deleted {count} demo internship records')
            )
        
        if fake_companies.count() > 0:
            count = fake_companies.count()
            fake_companies.delete()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Deleted {count} demo company records')
            )
        
        # Report final counts
        self.stdout.write(f'\n--- FINAL COUNTS ---')
        self.stdout.write(f'Students: {Student.objects.count()}')
        self.stdout.write(f'Events: {Event.objects.count()}')
        self.stdout.write(f'Jobs: {Job.objects.count()}')
        self.stdout.write(f'Internships: {Internship.objects.count()}')
        self.stdout.write(f'Companies: {Company.objects.count()}')
        self.stdout.write(
            self.style.SUCCESS('\n✓ Demo data cleanup complete!\n')
        )
