from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from reviews.models import Review
from reviews.permissions import IsAdminRole
from reviews.serializers import ReviewSerializer
from reviews import services as review_services


class ReviewsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = review_services.list_reviews()
        return Response({"data": ReviewSerializer(qs, many=True).data})

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"message": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        data = review_services.create_review(request.data, request.user)
        return Response({"data": data}, status=status.HTTP_201_CREATED)


class ReviewAdminDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, review_id):
        data = review_services.update_review(review_id, request.data, partial=True)
        return Response({"data": data})

    def delete(self, request, review_id):
        data = review_services.delete_review(review_id)
        return Response({"data": data})
