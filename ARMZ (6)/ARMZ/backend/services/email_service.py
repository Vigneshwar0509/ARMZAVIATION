import logging
from html import escape

import requests
from django.conf import settings

from services.tasks import shared_task

logger = logging.getLogger(__name__)

BREVO_API_ENDPOINT = "https://api.brevo.com/v3/smtp/email"


def _build_brand_html(subject: str, body_lines: list[str], details: list[tuple[str, str]] = None, footer_lines: list[str] = None) -> str:
    details_html = ""
    if details:
        rows = []
        for heading, value in details:
            rows.append(
                f"<tr><td style='padding:8px 0;font-weight:600;color:#0f172a;width:160px'>{escape(str(heading))}</td>"
                f"<td style='padding:8px 0;color:#334155'>{escape(str(value))}</td></tr>"
            )
        details_html = (
            "<table style='width:100%;border-collapse:collapse;margin-top:18px;'>"
            f"{''.join(rows)}"
            "</table>"
        )

    footer_html = ""
    if footer_lines:
        footer_html = "".join(
            f"<p style='margin:0 0 8px;color:#64748b;font-size:13px'>{escape(line)}</p>" for line in footer_lines
        )

    body_html = "".join(
        f"<p style='margin:0 0 14px;color:#334155;font-size:15px'>{escape(line)}</p>" for line in body_lines
    )

    return f"""
    <html>
      <body style="margin:0;background:#f8fafc;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 0;">
          <tr>
            <td align="center">
              <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
                <tr>
                  <td style="background:#5b21b6;padding:28px 32px;color:#ffffff;text-align:center;">
                    <h1 style="margin:0;font-size:28px;letter-spacing:-0.03em;">{escape(subject)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    {body_html}
                    {details_html}
                    {footer_html}
                  </td>
                </tr>
                <tr>
                  <td style="background:#eef2ff;padding:20px 32px;color:#475569;font-size:13px;">
                    <p style="margin:0;">ARMZ Aviation · Trusted operations platform · support@armz.local</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """.strip()


def build_transactional_html_email(subject: str, body_lines: list[str], details: list[tuple[str, str]] = None, footer_lines: list[str] = None) -> str:
    return _build_brand_html(subject, body_lines, details=details, footer_lines=footer_lines)


def build_otp_email(recipient_name: str, otp_code: str, otp_type: str = "email") -> tuple[str, str, str]:
    subject_map = {
        "email": "Your ARMZ verification code",
        "phone": "Your ARMZ verification code",
        "password_reset": "ARMZ password reset code",
    }
    subject = subject_map.get(otp_type, "Your ARMZ verification code")
    purpose = (
        "Use this code to verify your ARMZ email address."
        if otp_type == "email"
        else "Use this code to confirm your ARMZ phone number."
        if otp_type == "phone"
        else "Use this code to reset your ARMZ password."
    )
    validity = "10 minutes"
    text_body = (
        f"Hello {recipient_name or 'Customer'},\n\n"
        f"Your one-time code is: {otp_code}\n"
        f"This code is valid for {validity}.\n\n"
        f"{purpose}\n\n"
        "Do not share this code with anyone. If you did not request this, please contact support@armz.local."
    )
    html_body = _build_brand_html(
        subject,
        [
            f"Hello {recipient_name or 'Customer'},",
            purpose,
            f"Your one-time code is: {otp_code}",
            f"This code is valid for {validity}.",
            "Do not share this code with anyone.",
        ],
        details=[
            ("Purpose", purpose),
            ("Expires in", validity),
        ],
        footer_lines=[
            "If you did not request this code, contact support@armz.local immediately.",
            "Thank you for using ARMZ Aviation.",
        ],
    )
    return subject, text_body, html_body


@shared_task()
def send_email_async(subject, message, recipients, html_message=None, attachments=None, reply_to=None):
    """Send email via Brevo Transactional Email API."""
    if not recipients:
        return 0
    
    brevo_api_key = getattr(settings, "BREVO_API_KEY", "").strip()
    if not brevo_api_key:
        error_msg = "BREVO_API_KEY not configured. Cannot send email."
        logger.error(error_msg)
        if not getattr(settings, "EMAIL_FAIL_SILENTLY", False):
            raise ValueError(error_msg)
        return 0
    
    try:
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@armz.local")
        
        # Prepare recipient list
        to_recipients = [{"email": email} for email in (recipients if isinstance(recipients, list) else [recipients])]
        
        # Prepare reply-to
        reply_to_list = None
        if reply_to:
            reply_to_list = [{"email": email} for email in (reply_to if isinstance(reply_to, list) else [reply_to])]
        
        # Build Brevo API payload
        payload = {
            "sender": {"email": from_email},
            "to": to_recipients,
            "subject": subject,
            "textContent": message,
        }
        
        # Add HTML content if provided
        if html_message:
            payload["htmlContent"] = html_message
        
        # Add reply-to if provided
        if reply_to_list:
            payload["replyTo"] = reply_to_list
        
        # Note: Brevo API doesn't support attachments in the same way.
        # Attachments are currently skipped. If needed, implement via separate API calls.
        if attachments:
            logger.warning("Attachments are not supported with Brevo API. Email will be sent without attachments.")
        
        headers = {
            "api-key": brevo_api_key,
            "Content-Type": "application/json",
        }
        
        response = requests.post(BREVO_API_ENDPOINT, json=payload, headers=headers, timeout=30)
        
        if response.status_code in (200, 201):
            logger.info("Email sent successfully via Brevo API to %s", recipients)
            return 1
        else:
            error_detail = response.text
            logger.error("Brevo API error (status %d): %s", response.status_code, error_detail)
            if not getattr(settings, "EMAIL_FAIL_SILENTLY", False):
                raise Exception(f"Brevo API error: {response.status_code} - {error_detail}")
            return 0
            
    except requests.exceptions.RequestException as e:
        logger.exception("Network error sending email via Brevo API to %s: %s", recipients, e)
        if not getattr(settings, "EMAIL_FAIL_SILENTLY", False):
            raise
        return 0
    except Exception as e:
        logger.exception("Failed to send email via Brevo API to %s: %s", recipients, e)
        if not getattr(settings, "EMAIL_FAIL_SILENTLY", False):
            raise
        return 0


def queue_email(subject, message, recipients, html_message=None, attachments=None, reply_to=None):
    try:
        if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
            logger.debug("CELERY_TASK_ALWAYS_EAGER set: sending email synchronously to %s", recipients)
            return send_email_async(subject, message, recipients, html_message=html_message, attachments=attachments, reply_to=reply_to)

        # Try to queue via Celery if available, otherwise fall back to sync send
        if hasattr(send_email_async, "delay"):
            try:
                return send_email_async.delay(subject, message, recipients, html_message, attachments, reply_to)
            except Exception as e:
                logger.warning("Celery .delay failed, falling back to sync send: %s", e, exc_info=True)
                return send_email_async(subject, message, recipients, html_message=html_message, attachments=attachments, reply_to=reply_to)

        # No .delay available, call directly
        return send_email_async(subject, message, recipients, html_message=html_message, attachments=attachments, reply_to=reply_to)
    except Exception:
        logger.exception("queue_email failed for recipients=%s", recipients)
        if getattr(settings, "EMAIL_FAIL_SILENTLY", False):
            return 0
        raise


def send_account_ready_email(user):
    name = getattr(user, "first_name", None) or getattr(user, "name", None) or "Customer"
    subject = "Welcome to ARMZ Aviation — Your account is ready"
    text_body = (
        f"Hello {name},\n\n"
        "Welcome to ARMZ Aviation. Your account has been successfully created and verified.\n\n"
        "You can now access your dashboard, manage bookings, and explore premium services.\n\n"
        "If you need assistance, reply to this email or contact support@armz.local.\n\n"
        "Warm regards,\n"
        "The ARMZ Aviation Team"
    )

    html_body = _build_brand_html(
        subject,
        [
            f"Hello {name},",
            "Welcome to ARMZ Aviation. Your account has been successfully created and verified.",
            "You can now access your dashboard, manage bookings, and explore premium services.",
            "If you need assistance, reply to this email or contact support@armz.local.",
        ],
        details=[
            ("Email", user.email),
            ("Account status", "Active"),
        ],
        footer_lines=[
            "Need help? Reach our support team at support@armz.local.",
            "Thank you for choosing ARMZ Aviation.",
        ],
    )

    try:
        return queue_email(subject, text_body, [user.email], html_message=html_body)
    except Exception:
        logger.exception("Failed to send account ready email to %s", user.email)
        return 0


def send_payment_receipt_email(user, receipt: dict):
    plan_name = receipt.get("plan_name") or "Subscription Plan"
    payment_id = receipt.get("payment_id") or "payment"
    order_id = receipt.get("order_id") or "N/A"
    amount = receipt.get("amount") or "0"
    currency = receipt.get("currency") or "INR"
    start_date = receipt.get("start_date") or "N/A"
    end_date = receipt.get("end_date") or "N/A"
    renewal_date = receipt.get("renewal_date") or "N/A"
    purchase_date = receipt.get("purchase_date") or "N/A"

    subject = f"Payment receipt for {plan_name}"
    text_body = (
        f"Hello {getattr(user, 'first_name', '') or getattr(user, 'name', '') or 'Customer'},\n\n"
        f"Your payment has been confirmed for {plan_name}.\n\n"
        f"Receipt No: {payment_id}\n"
        f"Order ID: {order_id}\n"
        f"Amount: {currency} {amount}\n"
        f"Purchase Date: {purchase_date}\n"
        f"Subscription Start: {start_date}\n"
        f"Subscription End: {end_date}\n"
        f"Renewal Date: {renewal_date}\n\n"
        "A bill copy is attached to this email.\n\n"
        "Thank you,\n"
        "The ARMZ Aviation Team"
    )

    html_body = _build_brand_html(
        subject,
        [
            f"Hello {getattr(user, 'first_name', '') or getattr(user, 'name', '') or 'Customer'},",
            "Your payment has been confirmed successfully.",
            f"Receipt No: {payment_id}",
            f"Order ID: {order_id}",
            f"Amount: {currency} {amount}",
            f"Purchase Date: {purchase_date}",
            f"Subscription Start: {start_date}",
            f"Subscription End: {end_date}",
            f"Renewal Date: {renewal_date}",
            "A bill copy is attached to this email.",
        ],
        details=[
            ("Plan", plan_name),
            ("Receipt No", payment_id),
            ("Order ID", order_id),
            ("Amount", f"{currency} {amount}"),
            ("Purchase Date", purchase_date),
            ("Subscription Start", start_date),
            ("Subscription End", end_date),
            ("Renewal Date", renewal_date),
        ],
        footer_lines=[
            "If you have any questions about this payment, contact support@armz.local.",
            "Thank you for choosing ARMZ Aviation.",
        ],
    )

    try:
        return queue_email(
            subject,
            text_body,
            [user.email],
            html_message=html_body,
            attachments=[(f"receipt-{payment_id}.html", html_body, "text/html")],
        )
    except Exception:
        logger.exception("Failed to queue payment receipt email to %s", user.email)
        return 0
