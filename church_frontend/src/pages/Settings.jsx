import { useEffect, useState } from "react";
import {
  Church,
  Receipt,
  UserRound,
  Users,
  Database,
  Save,
  Upload,
  LockKeyhole,
  ExternalLink,
  LoaderCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import BackupRestore from "../components/BackupRestore";

import "../styles/Settings.css";


const profileFields = [
  ["church_name", "Church Name"],
  ["headquarters", "Headquarters"],
  ["branch_name", "Branch Name"],
  ["registration_number", "Registration Number"],
  ["registration_details", "Registration Details", "textarea"],
  ["address", "Church Address", "textarea"],
  ["phone", "Phone Number", "tel"],
  ["email", "Email Address", "email"],
  ["pastor_name", "Pastor Name"],
  ["cashier_name", "Cashier Name"],
];


const receiptFields = [
  ["praise_text", "Praise Text"],
  ["receipt_title", "Cash Receipt Title"],
  ["voucher_title", "Payment Voucher Title"],
  ["receipt_signature", "Receipt Signature"],
  ["receiver_signature", "Receiver Signature"],
  ["cashier_signature", "Cashier Signature"],
  ["pastor_signature", "Pastor Signature"],
];


const initialPassword = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};


function getError(error) {
  const data = error.response?.data;

  if (data?.detail) {
    return data.detail;
  }

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([key, value]) =>
        `${key}: ${Array.isArray(value)
          ? value.join(" ")
          : String(value)}`
      )
      .join(" ");
  }

  return "Something went wrong. Please try again.";
}


export default function Settings() {

  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const isAdmin = Boolean(user?.is_superuser);

  const [tab, setTab] = useState("church");

  const [form, setForm] = useState({});

  const [logo, setLogo] = useState(null);

  const [preview, setPreview] = useState("");

  const [staff, setStaff] = useState([]);

  const [password, setPassword] = useState(
    initialPassword
  );

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState("");

  const [error, setError] = useState("");


  // ======================================
  // LOAD CHURCH SETTINGS
  // ======================================

  useEffect(() => {

    const controller = new AbortController();

    const loadSettings = async () => {

      try {

        const response = await api.get(
          "settings/",
          { signal: controller.signal }
        );

        if (!controller.signal.aborted) {
          setForm(response.data);
        }

      } catch (err) {

        if (!controller.signal.aborted) {
          setError(getError(err));
        }

      } finally {

        if (!controller.signal.aborted) {
          setLoading(false);
        }

      }

    };

    loadSettings();

    return () => controller.abort();

  }, []);


  // ======================================
  // LOGO PREVIEW
  // ======================================

  useEffect(() => {

    if (!logo) {
      setPreview(form.logo || "");
      return;
    }

    const objectUrl = URL.createObjectURL(logo);

    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);

  }, [logo, form.logo]);


  // ======================================
  // LOAD STAFF ACCOUNTS
  // ======================================

  useEffect(() => {

    if (tab !== "staff" || !isAdmin) return;

    const controller = new AbortController();

    api.get("settings/staff/", {
      signal: controller.signal,
    })

      .then((response) => {

        if (!controller.signal.aborted) {
          setStaff(response.data);
        }

      })

      .catch((err) => {

        if (!controller.signal.aborted) {
          setError(getError(err));
        }

      });

    return () => controller.abort();

  }, [tab, isAdmin]);


  // ======================================
  // SETTINGS TABS
  // ======================================

  const tabs = [

    {
      id: "church",
      label: "Church Profile",
      icon: Church,
    },

    {
      id: "receipt",
      label: "Receipt & Voucher",
      icon: Receipt,
    },

    {
      id: "account",
      label: "My Account",
      icon: UserRound,
    },

    ...(isAdmin ? [

      {
        id: "staff",
        label: "Staff Management",
        icon: Users,
      },

      {
        id: "backup",
        label: "Backup & Restore",
        icon: Database,
      },

    ] : []),

  ];


  const changeTab = (value) => {

    setTab(value);

    setSuccess("");

    setError("");

  };


  const handleChange = (event) => {

    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  // ======================================
  // LOGO UPLOAD
  // ======================================

  const handleLogo = (event) => {

    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {

      setError("Please select a valid image.");

      return;

    }

    if (file.size > 2 * 1024 * 1024) {

      setError("Image size must not exceed 2 MB.");

      return;

    }

    setLogo(file);

  };


  // ======================================
  // SAVE CHURCH SETTINGS
  // ======================================

  const saveSettings = async (event) => {

    event.preventDefault();

    if (!isAdmin || !form.id) return;

    setSaving(true);

    setSuccess("");

    setError("");

    try {

      const data = new FormData();

      const fields = tab === "receipt"
        ? receiptFields
        : profileFields;

      fields.forEach(([name]) => {

        data.append(name, form[name] ?? "");

      });

      if (tab === "church" && logo) {

        data.append("logo", logo);

      }

      const response = await api.patch(
        "settings/",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setForm(response.data);

      if (tab === "church") {

        setLogo(null);

      }

      setSuccess("Settings saved successfully.");

    } catch (err) {

      setError(getError(err));

    } finally {

      setSaving(false);

    }

  };


  // ======================================
  // CHANGE PASSWORD
  // ======================================

  const savePassword = async (event) => {

    event.preventDefault();

    setSuccess("");

    setError("");

    if (
      password.new_password !==
      password.confirm_password
    ) {

      setError("New passwords do not match.");

      return;

    }

    setSaving(true);

    try {

      await api.post(
        "settings/change-password/",
        password
      );

      setPassword(initialPassword);

      window.alert(
        "Password changed successfully. Please log in again."
      );

      await logout();

      navigate("/login", { replace: true });

    } catch (err) {

      setError(getError(err));

    } finally {

      setSaving(false);

    }

  };


  // ======================================
  // REUSABLE FORM FIELD
  // ======================================

  const renderField = ([name, label, type]) => (

    <div
      key={name}
      className={
        type === "textarea"
          ? "settings-field full-width"
          : "settings-field"
      }
    >

      <label htmlFor={name}>{label}</label>

      {type === "textarea" ? (

        <textarea
          id={name}
          name={name}
          rows={3}
          value={form[name] || ""}
          onChange={handleChange}
          disabled={!isAdmin || saving}
        />

      ) : (

        <input
          id={name}
          name={name}
          type={type || "text"}
          value={form[name] || ""}
          onChange={handleChange}
          disabled={!isAdmin || saving}
          required={[
            "church_name",
            "branch_name",
            "receipt_title",
            "voucher_title",
          ].includes(name)}
        />

      )}

    </div>

  );


  const adminUrl = new URL(
    "/admin/",
    api.defaults.baseURL ||
      "http://127.0.0.1:8000/api/"
  ).href;


  if (loading) {

    return (

      <div className="settings-loading">

        <LoaderCircle
          size={35}
          className="settings-spinner"
        />

        <p>Loading church settings...</p>

      </div>

    );

  }


  return (

    <div className="settings-page">

      <div className="settings-header">

        <h1>Church Settings</h1>

        <p>
          Manage church information and account preferences.
        </p>

      </div>


      {/* SETTINGS TABS */}

      <div className="settings-tabs">

        {tabs.map(({ id, label, icon: Icon }) => (

          <button
            key={id}
            type="button"
            className={
              tab === id
                ? "settings-tab active"
                : "settings-tab"
            }
            onClick={() => changeTab(id)}
            disabled={saving}
          >

            <Icon size={19} />

            {label}

          </button>

        ))}

      </div>


      {/* SUCCESS AND ERROR MESSAGES */}

      {success && (

        <div className="settings-success">
          {success}
        </div>

      )}

      {error && (

        <div className="settings-error">
          {error}
        </div>

      )}


      {/* CHURCH PROFILE */}

      {tab === "church" && (

        <form
          className="settings-card"
          onSubmit={saveSettings}
        >

          <h2>Church Profile</h2>

          <p className="settings-description">
            Update the official church information.
          </p>


          <div className="settings-logo-section">

            <div className="settings-logo-preview">

              {preview ? (

                <img
                  src={preview}
                  alt="Church Logo"
                />

              ) : (

                <Church size={45} />

              )}

            </div>

            <div>

              <h3>Church Logo</h3>

              <p>PNG or JPG image, maximum 2 MB.</p>

              {isAdmin && (

                <label className="settings-upload">

                  <Upload size={17} />

                  Choose Image

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogo}
                    disabled={saving}
                    hidden
                  />

                </label>

              )}

            </div>

          </div>


          <div className="settings-form-grid">

            {profileFields.map(renderField)}

          </div>


          {isAdmin && (

            <div className="settings-footer">

              <button
                type="submit"
                className="settings-save"
                disabled={saving || !form.id}
              >

                <Save size={18} />

                {saving
                  ? "Saving..."
                  : "Save Changes"}

              </button>

            </div>

          )}

        </form>

      )}


      {/* RECEIPT AND VOUCHER SETTINGS */}

      {tab === "receipt" && (

        <form
          className="settings-card"
          onSubmit={saveSettings}
        >

          <h2>Receipt & Voucher Settings</h2>

          <p className="settings-description">
            Manage document titles and signature labels.
          </p>

          <div className="settings-form-grid">

            {receiptFields.map(renderField)}

          </div>


          {/* RECEIPT PREVIEW */}

          <div className="settings-document-preview">

            <p>{form.praise_text}</p>

            <h2>{form.church_name}</h2>

            <h3>NHO : {form.headquarters}</h3>

            <p>{form.registration_details}</p>

            <h3>{form.branch_name}</h3>

            <p>{form.address}</p>

            <h2>{form.receipt_title}</h2>

            <div className="settings-preview-signature">

              {form.receipt_signature}

            </div>

          </div>


          {isAdmin && (

            <div className="settings-footer">

              <button
                type="submit"
                className="settings-save"
                disabled={saving || !form.id}
              >

                <Save size={18} />

                {saving
                  ? "Saving..."
                  : "Save Changes"}

              </button>

            </div>

          )}

        </form>

      )}


      {/* MY ACCOUNT */}

      {tab === "account" && (

        <>

          <div className="settings-card">

            <h2>My Account</h2>

            <div className="settings-account">

              <div className="settings-avatar">

                <UserRound size={35} />

              </div>

              <div>

                <h3>{user?.full_name}</h3>

                <p>{user?.role}</p>

              </div>

            </div>

            <div className="settings-form-grid">

              {[
                ["Username", user?.username],
                ["Full Name", user?.full_name],
                ["Email", user?.email],
                ["Role", user?.role],
              ].map(([label, value]) => (

                <div
                  className="settings-field"
                  key={label}
                >

                  <label>{label}</label>

                  <input
                    value={value || ""}
                    readOnly
                  />

                </div>

              ))}

            </div>

          </div>


          {/* CHANGE PASSWORD */}

          <form
            className="settings-card"
            onSubmit={savePassword}
          >

            <h2>

              <LockKeyhole size={21} />

              Change Password

            </h2>

            <p className="settings-description">

              You will need to log in again after
              changing your password.

            </p>

            <div className="settings-password-fields">

              {[
                ["current_password", "Current Password"],
                ["new_password", "New Password"],
                ["confirm_password", "Confirm New Password"],
              ].map(([name, label]) => (

                <div
                  className="settings-field"
                  key={name}
                >

                  <label htmlFor={name}>
                    {label}
                  </label>

                  <input
                    id={name}
                    type="password"
                    value={password[name]}
                    required
                    disabled={saving}
                    autoComplete={
                      name === "current_password"
                        ? "current-password"
                        : "new-password"
                    }
                    onChange={(event) =>

                      setPassword((previous) => ({
                        ...previous,
                        [name]: event.target.value,
                      }))

                    }
                  />

                </div>

              ))}

            </div>

            <div className="settings-footer">

              <button
                type="submit"
                className="settings-save"
                disabled={saving}
              >

                <LockKeyhole size={18} />

                {saving
                  ? "Updating..."
                  : "Change Password"}

              </button>

            </div>

          </form>

        </>

      )}


      {/* STAFF MANAGEMENT */}

      {tab === "staff" && isAdmin && (

        <div className="settings-card">

          <div className="settings-staff-header">

            <div>

              <h2>Staff Management</h2>

              <p className="settings-description">
                Manage authorized church staff accounts.
              </p>

            </div>

            <a
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="settings-save"
            >

              <ExternalLink size={17} />

              Open Django Admin

            </a>

          </div>


          <div className="settings-table-wrapper">

            <table className="settings-table">

              <thead>

                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                {staff.map((member) => (

                  <tr key={member.id}>

                    <td>{member.username}</td>

                    <td>{member.full_name}</td>

                    <td>{member.email || "-"}</td>

                    <td>{member.role}</td>

                    <td>

                      <span
                        className={
                          member.is_active
                            ? "staff-active"
                            : "staff-inactive"
                        }
                      >

                        {member.is_active
                          ? "Active"
                          : "Inactive"}

                      </span>

                    </td>

                  </tr>

                ))}

                {staff.length === 0 && (

                  <tr>

                    <td colSpan={5}>
                      No staff accounts to display.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

          <p className="settings-staff-note">

            To create, edit or deactivate staff accounts,
            use the Users section in Django Admin.

          </p>

        </div>

      )}


      {/* BACKUP AND RESTORE */}

      {tab === "backup" && isAdmin && (

        <BackupRestore />

      )}

    </div>

  );

}