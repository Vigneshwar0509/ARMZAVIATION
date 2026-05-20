from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Application, SavedJob
from bookings.serializers import ApplicationSerializer, SavedJobSerializer
from bookings import services as booking_services
from services.notification_dispatch import send_plan_notification
from services.models import Job


class BookingsView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = booking_services.create_booking(request.data)
        return Response({"data": data}, status=status.HTTP_201_CREATED)


class ApplicationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get applications for current user or filter by parameters"""
        job_id = request.query_params.get("jobId")
        internship_id = request.query_params.get("internshipId")
        user_id = request.query_params.get("userId")
        
        # If userId is provided and user is not admin, they can't view others' applications
        if user_id and str(user_id) != str(request.user.id) and not request.user.is_admin_user:
            raise PermissionDenied("You cannot view another user's applications")
        
        queryset = booking_services.list_applications(
            request.user, 
            job_id=job_id, 
            internship_id=internship_id, 
            user_id=user_id
        )
        serialized = ApplicationSerializer(queryset, many=True).data
        return Response({"data": serialized})


class ApplicationStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, application_id):
        status_value = request.data.get("status", "")
        data = booking_services.update_application_status(application_id, request.user, status_value)
        return Response({"data": data})


class ApplicationNotesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, application_id):
        notes = request.data.get("notes", "")
        data = booking_services.save_application_notes(application_id, request.user, notes)
        return Response({"data": data})


class JobApplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, job_id):
        user_id = request.data.get("userId") or request.user.id
        data = booking_services.apply_to_job(job_id, user_id, request.user)
        return Response({"data": data}, status=status.HTTP_201_CREATED)


class InternshipApplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, internship_id):
        user_id = request.data.get("userId") or request.user.id
        data = booking_services.apply_to_internship(internship_id, user_id, request.user)
        return Response({"data": data}, status=status.HTTP_201_CREATED)


class SavedJobsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        queryset = booking_services.list_saved_jobs(user_id, request.user)
        return Response({"data": SavedJobSerializer(queryset, many=True).data})

    def post(self, request, user_id):
        job_id = request.data.get("jobId")
        data = booking_services.save_job(user_id, job_id, request.user)
        return Response({"data": data}, status=status.HTTP_201_CREATED)


class SavedJobDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, user_id, job_id):
        data = booking_services.unsave_job(user_id, job_id, request.user)
        return Response({"data": data})
