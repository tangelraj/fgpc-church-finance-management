from django.urls import path

from .views import download_backup


app_name = "backups"


urlpatterns = [

    path(

        "download/",

        download_backup,

        name="download-backup",

    ),

]