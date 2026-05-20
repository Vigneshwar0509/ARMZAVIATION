from django.core.management.base import BaseCommand
from django.conf import settings
from services.sms_service import queue_sms, send_otp_sms, send_job_alert_sms


class Command(BaseCommand):
    help = 'Test SMS service with a test message'

    def add_arguments(self, parser):
        parser.add_argument(
            '--phone',
            type=str,
            help='Phone number to send test SMS (in format +1234567890)',
            required=True
        )
        parser.add_argument(
            '--type',
            type=str,
            choices=['test', 'otp', 'booking', 'payment', 'job', 'interview'],
            default='test',
            help='Type of SMS to send'
        )
        parser.add_argument(
            '--otp',
            type=str,
            help='OTP code (for otp type)',
        )

    def handle(self, *args, **options):
        phone = options['phone']
        sms_type = options['type']
        
        self.stdout.write(f"SMS Provider: {getattr(settings, 'SMS_PROVIDER', 'not configured')}")
        self.stdout.write(f"Phone Number: {phone}")
        self.stdout.write(f"SMS Type: {sms_type}")
        self.stdout.write("")

        try:
            if sms_type == 'test':
                message = "Hello! This is a test SMS from ARMZ Aviation. If you received this, SMS services are working correctly!"
                self.stdout.write("Sending test SMS...")
                result = queue_sms(phone, message)
                
            elif sms_type == 'otp':
                otp = options.get('otp', '123456')
                self.stdout.write(f"Sending OTP SMS with code: {otp}...")
                result = send_otp_sms(phone, otp)
                
            elif sms_type == 'booking':
                booking_details = {
                    'booking_id': 'BK12345',
                    'date': '2026-05-10',
                    'time': '10:00 AM'
                }
                self.stdout.write("Sending booking confirmation SMS...")
                from services.sms_service import send_booking_confirmation_sms
                result = send_booking_confirmation_sms(phone, booking_details)
                
            elif sms_type == 'payment':
                payment_details = {
                    'amount': '9999',
                    'plan_name': 'Starter',
                    'reference_id': 'PAY67890'
                }
                self.stdout.write("Sending payment confirmation SMS...")
                from services.sms_service import send_payment_confirmation_sms
                result = send_payment_confirmation_sms(phone, payment_details)
                
            elif sms_type == 'job':
                job_details = {
                    'title': 'Pilot - Commercial',
                    'company': 'Air India',
                    'location': 'Mumbai'
                }
                self.stdout.write("Sending job alert SMS...")
                result = send_job_alert_sms(phone, job_details)
                
            elif sms_type == 'interview':
                interview_details = {
                    'date': '2026-05-15',
                    'time': '02:00 PM',
                    'company': 'Air India'
                }
                self.stdout.write("Sending interview reminder SMS...")
                from services.sms_service import send_interview_reminder_sms
                result = send_interview_reminder_sms(phone, interview_details)
            
            if result:
                self.stdout.write(self.style.SUCCESS(f'✅ SMS sent successfully to {phone}'))
            else:
                self.stdout.write(self.style.ERROR(f'❌ Failed to send SMS to {phone}'))
                self.stdout.write(self.style.WARNING('Check SMS provider configuration and logs'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {str(e)}'))
            self.stdout.write(self.style.WARNING('Make sure SMS provider SDK is installed (pip install twilio / boto3 / vonage)'))
