import { useEffect, useState, useCallback } from "react";

import {
  Users,
  UserCheck,
  UserMinus,
  Plus,
  Search,
  Eye,
  SquarePen,
  Phone,
  MessageCircle,
  RefreshCw,
  MapPin,
  LoaderCircle,
  QrCode,
  ClipboardList,
} from "lucide-react";

import { Link } from "react-router-dom";

import api from "../services/api";

import { useAuth } from "../context/AuthContext";

import FamilyForm from "../components/FamilyForm";

import RegistrationQR from "../components/RegistrationQR";

import "../styles/Families.css";


export default function Families() {

  const { user } = useAuth();

  const isAdmin = Boolean(user?.is_superuser);


  // ========================================
  // STATES
  // ========================================

  const [families, setFamilies] = useState([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [selectedFamily, setSelectedFamily] =
    useState(null);

  const [showInvitation, setShowInvitation] =
    useState(false);

  const [pendingCount, setPendingCount] =
    useState(0);


  // ========================================
  // FETCH FAMILIES
  // ========================================

  const fetchFamilies = useCallback(async () => {

    setLoading(true);

    setError("");

    try {

      const records = [];

      let next = "families/";

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

      setFamilies(records);

    } catch (err) {

      setError("Unable to load family records.");

    } finally {

      setLoading(false);

    }

  }, []);


  // ========================================
  // FETCH PENDING REGISTRATION COUNT
  // ========================================

  const fetchPendingCount = useCallback(async () => {

    if (!isAdmin) {

      setPendingCount(0);

      return;

    }

    try {

      const response = await api.get(
        "family-registrations/summary/"
      );

      setPendingCount(
        Number(response.data.pending) || 0
      );

    } catch (err) {

      console.error(
        "Unable to fetch registration count.",
        err
      );

    }

  }, [isAdmin]);


  // ========================================
  // INITIAL DATA LOADING
  // ========================================

  useEffect(() => {

    fetchFamilies();

  }, [fetchFamilies]);


  // ========================================
  // AUTOMATIC REGISTRATION COUNT REFRESH
  // ========================================

  useEffect(() => {

    fetchPendingCount();

    if (!isAdmin) return;

    const interval = setInterval(
      fetchPendingCount,
      30000
    );

    return () => clearInterval(interval);

  }, [isAdmin, fetchPendingCount]);


  // ========================================
  // MANUAL REFRESH
  // ========================================

  const handleRefresh = async () => {

    await Promise.all([
      fetchFamilies(),
      fetchPendingCount(),
    ]);

  };


  // ========================================
  // SEARCH AND FILTER
  // ========================================

  const filteredFamilies = families.filter(
    (family) => {

      const keyword = search.trim().toLowerCase();

      const matchesSearch = [

        family.family_id,

        family.family_head,

        family.mobile_number,

        family.whatsapp_number,

        family.email,

        ...(family.members || []).map(
          (member) => member.full_name
        ),

      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(keyword)
      );

      const matchesStatus =

        statusFilter === "all" ||

        (
          statusFilter === "active" &&
          family.is_active
        ) ||

        (
          statusFilter === "inactive" &&
          !family.is_active
        );

      return matchesSearch && matchesStatus;

    }
  );


  // ========================================
  // FAMILY STATISTICS
  // ========================================

  const activeFamilies = families.filter(
    (family) => family.is_active
  ).length;


  const inactiveFamilies =
    families.length - activeFamilies;


  // ========================================
  // ADD FAMILY
  // ========================================

  const openAddForm = () => {

    setSelectedFamily(null);

    setShowForm(true);

  };


  // ========================================
  // EDIT FAMILY
  // ========================================

  const openEditForm = (family) => {

    setSelectedFamily(family);

    setShowForm(true);

  };


  // ========================================
  // CLOSE FAMILY FORM
  // ========================================

  const closeFamilyForm = () => {

    setShowForm(false);

    setSelectedFamily(null);

  };


  // ========================================
  // AFTER FAMILY SAVED
  // ========================================

  const handleSaved = () => {

    setShowForm(false);

    setSelectedFamily(null);

    handleRefresh();

  };


  // ========================================
  // WHATSAPP CONTACT
  // ========================================

  const openWhatsApp = (family) => {

    let number = String(

      family.whatsapp_number ||
      family.mobile_number ||
      ""

    ).replace(/\D/g, "");

    if (number.length === 10) {

      number = `91${number}`;

    }

    if (!/^[1-9]\d{7,14}$/.test(number)) {

      alert(
        "Valid WhatsApp number is not available."
      );

      return;

    }

    window.open(
      `https://wa.me/${number}`,
      "_blank",
      "noopener,noreferrer"
    );

  };


  // ========================================
  // MAIN PAGE
  // ========================================

  return (

    <div className="families-page">

      {/* ===================================
          PAGE HEADING
      =================================== */}

      <div className="family-page-heading">

        <div>

          <h1>Family Management</h1>

          <p>
            Manage church families and members
          </p>

        </div>


        <div className="family-heading-actions">

          {/* REGISTRATION REQUESTS */}

          {isAdmin && (

            <Link
              to="/families/registrations"
              className="family-registration-btn"
            >

              <ClipboardList size={19} />

              Registration Requests

              {pendingCount > 0 && (

                <span className="family-pending-count">

                  {pendingCount}

                </span>

              )}

            </Link>

          )}


          {/* INVITE FAMILY */}

          {isAdmin && (

            <button
              type="button"
              className="family-invite-btn"
              onClick={() => setShowInvitation(true)}
            >

              <QrCode size={20} />

              Invite Family

            </button>

          )}


          {/* ADD FAMILY */}

          <button
            type="button"
            className="family-primary-btn"
            onClick={openAddForm}
          >

            <Plus size={20} />

            Add Family

          </button>

        </div>

      </div>


      {/* ===================================
          SUMMARY CARDS
      =================================== */}

      <div className="family-stats-grid">

        {/* TOTAL FAMILIES */}

        <div className="family-stat-card">

          <div className="family-stat-icon purple">

            <Users size={25} />

          </div>

          <div>

            <p>Total Families</p>

            <h2>

              {loading ? "..." : families.length}

            </h2>

          </div>

        </div>


        {/* ACTIVE FAMILIES */}

        <div className="family-stat-card">

          <div className="family-stat-icon green">

            <UserCheck size={25} />

          </div>

          <div>

            <p>Active Families</p>

            <h2>

              {loading ? "..." : activeFamilies}

            </h2>

          </div>

        </div>


        {/* INACTIVE FAMILIES */}

        <div className="family-stat-card">

          <div className="family-stat-icon gold">

            <UserMinus size={25} />

          </div>

          <div>

            <p>Inactive Families</p>

            <h2>

              {loading ? "..." : inactiveFamilies}

            </h2>

          </div>

        </div>

      </div>


      {/* ===================================
          SEARCH AND FILTER TOOLBAR
      =================================== */}

      <div className="family-toolbar">

        <div className="family-search">

          <Search size={20} />

          <input
            type="search"
            placeholder="Search family name, ID, mobile..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            aria-label="Search families"
          />

        </div>


        {/* STATUS FILTER */}

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          aria-label="Filter families by status"
        >

          <option value="all">

            All Families

          </option>

          <option value="active">

            Active Families

          </option>

          <option value="inactive">

            Inactive Families

          </option>

        </select>


        {/* REFRESH BUTTON */}

        <button
          type="button"
          className="family-secondary-btn"
          onClick={handleRefresh}
          disabled={loading}
          aria-label="Refresh families"
        >

          <RefreshCw
            size={18}
            className={
              loading ? "family-spinner" : ""
            }
          />

          {loading ? "Refreshing..." : "Refresh"}

        </button>

      </div>


      {/* ===================================
          ERROR MESSAGE
      =================================== */}

      {error && (

        <div
          className="family-error"
          role="alert"
        >

          {error}

        </div>

      )}


      {/* ===================================
          FAMILY CARDS
      =================================== */}

      {loading ? (

        <div className="family-empty">

          <LoaderCircle
            size={38}
            className="family-spinner"
          />

          <p>

            Loading church families...

          </p>

        </div>

      ) : filteredFamilies.length === 0 ? (

        <div className="family-empty">

          <Users size={48} />

          <h3>

            No families found

          </h3>

          <p>

            Add a family or change your search.

          </p>

        </div>

      ) : (

        <div className="family-card-grid">

          {filteredFamilies.map((family) => (

            <div
              className="family-card"
              key={family.id}
            >

              {/* FAMILY PHOTO AND STATUS */}

              <div className="family-card-top">

                <div className="family-avatar">

                  {family.photo ? (

                    <img
                      src={family.photo}
                      alt={family.family_head}
                      loading="lazy"
                    />

                  ) : (

                    <Users size={32} />

                  )}

                </div>


                <span
                  className={`family-status ${
                    family.is_active
                      ? "active"
                      : "inactive"
                  }`}
                >

                  {family.is_active
                    ? "Active"
                    : "Inactive"}

                </span>

              </div>


              {/* FAMILY NAME AND ID */}

              <div className="family-card-name">

                <span>

                  {family.family_id}

                </span>

                <h3>

                  {family.family_head}

                </h3>

              </div>


              {/* FAMILY INFORMATION */}

              <div className="family-card-info">

                <p>

                  <Phone size={16} />

                  {family.mobile_number ||
                    "Not provided"}

                </p>


                <p>

                  <Users size={16} />

                  {family.total_members ??
                    (
                      Array.isArray(family.members)

                        ? family.members.filter(
                            (member) => member.is_active
                          ).length + 1

                        : "—"
                    )
                  } Members

                </p>


                <p>

                  <MapPin size={16} />

                  {family.address ||
                    "Address not provided"}

                </p>

              </div>


              {/* FAMILY ACTION BUTTONS */}

              <div className="family-card-actions">

                {/* VIEW FAMILY */}

                <Link
                  to={`/families/${family.id}`}
                  className="family-action view"
                >

                  <Eye size={18} />

                  View

                </Link>


                {/* EDIT FAMILY */}

                <button
                  type="button"
                  className="family-action edit"
                  onClick={() => openEditForm(family)}
                >

                  <SquarePen size={18} />

                  Edit

                </button>


                {/* WHATSAPP */}

                <button
                  type="button"
                  className="family-action whatsapp"
                  onClick={() => openWhatsApp(family)}
                  aria-label="Contact family on WhatsApp"
                  title="Contact on WhatsApp"
                >

                  <MessageCircle size={19} />

                </button>

              </div>

            </div>

          ))}

        </div>

      )}


      {/* ===================================
          ADD / EDIT FAMILY MODAL
      =================================== */}

      {showForm && (

        <FamilyForm
          family={selectedFamily}
          onClose={closeFamilyForm}
          onSaved={handleSaved}
        />

      )}


      {/* ===================================
          FAMILY REGISTRATION QR MODAL
      =================================== */}

      {showInvitation && isAdmin && (

        <RegistrationQR
          onClose={() => {

            setShowInvitation(false);

            fetchPendingCount();

          }}
        />

      )}

    </div>

  );

}