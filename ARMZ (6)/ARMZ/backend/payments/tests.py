from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import datetime, timedelta
from decimal import Decimal

from accounts.models import User
from payments.models import PaymentOrder, PaymentTransaction, Subscription
from services.models import Plan
from services.utils import build_plan_code


@override_settings(PRIME_ADMIN_EMAIL="rkpk110011@gmail.com")
class PaymentSecurityTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="student@example.com",
            email="student@example.com",
            password="StudentPass123!",
            role="student",
            is_active=True,
        )
        self.admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="AdminPass123!",
            role="admin",
            is_active=True,
        )
        self.other_user = User.objects.create_user(
            username="other@example.com",
            email="other@example.com",
            password="OtherPass123!",
            role="student",
            is_active=True,
        )
        self.plan = Plan.objects.create(
            name="Premium",
            price=999,
            period="month",
            description="Premium plan",
            features=["Feature A"],
            permissions=["jobs"],
            type="student",
            is_active=True,
        )
        # Create subscription with required dates
        today = datetime.now().date()
        self.subscription = Subscription.objects.create(
            user=self.other_user, 
            plan=self.plan, 
            status="active",
            start_date=today,
            end_date=today + timedelta(days=30),
            renewal_date=today + timedelta(days=30)
        )

    @override_settings(DEBUG=False, RAZORPAY_KEY_ID="", RAZORPAY_KEY_SECRET="")
    def test_payment_order_requires_gateway_configuration_outside_debug(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/payments/create-order",
            {"planId": str(self.plan.id), "amount": 1000, "currency": "INR"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_subscription_detail_is_limited_to_owner(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/payments/subscription/{self.subscription.id}")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @override_settings(DEBUG=True, RAZORPAY_KEY_ID="", RAZORPAY_KEY_SECRET="")
    def test_create_order_uses_server_side_plan_price(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/payments/create-order",
            {"planId": str(self.plan.id), "amount": 1, "currency": "INR"},
            format="json",
        )
        if response.status_code != 200:
            print(f"ERROR Response: {response.content}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Amount should be converted to Decimal from plan price (999 paise per rupee)
        expected_amount = Decimal("999.00")  # 999 rupees
        self.assertEqual(Decimal(str(response.data["order"]["amount"])), expected_amount)

    @override_settings(DEBUG=True, RAZORPAY_KEY_ID="", RAZORPAY_KEY_SECRET="")
    def test_create_order_accepts_plan_code_as_planId(self):
        self.client.force_authenticate(user=self.user)
        plan_code = build_plan_code(self.plan.name)
        response = self.client.post(
            "/payments/create-order",
            {"planId": plan_code, "currency": "INR"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_amount = Decimal("999.00")
        self.assertEqual(Decimal(str(response.data["order"]["amount"])), expected_amount)

    @override_settings(DEBUG=True, RAZORPAY_KEY_ID="", RAZORPAY_KEY_SECRET="")
    def test_verify_payment_is_idempotent_for_duplicate_requests(self):
        self.client.force_authenticate(user=self.user)
        order = PaymentOrder.objects.create(
            user=self.user,
            plan=self.plan,
            amount=self.plan.price,
            currency="INR",
            status="created",
            razorpay_order_id="order_debug_001",
            created_by=self.user,
        )

        payload = {
            "razorpay_order_id": order.razorpay_order_id,
            "razorpay_payment_id": "pay_duplicate_001",
            "razorpay_signature": "sig",
            "planId": str(self.plan.id),
            "local_order_id": str(order.id),
        }

        first = self.client.post("/payments/verify", payload, format="json")
        self.assertEqual(first.status_code, status.HTTP_200_OK)

        second = self.client.post("/payments/verify", payload, format="json")
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(PaymentTransaction.objects.filter(razorpay_payment_id="pay_duplicate_001").count(), 1)

    @override_settings(DEBUG=True, RAZORPAY_KEY_ID="", RAZORPAY_KEY_SECRET="")
    def test_verify_payment_rejects_missing_order_reference(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/payments/verify",
            {
                "razorpay_payment_id": "pay_missing_order_001",
                "razorpay_signature": "sig",
                "planId": str(self.plan.id),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_payments_and_subscriptions_list_routes_return_200(self):
        self.client.force_authenticate(user=self.admin)
        payments_response = self.client.get("/api/admin/payments")
        subscriptions_response = self.client.get("/api/admin/subscriptions")

        self.assertEqual(payments_response.status_code, status.HTTP_200_OK)
        self.assertEqual(subscriptions_response.status_code, status.HTTP_200_OK)
        self.assertIn("data", payments_response.data)
        self.assertIn("data", subscriptions_response.data)

    def test_admin_payments_response_includes_camelcase_transaction_fields(self):
        self.client.force_authenticate(user=self.admin)
        order = PaymentOrder.objects.create(
            user=self.other_user,
            plan=self.plan,
            amount=Decimal('999.00'),
            currency="INR",
            status="paid",
            razorpay_order_id="order_test_001",
            created_by=self.admin,
        )
        PaymentTransaction.objects.create(
            user=self.other_user,
            plan=self.plan,
            order=order,
            amount=Decimal('999.00'),
            currency="INR",
            status="success",
            payment_method="card",
            razorpay_payment_id="pay_test_001",
        )

        response = self.client.get("/api/admin/payments")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data.get('data') if isinstance(response.data, dict) else None
        self.assertIsNotNone(data)
        self.assertIn('transactions', data)
        self.assertIn('summary', data)
        self.assertTrue(isinstance(data['transactions'], list))
        self.assertGreater(len(data['transactions']), 0)

        txn = data['transactions'][0]
        self.assertIn('transactionDate', txn)
        self.assertIn('paymentId', txn)
        self.assertIn('orderId', txn)
        self.assertIn('userName', txn)
        self.assertIn('planName', txn)
        self.assertIn('totalRevenue', data['summary'])
        self.assertIn('pendingPayments', data['summary'])
