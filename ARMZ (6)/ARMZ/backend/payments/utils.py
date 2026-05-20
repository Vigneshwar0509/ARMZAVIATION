import hmac
import hashlib


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str, secret: str) -> bool:
    payload = f"{order_id}|{payment_id}".encode("utf-8")
    generated = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated, signature)
