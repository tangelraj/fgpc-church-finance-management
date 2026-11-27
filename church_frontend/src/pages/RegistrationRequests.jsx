import { useEffect, useState } from "react";

import {
  ArrowLeft,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  RefreshCw,
  Eye,
  Phone,
  MapPin,
  CalendarDays,
  LoaderCircle,
  X,
  Check,
} from "lucide-react";

import { Link } from "react-router-dom";

import api from "../services/api";

import { useAuth } from "../context/AuthContext";

import "../styles/RegistrationRequests.css";


const formatDate = (value) => {

  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });

};


const getError = (err) => {

  const data = err.response?.data;

  return (
    data?.detail ||
    (data ? JSON.stringify(data) : "Something went wrong.")
  );

};


export default function RegistrationRequests() {

  const { user } = useAuth();

  const isAdmin = Boolean(user?.is_superuser);

  const [registrations, setRegistrations] = useState([]);

  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [statusFilter, setStatusFilter] =
    useState("pending");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [processing, setProcessing] = useState(false);

  const [selected, setSelected] = useState(null);

  const [showReject, setShowReject] = useState(false);

  const [reason, setReason] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");


  // ==========================================
  // FETCH REGISTRATIONS
  // ==========================================

  const fetchRegistrations = async () => {

    setLoading(true);
    setError("");

    try {

      const records = [];

      let next = "family-registrations/";

      while (next) {

        const response = await api.get(next);

        if (Array.isArray(response.data)) {

          records.push(...response.data);

          next = null;

        } else {

          records.push(
            ...(response.data.results || [])
          );

          next = response.data.next || null;

        }

      }

      const summaryResponse = await api.get(
        "family-registrations/summary/"
      );

      setRegistrations(records);

      setSummary(summaryResponse.data);

    } catch (err) {

      setError(getError(err));

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    if (isAdmin) {

      fetchRegistrations();

    }

  }, [isAdmin]);


  // ==========================================
  // FILTER REGISTRATIONS
  // ==========================================

  const filteredRegistrations = registrations.filter(
    (registration) => {

      const keyword = search.trim().toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        registration.status === statusFilter;

      const matchesSearch = [

        registration.family_head,
        registration.mobile_number,
        registration.whatsapp_number,
        registration.email,
        registration.registration_id,

        ...(registration.members || []).map(
          (member) => member.full_name
        ),

      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(keyword)
      );

      return matchesStatus && matchesSearch;

    }
  );


  // ==========================================
  // OPEN DETAILS
  // ==========================================

  const openDetails = (registration) => {

    setSelected(registration);

    setShowReject(false);

    setReason("");

    setError("");

  };


  const closeDetails = () => {

    if (processing) return;

    setSelected(null);

    setShowReject(false);

    setReason("");

  };


  // ==========================================
  // APPROVE REGISTRATION
  // ==========================================

  const approveRegistration = async () => {

    if (
      !selected ||
      processing ||
      selected.status !== "pending"
    ) return;

    const confirmed = window.confirm(
      `Approve registration for ${selected.family_head}?`
    );

    if (!confirmed) return;

    setProcessing(true);

    setError("");

    setSuccess("");

    try {

      const response = await api.post(
        `family-registrations/${selected.id}/approve/`
      );

      setSuccess(
        `Family approved successfully. Family ID: ${
          response.data.family_id
        }`
      );

      setSelected(null);

      setStatusFilter("approved");

      await fetchRegistrations();

    } catch (err) {

      setError(getError(err));

    } finally {

      setProcessing(false);

    }

  };


  // ==========================================
  // REJECT REGISTRATION
  // ==========================================

  const rejectRegistration = async (event) => {

    event.preventDefault();

    if (
      !selected ||
      processing ||
      selected.status !== "pending"
    ) return;

    if (!reason.trim()) {

      setError("Please enter a rejection reason.");

      return;

    }

    setProcessing(true);

    setError("");

    setSuccess("");

    try {

      await api.post(
        `family-registrations/${selected.id}/reject/`,
        {
          reason: reason.trim(),
        }
      );

      setSuccess(
        "Family registration rejected successfully."
      );

      setSelected(null);

      setShowReject(false);

      setReason("");

      setStatusFilter("rejected");

      await fetchRegistrations();

    } catch (err) {

      setError(getError(err));

    } finally {

      setProcessing(false);

    }

  };


  // ==========================================
  // ADMIN PERMISSION
  // ==========================================

  if (!isAdmin) {

    return (

      <div className="rr-empty">

        <XCircle size={45} />

        <h2>Access Denied</h2>

        <p>
          Only administrators can review registrations.
        </p>

        <Link to="/families">
          Back to Families
        </Link>

      </div>

    );

  }


  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (

    <div className="rr-page">

      <div className="rr-page-heading">

        <div>

          <Link
            to="/families"
            className="rr-back"
          >

            <ArrowLeft size={18} />

            Back to Families

          </Link>

          <h1>Family Registration Requests</h1>

          <p>
            Review and manage submitted family registrations
          </p>

        </div>

        <button
          className="rr-secondary"
          onClick={fetchRegistrations}
          disabled={loading || processing}
        >

          <RefreshCw size={18} />

          Refresh

        </button>

      </div>


      {/* SUMMARY CARDS */}

      <div className="rr-stats">

        {[
          {
            label: "Total Requests",
            value: summary.total,
            icon: ClipboardList,
            color: "purple",
          },
          {
            label: "Pending",
            value: summary.pending,
            icon: Clock,
            color: "gold",
          },
          {
            label: "Approved",
            value: summary.approved,
            icon: CheckCircle2,
            color: "green",
          },
          {
            label: "Rejected",
            value: summary.rejected,
            icon: XCircle,
            color: "red",
          },
        ].map((item) => {

          const Icon = item.icon;

          return (

            <div
              className="rr-stat-card"
              key={item.label}
            >

              <div
                className={`rr-stat-icon ${item.color}`}
              >

                <Icon size={25} />

              </div>

              <div>

                <p>{item.label}</p>

                <h2>
                  {loading ? "..." : item.value}
                </h2>

              </div>

            </div>

          );

        })}

      </div>


      {/* SUCCESS / ERROR */}

      {success && (

        <div className="rr-success" role="status">

          <CheckCircle2 size={20} />

          {success}

        </div>

      )}


      {error && !selected && (

        <div className="rr-error" role="alert">

          <XCircle size={20} />

          {error}

        </div>

      )}


      {/* SEARCH AND FILTER */}

      <div className="rr-toolbar">

        <div className="rr-search">

          <Search size={19} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search family name, mobile, member..."
          />

        </div>

        <div className="rr-tabs">

          {[
            "all",
            "pending",
            "approved",
            "rejected",
          ].map((item) => (

            <button
              key={item}
              type="button"
              className={
                statusFilter === item
                  ? "active"
                  : ""
              }
              onClick={() => setStatusFilter(item)}
            >

              {item.charAt(0).toUpperCase() +
                item.slice(1)}

            </button>

          ))}

        </div>

      </div>


      {/* REGISTRATION CARDS */}

      {loading ? (

        <div className="rr-empty">

          <LoaderCircle
            size={38}
            className="rr-spinner"
          />

          <p>Loading registration requests...</p>

        </div>

      ) : filteredRegistrations.length === 0 ? (

        <div className="rr-empty">

          <ClipboardList size={48} />

          <h3>No registrations found</h3>

          <p>
            There are no matching registration requests.
          </p>

        </div>

      ) : (

        <div className="rr-card-grid">

          {filteredRegistrations.map((registration) => (

            <div
              className="rr-card"
              key={registration.id}
            >

              <div className="rr-card-top">

                <div className="rr-avatar">

                  <Users size={29} />

                </div>

                <span
                  className={`rr-status ${registration.status}`}
                >

                  {registration.status_name ||
                    registration.status}

                </span>

              </div>

              <h3>{registration.family_head}</h3>

              <div className="rr-card-info">

                <p>

                  <Phone size={16} />

                  {registration.mobile_number}

                </p>

                <p>

                  <Users size={16} />

                  {registration.total_members ??
                    ((registration.members || []).length + 1)
                  } Members

                </p>

                <p>

                  <MapPin size={16} />

                  {registration.address ||
                    "Address not provided"}

                </p>

                <p>

                  <CalendarDays size={16} />

                  {formatDate(registration.submitted_at)}

                </p>

              </div>

              {registration.approved_family_code && (

                <div className="rr-family-code">

                  Family ID:{" "}
                  {registration.approved_family_code}

                </div>

              )}

              <div className="rr-card-actions">

                <button
                  className="rr-primary"
                  onClick={() => openDetails(registration)}
                >

                  <Eye size={18} />

                  View Details

                </button>

                {registration.status === "approved" &&
                  registration.approved_family && (

                    <Link
                      className="rr-secondary"
                      to={`/families/${registration.approved_family}`}
                    >

                      View Family

                    </Link>

                  )}

              </div>

            </div>

          ))}

        </div>

      )}


      {/* REGISTRATION DETAILS MODAL */}

      {selected && (

        <div className="rr-overlay">

          <div
            className="rr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rr-modal-title"
          >

            <div className="rr-modal-header">

              <div>

                <h2 id="rr-modal-title">
                  Registration Details
                </h2>

                <p>{selected.family_head}</p>

              </div>

              <button
                className="rr-close"
                onClick={closeDetails}
                disabled={processing}
                aria-label="Close details"
              >

                <X size={23} />

              </button>

            </div>


            <div className="rr-modal-body">

              <span
                className={`rr-status ${selected.status}`}
              >

                {selected.status_name || selected.status}

              </span>


              <h3>Family Head Information</h3>

              <div className="rr-detail-grid">

                {[
                  ["Family Head", selected.family_head],
                  ["Mobile Number", selected.mobile_number],
                  ["WhatsApp Number", selected.whatsapp_number],
                  ["Email", selected.email],
                  ["Address", selected.address],
                  ["Notes", selected.notes],
                  ["Submitted At", formatDate(selected.submitted_at)],
                  ["Consent Given", selected.consent_given ? "Yes" : "No"],
                ].map(([label, value]) => (

                  <div
                    className="rr-detail"
                    key={label}
                  >

                    <span>{label}</span>

                    <strong>
                      {value || "Not provided"}
                    </strong>

                  </div>

                ))}

              </div>


              {/* FAMILY MEMBERS */}

              <h3>

                Family Members ({(selected.members || []).length})

              </h3>

              {(selected.members || []).length === 0 ? (

                <p className="rr-muted">

                  No additional family members.

                </p>

              ) : (

                <div className="rr-table-wrapper">

                  <table className="rr-table">

                    <thead>

                      <tr>

                        <th>Name</th>

                        <th>Relationship</th>

                        <th>Gender</th>

                        <th>Date of Birth</th>

                        <th>Mobile</th>

                        <th>Occupation</th>

                        <th>Baptized</th>

                      </tr>

                    </thead>

                    <tbody>

                      {selected.members.map((member, index) => (

                        <tr key={member.id ?? index}>

                          <td>{member.full_name}</td>

                          <td>{member.relationship}</td>

                          <td>{member.gender || "—"}</td>

                          <td>{member.date_of_birth || "—"}</td>

                          <td>{member.mobile_number || "—"}</td>

                          <td>{member.occupation || "—"}</td>

                          <td>

                            {member.is_baptized ? "Yes" : "No"}

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}


              {/* REVIEW INFORMATION */}

              {selected.status !== "pending" && (

                <>

                  <h3>Review Information</h3>

                  <div className="rr-detail-grid">

                    <div className="rr-detail">

                      <span>Reviewed By</span>

                      <strong>

                        {selected.reviewed_by_name || "—"}

                      </strong>

                    </div>

                    <div className="rr-detail">

                      <span>Reviewed At</span>

                      <strong>

                        {formatDate(selected.reviewed_at)}

                      </strong>

                    </div>

                    {selected.approved_family_code && (

                      <div className="rr-detail">

                        <span>Family ID</span>

                        <strong>

                          {selected.approved_family_code}

                        </strong>

                      </div>

                    )}

                    {selected.rejection_reason && (

                      <div className="rr-detail">

                        <span>Rejection Reason</span>

                        <strong>

                          {selected.rejection_reason}

                        </strong>

                      </div>

                    )}

                  </div>

                </>

              )}


              {error && (

                <div className="rr-error" role="alert">

                  {error}

                </div>

              )}


              {/* REJECTION FORM */}

              {showReject && selected.status === "pending" && (

                <form
                  className="rr-reject-form"
                  onSubmit={rejectRegistration}
                >

                  <h3>Reject Registration</h3>

                  <label htmlFor="rejection-reason">

                    Rejection Reason *

                  </label>

                  <textarea
                    id="rejection-reason"
                    value={reason}
                    onChange={(event) =>
                      setReason(event.target.value)
                    }
                    placeholder="Enter the reason for rejection..."
                    maxLength={1000}
                    rows={4}
                    required
                    disabled={processing}
                  />

                  <div className="rr-modal-actions">

                    <button
                      type="button"
                      className="rr-secondary"
                      onClick={() => setShowReject(false)}
                      disabled={processing}
                    >

                      Cancel

                    </button>

                    <button
                      type="submit"
                      className="rr-danger"
                      disabled={processing}
                    >

                      {processing
                        ? "Processing..."
                        : "Confirm Rejection"}

                    </button>

                  </div>

                </form>

              )}

            </div>


            {/* APPROVAL BUTTONS */}

            <div className="rr-modal-footer">

              <button
                className="rr-secondary"
                onClick={closeDetails}
                disabled={processing}
              >

                Close

              </button>

              {selected.status === "pending" &&
                !showReject && (

                  <>

                    <button
                      className="rr-danger"
                      onClick={() => {

                        setError("");

                        setShowReject(true);

                      }}
                      disabled={processing}
                    >

                      <X size={18} />

                      Reject

                    </button>

                    <button
                      className="rr-approve"
                      onClick={approveRegistration}
                      disabled={processing}
                    >

                      <Check size={18} />

                      {processing
                        ? "Approving..."
                        : "Approve Family"}

                    </button>

                  </>

                )}

            </div>

          </div>

        </div>

      )}

    </div>

  );

}