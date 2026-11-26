import { useEffect, useState } from "react";

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
} from "lucide-react";

import { Link } from "react-router-dom";

import api from "../services/api";

import FamilyForm from "../components/FamilyForm";

import "../styles/Families.css";


export default function Families() {

  const [families, setFamilies] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [selectedFamily, setSelectedFamily] =
    useState(null);


  // ========================================
  // FETCH FAMILIES
  // ========================================

  const fetchFamilies = async () => {

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

  };


  useEffect(() => {

    fetchFamilies();

  }, []);


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


  const activeFamilies = families.filter(
    (family) => family.is_active
  ).length;


  const inactiveFamilies =
    families.length - activeFamilies;


  // ========================================
  // ADD / EDIT FAMILY
  // ========================================

  const openAddForm = () => {

    setSelectedFamily(null);
    setShowForm(true);

  };


  const openEditForm = (family) => {

    setSelectedFamily(family);
    setShowForm(true);

  };


  const handleSaved = () => {

    setShowForm(false);
    setSelectedFamily(null);
    fetchFamilies();

  };


  // ========================================
  // WHATSAPP
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

      alert("Valid WhatsApp number is not available.");
      return;

    }

    window.open(
      `https://wa.me/${number}`,
      "_blank",
      "noopener,noreferrer"
    );

  };


  return (

    <div className="families-page">

      {/* PAGE HEADING */}

      <div className="family-page-heading">

        <div>

          <h1>Family Management</h1>

          <p>
            Manage church families and members
          </p>

        </div>

        <button
          className="family-primary-btn"
          onClick={openAddForm}
        >

          <Plus size={20} />

          Add Family

        </button>

      </div>


      {/* SUMMARY CARDS */}

      <div className="family-stats-grid">

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


      {/* SEARCH */}

      <div className="family-toolbar">

        <div className="family-search">

          <Search size={20} />

          <input
            placeholder="Search family name, ID, mobile..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >

          <option value="all">All Families</option>
          <option value="active">Active Families</option>
          <option value="inactive">Inactive Families</option>

        </select>

        <button
          className="family-secondary-btn"
          onClick={fetchFamilies}
          disabled={loading}
          aria-label="Refresh families"
        >

          <RefreshCw size={18} />

          Refresh

        </button>

      </div>


      {error && (

        <div className="family-error">

          {error}

        </div>

      )}


      {/* FAMILY CARDS */}

      {loading ? (

        <div className="family-empty">

          <LoaderCircle
            size={38}
            className="family-spinner"
          />

          <p>Loading church families...</p>

        </div>

      ) : filteredFamilies.length === 0 ? (

        <div className="family-empty">

          <Users size={48} />

          <h3>No families found</h3>

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

              <div className="family-card-top">

                <div className="family-avatar">

                  {family.photo ? (

                    <img
                      src={family.photo}
                      alt={family.family_head}
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


              <div className="family-card-name">

                <span>{family.family_id}</span>

                <h3>{family.family_head}</h3>

              </div>


              <div className="family-card-info">

                <p>

                  <Phone size={16} />

                  {family.mobile_number || "Not provided"}

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

                  {family.address || "Address not provided"}

                </p>

              </div>


              <div className="family-card-actions">

                <Link
                  to={`/families/${family.id}`}
                  className="family-action view"
                >

                  <Eye size={18} />

                  View

                </Link>

                <button
                  className="family-action edit"
                  onClick={() => openEditForm(family)}
                >

                  <SquarePen size={18} />

                  Edit

                </button>

                <button
                  className="family-action whatsapp"
                  onClick={() => openWhatsApp(family)}
                  aria-label="Contact family on WhatsApp"
                >

                  <MessageCircle size={19} />

                </button>

              </div>

            </div>

          ))}

        </div>

      )}


      {showForm && (

        <FamilyForm
          family={selectedFamily}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />

      )}

    </div>

  );

}