import { useState } from "react";

import {
  Database,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  HardDrive,
  FileArchive,
} from "lucide-react";

import api from "../services/api";

import "../styles/BackupRestore.css";


export default function BackupRestore() {

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");


  const downloadBackup = async () => {

    setLoading(true);
    setSuccess("");
    setError("");

    let objectUrl;

    try {

      const response = await api.get(
        "backups/download/",
        {
          responseType: "blob",
          timeout: 300000,
        }
      );

      const blob = new Blob(
        [response.data],
        { type: "application/zip" }
      );

      objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = objectUrl;

      link.download = `FGPC_Backup_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.zip`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      setSuccess(
        "Backup generated. Your download has started."
      );

    } catch (err) {

      setError(
        err.response?.status === 403
          ? "Only administrators can download backups."
          : "Unable to download backup. Please check your backend."
      );

    } finally {

      if (objectUrl) {

        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 1000);

      }

      setLoading(false);

    }

  };


  const backupItems = [
    "Family and member details",
    "Offering and expense records",
    "Receipt and voucher records",
    "Church settings",
    "Staff accounts",
    "Church logo and family photos",
  ];


  return (

    <div className="backup-page">

      {success && (

        <div className="settings-success">

          <CheckCircle2 size={20} />

          {success}

        </div>

      )}

      {error && (

        <div className="settings-error">

          <AlertCircle size={20} />

          {error}

        </div>

      )}


      {/* DATABASE BACKUP */}

      <div className="settings-card">

        <div className="backup-heading">

          <div className="backup-icon">

            <Database size={30} />

          </div>

          <div>

            <h2>Database Backup</h2>

            <p>
              Protect your church financial records.
            </p>

          </div>

        </div>


        <div className="backup-items">

          <h3>Included in your backup</h3>

          {backupItems.map((item) => (

            <div
              className="backup-item"
              key={item}
            >

              <CheckCircle2 size={18} />

              <span>{item}</span>

            </div>

          ))}

        </div>


        <div className="backup-format">

          <FileArchive size={30} />

          <div>

            <strong>Complete ZIP Backup</strong>

            <p>
              SQLite database and uploaded images
            </p>

          </div>

        </div>


        <button
          type="button"
          className="backup-download-button"
          onClick={downloadBackup}
          disabled={loading}
        >

          {loading ? (

            <LoaderCircle
              size={20}
              className="settings-spinner"
            />

          ) : (

            <Download size={20} />

          )}

          {loading
            ? "Creating Backup..."
            : "Download Complete Backup"}

        </button>

      </div>


      {/* RESTORE DATABASE */}

      <div className="settings-card">

        <div className="backup-heading">

          <div className="backup-icon">

            <HardDrive size={30} />

          </div>

          <div>

            <h2>Restore Database</h2>

            <p>
              Recover records from an existing backup.
            </p>

          </div>

        </div>


        <div className="backup-warning">

          <AlertCircle size={24} />

          <div>

            <strong>Important</strong>

            <p>

              Restoring a database replaces existing
              financial records. Restoration must be
              performed offline by an authorized
              administrator.

            </p>

          </div>

        </div>

      </div>


      {/* BACKUP RECOMMENDATIONS */}

      <div className="settings-card">

        <div className="backup-heading">

          <div className="backup-icon">

            <ShieldCheck size={30} />

          </div>

          <div>

            <h2>Backup Recommendations</h2>

            <p>Keep your church records secure.</p>

          </div>

        </div>


        <div className="backup-items">

          {[
            "Create a backup after every Sunday service.",
            "Create a backup before software updates.",
            "Keep an encrypted copy on a separate device.",
            "Never share database backups publicly.",
            "Test backup recovery regularly.",
          ].map((item) => (

            <div
              className="backup-item"
              key={item}
            >

              <CheckCircle2 size={18} />

              <span>{item}</span>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}