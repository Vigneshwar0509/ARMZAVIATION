import logging
from html import escape

from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import NotFound

from contact.models import Lead
from contact.selectors import lead_by_id, leads_queryset
from contact.serializers import LeadSerializer
from services.email_service import queue_email
from services.sms_service import queue_sms

logger = logging.getLogger(__name__)


def _build_contact_lead_payload(contact_message, user=None):
    metadata = {
        "formType": "contact",
        "fullName": contact_message.full_name,
        "email": contact_message.email,
        "phone": contact_message.phone or "",
        "subject": contact_message.subject,
        "submittedAt": contact_message.created_at.isoformat() if contact_message.created_at else None,
    }
    if user and getattr(user, "id", None):
        metadata["userId"] = user.id

    return {
        "user": user if getattr(user, "is_authenticated", False) else None,
        "name": contact_message.full_name,
        "email": contact_message.email,
        "phone": contact_message.phone or "",
        "interest": contact_message.subject,
        "source": "contact_form",
        "message": contact_message.message,
        "metadata": metadata,
    }


def build_contact_email_payload(full_name: str, email: str, phone: str, subject: str, message: str) -> tuple[str, str, str]:
    email_subject = f"[ARMZ Contact] {subject}"
    text_body = (
        "New contact enquiry received from the ARMZ website.\n\n"
        f"Name: {full_name}\n"
        f"Email: {email}\n"
        f"Phone: {phone or 'Not provided'}\n"
        f"Subject: {subject}\n\n"
        "Message:\n"
        f"{message}\n\n"
        "This message was generated automatically by the ARMZ contact form."
    )
    html_body = (
        "<html><body style='font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:24px;'>"
        "<div style='max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:28px;'>"
        "<h2 style='margin:0 0 16px;color:#1e293b;'>New Contact Enquiry</h2>"
        "<p style='margin:0 0 20px;color:#475569;'>A visitor submitted the contact form on ARMZ Aviation. Review the request below and follow up as needed.</p>"
        "<table style='width:100%;border-collapse:collapse;color:#334155;'>"
        f"<tr><td style='padding:10px 0;font-weight:700;width:180px;'>Name</td><td style='padding:10px 0;'>{escape(full_name)}</td></tr>"
        f"<tr><td style='padding:10px 0;font-weight:700;'>Email</td><td style='padding:10px 0;'>{escape(email)}</td></tr>"
        f"<tr><td style='padding:10px 0;font-weight:700;'>Phone</td><td style='padding:10px 0;'>{escape(phone or 'Not provided')}</td></tr>"
        f"<tr><td style='padding:10px 0;font-weight:700;'>Subject</td><td style='padding:10px 0;'>{escape(subject)}</td></tr>"
        "</table>"
        "<section style='margin-top:24px;'>"
        "<h3 style='margin:0 0 10px;color:#0f172a;font-size:16px;'>Message</h3>"
        f"<p style='margin:0;color:#475569;white-space:pre-wrap;line-height:1.65;'>{escape(message)}</p>"
        "</section>"
        "<footer style='margin-top:30px;border-top:1px solid #e2e8f0;padding-top:18px;color:#64748b;font-size:13px;'>"
        "<p style='margin:0;'>Contact form submitted securely through ARMZ Aviation.</p>"
        f"<p style='margin:8px 0 0;'>Support: {escape(getattr(settings, 'CONTACT_INBOX_EMAIL', 'support@armz.local'))}</p>"
        "</footer>"
        "</div></body></html>"
    )
    return email_subject, text_body, html_body


@transaction.atomic
def submit_contact_message(serializer, user=None):
    contact_message = serializer.save()
    Lead.objects.create(**_build_contact_lead_payload(contact_message, user=user))
    email_subject, email_text, email_html = build_contact_email_payload(
        full_name=contact_message.full_name,
        email=contact_message.email,
        phone=contact_message.phone,
        subject=contact_message.subject,
        message=contact_message.message,
    )

    sms_result = True
    if contact_message.phone:
        sms_message = (
            f"Hi {contact_message.full_name},\n"
            "Thanks for reaching out to ARMZ Aviation. Your enquiry has been received and our support team will respond within 24 hours.\n"
            "For urgent assistance, reply to this message or email support@armz.local."
        )
        try:
            sms_result = queue_sms(contact_message.phone, sms_message)
        except Exception:
            logger.exception("Failed to queue contact confirmation SMS for %s", contact_message.phone)
            sms_result = False

    try:
        queue_email(
            email_subject,
            email_text,
            [getattr(settings, 'CONTACT_INBOX_EMAIL', 'support@armz.local')],
            html_message=email_html,
            reply_to=[contact_message.email] if contact_message.email else None,
        )
    except Exception:
        logger.exception("Failed to queue contact enquiry email for %s", contact_message.email)
        message = "Your enquiry was saved, but the email could not be delivered."
        if not sms_result:
            message = "Your enquiry was saved, but we could not deliver notifications by email or SMS."
        return {"success": True, "message": message}, 201

    if not sms_result and contact_message.phone:
        return {"success": True, "message": "Message submitted, but SMS confirmation could not be delivered."}, 201

    return {"success": True, "message": "Message submitted"}, 201


def list_leads_for_user(user):
    if not user.is_admin_user:
        return []
    return leads_queryset()


def create_lead(serializer, user=None):
    lead = serializer.save(user=user)
    return LeadSerializer(lead).data


def update_lead_status(lead_id, status_value):
    lead = lead_by_id(lead_id)
    if not lead:
        raise NotFound("Lead not found")
    lead.status = status_value or lead.status
    lead.save(update_fields=["status", "updated_at"])
    return LeadSerializer(lead).data


def delete_lead(lead_id):
    lead = lead_by_id(lead_id)
    if not lead:
        raise NotFound("Lead not found")
    lead.delete()
    return {"success": True}
