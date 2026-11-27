import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

import {
  Church,
  UserRound,
  Users,
  Plus,
  Trash2,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Clock,
} from "lucide-react";

import "../styles/FamilyRegistration.css";


// ==========================================
// PUBLIC API
// ==========================================

const publicApi = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000/api/",

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 20000,
});


// ==========================================
// INITIAL FORM DATA
// ==========================================

const initialForm = {
  family_head: "",
  mobile_number: "",
  whatsapp_number: "",
  email: "",
  address: "",
  notes: "",
  consent_given: false,
};


const createMember = () => ({
  key: crypto.randomUUID(
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`
    ),
  full_name: "",
  relationship: "",
  gender: "",
  date_of_birth: "",
  mobile_number: "",
  occupation: "",
  is_baptized: false,
});


const relationships = [
  ["husband", "Husband"],
  ["wife", "Wife"],
  ["son", "Son"],
  ["daughter", "Daughter"],
  ["father", "Father"],
  ["mother", "Mother"],
  ["brother", "Brother"],
  ["sister", "Sister"],
  ["other", "Other"],
];


// ==========================================
// ERROR MESSAGE
// ==========================================

function getErrorMessage(error) {
  const data = error.response?.data;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (data && typeof data === "object") {
    return JSON.stringify(data);
  }

  return (
    "Unable to connect to the server. " +
    "Please try again."
  );
}


// ==========================================
// FAMILY REGISTRATION PAGE
// ==========================================

export default function FamilyRegistration() {

  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [form, setForm] = useState(initialForm);

  const [members, setMembers] = useState([]);

  const [invitation, setInvitation] = useState(null);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [valid, setValid] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(null);


  // ========================================
  // VALIDATE REGISTRATION LINK
  // ========================================

  useEffect(() => {

    const controller = new AbortController();

    setLoading(true);
    setValid(false);
    setError("");
    setSuccess(null);
    setForm(initialForm);
    setMembers([]);

    if (!token) {
      setError(
        "Registration link is missing. " +
        "Please contact the church administrator."
      );

      setLoading(false);
      return;
    }

    const validateInvitation = async () => {

      try {

        const response = await publicApi.post(
          "public/family-registration/validate/",
          { token },
          { signal: controller.signal }
        );

        if (response.data.valid) {
          setInvitation(response.data);
          setValid(true);
        } else {
          setError("Invalid registration invitation.");
        }

      } catch (err) {

        if (axios.isCancel(err)) return;

        setError(getErrorMessage(err));
        setValid(false);

      } finally {

        if (!controller.signal.aborted) {
          setLoading(false);
        }

      }

    };

    validateInvitation();

    return () => controller.abort();

  }, [token]);


  // ========================================
  // HANDLE FAMILY DETAILS
  // ========================================

  const handleChange = (event) => {

    const { name, value, type, checked } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox"
        ? checked
        : value,
    }));

  };


  // ========================================
  // ADD FAMILY MEMBER
  // ========================================

  const addMember = () => {

    if (members.length >= 20) {
      setError(
        "Maximum 20 additional family members allowed."
      );
      return;
    }

    setMembers((previous) => [
      ...previous,
      createMember(),
    ]);

  };


  // ========================================
  // REMOVE FAMILY MEMBER
  // ========================================

  const removeMember = (key) => {

    setMembers((previous) =>
      previous.filter(
        (member) => member.key !== key
      )
    );

  };


  // ========================================
  // UPDATE FAMILY MEMBER
  // ========================================

  const updateMember = (key, field, value) => {

    setMembers((previous) =>
      previous.map((member) =>
        member.key === key
          ? {
              ...member,
              [field]: value,
            }
          : member
      )
    );

  };


  // ========================================
  // SUBMIT REGISTRATION
  // ========================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    if (submitting || !valid) return;

    setError("");

    if (!form.consent_given) {
      setError(
        "Please confirm your consent before submitting."
      );
      return;
    }

    const payload = {
      ...form,

      token,

      members: members.map(({ key, ...member }) => ({
        ...member,

        date_of_birth:
          member.date_of_birth || null,
      })),
    };

    setSubmitting(true);

    try {

      const response = await publicApi.post(
        "public/family-registration/submit/",
        payload
      );

      setSuccess(response.data);

      setForm(initialForm);
      setMembers([]);
      setValid(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    } catch (err) {

      setError(getErrorMessage(err));

    } finally {

      setSubmitting(false);

    }

  };


  // ========================================
  // CHURCH HEADER
  // ========================================

  const renderHeader = () => (

    <header className="fr-header">

      <div className="fr-church-icon">
        <Church size={40} />
      </div>

      <span className="fr-praise">
        PRAISE THE LORD
      </span>

      <h1>
        {invitation?.church_name ||
          "FULL GOSPEL PENTECOSTAL CHURCH"}
      </h1>

      <h2>
        {invitation?.branch_name || "YELAHANKA"}
      </h2>

      <div className="fr-header-line" />

      <h3>Family Registration Form</h3>

      <p>
        Welcome to our church family.
        Kindly provide your family details.
      </p>

    </header>

  );


  // ========================================
  // MAIN PAGE
  // ========================================

  return (

    <div className="fr-page">

      <main className="fr-container">

        {renderHeader()}


        {/* LOADING */}

        {loading && (

          <div className="fr-state-card">

            <LoaderCircle
              size={45}
              className="fr-spinner"
            />

            <h2>Verifying Registration Link</h2>

            <p>Please wait...</p>

          </div>

        )}


        {/* SUCCESS */}

        {!loading && success && (

          <div className="fr-state-card">

            <div className="fr-success-icon">
              <CheckCircle2 size={60} />
            </div>

            <h2>Registration Successful!</h2>

            <p>
              Thank you for submitting your
              family details.
            </p>

            <div className="fr-success-message">

              Your registration has been received
              and is awaiting administrator approval.

            </div>

            <div className="fr-reference">

              <span>Registration Reference</span>

              <strong>
                {success.registration_id}
              </strong>

            </div>

            <p>
              You can now safely close this page.
            </p>

            <h3>God Bless You!</h3>

          </div>

        )}


        {/* INVALID INVITATION */}

        {!loading && !valid && !success && (

          <div className="fr-state-card">

            <div className="fr-invalid-icon">
              <AlertCircle size={55} />
            </div>

            <h2>Registration Link Unavailable</h2>

            <p>{error}</p>

            <p>
              Please contact the church administrator
              for a new registration link.
            </p>

          </div>

        )}


        {/* REGISTRATION FORM */}

        {!loading && valid && !success && (

          <form
            className="fr-form"
            onSubmit={handleSubmit}
          >

            {invitation?.expires_at && (

              <div className="fr-expiry">

                <Clock size={18} />

                <span>
                  Invitation valid until{" "}
                  {new Date(
                    invitation.expires_at
                  ).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                </span>

              </div>

            )}


            {/* FAMILY HEAD DETAILS */}

            <section className="fr-section">

              <div className="fr-section-title">

                <UserRound size={23} />

                <div>
                  <h2>Family Head Details</h2>
                  <p>Enter your personal details</p>
                </div>

              </div>

              <div className="fr-grid">

                <div className="fr-field fr-full">

                  <label>Family Head Name *</label>

                  <input
                    type="text"
                    name="family_head"
                    value={form.family_head}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    maxLength={150}
                    required
                  />

                </div>

                <div className="fr-field">

                  <label>Mobile Number *</label>

                  <input
                    type="tel"
                    name="mobile_number"
                    value={form.mobile_number}
                    onChange={handleChange}
                    placeholder="Enter mobile number"
                    maxLength={15}
                    required
                  />

                </div>

                <div className="fr-field">

                  <label>WhatsApp Number</label>

                  <input
                    type="tel"
                    name="whatsapp_number"
                    value={form.whatsapp_number}
                    onChange={handleChange}
                    placeholder="Enter WhatsApp number"
                    maxLength={15}
                  />

                </div>

                <div className="fr-field fr-full">

                  <label>Email Address</label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    maxLength={254}
                  />

                </div>

                <div className="fr-field fr-full">

                  <label>Residential Address *</label>

                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter complete address"
                    rows={4}
                    maxLength={2000}
                    required
                  />

                </div>

              </div>

            </section>


            {/* FAMILY MEMBERS */}

            <section className="fr-section">

              <div className="fr-section-title">

                <Users size={24} />

                <div>
                  <h2>Family Members</h2>
                  <p>
                    Add other members of your family.
                  </p>
                </div>

              </div>

              <div className="fr-member-count">

                Total Family Members:
                <strong>{members.length + 1}</strong>

              </div>

              {members.length === 0 && (

                <div className="fr-empty-members">

                  <Users size={35} />

                  <p>No additional members added.</p>

                  <span>
                    Click Add Family Member to continue.
                  </span>

                </div>

              )}

              {members.map((member, index) => (

                <div
                  className="fr-member-card"
                  key={member.key}
                >

                  <div className="fr-member-header">

                    <h3>
                      Family Member {index + 1}
                    </h3>

                    <button
                      type="button"
                      className="fr-remove-btn"
                      onClick={() =>
                        removeMember(member.key)
                      }
                      aria-label={`Remove member ${index + 1}`}
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                  <div className="fr-grid">

                    <div className="fr-field fr-full">

                      <label>Full Name *</label>

                      <input
                        type="text"
                        value={member.full_name}
                        maxLength={150}
                        onChange={(e) =>
                          updateMember(
                            member.key,
                            "full_name",
                            e.target.value
                          )
                        }
                        placeholder="Enter full name"
                        required
                      />

                    </div>

                    <div className="fr-field">

                      <label>Relationship *</label>

                      <select
                        value={member.relationship}
                        onChange={(e) =>
                          updateMember(
                            member.key,
                            "relationship",
                            e.target.value
                          )
                        }
                        required
                      >

                        <option value="">
                          Select relationship
                        </option>

                        {relationships.map(
                          ([value, label]) => (
                            <option
                              key={value}
                              value={value}
                            >
                              {label}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    <div className="fr-field">

                      <label>Gender</label>

                      <select
                        value={member.gender}
                        onChange={(e) =>
                          updateMember(
                            member.key,
                            "gender",
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Select gender
                        </option>

                        <option value="male">
                          Male
                        </option>

                        <option value="female">
                          Female
                        </option>

                        <option value="other">
                          Other
                        </option>

                      </select>

                    </div>

                    <div className="fr-field">

                      <label>Date of Birth</label>

                      <input
                        type="date"
                        value={member.date_of_birth}
                        max={new Date().toLocaleDateString(
                          "en-CA",
                          { timeZone: "Asia/Kolkata" }
                        )}
                        onChange={(e) =>
                          updateMember(
                            member.key,
                            "date_of_birth",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="fr-field">

                      <label>Occupation</label>

                      <input
                        type="text"
                        value={member.occupation}
                        maxLength={100}
                        placeholder="Occupation"
                        onChange={(e) =>
                          updateMember(
                            member.key,
                            "occupation",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="fr-field fr-full">

                      <label>Mobile Number</label>

                      <input
                        type="tel"
                        value={member.mobile_number}
                        maxLength={15}
                        placeholder="Enter mobile number"
                        onChange={(e) =>
                          updateMember(
                            member.key,
                            "mobile_number",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <label className="fr-checkbox fr-full">

                      <input
                        type="checkbox"
                        checked={member.is_baptized}
                        onChange={(e) =>
                          updateMember(
                            member.key,
                            "is_baptized",
                            e.target.checked
                          )
                        }
                      />

                      Baptized

                    </label>

                  </div>

                </div>

              ))}

              <button
                type="button"
                className="fr-add-member"
                onClick={addMember}
                disabled={members.length >= 20}
              >

                <Plus size={20} />

                Add Family Member

              </button>

            </section>


            {/* ADDITIONAL INFORMATION */}

            <section className="fr-section">

              <div className="fr-field">

                <label>Additional Notes</label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any additional information..."
                  rows={3}
                  maxLength={2000}
                />

              </div>

            </section>


            {/* CONSENT */}

            <div className="fr-consent">

              <ShieldCheck size={26} />

              <div>

                <h3>Privacy & Consent</h3>

                <p>
                  Your information will be stored for
                  church membership and administration.
                  Authorized church administrators can
                  review your submitted details.
                </p>

                <label className="fr-checkbox">

                  <input
                    type="checkbox"
                    name="consent_given"
                    checked={form.consent_given}
                    onChange={handleChange}
                    required
                  />

                  <span>
                    I confirm that the information
                    provided is correct and that I
                    have permission to submit the
                    details of my family members.
                    I consent to its use for church
                    administration.
                  </span>

                </label>

              </div>

            </div>


            {/* ERROR MESSAGE */}

            {error && (

              <div
                className="fr-error"
                role="alert"
              >

                <AlertCircle size={20} />

                <span>{error}</span>

              </div>

            )}


            {/* SUBMIT BUTTON */}

            <button
              type="submit"
              className="fr-submit"
              disabled={
                submitting || !form.consent_given
              }
            >

              {submitting ? (

                <>
                  <LoaderCircle
                    size={22}
                    className="fr-spinner"
                  />
                  Submitting Registration...
                </>

              ) : (

                <>
                  <Send size={21} />
                  Submit Family Registration
                </>

              )}

            </button>

            <p className="fr-submit-note">
              Your registration will be reviewed
              by the church administrator.
            </p>

          </form>

        )}

        <footer className="fr-footer">

          <Church size={20} />

          <p>
            Full Gospel Pentecostal Church,
            Yelahanka
          </p>

          <span>God Bless You!</span>

        </footer>

      </main>

    </div>

  );

}