import json
import sqlite3
import tempfile
import zipfile

from pathlib import Path

from django.conf import settings
from django.utils import timezone


# ==========================================
# BACKUP FILE NAME
# ==========================================

def backup_filename():

    timestamp = timezone.localtime().strftime(
        "%Y%m%d_%H%M%S"
    )

    return f"FGPC_Backup_{timestamp}.zip"


# ==========================================
# CREATE DATABASE BACKUP
# ==========================================

def create_backup(output_path):

    database = settings.DATABASES["default"]

    if database["ENGINE"] != "django.db.backends.sqlite3":

        raise ValueError(
            "This backup system supports SQLite only."
        )

    database_path = Path(database["NAME"])

    if not database_path.is_file():

        raise FileNotFoundError(
            "Database file not found."
        )

    output_path = Path(output_path)

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with tempfile.TemporaryDirectory() as temp_dir:

        snapshot_path = (
            Path(temp_dir) / "db.sqlite3"
        )

        # Create a consistent SQLite snapshot

        source = sqlite3.connect(
            database_path.resolve().as_uri() + "?mode=ro",
            uri=True,
        )

        destination = sqlite3.connect(
            str(snapshot_path)
        )

        try:

            source.backup(destination)

        finally:

            destination.close()

            source.close()

        # Backup information

        backup_info = {

            "project": (
                "FGPC Yelahanka Church Finance Management"
            ),

            "backup_date": (
                timezone.localtime().isoformat()
            ),

            "database_type": "SQLite",

            "backup_version": 1,

        }

        # Create ZIP file

        with zipfile.ZipFile(

            output_path,

            mode="w",

            compression=zipfile.ZIP_DEFLATED,

        ) as zip_file:

            # Add database

            zip_file.write(

                snapshot_path,

                arcname="db.sqlite3",

            )

            # Add backup information

            zip_file.writestr(

                "backup_info.json",

                json.dumps(
                    backup_info,
                    indent=4,
                ),

            )

            # Add uploaded media files

            media_root = Path(
                settings.MEDIA_ROOT
            )

            if media_root.is_dir():

                for file_path in media_root.rglob("*"):

                    if (
                        file_path.is_file()
                        and not file_path.is_symlink()
                        and file_path.resolve().is_relative_to(
                            media_root.resolve()
                        )
                    ):

                        relative_path = (
                            file_path.relative_to(
                                media_root
                            )
                        )

                        zip_file.write(

                            file_path,

                            arcname=(
                                Path("media")
                                / relative_path
                            ).as_posix(),

                        )

    return output_path