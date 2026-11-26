import { useEffect, useState } from "react";

import {
  Plus,
  HandCoins,
  Receipt,
  Search,
  RefreshCw,
  Eye,
  Download,
  MessageCircle,
  CheckCircle2,
  X,
  LoaderCircle,
} from "lucide-react";

import OfferingForm from "../components/OfferingForm";

import {
  currency,
  formatDate,
  fetchAll,
  viewReceipt,
  downloadReceipt,
  shareReceipt,
  errorMessage,
} from "../services/finance";

import "../styles/Offerings.css";


export default function Offerings({
  receiptsOnly = false,
}) {

  const [offerings, setOfferings] = useState([]);

  const [families, setFamilies] = useState([]);

  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");

  const [paymentFilter, setPaymentFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [savedOffering, setSavedOffering] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ========================================
  // LOAD DATA
  // ========================================

  const loadData = async () => {

    setLoading(true);

    setError("");

    try {

      const [
        offeringData,
        familyData,
        categoryData,
      ] = await Promise.all([

        fetchAll("offerings/"),

        fetchAll("families/"),

        fetchAll("offering-categories/"),

      ]);

      setOfferings(offeringData);

      setFamilies(familyData);

      setCategories(categoryData);

    } catch (err) {

      setError(errorMessage(err));

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadData();

  }, []);


  // ========================================
  // SEARCH AND FILTER
  // ========================================

  const filteredOfferings = offerings.filter(
    (offering) => {

      const keyword =
        search.trim().toLowerCase();

      const matchesSearch = [

        offering.receipt_number,
        offering.donor_name,
        offering.donor_phone,

      ].some((value) =>

        String(value || "")
          .toLowerCase()
          .includes(keyword)

      );

      const matchesPayment =
        paymentFilter === "all" ||
        offering.payment_method === paymentFilter;

      const matchesStatus = receiptsOnly

        ? offering.status === "completed"

        : statusFilter === "all" ||
          offering.status === statusFilter;

      const matchesStart =
        !startDate ||
        offering.date >= startDate;

      const matchesEnd =
        !endDate ||
        offering.date <= endDate;

      return (
        matchesSearch &&
        matchesPayment &&
        matchesStatus &&
        matchesStart &&
        matchesEnd
      );

    }
  );


  const completedOfferings =
    filteredOfferings.filter(
      (offering) =>
        offering.status === "completed"
    );


  const totalIncome = completedOfferings.reduce(

    (total, offering) =>
      total + Math.round(
        Number(offering.total_amount || 0) * 100
      ),

    0

  ) / 100;


  // ========================================
  // RECEIPT ACTIONS
  // ========================================

  const handleView = async (offering) => {

    try {

      await viewReceipt(offering.id);

    } catch (err) {

      alert(
        err.message === "Please allow browser pop-ups."
          ? err.message
          : "Unable to open receipt PDF."
      );

    }

  };


  const handleDownload = async (offering) => {

    try {

      await downloadReceipt(offering);

    } catch (err) {

      alert("Unable to download receipt.");

    }

  };


  const handleSaved = (offering) => {

    setShowForm(false);

    setSavedOffering(offering);

    loadData();

  };


  const resetFilters = () => {

    setSearch("");

    setPaymentFilter("all");

    setStatusFilter("all");

    setStartDate("");

    setEndDate("");

  };


  return (

    <div className="finance-page">

      {/* PAGE HEADER */}

      <div className="finance-page-heading">

        <div>

          <h1>

            {receiptsOnly
              ? "Cash Receipts"
              : "Offering Management"}

          </h1>

          <p>

            {receiptsOnly
              ? "View, print and share cash receipts"
              : "Manage church offerings and contributions"}

          </p>

        </div>

        {!receiptsOnly && (

          <button
            className="finance-primary-btn"
            onClick={() => setShowForm(true)}
            disabled={loading}
          >

            <Plus size={20} />

            New Offering

          </button>

        )}

      </div>


      {/* SUMMARY CARDS */}

      <div className="finance-stats-grid">

        <div className="finance-stat-card">

          <HandCoins size={30} />

          <div>

            <p>Completed Income</p>

            <h2>
              {loading ? "..." : currency(totalIncome)}
            </h2>

          </div>

        </div>


        <div className="finance-stat-card">

          <Receipt size={30} />

          <div>

            <p>Completed Receipts</p>

            <h2>
              {loading
                ? "..."
                : completedOfferings.length}
            </h2>

          </div>

        </div>


        <div className="finance-stat-card">

          <HandCoins size={30} />

          <div>

            <p>Matching Records</p>

            <h2>
              {loading
                ? "..."
                : filteredOfferings.length}
            </h2>

          </div>

        </div>

      </div>


      {/* SEARCH AND FILTER */}

      <div className="finance-toolbar">

        <div className="finance-search">

          <Search size={19} />

          <input
            placeholder="Search receipt, donor, mobile..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>


        <select
          value={paymentFilter}
          onChange={(event) =>
            setPaymentFilter(event.target.value)
          }
        >

          <option value="all">All Payments</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>

          <option value="bank_transfer">
            Bank Transfer
          </option>

          <option value="cheque">Cheque</option>

        </select>


        {!receiptsOnly && (

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >

            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>

          </select>

        )}


        <label className="finance-date-field">

          From

          <input
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(event.target.value)
            }
          />

        </label>


        <label className="finance-date-field">

          To

          <input
            type="date"
            value={endDate}
            onChange={(event) =>
              setEndDate(event.target.value)
            }
          />

        </label>


        <button
          className="finance-secondary-btn"
          onClick={resetFilters}
        >

          Reset

        </button>


        <button
          className="finance-secondary-btn"
          onClick={loadData}
          disabled={loading}
          aria-label="Refresh"
        >

          <RefreshCw size={18} />

        </button>

      </div>


      {error && (

        <div className="finance-error">

          {error}

        </div>

      )}


      {/* OFFERING TABLE */}

      <div className="finance-panel">

        <h2>

          {receiptsOnly
            ? "Receipt History"
            : "Offering History"}

        </h2>


        {loading ? (

          <div className="finance-empty">

            <LoaderCircle size={35} />

            <p>Loading financial records...</p>

          </div>

        ) : (

          <div className="finance-table-wrapper">

            <table className="finance-table">

              <thead>

                <tr>

                  <th>Receipt Number</th>
                  <th>Donor / Family</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>

                </tr>

              </thead>

              <tbody>

                {filteredOfferings.map(
                  (offering) => (

                    <tr key={offering.id}>

                      <td className="finance-record-number">

                        {offering.receipt_number}

                      </td>

                      <td>

                        {offering.donor_name}

                      </td>

                      <td>

                        {formatDate(offering.date)}

                      </td>

                      <td className="finance-capitalize">

                        {offering.payment_method_name ||
                          offering.payment_method
                            ?.replaceAll("_", " ")}

                      </td>

                      <td className="finance-income">

                        {currency(offering.total_amount)}

                      </td>

                      <td>

                        <span
                          className={`finance-status ${
                            offering.status
                          }`}
                        >

                          {offering.status}

                        </span>

                      </td>

                      <td>

                        {offering.status === "completed"
                          ? (

                            <div className="finance-actions">

                              <button
                                className="finance-icon-btn purple"
                                title="View / Print Receipt"
                                aria-label="View or print receipt"
                                onClick={() =>
                                  handleView(offering)
                                }
                              >

                                <Eye size={18} />

                              </button>


                              <button
                                className="finance-icon-btn gold"
                                title="Download PDF"
                                aria-label="Download receipt"
                                onClick={() =>
                                  handleDownload(offering)
                                }
                              >

                                <Download size={18} />

                              </button>


                              <button
                                className="finance-icon-btn green"
                                title="Share on WhatsApp"
                                aria-label="Share receipt information"
                                onClick={() =>
                                  shareReceipt(offering)
                                }
                              >

                                <MessageCircle size={18} />

                              </button>

                            </div>

                          ) : "—"}

                      </td>

                    </tr>

                  )
                )}


                {filteredOfferings.length === 0 && (

                  <tr>

                    <td
                      colSpan={7}
                      className="finance-empty-cell"
                    >

                      No offering records found.

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* NEW OFFERING FORM */}

      {showForm && (

        <OfferingForm
          families={families}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />

      )}


      {/* SUCCESS MESSAGE */}

      {savedOffering && (

        <div className="offering-modal-overlay">

          <div className="receipt-success-modal">

            <button
              className="receipt-success-close"
              onClick={() => setSavedOffering(null)}
              aria-label="Close"
            >

              <X size={22} />

            </button>


            <CheckCircle2
              size={65}
              color="#198754"
            />

            <h2>Offering Saved Successfully!</h2>

            <p>

              Your cash receipt has been generated.

            </p>


            <div className="receipt-success-details">

              <span>Receipt Number</span>

              <strong>

                {savedOffering.receipt_number}

              </strong>

              <span>Received From</span>

              <strong>

                {savedOffering.donor_name}

              </strong>

              <span>Total Amount</span>

              <h1>

                {currency(savedOffering.total_amount)}

              </h1>

              <p>

                {savedOffering.amount_in_words}

              </p>

            </div>


            <div className="receipt-success-actions">

              <button
                className="finance-primary-btn"
                onClick={() =>
                  handleView(savedOffering)
                }
              >

                <Eye size={18} />

                View / Print

              </button>


              <button
                className="finance-secondary-btn"
                onClick={() =>
                  handleDownload(savedOffering)
                }
              >

                <Download size={18} />

                Download PDF

              </button>


              <button
                className="finance-whatsapp-btn"
                onClick={() =>
                  shareReceipt(savedOffering)
                }
              >

                <MessageCircle size={18} />

                WhatsApp

              </button>

            </div>


            <button
              className="finance-secondary-btn"
              onClick={() => {

                setSavedOffering(null);

                setShowForm(true);

              }}
            >

              <Plus size={18} />

              Add Another Offering

            </button>

          </div>

        </div>

      )}

    </div>

  );

}