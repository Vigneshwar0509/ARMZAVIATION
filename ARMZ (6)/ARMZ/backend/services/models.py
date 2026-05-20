from django.conf import settings
from django.db import models


class Service(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Company(models.Model):
    name = models.CharField(max_length=255)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    logo = models.URLField(blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Plan(models.Model):
    TYPE_CHOICES = (("student", "Student"), ("employer", "Employer"))
    name = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=12, decimal_places=2, help_text="Base subscription price")
    razorpay_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=2.00, help_text="Razorpay fee percentage (e.g., 2.00 for 2%)")
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=18.00, help_text="GST percentage (e.g., 18.00 for 18%)")
    razorpay_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0, editable=False, help_text="Calculated Razorpay fee (2% of base price)", null=True, blank=True)
    gst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, editable=False, help_text="Calculated GST (18% of base price)", null=True, blank=True)
    final_price = models.DecimalField(max_digits=12, decimal_places=2, default=0, editable=False, help_text="Final price = base + fee + GST", null=True, blank=True)
    tier = models.IntegerField(default=0, help_text="Numeric tier for plan comparison (upgrade/downgrade). Higher = more premium.", null=True, blank=True)
    period = models.CharField(max_length=32, default="month")
    description = models.TextField(blank=True)
    features = models.JSONField(default=list)
    permissions = models.JSONField(default=list)
    tabs = models.JSONField(default=list, blank=True, help_text="Tab configuration for plan details display", null=True)
    razorpay_plan_id = models.CharField(max_length=120, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="student")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_pricing(self):
        """Calculate Razorpay fee and GST based on base price"""
        from decimal import Decimal
        base = Decimal(str(self.price or 0))
        fee_percentage = Decimal(str(self.razorpay_fee_percentage or 2))
        gst_percentage = Decimal(str(self.gst_percentage or 18))
        
        self.razorpay_fee = (base * fee_percentage) / Decimal(100)
        self.gst_amount = (base * gst_percentage) / Decimal(100)
        self.final_price = base + self.razorpay_fee + self.gst_amount

    def save(self, *args, **kwargs):
        self.calculate_pricing()
        super().save(*args, **kwargs)

    def get_pricing_breakdown(self):
        """Return pricing breakdown as dictionary"""
        # Ensure pricing is calculated if not already done
        if self.razorpay_fee is None or self.gst_amount is None or self.final_price is None:
            self.calculate_pricing()
            
        return {
            "base_price": float(self.price),
            "razorpay_fee": float(self.razorpay_fee or 0),
            "razorpay_fee_percentage": float(self.razorpay_fee_percentage),
            "gst_amount": float(self.gst_amount or 0),
            "gst_percentage": float(self.gst_percentage),
            "final_price": float(self.final_price or self.price),
        }

    def __str__(self):
        return self.name


class Job(models.Model):
    STATUS_CHOICES = (("Active", "Active"), ("Closed", "Closed"))
    title = models.CharField(max_length=255)
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name="jobs")
    company_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    description = models.TextField()
    salary = models.CharField(max_length=120, blank=True)
    category = models.CharField(max_length=120, blank=True)
    skills = models.JSONField(default=list)
    type = models.CharField(max_length=120, default="Full-time")
    experience = models.CharField(max_length=120, blank=True)
    requirements = models.JSONField(default=list)
    responsibilities = models.JSONField(default=list)
    logo = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Active")
    posted_by_email = models.EmailField(blank=True)
    applications = models.PositiveIntegerField(default=0)
    views = models.PositiveIntegerField(default=0)
    posted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
    
    class Meta:
        indexes = [
            models.Index(fields=["posted_by_email"]),
            models.Index(fields=["company"]),
            models.Index(fields=["status"]),
            models.Index(fields=["posted_at"]),
        ]


class Internship(models.Model):
    title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    duration = models.CharField(max_length=120, blank=True)
    stipend = models.CharField(max_length=64, blank=True)
    description = models.TextField()
    department = models.CharField(max_length=120, blank=True)
    skills = models.JSONField(default=list)
    requirements = models.JSONField(default=list)
    applications = models.PositiveIntegerField(default=0)
    views = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="Active")
    posted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=["company_name"]),
            models.Index(fields=["status"]),
            models.Index(fields=["posted_at"]),
        ]


class Student(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student_profile", null=True, blank=True)
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120, blank=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    institution = models.CharField(max_length=255, blank=True)
    major = models.CharField(max_length=255, blank=True)
    enrollment_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, default="Active")
    courses = models.PositiveIntegerField(default=0)
    assessments = models.PositiveIntegerField(default=0)
    profile_completion = models.PositiveIntegerField(default=0)
    location = models.CharField(max_length=120, blank=True)
    gpa = models.CharField(max_length=20, blank=True)
    resume_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Campaign(models.Model):
    name = models.CharField(max_length=255)
    target = models.CharField(max_length=255)
    reach = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=30, default="Draft")
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    impressions = models.PositiveIntegerField(default=0)
    clicks = models.PositiveIntegerField(default=0)
    conversions = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class College(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    students = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="Pending")


class Event(models.Model):
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=64, default="Event")
    date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    attendees = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="Upcoming")


class EventRegistration(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="registrations")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="event_registrations")
    registration_code = models.CharField(max_length=64, unique=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("event", "user")
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["event"]),
        ]


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    description = models.TextField()
    type = models.CharField(max_length=64, default="general")
    icon = models.CharField(max_length=64, blank=True)
    read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=255, blank=True)
    priority = models.CharField(max_length=20, default="medium")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["read"]),
            models.Index(fields=["created_at"]),
        ]


class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_preferences")
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=False)
    sms_notifications = models.BooleanField(default=False)
    job_alerts = models.BooleanField(default=True)
    interview_reminders = models.BooleanField(default=True)
    application_updates = models.BooleanField(default=True)
    course_updates = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False)
    weekly_digest = models.BooleanField(default=True)
    immediate_alerts = models.BooleanField(default=True)
    
    class Meta:
        indexes = [
            models.Index(fields=["user"]),
        ]


class Webinar(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=120, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    meeting_link = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class WebinarRegistration(models.Model):
    webinar = models.ForeignKey(Webinar, on_delete=models.CASCADE, related_name="registrations")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="webinar_registrations")
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("webinar", "user")
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["webinar"]),
        ]


class WebinarPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="webinar_preferences")
    preferences = models.JSONField(default=dict)


class Course(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    thumbnail = models.URLField(blank=True)
    category = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class CourseEnrollment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="course_enrollments")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    progress = models.PositiveIntegerField(default=0)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "course")
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["course"]),
        ]


class Interview(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interviews")
    title = models.CharField(max_length=255)
    scheduled_date = models.DateField(null=True, blank=True)
    scheduled_time = models.TimeField(null=True, blank=True)
    meeting_link = models.URLField(blank=True)
    status = models.CharField(max_length=32, default="scheduled")


class Assessment(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    questions = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)


class AssessmentAttempt(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name="attempts")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assessment_attempts")
    answers = models.JSONField(default=dict)
    score = models.PositiveIntegerField(default=0)
    submitted_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
