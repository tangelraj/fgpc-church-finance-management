from django.urls import path

from .views import (
    church_settings_view,
    change_password,
    staff_list,
)


app_name = "church_settings"


urlpatterns = [

    path(
        "",
        church_settings_view,
        name="church-settings"
    ),

    path(
        "change-password/",
        change_password,
        name="change-password"
    ),

    path(
        "staff/",
        staff_list,
        name="staff-list"
    ),

]