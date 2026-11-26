from django.urls import path
from .views import dashboard_summary

app_name = "reports"

urlpatterns = [
    path(
        "dashboard/",
        dashboard_summary,
        name="dashboard-summary"
    ),
]