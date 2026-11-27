import { useState, useRef } from "react";

import { QRCodeCanvas } from "qrcode.react";

import {
  X,
  QrCode,
  Copy,
  Download,
  Printer,
  MessageCircle,
  ExternalLink,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  Link2,
} from "lucide-react";

import api from "../services/api";

import "../styles/RegistrationQR.css";


export default function RegistrationQR({ onClose }) {

  const qrRef = useRef(null);

  const [form, setForm] = useState({
    title: "Family Registration",
    invited_name: "",
    invited_mobile: "",
    validity_days: 7,
  });

  const [invitation, setInvitation] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");


  const registrationLink =
    invitation?.registration_link || "";


  // ========================================
  // HANDLE INPUT
  // ========================================

  const handleChange = (event) => {

    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  // ========================================
  // GENERATE REGISTRATION INVITATION
  // ========================================

  const generateInvitation = async (event) => {

    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {

      const response = await api.post(
        "registration-invitations/",
        {
          ...form,
          validity_days: Number(form.validity_days),
        }
      );

      setInvitation(response.data);

      setSuccess(
        "Registration invitation generated successfully."
      );

    } catch (err) {

      const data = err.response?.data;

      setError(
        data?.detail ||
        (data
          ? JSON.stringify(data)
          : "Unable to generate registration invitation.")
      );

    } finally {

      setLoading(false);

    }

  };


  // ========================================
  // COPY REGISTRATION LINK
  // ========================================

  const copyLink = async () => {

    if (!registrationLink) return;

    setError("");

    try {

      await navigator.clipboard.writeText(
        registrationLink
      );

      setSuccess("Registration link copied!");

    } catch {

      setError(
        "Unable to copy automatically. " +
        "Please select and copy the link manually."
      );

    }

  };


  // ========================================
  // DOWNLOAD QR CODE
  // ========================================

  const downloadQR = () => {

    const canvas = qrRef.current?.querySelector(
      "canvas"
    );

    if (!canvas) return;

    const image = canvas.toDataURL("image/png");

    const link = document.createElement("a");

    link.href = image;

    link.download =
      `FGPC-Family-Registration-${invitation.invitation_id}.png`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    setSuccess("QR code downloaded successfully.");

  };


  // ========================================
  // SHARE THROUGH WHATSAPP
  // ========================================

  const shareWhatsApp = () => {

    if (!registrationLink) return;

    let number = String(
      invitation.invited_mobile || ""
    ).replace(/\D/g, "");

    if (number.length === 10) {
      number = `91${number}`;
    }

    if (
      number &&
      !/^[1-9]\d{7,14}$/.test(number)
    ) {

      setError("Please enter a valid WhatsApp number.");

      return;

    }

    const greeting = invitation.invited_name
      ? `Dear ${invitation.invited_name},`
      : "Dear Church Member,";

    const message = [
      "Praise the Lord! 🙏",
      "",
      greeting,
      "",
      "Greetings from Full Gospel Pentecostal Church, Yelahanka.",
      "",
      "Kindly register your family and family member details using the link below.",
      "",
      registrationLink,
      "",
      `Valid until: ${new Date(
        invitation.expires_at
      ).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}`,
      "",
      "This invitation can be used only once.",
      "",
      "God bless you!",
      "",
      "FGPC Yelahanka",
    ].join("\n");

    const url =
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

  };


  // ========================================
  // PRINT QR CODE
  // ========================================

  const printQR = () => {

    const canvas = qrRef.current?.querySelector(
      "canvas"
    );

    if (!canvas) return;

    const printWindow = window.open(
      "",
      "_blank",
      "width=700,height=800"
    );

    if (!printWindow) {

      setError(
        "Please allow browser popups to print the QR code."
      );

      return;

    }

    const doc = printWindow.document;

    doc.title = "FGPC Family Registration";

    doc.body.style.cssText = `
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 40px;
      color: #54265f;
    `;

    const addText = (tag, value) => {

      const element = doc.createElement(tag);

      element.textContent = value;

      doc.body.appendChild(element);

      return element;

    };

    addText("h3", "PRAISE THE LORD");

    addText(
      "h2",
      "FULL GOSPEL PENTECOSTAL CHURCH"
    );

    addText("h3", "YELAHANKA");

    addText("h1", "Family Registration");

    addText(
      "p",
      "Scan the QR code using your mobile phone."
    );

    const image = doc.createElement("img");

    image.width = 280;

    image.height = 280;

    image.alt = "Family Registration QR Code";

    image.onload = () => {

      printWindow.focus();

      printWindow.print();

    };

    addText(
      "p",
      `Valid until: ${new Date(
        invitation.expires_at
      ).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}`
    );

    const linkText = addText(
      "p",
      registrationLink
    );

    linkText.style.cssText = `
      font-size: 11px;
      overflow-wrap: anywhere;
    `;

    doc.body.appendChild(image);

    addText("h3", "God Bless You!");

    image.src = canvas.toDataURL("image/png");

  };


  // ========================================
  // CREATE ANOTHER INVITATION
  // ========================================

  const resetInvitation = () => {

    setInvitation(null);

    setForm({
      title: "Family Registration",
      invited_name: "",
      invited_mobile: "",
      validity_days: 7,
    });

    setSuccess("");

    setError("");

  };


  // ========================================
  // MAIN COMPONENT
  // ========================================

  return (

    <div className="rq-overlay">

      <div
        className="rq-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rq-title"
      >

        <div className="rq-header">

          <div className="rq-heading">

            <div className="rq-heading-icon">
              <QrCode size={25} />
            </div>

            <div>

              <h2 id="rq-title">
                Invite New Family
              </h2>

              <p>
                Share family registration form
              </p>

            </div>

          </div>

          <button
            type="button"
            className="rq-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close invitation"
          >
            <X size={23} />
          </button>

        </div>


        <div className="rq-content">

          {!invitation && (

            <form
              className="rq-form"
              onSubmit={generateInvitation}
            >

              <div className="rq-information">

                <Link2 size={22} />

                <p>
                  Generate a secure registration link
                  and QR code. Church members can fill
                  their family details without logging in.
                </p>

              </div>


              <div className="rq-field">

                <label htmlFor="rq-name">
                  Family Head Name (Optional)
                </label>

                <input
                  id="rq-name"
                  type="text"
                  name="invited_name"
                  value={form.invited_name}
                  onChange={handleChange}
                  placeholder="Enter family head name"
                  maxLength={150}
                />

              </div>


              <div className="rq-field">

                <label htmlFor="rq-mobile">
                  Mobile Number (Optional)
                </label>

                <input
                  id="rq-mobile"
                  type="tel"
                  name="invited_mobile"
                  value={form.invited_mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  maxLength={15}
                />

              </div>


              <div className="rq-field">

                <label htmlFor="rq-validity">
                  Registration Link Validity
                </label>

                <select
                  id="rq-validity"
                  name="validity_days"
                  value={form.validity_days}
                  onChange={handleChange}
                >

                  <option value={1}>1 Day</option>

                  <option value={7}>7 Days</option>

                  <option value={15}>15 Days</option>

                  <option value={30}>30 Days</option>

                </select>

              </div>


              <button
                type="submit"
                className="rq-primary"
                disabled={loading}
              >

                {loading ? (

                  <>
                    <LoaderCircle
                      size={20}
                      className="rq-spinner"
                    />

                    Generating Invitation...
                  </>

                ) : (

                  <>
                    <QrCode size={20} />

                    Generate Link & QR Code
                  </>

                )}

              </button>

            </form>

          )}


          {/* GENERATED INVITATION */}

          {invitation && registrationLink && (

            <div className="rq-result">

              <div className="rq-qr-card">

                <span className="rq-praise">
                  PRAISE THE LORD
                </span>

                <h3>
                  FULL GOSPEL PENTECOSTAL CHURCH
                </h3>

                <p className="rq-branch">
                  YELAHANKA
                </p>

                <div
                  className="rq-code"
                  ref={qrRef}
                >

                  <QRCodeCanvas
                    value={registrationLink}
                    size={240}
                    level="M"
                    marginSize={4}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />

                </div>

                <h3>Scan to Register Your Family</h3>

                {invitation.invited_name && (

                  <p>
                    Invitation for:{" "}
                    <strong>
                      {invitation.invited_name}
                    </strong>
                  </p>

                )}

                <span className="rq-expiry">

                  Valid until:{" "}

                  {new Date(
                    invitation.expires_at
                  ).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}

                </span>

              </div>


              <div className="rq-field">

                <label htmlFor="rq-link">
                  Registration Link
                </label>

                <input
                  id="rq-link"
                  value={registrationLink}
                  readOnly
                  onFocus={(event) =>
                    event.target.select()
                  }
                />

              </div>


              <div className="rq-actions">

                <button
                  type="button"
                  onClick={copyLink}
                >

                  <Copy size={19} />

                  Copy Link

                </button>


                <button
                  type="button"
                  className="rq-whatsapp"
                  onClick={shareWhatsApp}
                >

                  <MessageCircle size={19} />

                  Share WhatsApp

                </button>


                <button
                  type="button"
                  onClick={downloadQR}
                >

                  <Download size={19} />

                  Download QR

                </button>


                <button
                  type="button"
                  onClick={printQR}
                >

                  <Printer size={19} />

                  Print QR Code

                </button>


                <a
                  href={registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >

                  <ExternalLink size={19} />

                  Open Form

                </a>


                <button
                  type="button"
                  onClick={resetInvitation}
                >

                  <QrCode size={19} />

                  New Invitation

                </button>

              </div>


              <div className="rq-note">

                This invitation is valid for one
                registration only. After submission,
                the details will be saved for
                administrator approval.

              </div>

            </div>

          )}


          {invitation && !registrationLink && (

            <div className="rq-error">

              No active registration link was returned.

              <button
                type="button"
                onClick={resetInvitation}
              >
                Create another invitation
              </button>

            </div>

          )}


          {success && (

            <div className="rq-success" role="status">

              <CheckCircle2 size={20} />

              {success}

            </div>

          )}


          {error && (

            <div className="rq-error" role="alert">

              <AlertCircle size={20} />

              {error}

            </div>

          )}

        </div>


        <div className="rq-footer">

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>

        </div>

      </div>

    </div>

  );

}