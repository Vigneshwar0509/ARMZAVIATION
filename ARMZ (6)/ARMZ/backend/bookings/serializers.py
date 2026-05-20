from rest_framework import serializers

from bookings.models import Application, Booking, SavedJob
from services.serializers import InternshipSerializer, JobSerializer


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = "__all__"


class ApplicationSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    internship = InternshipSerializer(read_only=True)
    jobId = serializers.SerializerMethodField()
    userId = serializers.IntegerField(source="user_id", read_only=True)
    appliedAt = serializers.DateTimeField(source="applied_at", read_only=True)
    userName = serializers.SerializerMethodField()
    userEmail = serializers.EmailField(source="user.email", read_only=True)
    userPhone = serializers.CharField(source="user.phone", read_only=True, required=False, allow_blank=True)
    job_details = serializers.SerializerMethodField()
    statusLabel = serializers.SerializerMethodField()
    applicationType = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id",
            "job",
            "internship",
            "job_id",
            "internship_id",
            "user_id",
            "status",
            "applied_at",
            "jobId",
            "userId",
            "appliedAt",
            "userName",
            "userEmail",
            "userPhone",
            "job_details",
            "statusLabel",
            "applicationType",
        ]

    def get_userName(self, obj):
        try:
            return obj.user.get_full_name().strip() or obj.user.email
        except:
            return obj.user.email if obj.user else "Unknown"

    def get_jobId(self, obj):
        return obj.job_id or obj.internship_id or ""

    def get_applicationType(self, obj):
        """Determine whether this is a Job or Internship application"""
        if obj.internship_id:
            return "Internship"
        return "Job"

    def get_job_details(self, obj):
        """Always return job/internship details with all required fields for admin panel"""
        try:
            if obj.job is not None:
                return {
                    "id": obj.job.id,
                    "title": obj.job.title or "",
                    "company": obj.job.company_name or "",
                    "location": obj.job.location or "",
                    "salary": obj.job.salary or "",
                    "type": "Job",
                }

            if obj.internship is not None:
                return {
                    "id": obj.internship.id,
                    "title": obj.internship.title or "",
                    "company": obj.internship.company_name or "",
                    "location": obj.internship.location or "",
                    "salary": obj.internship.stipend or "",
                    "type": "Internship",
                }
        except Exception as e:
            # Gracefully handle any missing data
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in get_job_details: {str(e)}")
            pass

        return {
            "id": "",
            "title": "",
            "company": "",
            "location": "",
            "salary": "",
            "type": "Unknown",
        }

    def get_statusLabel(self, obj):
        return obj.get_status_display()


class SavedJobSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)

    class Meta:
        model = SavedJob
        fields = ["id", "job", "job_id", "user_id", "created_at"]
