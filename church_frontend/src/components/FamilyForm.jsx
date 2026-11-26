import { useState } from "react";

import {
  X,
  Save,
  ImagePlus,
  LoaderCircle,
} from "lucide-react";

import api from "../services/api";


export default function FamilyForm({
  family,
  onClose,
  onSaved,
}) {

  const [form, setForm] = useState({

    family_head: family?.family_head || "",
    mobile_number: family?.mobile_number || "",
    whatsapp_number: family?.whatsapp_number || "",
    email: family?.email || "",
    address: family?.address || "",
    joining_date: family?.joining_date || "",
    notes: family?.notes || "",
    is_active: family?.is_active ?? true,

  });

  const [photo, setPhoto] = useState(null);
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

      const formData = new FormData();

      Object.entries(form).forEach(
        ([key, value]) => {

          if (key === "joining_date" && !value) {
            return;
          }

          formData.append(key, value);

        }
      );

      if (photo) {
        formData.append("photo", photo);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      if (family?.id) {

        await api.patch(
          `families/${family.id}/`,
          formData,
          config
        );

      } else {

        await api.post(
          "families/",
          formData,
          config
        );

      }

      onSaved();

    } catch (err) {

      const data = err.response?.data;

      setError(
        data
          ? typeof data === "string"
            ? data
            : JSON.stringify(data)
          : "Unable to save family."
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
        aria-labelledby="family-form-title"
      >

        <div className="family-modal-header">

          <div>

            <h2 id="family-form-title">

              {family
                ? "Edit Family"
                : "Register New Family"}

            </h2>

            <p>
              Enter church family information
            </p>

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

                <label>Family Head *</label>

                <input
                  name="family_head"
                  value={form.family_head}
                  onChange={handleChange}
                  placeholder="Enter family head name"
                  required
                />

              </div>


              <div className="family-field">

                <label>Mobile Number</label>

                <input
                  type="tel"
                  name="mobile_number"
                  value={form.mobile_number}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                />

              </div>


              <div className="family-field">

                <label>WhatsApp Number</label>

                <input
                  type="tel"
                  name="whatsapp_number"
                  value={form.whatsapp_number}
                  onChange={handleChange}
                  placeholder="Enter WhatsApp number"
                />

              </div>


              <div className="family-field">

                <label>Email Address</label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />

              </div>


              <div className="family-field">

                <label>Joining Date</label>

                <input
                  type="date"
                  name="joining_date"
                  value={form.joining_date}
                  onChange={handleChange}
                />

              </div>


              <div className="family-field">

                <label>Family Photo</label>

                <div className="photo-upload">

                  <ImagePlus size={20} />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setPhoto(
                        event.target.files?.[0] || null
                      )
                    }
                  />

                </div>

              </div>


              <div className="family-field full-width">

                <label>Address</label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter complete address"
                  rows={3}
                />

              </div>


              <div className="family-field full-width">

                <label>Notes</label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Additional family information"
                  rows={3}
                />

              </div>


              <label className="family-checkbox">

                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />

                Active Family

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

              {loading
                ? <LoaderCircle size={18} />
                : <Save size={18} />}

              {loading
                ? "Saving..."
                : "Save Family"}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}