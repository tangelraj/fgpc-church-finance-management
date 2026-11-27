import { useEffect, useState } from "react";

import {
  X,
  FileText,
  Download,
  MessageCircle,
  LoaderCircle,
  CheckCircle2,
  Share2,
} from "lucide-react";

import {
  prepareReceiptPDF,
  canShareReceiptPDF,
  shareReceiptPDF,
  saveReceiptPDF,
  openReceiptWhatsApp,
} from "../services/receiptShare";

import { currency } from "../services/finance";


export default function ReceiptShareModal({
  offering,
  onClose,
}) {

  const [pdfFile, setPdfFile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [sharing, setSharing] = useState(false);

  const [downloaded, setDownloaded] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");


  // ========================================
  // PREPARE RECEIPT PDF
  // ========================================

  useEffect(() => {

    let active = true;

    const loadPDF = async () => {

      try {

        setLoading(true);

        setError("");

        setPdfFile(null);

        setDownloaded(false);

        setSuccess("");

        const file = await prepareReceiptPDF(
          offering
        );

        if (active) {

          setPdfFile(file);

        }

      } catch (err) {

        if (active) {

          setError(
            "Unable to prepare receipt PDF. Please close and try again."
          );

        }

      } finally {

        if (active) {

          setLoading(false);

        }

      }

    };

    loadPDF();

    return () => {

      active = false;

    };

  }, [offering]);


  // ========================================
  // SHARE PDF
  // ========================================

  const handleShare = async () => {

    if (!pdfFile || sharing) return;

    setSharing(true);

    setError("");

    setSuccess("");

    try {

      await shareReceiptPDF(
        pdfFile,
        offering
      );

      setSuccess(
        "PDF handed to your device's sharing service. Confirm delivery in WhatsApp."
      );

    } catch (err) {

      if (err.name !== "AbortError") {

        setError(
          "Direct sharing is unavailable. Download the PDF and attach it in WhatsApp."
        );

      }

    } finally {

      setSharing(false);

    }

  };


  // ========================================
  // DOWNLOAD PDF
  // ========================================

  const handleDownload = () => {

    if (!pdfFile) return;

    try {

      saveReceiptPDF(pdfFile);

      setDownloaded(true);

      setError("");

      setSuccess(
        "Download requested. Attach the saved PDF in WhatsApp."
      );

    } catch {

      setError(
        "Unable to download receipt PDF."
      );

    }

  };


  // ========================================
  // OPEN WHATSAPP
  // ========================================

  const handleWhatsApp = () => {

    if (!pdfFile) return;

    openReceiptWhatsApp(offering);

  };


  const directShareSupported =
    pdfFile && canShareReceiptPDF(pdfFile);


  return (

    <div className="receipt-share-overlay">

      <div
        className="receipt-share-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-share-title"
      >

        <button
          type="button"
          className="receipt-share-close"
          onClick={onClose}
          disabled={sharing}
          aria-label="Close"
        >

          <X size={22} />

        </button>


        <div className="receipt-share-icon">

          <MessageCircle size={32} />

        </div>


        <h2 id="receipt-share-title">
          Share Cash Receipt
        </h2>

        <p className="receipt-share-subtitle">

          Share the actual receipt PDF
          through WhatsApp

        </p>


        {/* RECEIPT INFORMATION */}

        <div className="receipt-share-info">

          <div>

            <span>Receipt Number</span>

            <strong>
              {offering.receipt_number}
            </strong>

          </div>

          <div>

            <span>Received From</span>

            <strong>
              {offering.donor_name}
            </strong>

          </div>

          <div>

            <span>Total Amount</span>

            <strong className="receipt-share-amount">

              {currency(offering.total_amount)}

            </strong>

          </div>

        </div>


        {/* LOADING */}

        {loading && (

          <div className="receipt-share-loading">

            <LoaderCircle
              size={25}
              className="receipt-share-spinner"
            />

            <p>Preparing receipt PDF...</p>

          </div>

        )}


        {/* PDF FILE */}

        {pdfFile && (

          <div className="receipt-share-file">

            <FileText size={36} />

            <div>

              <strong>{pdfFile.name}</strong>

              <span>

                PDF Document ·{" "}

                {(pdfFile.size / 1024).toFixed(1)}

                {" "}KB

              </span>

            </div>

            <CheckCircle2
              size={22}
              color="#198754"
            />

          </div>

        )}


        {/* ERROR */}

        {error && (

          <div className="receipt-share-error">

            {error}

          </div>

        )}


        {/* SUCCESS */}

        {success && (

          <div className="receipt-share-success">

            <CheckCircle2 size={19} />

            <span>{success}</span>

          </div>

        )}


        {/* DIRECT FILE SHARING */}

        {directShareSupported && (

          <button
            type="button"
            className="receipt-share-whatsapp"
            onClick={handleShare}
            disabled={sharing}
          >

            {sharing ? (

              <LoaderCircle
                size={20}
                className="receipt-share-spinner"
              />

            ) : (

              <Share2 size={20} />

            )}

            {sharing
              ? "Sharing PDF..."
              : "Share PDF via WhatsApp"}

          </button>

        )}


        {directShareSupported && (

          <p className="receipt-share-help">

            Select WhatsApp from your device's
            sharing menu, then choose the recipient.

          </p>

        )}


        {/* DESKTOP FALLBACK */}

        {pdfFile && (

          <>

            <div className="receipt-share-divider">

              <span>

                {directShareSupported
                  ? "Or share manually"
                  : "Share using WhatsApp Web"}

              </span>

            </div>


            <button
              type="button"
              className="receipt-share-download"
              onClick={handleDownload}
              disabled={sharing}
            >

              <Download size={20} />

              {downloaded
                ? "Download PDF Again"
                : "1. Download Receipt PDF"}

            </button>


            <button
              type="button"
              className="receipt-share-whatsapp"
              onClick={handleWhatsApp}
              disabled={!downloaded || sharing}
            >

              <MessageCircle size={20} />

              2. Open WhatsApp

            </button>


            <p className="receipt-share-help">

              In WhatsApp, click the attachment
              button, select Document, choose the
              downloaded receipt PDF and send it.

            </p>

          </>

        )}


        <button
          type="button"
          className="receipt-share-cancel"
          onClick={onClose}
          disabled={sharing}
        >

          Close

        </button>

      </div>

    </div>

  );

}