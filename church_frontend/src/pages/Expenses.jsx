import { useEffect, useState } from "react";

import {
  Plus,
  Wallet,
  Receipt,
  TrendingDown,
  Search,
  RefreshCw,
  Eye,
  Download,
  MessageCircle,
  CheckCircle2,
  X,
  LoaderCircle,
} from "lucide-react";

import ExpenseForm from "../components/ExpenseForm";

import {
  currency,
  formatDate,
  fetchAll,
  errorMessage,
} from "../services/finance";

import {
  viewVoucher,
  downloadVoucher,
  shareVoucher,
} from "../services/vouchers";

import "../styles/Offerings.css";
import "../styles/Expenses.css";


export default function Expenses({
  vouchersOnly = false,
}) {

  const [expenses, setExpenses] = useState([]);

  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");

  const [fundFilter, setFundFilter] =
    useState("all");

  const [paymentFilter, setPaymentFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [savedExpense, setSavedExpense] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ========================================
  // LOAD EXPENSE DATA
  // ========================================

  const loadData = async () => {

    setLoading(true);

    setError("");

    try {

      const [
        expenseData,
        categoryData,
      ] = await Promise.all([

        fetchAll("expenses/"),

        fetchAll("expense-categories/"),

      ]);

      setExpenses(expenseData);

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
  // FILTER EXPENSES
  // ========================================

  const filteredExpenses = expenses.filter(
    (expense) => {

      const keyword =
        search.trim().toLowerCase();

      const matchesSearch = [

        expense.voucher_number,
        expense.paid_to,
        expense.phone_number,

        ...(expense.items || []).map(
          (item) => item.particulars
        ),

      ].some((value) =>

        String(value || "")
          .toLowerCase()
          .includes(keyword)

      );

      const matchesFund =
        fundFilter === "all" ||
        expense.fund === fundFilter;

      const matchesPayment =
        paymentFilter === "all" ||
        expense.payment_method === paymentFilter;

      const matchesStatus = vouchersOnly

        ? expense.status === "completed"

        : statusFilter === "all" ||
          expense.status === statusFilter;

      const matchesStart =
        !startDate ||
        expense.date >= startDate;

      const matchesEnd =
        !endDate ||
        expense.date <= endDate;

      return (

        matchesSearch &&
        matchesFund &&
        matchesPayment &&
        matchesStatus &&
        matchesStart &&
        matchesEnd

      );

    }
  );


  // ========================================
  // EXPENSE TOTALS
  // ========================================

  const completedExpenses =
    filteredExpenses.filter(
      (expense) =>
        expense.status === "completed"
    );


  const sumExpenses = (records) =>

    records.reduce(

      (total, expense) =>
        total + Math.round(
          Number(expense.total_amount || 0) * 100
        ),

      0

    ) / 100;


  const totalExpenses =
    sumExpenses(completedExpenses);


  const localExpenses = sumExpenses(

    completedExpenses.filter(
      (expense) => expense.fund === "local"
    )

  );


  const denominationExpenses = sumExpenses(

    completedExpenses.filter(
      (expense) =>
        expense.fund === "denomination"
    )

  );


  // ========================================
  // VOUCHER ACTIONS
  // ========================================

  const handleView = async (expense) => {

    try {

      await viewVoucher(expense.id);

    } catch (err) {

      alert(
        err.message === "Please allow browser pop-ups."
          ? err.message
          : "Unable to open voucher PDF."
      );

    }

  };


  const handleDownload = async (expense) => {

    try {

      await downloadVoucher(expense);

    } catch {

      alert("Unable to download voucher.");

    }

  };


  const handleSaved = (expense) => {

    setShowForm(false);

    setSavedExpense(expense);

    loadData();

  };


  const resetFilters = () => {

    setSearch("");

    setFundFilter("all");

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

            {vouchersOnly
              ? "Payment Vouchers"
              : "Expense Management"}

          </h1>

          <p>

            {vouchersOnly
              ? "View, print and download payment vouchers"
              : "Manage church expenses and fund payments"}

          </p>

        </div>


        {!vouchersOnly && (

          <button
            className="finance-primary-btn"
            onClick={() => setShowForm(true)}
            disabled={loading}
          >

            <Plus size={20} />

            New Expense

          </button>

        )}

      </div>


      {/* SUMMARY CARDS */}

      <div className="finance-stats-grid expense-stats-grid">

        <div className="finance-stat-card">

          <TrendingDown
            size={30}
            className="expense-amount"
          />

          <div>

            <p>Total Expenses</p>

            <h2 className="expense-amount">

              {loading
                ? "..."
                : currency(totalExpenses)}

            </h2>

          </div>

        </div>


        <div className="finance-stat-card">

          <Wallet size={30} />

          <div>

            <p>Local Church Expenses</p>

            <h2>

              {loading
                ? "..."
                : currency(localExpenses)}

            </h2>

          </div>

        </div>


        <div className="finance-stat-card">

          <Wallet size={30} />

          <div>

            <p>Denomination Expenses</p>

            <h2>

              {loading
                ? "..."
                : currency(denominationExpenses)}

            </h2>

          </div>

        </div>


        <div className="finance-stat-card">

          <Receipt size={30} />

          <div>

            <p>Completed Vouchers</p>

            <h2>

              {loading
                ? "..."
                : completedExpenses.length}

            </h2>

          </div>

        </div>

      </div>


      {/* SEARCH AND FILTERS */}

      <div className="finance-toolbar">

        <div className="finance-search">

          <Search size={19} />

          <input
            placeholder="Search voucher, receiver..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>


        <select
          value={fundFilter}
          onChange={(event) =>
            setFundFilter(event.target.value)
          }
        >

          <option value="all">
            All Funds
          </option>

          <option value="local">
            Local Church
          </option>

          <option value="denomination">
            Denomination
          </option>

        </select>


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


        {!vouchersOnly && (

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >

            <option value="all">All Status</option>

            <option value="completed">
              Completed
            </option>

            <option value="draft">Draft</option>

            <option value="cancelled">
              Cancelled
            </option>

          </select>

        )}


        <label className="finance-date-field">

          From

          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
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
            min={startDate || undefined}
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


      {/* EXPENSE HISTORY */}

      <div className="finance-panel">

        <div className="expense-history-heading">

          <h2>

            {vouchersOnly
              ? "Voucher History"
              : "Expense History"}

          </h2>

          <span>

            {filteredExpenses.length} Records

          </span>

        </div>


        {loading ? (

          <div className="finance-empty">

            <LoaderCircle size={35} />

            <p>Loading expense records...</p>

          </div>

        ) : (

          <div className="finance-table-wrapper">

            <table className="finance-table expense-history-table">

              <thead>

                <tr>

                  <th>Voucher Number</th>

                  <th>Paid To</th>

                  <th>Date</th>

                  <th>Particulars</th>

                  <th>Fund</th>

                  <th>Payment</th>

                  <th>Amount</th>

                  <th>Status</th>

                  <th>Actions</th>

                </tr>

              </thead>


              <tbody>

                {filteredExpenses.map((expense) => (

                  <tr key={expense.id}>

                    <td className="finance-record-number">

                      {expense.voucher_number}

                    </td>


                    <td>{expense.paid_to}</td>


                    <td>

                      {formatDate(expense.date)}

                    </td>


                    <td>

                      <div className="expense-particulars">

                        {(expense.items || []).map(
                          (item, index) => (

                            <span key={item.id || index}>

                              {item.particulars}

                            </span>

                          )
                        )}

                      </div>

                    </td>


                    <td>

                      <span
                        className={`expense-fund-tag ${
                          expense.fund
                        }`}
                      >

                        {expense.fund_name ||
                          (
                            expense.fund === "local"
                              ? "Local Church"
                              : "Denomination"
                          )}

                      </span>

                    </td>


                    <td className="finance-capitalize">

                      {expense.payment_method_name ||
                        expense.payment_method
                          ?.replaceAll("_", " ")}

                    </td>


                    <td className="expense-amount">

                      {currency(expense.total_amount)}

                    </td>


                    <td>

                      <span
                        className={`finance-status ${
                          expense.status
                        }`}
                      >

                        {expense.status}

                      </span>

                    </td>


                    <td>

                      {expense.status === "completed"
                        ? (

                          <div className="finance-actions">

                            <button
                              className="finance-icon-btn purple"
                              title="View / Print Voucher"
                              aria-label="View voucher"
                              onClick={() =>
                                handleView(expense)
                              }
                            >

                              <Eye size={18} />

                            </button>


                            <button
                              className="finance-icon-btn gold"
                              title="Download Voucher"
                              aria-label="Download voucher"
                              onClick={() =>
                                handleDownload(expense)
                              }
                            >

                              <Download size={18} />

                            </button>


                            <button
                              className="finance-icon-btn green"
                              title="Share on WhatsApp"
                              aria-label="Share voucher details"
                              onClick={() =>
                                shareVoucher(expense)
                              }
                            >

                              <MessageCircle size={18} />

                            </button>

                          </div>

                        ) : "—"}

                    </td>

                  </tr>

                ))}


                {filteredExpenses.length === 0 && (

                  <tr>

                    <td
                      colSpan={9}
                      className="finance-empty-cell"
                    >

                      No expense records found.

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* EXPENSE FORM */}

      {showForm && (

        <ExpenseForm
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />

      )}


      {/* SUCCESS MODAL */}

      {savedExpense && (

        <div className="offering-modal-overlay">

          <div
            className="receipt-success-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Expense saved"
          >

            <button
              className="receipt-success-close"
              onClick={() => setSavedExpense(null)}
              aria-label="Close"
            >

              <X size={22} />

            </button>


            <CheckCircle2
              size={65}
              color="#198754"
            />


            <h2>Expense Saved Successfully!</h2>

            <p>

              Your payment voucher has been generated.

            </p>


            <div className="receipt-success-details">

              <span>Voucher Number</span>

              <strong>

                {savedExpense.voucher_number}

              </strong>


              <span>Paid To</span>

              <strong>

                {savedExpense.paid_to}

              </strong>


              <span>Expense Fund</span>

              <strong>

                {savedExpense.fund_name ||
                  (
                    savedExpense.fund === "local"
                      ? "Local Church"
                      : "Denomination"
                  )}

              </strong>


              <span>Total Expense</span>

              <h1 className="expense-amount">

                {currency(savedExpense.total_amount)}

              </h1>


              <p>

                {savedExpense.amount_in_words}

              </p>

            </div>


            <div className="receipt-success-actions">

              <button
                className="finance-primary-btn"
                onClick={() =>
                  handleView(savedExpense)
                }
              >

                <Eye size={18} />

                View / Print

              </button>


              <button
                className="finance-secondary-btn"
                onClick={() =>
                  handleDownload(savedExpense)
                }
              >

                <Download size={18} />

                Download PDF

              </button>


              <button
                className="finance-whatsapp-btn"
                onClick={() =>
                  shareVoucher(savedExpense)
                }
              >

                <MessageCircle size={18} />

                WhatsApp

              </button>

            </div>


            <button
              className="finance-secondary-btn"
              onClick={() => {

                setSavedExpense(null);

                setShowForm(true);

              }}
            >

              <Plus size={18} />

              Add Another Expense

            </button>

          </div>

        </div>

      )}

    </div>

  );

}