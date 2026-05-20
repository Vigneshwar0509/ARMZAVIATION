from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from contact.permissions import IsAdminRole
from contact.serializers import ContactMessageSerializer, LeadSerializer
from contact import services as contact_services


class ContactView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload, response_status = contact_services.submit_contact_message(
            serializer,
            user=request.user if getattr(request.user, "is_authenticated", False) else None,
        )
        return Response(payload, status=response_status)


class LeadsView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        leads = contact_services.list_leads_for_user(request.user)
        return Response({"data": LeadSerializer(leads, many=True).data})

    def post(self, request):
        serializer = LeadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = contact_services.create_lead(
            serializer,
            user=request.user if request.user.is_authenticated else None,
        )
        return Response({"data": payload}, status=201)


class LeadStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def patch(self, request, lead_id):
        return Response({"data": contact_services.update_lead_status(lead_id, request.data.get("status"))})


class LeadDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def delete(self, request, lead_id):
        return Response({"data": contact_services.delete_lead(lead_id)})
