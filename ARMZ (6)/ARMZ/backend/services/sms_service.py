import logging
from abc import ABC, abstractmethod

from django.conf import settings

from services.tasks import shared_task

logger = logging.getLogger(__name__)


class SMSProvider(ABC):
    """Abstract base class for SMS providers"""
    
    @abstractmethod
    def send(self, phone_number: str, message: str) -> bool:
        """Send SMS message"""
        pass


class TwilioSMSProvider(SMSProvider):
    """Twilio SMS Provider"""
    
    def __init__(self):
        self.client = None
        self.account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
        self.auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
        self.from_number = getattr(settings, 'TWILIO_FROM_NUMBER', '')
        
        if not all([self.account_sid, self.auth_token, self.from_number]):
            logger.warning('Twilio SMS provider not configured')
            return
        
        try:
            from twilio.rest import Client
            self.client = Client(self.account_sid, self.auth_token)
        except ImportError:
            logger.error('Twilio SDK not installed. Install with: pip install twilio')
            self.client = None
    
    def send(self, phone_number: str, message: str) -> bool:
        """Send SMS via Twilio"""
        if not self.client:
            logger.error('Twilio client not initialized')
            return False
        
        try:
            response = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=phone_number
            )
            logger.info(f'SMS sent successfully via Twilio: {response.sid}')
            return True
        except Exception as e:
            logger.exception(f'Failed to send SMS via Twilio to {phone_number}: {e}')
            return False


class AWS_SNSSMSProvider(SMSProvider):
    """AWS SNS SMS Provider"""
    
    def __init__(self):
        self.region = getattr(settings, 'AWS_REGION', 'us-east-1')
        try:
            import boto3
            self.client = boto3.client('sns', region_name=self.region)
        except ImportError:
            logger.error('boto3 not installed. Install with: pip install boto3')
            self.client = None
        except Exception as e:
            logger.error(f'Failed to initialize AWS SNS client: {e}')
            self.client = None
    
    def send(self, phone_number: str, message: str) -> bool:
        """Send SMS via AWS SNS"""
        if not self.client:
            logger.error('AWS SNS client not initialized')
            return False
        
        try:
            response = self.client.publish(
                PhoneNumber=phone_number,
                Message=message,
                MessageAttributes={
                    'AWS.SNS.SMS.SenderID': {
                        'DataType': 'String',
                        'StringValue': 'ARMZ'
                    },
                    'AWS.SNS.SMS.SMSType': {
                        'DataType': 'String',
                        'StringValue': 'Transactional'
                    }
                }
            )
            logger.info(f'SMS sent successfully via AWS SNS: {response["MessageId"]}')
            return True
        except Exception as e:
            logger.exception(f'Failed to send SMS via AWS SNS to {phone_number}: {e}')
            return False


class VonageSMSProvider(SMSProvider):
    """Vonage (Nexmo) SMS Provider"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'VONAGE_API_KEY', '')
        self.api_secret = getattr(settings, 'VONAGE_API_SECRET', '')
        self.from_name = getattr(settings, 'VONAGE_FROM_NAME', 'ARMZ')
        
        if not all([self.api_key, self.api_secret]):
            logger.warning('Vonage SMS provider not configured')
            return
        
        try:
            import vonage
            self.client = vonage.Client(key=self.api_key, secret=self.api_secret)
        except ImportError:
            logger.error('Vonage SDK not installed. Install with: pip install vonage')
            self.client = None
    
    def send(self, phone_number: str, message: str) -> bool:
        """Send SMS via Vonage"""
        if not self.client:
            logger.error('Vonage client not initialized')
            return False
        
        try:
            response = self.client.sms.send_message({
                'to': phone_number,
                'from': self.from_name,
                'text': message
            })
            
            if response['messages'][0]['status'] == '0':
                logger.info(f'SMS sent successfully via Vonage: {response["messages"][0]["message-id"]}')
                return True
            else:
                logger.error(f'Vonage SMS failed: {response["messages"][0]["error-text"]}')
                return False
        except Exception as e:
            logger.exception(f'Failed to send SMS via Vonage to {phone_number}: {e}')
            return False


def get_sms_provider() -> SMSProvider:
    """Get configured SMS provider"""
    provider_name = getattr(settings, 'SMS_PROVIDER', 'twilio').lower()
    
    if provider_name == 'twilio':
        return TwilioSMSProvider()
    elif provider_name == 'aws_sns':
        return AWS_SNSSMSProvider()
    elif provider_name == 'vonage':
        return VonageSMSProvider()
    else:
        logger.error(f'Unknown SMS provider: {provider_name}')
        raise ValueError(f'SMS provider "{provider_name}" not supported')


@shared_task()
def send_sms_async(phone_number: str, message: str):
    """Send SMS asynchronously"""
    if not phone_number:
        logger.warning('No phone number provided for SMS')
        return False
    
    try:
        provider = get_sms_provider()
        return provider.send(phone_number, message)
    except Exception as e:
        logger.exception(f'Failed to send SMS to {phone_number}: {e}')
        if getattr(settings, 'SMS_FAIL_SILENTLY', False):
            return False
        raise


def queue_sms(phone_number: str, message: str):
    """Queue SMS for sending"""
    if not phone_number:
        logger.warning('No phone number provided for SMS')
        return False
    
    try:
        if getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
            logger.debug('CELERY_TASK_ALWAYS_EAGER set: sending SMS synchronously to %s', phone_number)
            return send_sms_async(phone_number, message)
        
        # Try to queue via Celery if available, otherwise fall back to sync send
        if hasattr(send_sms_async, 'delay'):
            try:
                return send_sms_async.delay(phone_number, message)
            except Exception as e:
                logger.warning('Celery .delay failed, falling back to sync send: %s', e, exc_info=True)
                return send_sms_async(phone_number, message)
        
        # No .delay available, call directly
        return send_sms_async(phone_number, message)
    except Exception:
        logger.exception('queue_sms failed for phone_number=%s', phone_number)
        if getattr(settings, 'SMS_FAIL_SILENTLY', False):
            return False
        raise


def send_otp_sms(phone_number: str, otp_code: str):
    """Send OTP via SMS"""
    message = (
        f"ARMZ Aviation verification code: {otp_code}. "
        "Valid for 10 minutes. Do not share this code with anyone. "
        "Need help? Contact support@armz.local."
    )
    return queue_sms(phone_number, message)


def send_booking_confirmation_sms(phone_number: str, booking_details: dict):
    """Send booking confirmation SMS"""
    message = (
        f"ARMZ Booking Confirmed!\n"
        f"Booking ID: {booking_details.get('booking_id', 'N/A')}\n"
        f"Service: {booking_details.get('service_name', 'ARMZ Service')}\n"
        f"When: {booking_details.get('date', 'N/A')} {booking_details.get('time', 'N/A')}\n"
        "Thank you for choosing ARMZ Aviation. Reply HELP for support."
    )
    return queue_sms(phone_number, message)


def send_payment_confirmation_sms(phone_number: str, payment_details: dict):
    """Send payment confirmation SMS"""
    message = (
        "ARMZ Payment Success\n"
        f"Amount: {payment_details.get('currency', 'INR')} {payment_details.get('amount', 'N/A')}\n"
        f"Plan: {payment_details.get('plan_name', 'N/A')}\n"
        f"Ref: {payment_details.get('reference_id', payment_details.get('payment_id', 'N/A'))}\n"
        "We appreciate your business."
    )
    return queue_sms(phone_number, message)


def send_job_alert_sms(phone_number: str, job_details: dict):
    """Send job alert SMS"""
    message = (
        "ARMZ Job Alert!\n"
        f"Role: {job_details.get('title', 'N/A')}\n"
        f"Company: {job_details.get('company', 'N/A')}\n"
        f"Location: {job_details.get('location', 'N/A')}\n"
        "Open the ARMZ portal to view details and apply."
    )
    return queue_sms(phone_number, message)


def send_interview_reminder_sms(phone_number: str, interview_details: dict):
    """Send interview reminder SMS"""
    message = (
        "Interview Reminder\n"
        f"Company: {interview_details.get('company', 'N/A')}\n"
        f"Date: {interview_details.get('date', 'N/A')}\n"
        f"Time: {interview_details.get('time', 'N/A')}\n"
        "Please arrive 10 minutes early and keep your documents ready."
    )
    return queue_sms(phone_number, message)
