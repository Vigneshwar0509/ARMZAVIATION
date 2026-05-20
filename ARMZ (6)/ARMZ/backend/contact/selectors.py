from contact.models import Lead


def lead_by_id(lead_id):
    return Lead.objects.filter(pk=lead_id).first()


def leads_queryset():
    return Lead.objects.select_related("user").order_by("-created_at")
