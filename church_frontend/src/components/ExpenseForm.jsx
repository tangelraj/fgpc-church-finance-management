import { useState, useRef } from "react";

import {
  X,
  Church,
  Plus,
  Trash2,
  Save,
  LoaderCircle,
} from "lucide-react";

import api from "../services/api";

import {
  currency,
  amountToWords,
  todayDate,
  errorMessage,
} from "../services/finance";


export default function ExpenseForm({
  categories,
  onClose,
  onSaved,
}) {

  const [form, setForm] = useState({

    paid_to: "",
    phone_number: "",
    date: todayDate(),
    fund: "local",
    payment_method: "cash",
    transaction_reference: "",
    notes: "",

  });

  const [items, setItems] = useState([

    {
      key: 1,
      category: "",
      particulars: "",
      amount: "",
    },

  ]);

  const nextKey = useRef(2);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");


  // ========================================
  // ACTIVE EXPENSE CATEGORIES
  // ========================================

  const activeCategories = categories.filter(
    (category) => category.is_active
  );


  // ========================================
  // FORM CHANGE
  // ========================================

  const handleChange = (event) => {

    const { name, value } = event.target;

    setForm((previous) => ({

      ...previous,

      [name]: value,

    }));

  };


  // ========================================
  // ADD EXPENSE ITEM
  // ========================================

  const addItem = () => {

    const key = nextKey.current++;

    setItems((previous) => [

      ...previous,

      {
        key,
        category: "",
        particulars: "",
        amount: "",
      },

    ]);

  };


  // ========================================
  // UPDATE EXPENSE ITEM
  // ========================================

  const updateItem = (key, field, value) => {

    setItems((previous) =>

      previous.map((item) =>

        item.key === key
          ? { ...item, [field]: value }
          : item

      )

    );

  };


  // ========================================
  // REMOVE EXPENSE ITEM
  // ========================================

  const removeItem = (key) => {

    setItems((previous) => {

      if (previous.length === 1) {

        return previous;

      }

      return previous.filter(
        (item) => item.key !== key
      );

    });

  };


  // ========================================
  // CALCULATE TOTAL
  // ========================================

  const totalAmount = items.reduce(

    (total, item) => {

      const amount = Number(item.amount);

      return total + (
        Number.isFinite(amount) && amount > 0
          ? Math.round(amount * 100)
          : 0
      );

    },

    0

  ) / 100;


  // ========================================
  // SAVE EXPENSE
  // ========================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    if (loading) return;

    setError("");

    if (!form.paid_to.trim()) {

      setError("Enter the receiver name.");

      return;

    }

    if (items.length === 0) {

      setError("Add at least one expense item.");

      return;

    }

    for (const item of items) {

      const amount = Number(item.amount);

      if (
        !item.category ||
        !item.particulars.trim() ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {

        setError(
          "Complete all expense item fields."
        );

        return;

      }

    }

    if (
      totalAmount <= 0 ||
      totalAmount > 9999999999.99
    ) {

      setError("Enter a valid total amount.");

      return;

    }

    const payload = {

      ...form,

      paid_to: form.paid_to.trim(),

      items: items.map((item) => ({

        category: Number(item.category),

        particulars: item.particulars.trim(),

        amount: Number(item.amount).toFixed(2),

      })),

    };

    setLoading(true);

    try {

      const response = await api.post(
        "expenses/",
        payload
      );

      onSaved(response.data);

    } catch (err) {

      setError(errorMessage(err));

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="offering-modal-overlay">

      <div
        className="offering-modal expense-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-title"
      >

        {/* MODAL HEADER */}

        <div className="offering-modal-header">

          <div>

            <h2 id="expense-title">
              New Expense
            </h2>

            <p>
              Record church expenses and generate voucher
            </p>

          </div>

          <button
            type="button"
            className="offering-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >

            <X size={24} />

          </button>

        </div>


        <form onSubmit={handleSubmit}>

          <div className="offering-modal-body">

            {error && (

              <div className="finance-error">

                {error}

              </div>

            )}


            {/* CHURCH HEADER */}

            <div className="offering-church-heading">

              <Church size={40} />

              <span>PRAISE THE LORD</span>

              <h2>
                FULL GOSPEL PENTECOSTAL CHURCH
              </h2>

              <h3>YELAHANKA</h3>

              <p>
                Thirumalappa Nagar, Attur 2nd Stage,
                Yelahanka, Bangalore - 560064
              </p>

              <h4>PAYMENT VOUCHER</h4>

            </div>


            {/* RECEIVER INFORMATION */}

            <div className="offering-form-grid">

              <label className="offering-field">

                Paid To *

                <input
                  name="paid_to"
                  value={form.paid_to}
                  onChange={handleChange}
                  placeholder="Receiver / Company name"
                  maxLength={150}
                  required
                />

              </label>


              <label className="offering-field">

                Date *

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />

              </label>


              <label className="offering-field">

                Mobile / WhatsApp Number

                <input
                  type="tel"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  maxLength={15}
                  placeholder="Optional mobile number"
                />

              </label>


              <label className="offering-field">

                Expense Fund *

                <select
                  name="fund"
                  value={form.fund}
                  onChange={handleChange}
                >

                  <option value="local">
                    Local Church
                  </option>

                  <option value="denomination">
                    Denomination
                  </option>

                </select>

              </label>

            </div>


            {/* EXPENSE PARTICULARS */}

            <div className="expense-items-panel">

              <div className="expense-items-heading">

                <h3>Expense Particulars</h3>

                <button
                  type="button"
                  className="expense-add-item"
                  onClick={addItem}
                >

                  <Plus size={17} />

                  Add Item

                </button>

              </div>


              <div className="expense-table-wrapper">

                <table className="expense-entry-table">

                  <thead>

                    <tr>

                      <th>No.</th>

                      <th>Category</th>

                      <th>Particulars</th>

                      <th>Amount (₹)</th>

                      <th>Action</th>

                    </tr>

                  </thead>


                  <tbody>

                    {items.map((item, index) => (

                      <tr key={item.key}>

                        <td>{index + 1}</td>


                        <td>

                          <select
                            value={item.category}
                            aria-label={`Category ${index + 1}`}
                            onChange={(event) =>
                              updateItem(
                                item.key,
                                "category",
                                event.target.value
                              )
                            }
                            required
                          >

                            <option value="">
                              Select Category
                            </option>

                            {activeCategories.map(
                              (category) => (

                                <option
                                  key={category.id}
                                  value={category.id}
                                >

                                  {category.name}

                                </option>

                              )
                            )}

                          </select>

                        </td>


                        <td>

                          <input
                            value={item.particulars}
                            aria-label={`Particulars ${index + 1}`}
                            placeholder="Enter particulars"
                            maxLength={250}
                            onChange={(event) =>
                              updateItem(
                                item.key,
                                "particulars",
                                event.target.value
                              )
                            }
                            required
                          />

                        </td>


                        <td>

                          <input
                            type="number"
                            min="0.01"
                            max="9999999999.99"
                            step="0.01"
                            placeholder="0.00"
                            aria-label={`Amount ${index + 1}`}
                            value={item.amount}
                            onChange={(event) =>
                              updateItem(
                                item.key,
                                "amount",
                                event.target.value
                              )
                            }
                            required
                          />

                        </td>


                        <td>

                          <button
                            type="button"
                            className="expense-remove-item"
                            onClick={() =>
                              removeItem(item.key)
                            }
                            disabled={items.length === 1}
                            aria-label="Remove item"
                          >

                            <Trash2 size={17} />

                          </button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>


            {/* TOTAL AMOUNT */}

            <div className="offering-total-box">

              <div className="offering-total-row">

                <span>Total Expense</span>

                <h2 className="expense-amount">

                  {currency(totalAmount)}

                </h2>

              </div>

              <div className="offering-words">

                <strong>Amount in Words:</strong>

                <p>

                  {amountToWords(totalAmount)}

                </p>

              </div>

            </div>


            {/* PAYMENT INFORMATION */}

            <div className="offering-form-grid">

              <label className="offering-field">

                Payment Method

                <select
                  name="payment_method"
                  value={form.payment_method}
                  onChange={handleChange}
                >

                  <option value="cash">
                    Cash
                  </option>

                  <option value="upi">
                    UPI
                  </option>

                  <option value="bank_transfer">
                    Bank Transfer
                  </option>

                  <option value="cheque">
                    Cheque
                  </option>

                </select>

              </label>


              <label className="offering-field">

                Transaction Reference

                <input
                  name="transaction_reference"
                  value={form.transaction_reference}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="Optional reference number"
                />

              </label>


              <label className="offering-field full-width">

                Notes

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Additional expense details"
                />

              </label>

            </div>


            <div className="expense-balance-notice">

              This expense will be deducted from the
              selected fund balance after saving.

            </div>

          </div>


          {/* MODAL FOOTER */}

          <div className="offering-modal-footer">

            <button
              type="button"
              className="finance-secondary-btn"
              onClick={onClose}
              disabled={loading}
            >

              Cancel

            </button>


            <button
              type="submit"
              className="finance-primary-btn"
              disabled={
                loading ||
                activeCategories.length === 0
              }
            >

              {loading
                ? <LoaderCircle size={19} />
                : <Save size={19} />}

              {loading
                ? "Saving Expense..."
                : "Save & Generate Voucher"}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}