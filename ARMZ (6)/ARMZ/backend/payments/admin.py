from django.contrib import admin
from django.db.models import Sum, Count, Q
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from payments.models import PaymentOrder, PaymentTransaction, Subscription


@admin.register(PaymentOrder)
class PaymentOrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user_email',
        'plan_name',
        'amount_display',
        'currency',
        'status_badge',
        'razorpay_order_id_display',
        'created_at',
    )
    list_filter = ('status', 'currency', 'created_at', 'is_deleted')
    search_fields = ('user__email', 'user__username', 'razorpay_order_id', 'idempotency_key')
    readonly_fields = (
        'razorpay_order_id',
        'idempotency_key',
        'amount',
        'currency',
        'created_at',
        'updated_at',
        'created_by',
        'transactions_summary',
    )
    fieldsets = (
        ('Order Information', {
            'fields': ('id', 'user', 'plan', 'status', 'created_at', 'updated_at')
        }),
        ('Amount & Currency', {
            'fields': ('amount', 'currency')
        }),
        ('Razorpay Details', {
            'fields': ('razorpay_order_id', 'idempotency_key')
        }),
        ('Audit Trail', {
            'fields': ('created_by', 'is_deleted'),
            'classes': ('collapse',)
        }),
        ('Related Transactions', {
            'fields': ('transactions_summary',),
            'classes': ('collapse',)
        }),
    )
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'
    user_email.admin_order_field = 'user__email'

    def plan_name(self, obj):
        return obj.plan.name if obj.plan else 'N/A'
    plan_name.short_description = 'Plan'
    plan_name.admin_order_field = 'plan__name'

    def amount_display(self, obj):
        return f"₹ {obj.amount}"
    amount_display.short_description = 'Amount'
    amount_display.admin_order_field = 'amount'

    def razorpay_order_id_display(self, obj):
        if obj.razorpay_order_id:
            return format_html('<code>{}</code>', obj.razorpay_order_id)
        return 'N/A'
    razorpay_order_id_display.short_description = 'Razorpay Order ID'

    def status_badge(self, obj):
        colors = {'created': '#FFA500', 'paid': '#28a745', 'failed': '#dc3545'}
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.status.upper()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'

    def transactions_summary(self, obj):
        txs = obj.transactions.all()
        if not txs.exists():
            return "No transactions"
        success_count = txs.filter(status='success').count()
        total = txs.count()
        return f"{success_count}/{total} transactions successful"
    transactions_summary.short_description = 'Transactions'

    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(is_deleted=False).select_related('user', 'plan')


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user_email',
        'plan_name',
        'amount_display',
        'status_badge',
        'payment_method',
        'order_link',
        'created_at',
    )
    list_filter = ('status', 'payment_method', 'currency', 'created_at', 'is_deleted')
    search_fields = ('user__email', 'razorpay_payment_id', 'razorpay_signature', 'order__razorpay_order_id')
    readonly_fields = (
        'razorpay_payment_id',
        'razorpay_signature',
        'amount',
        'currency',
        'created_at',
        'updated_at',
        'modified_by',
        'order_link',
    )
    fieldsets = (
        ('Transaction Information', {
            'fields': ('id', 'user', 'plan', 'order_link', 'status', 'created_at', 'updated_at')
        }),
        ('Amount & Currency', {
            'fields': ('amount', 'currency', 'payment_method')
        }),
        ('Razorpay Details', {
            'fields': ('razorpay_payment_id', 'razorpay_signature')
        }),
        ('Audit Trail', {
            'fields': ('modified_by', 'is_deleted'),
            'classes': ('collapse',)
        }),
    )
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'
    user_email.admin_order_field = 'user__email'

    def plan_name(self, obj):
        return obj.plan.name if obj.plan else 'N/A'
    plan_name.short_description = 'Plan'
    plan_name.admin_order_field = 'plan__name'

    def amount_display(self, obj):
        return f"₹ {obj.amount}"
    amount_display.short_description = 'Amount'
    amount_display.admin_order_field = 'amount'

    def status_badge(self, obj):
        colors = {'success': '#28a745', 'failed': '#dc3545', 'pending': '#FFA500'}
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.status.upper()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'

    def order_link(self, obj):
        if obj.order:
            url = reverse('admin:payments_paymentorder_change', args=[obj.order.id])
            return format_html('<a href="{}">{}</a>', url, obj.order.razorpay_order_id or obj.order.id)
        return 'N/A'
    order_link.short_description = 'Related Order'

    def save_model(self, request, obj, form, change):
        if change:  # Editing existing object
            obj.modified_by = request.user
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(is_deleted=False).select_related('user', 'plan', 'order')


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user_email',
        'plan_name',
        'status_badge',
        'amount_display',
        'start_date',
        'end_date',
        'auto_renew',
        'created_at',
    )
    list_filter = ('status', 'auto_renew', 'created_at', 'is_deleted')
    search_fields = ('user__email', 'user__username', 'razorpay_subscription_id')
    readonly_fields = (
        'razorpay_subscription_id',
        'amount',
        'currency',
        'created_at',
        'updated_at',
        'modified_by',
    )
    fieldsets = (
        ('Subscription Information', {
            'fields': ('id', 'user', 'plan', 'status', 'created_at', 'updated_at')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date', 'renewal_date')
        }),
        ('Amount & Currency', {
            'fields': ('amount', 'currency', 'payment_method')
        }),
        ('Renewal Settings', {
            'fields': ('auto_renew',)
        }),
        ('Razorpay Details', {
            'fields': ('razorpay_subscription_id',)
        }),
        ('Audit Trail', {
            'fields': ('modified_by', 'is_deleted'),
            'classes': ('collapse',)
        }),
    )
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'
    user_email.admin_order_field = 'user__email'

    def plan_name(self, obj):
        return obj.plan.name if obj.plan else 'N/A'
    plan_name.short_description = 'Plan'
    plan_name.admin_order_field = 'plan__name'

    def amount_display(self, obj):
        return f"₹ {obj.amount}"
    amount_display.short_description = 'Amount'
    amount_display.admin_order_field = 'amount'

    def status_badge(self, obj):
        colors = {'active': '#28a745', 'pending': '#FFA500', 'cancelled': '#dc3545', 'expired': '#6c757d'}
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.status.upper()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'

    def save_model(self, request, obj, form, change):
        if change:  # Editing existing object
            obj.modified_by = request.user
        super().save_model(request, obj, form, change)

    def delete_model(self, request, obj):
        """Soft delete instead of hard delete"""
        obj.is_deleted = True
        obj.modified_by = request.user
        obj.save()

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(is_deleted=False).select_related('user', 'plan')
