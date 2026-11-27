import logging
import shutil
import tempfile

from pathlib import Path
from django.conf import settings

from django.http import FileResponse

from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from audit_logs.utils import create_audit_log

from .utils import (
    create_backup,
    backup_filename,
)


logger = logging.getLogger(__name__)


# ==========================================
# DOWNLOAD DATABASE BACKUP
# ==========================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def download_backup(request):

    # Only superusers can download backups

    if not request.user.is_superuser:

        return Response(

            {
                "detail": (
                    "Only administrators can "
                    "download database backups."
                )
            },

            status=status.HTTP_403_FORBIDDEN,

        )
    
    if (
        settings.DATABASES["default"]["ENGINE"]
        != "django.db.backends.sqlite3"
    ):

        return Response(

            {
                "detail": (
                    "SQLite backup downloads are not "
                    "available for PostgreSQL databases. "
                    "Use the configured database backup service."
                )
            },

            status=status.HTTP_503_SERVICE_UNAVAILABLE,

        )

    filename = backup_filename()

    download_file = tempfile.TemporaryFile(
        mode="w+b"
    )

    try:

        with tempfile.TemporaryDirectory() as temp_dir:

            backup_path = (
                Path(temp_dir) / filename
            )

            create_backup(backup_path)

            with open(backup_path, "rb") as source:

                shutil.copyfileobj(
                    source,
                    download_file,
                )

        download_file.seek(0)

        # Record backup activity

        create_audit_log(

            user=request.user,

            module="backups",

            action="downloaded",

            reference=filename,

            description=(
                "Database backup generated "
                "for administrator download."
            ),

        )

        # Return ZIP file

        response = FileResponse(

            download_file,

            as_attachment=True,

            filename=filename,

            content_type="application/zip",

        )

        response["Cache-Control"] = (
            "private, no-store"
        )

        return response

    except Exception:

        download_file.close()

        logger.exception(
            "Database backup failed."
        )

        return Response(

            {
                "detail": (
                    "Unable to create database backup. "
                    "Please check the server logs."
                )
            },

            status=status.HTTP_500_INTERNAL_SERVER_ERROR,

        )