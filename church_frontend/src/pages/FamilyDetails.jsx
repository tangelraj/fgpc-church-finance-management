import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Users,
  UserRound,
  Phone,
  Mail,
  MapPin,
  Plus,
  SquarePen,
  HandCoins,
  CalendarDays,
  Receipt,
  LoaderCircle,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import api from "../services/api";

import MemberForm from "../components/MemberForm";
import FamilyForm from "../components/FamilyForm";

import "../styles/Families.css";


const currency = (value) =>
  Number(value || 0).toLocaleString("en-IN", {

    style: "currency",
    currency: "INR",

  });


const formatDate = (value) => {

  if (!value) return "-";

  const [year, month, day] =
    value.slice(0, 10).split("-");

  return `${day}/${month}/${year}`;

};


async function fetchAll(url) {

  const records = [];

  let next = url;

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

  return records;

}


export default function FamilyDetails() {

  const { id } = useParams();

  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [offerings, setOfferings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showMemberForm, setShowMemberForm] =
    useState(false);

  const [showFamilyForm, setShowFamilyForm] =
    useState(false);

  const [selectedMember, setSelectedMember] =
    useState(null);


  // ========================================
  // FETCH FAMILY DETAILS
  // ========================================

  const fetchDetails = async () => {

    setLoading(true);
    setError("");

    try {

      const [
        familyResponse,
        memberRecords,
        offeringRecords,
      ] = await Promise.all([

        api.get(`families/${id}/`),

        fetchAll(
          `family-members/?family=${id}`
        ),

        fetchAll(
          `offerings/?family=${id}&status=completed`
        ),

      ]);

      setFamily(familyResponse.data);

      setMembers(

        memberRecords.filter((member) =>

          String(
            member.family?.id ?? member.family
          ) === String(id)

        )

      );

      setOfferings(

        offeringRecords.filter((offering) =>

          offering.status === "completed" &&

          String(
            offering.family?.id ?? offering.family
          ) === String(id)

        )

      );

    } catch (err) {

      setError("Unable to load family details.");

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    fetchDetails();

  }, [id]);


  const totalContribution = offerings.reduce(

    (total, offering) =>
      total + Number(offering.total_amount || 0),

    0

  );


  const activeMemberCount = members.filter(
    (member) => member.is_active
  ).length + 1;


  const openMemberForm = (member = null) => {

    setSelectedMember(member);
    setShowMemberForm(true);

  };


  const handleSaved = () => {

    setShowMemberForm(false);
    setShowFamilyForm(false);
    setSelectedMember(null);

    fetchDetails();

  };


  if (loading) {

    return (

      <div className="family-empty">

        <LoaderCircle
          size={38}
          className="family-spinner"
        />

        <p>Loading family details...</p>

      </div>

    );

  }


  if (!family || error) {

    return (

      <div className="family-empty">

        <h3>{error || "Family not found"}</h3>

        <Link
          to="/families"
          className="family-primary-btn"
        >
          Back to Families
        </Link>

      </div>

    );

  }


  return (

    <div className="families-page">

      <Link
        to="/families"
        className="family-back-link"
      >

        <ArrowLeft size={19} />

        Back to Families

      </Link>


      {/* FAMILY PROFILE */}

      <div className="family-profile">

        <div className="family-profile-main">

          <div className="family-profile-photo">

            {family.photo ? (

              <img
                src={family.photo}
                alt={family.family_head}
              />

            ) : (

              <Users size={55} />

            )}

          </div>


          <div className="family-profile-title">

            <span>{family.family_id}</span>

            <h1>{family.family_head}</h1>

            <p>
              {family.is_active
                ? "Active Church Family"
                : "Inactive Church Family"}
            </p>

          </div>


          <button
            className="family-profile-edit"
            onClick={() => setShowFamilyForm(true)}
          >

            <SquarePen size={18} />

            Edit Family

          </button>

        </div>


        <div className="family-profile-info">

          <p>

            <Phone size={18} />

            {family.mobile_number || "Not provided"}

          </p>

          <p>

            <Mail size={18} />

            {family.email || "Not provided"}

          </p>

          <p>

            <CalendarDays size={18} />

            Joined: {formatDate(family.joining_date)}

          </p>

          <p>

            <MapPin size={18} />

            {family.address || "Not provided"}

          </p>

        </div>

      </div>


      {/* FAMILY STATISTICS */}

      <div className="family-stats-grid">

        <div className="family-stat-card">

          <div className="family-stat-icon purple">
            <Users size={25} />
          </div>

          <div>

            <p>Active Members</p>

            <h2>{activeMemberCount}</h2>

          </div>

        </div>


        <div className="family-stat-card">

          <div className="family-stat-icon green">
            <HandCoins size={25} />
          </div>

          <div>

            <p>Total Contributions</p>

            <h2>{currency(totalContribution)}</h2>

          </div>

        </div>


        <div className="family-stat-card">

          <div className="family-stat-icon gold">
            <Receipt size={25} />
          </div>

          <div>

            <p>Total Receipts</p>

            <h2>{offerings.length}</h2>

          </div>

        </div>

      </div>


      {/* FAMILY MEMBERS */}

      <section className="family-panel">

        <div className="family-panel-heading">

          <div>

            <h2>Family Members</h2>

            <p>Manage individual church members</p>

          </div>

          <button
            className="family-primary-btn"
            onClick={() => openMemberForm()}
          >

            <Plus size={19} />

            Add Member

          </button>

        </div>


        <div className="family-table-wrapper">

          <table className="family-table">

            <thead>

              <tr>

                <th>Name</th>
                <th>Relationship</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Baptized</th>
                <th>Status</th>
                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              <tr>

                <td>

                  <div className="member-name">

                    <UserRound size={19} />

                    {family.family_head}

                  </div>

                </td>

                <td>Family Head</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>

                <td>

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

                </td>

                <td>

                  <button
                    className="family-action edit"
                    onClick={() => setShowFamilyForm(true)}
                  >
                    <SquarePen size={17} />
                  </button>

                </td>

              </tr>


              {members.map((member) => (

                <tr key={member.id}>

                  <td>

                    <div className="member-name">

                      <UserRound size={19} />

                      {member.full_name}

                    </div>

                  </td>

                  <td className="capitalize">
                    {member.relationship}
                  </td>

                  <td className="capitalize">
                    {member.gender}
                  </td>

                  <td>
                    {formatDate(member.date_of_birth)}
                  </td>

                  <td>
                    {member.is_baptized ? "Yes" : "No"}
                  </td>

                  <td>

                    <span
                      className={`family-status ${
                        member.is_active
                          ? "active"
                          : "inactive"
                      }`}
                    >

                      {member.is_active
                        ? "Active"
                        : "Inactive"}

                    </span>

                  </td>

                  <td>

                    <button
                      className="family-action edit"
                      onClick={() =>
                        openMemberForm(member)
                      }
                    >

                      <SquarePen size={17} />

                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </section>


      {/* OFFERING HISTORY */}

      <section className="family-panel">

        <div className="family-panel-heading">

          <div>

            <h2>Offering History</h2>

            <p>
              Completed contributions from this family
            </p>

          </div>

        </div>


        <div className="family-table-wrapper">

          <table className="family-table">

            <thead>

              <tr>

                <th>Receipt Number</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th>Total Amount</th>

              </tr>

            </thead>

            <tbody>

              {offerings.length > 0 ? (

                offerings.map((offering) => (

                  <tr key={offering.id}>

                    <td className="family-receipt-number">

                      {offering.receipt_number}

                    </td>

                    <td>

                      {formatDate(offering.date)}

                    </td>

                    <td className="capitalize">

                      {offering.payment_method_name ||
                        offering.payment_method}

                    </td>

                    <td className="family-income">

                      {currency(offering.total_amount)}

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan={4}
                    className="family-empty-table"
                  >

                    No completed offerings found.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>


      {showMemberForm && (

        <MemberForm
          familyId={family.id}
          member={selectedMember}
          onClose={() => setShowMemberForm(false)}
          onSaved={handleSaved}
        />

      )}


      {showFamilyForm && (

        <FamilyForm
          family={family}
          onClose={() => setShowFamilyForm(false)}
          onSaved={handleSaved}
        />

      )}

    </div>

  );

}