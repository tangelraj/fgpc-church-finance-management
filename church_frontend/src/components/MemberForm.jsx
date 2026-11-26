import { useState } from "react";

import { X, Save } from "lucide-react";

import api from "../services/api";


export default function MemberForm({
  familyId,
  member,
  onClose,
  onSaved,
}) {

  const [form, setForm] = useState({

    full_name: member?.full_name || "",
    relationship: member?.relationship || "other",
    gender: member?.gender || "",
    date_of_birth: member?.date_of_birth || "",
    mobile_number: member?.mobile_number || "",
    occupation: member?.occupation || "",
    is_baptized: member?.is_baptized ?? false,
    is_active: member?.is_active ?? true,

  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleChange = (event) => {

    const { name, value, checked, type } =
      event.target;

    setForm((previous) => ({

      ...previous,

      [name]: type === "checkbox"
        ? checked
        : value,

    }));

  };


  const handleSubmit = async (event) => {

    event.preventDefault();

    setLoading(true);
    setError("");

    try {

      const payload = {

        ...form,

        family: familyId,

        date_of_birth:
          form.date_of_birth || null,

      };

      if (member?.id) {

        await api.patch(
          `family-members/${member.id}/`,
          payload
        );

      } else {

        await api.post(
          "family-members/",
          payload
        );

      }

      onSaved();

    } catch (err) {

      setError(

        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Unable to save member."

      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="family-modal-overlay">

      <div
        className="family-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-form-title"
      >

        <div className="family-modal-header">

          <div>

            <h2 id="member-form-title">

              {member
                ? "Edit Member"
                : "Add Family Member"}

            </h2>

            <p>Enter individual member details</p>

          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close form"
          >
            <X size={24} />
          </button>

        </div>


        <form onSubmit={handleSubmit}>

          <div className="family-modal-body">

            {error && (
              <div className="family-error">
                {error}
              </div>
            )}

            <div className="family-form-grid">

              <div className="family-field">

                <label>Full Name *</label>

                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="family-field">

                <label>Relationship</label>

                <select
                  name="relationship"
                  value={form.relationship}
                  onChange={handleChange}
                >

                  <option value="husband">Husband</option>
                  <option value="wife">Wife</option>
                  <option value="son">Son</option>
                  <option value="daughter">Daughter</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="brother">Brother</option>
                  <option value="sister">Sister</option>
                  <option value="other">Other</option>

                </select>

              </div>


              <div className="family-field">

                <label>Gender</label>

                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                >

                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>

                </select>

              </div>


              <div className="family-field">

                <label>Date of Birth</label>

                <input
                  type="date"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={handleChange}
                />

              </div>


              <div className="family-field">

                <label>Mobile Number</label>

                <input
                  type="tel"
                  name="mobile_number"
                  value={form.mobile_number}
                  onChange={handleChange}
                />

              </div>


              <div className="family-field">

                <label>Occupation</label>

                <input
                  name="occupation"
                  value={form.occupation}
                  onChange={handleChange}
                />

              </div>


              <label className="family-checkbox">

                <input
                  type="checkbox"
                  name="is_baptized"
                  checked={form.is_baptized}
                  onChange={handleChange}
                />

                Baptized Member

              </label>


              <label className="family-checkbox">

                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />

                Active Member

              </label>

            </div>

          </div>


          <div className="family-modal-footer">

            <button
              type="button"
              className="family-secondary-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="family-primary-btn"
              disabled={loading}
            >

              <Save size={18} />

              {loading ? "Saving..." : "Save Member"}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}