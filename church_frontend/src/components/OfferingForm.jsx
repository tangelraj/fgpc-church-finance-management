import { useState } from "react";

import {
  X,
  Church,
  Save,
  Plus,
  Trash2,
  LoaderCircle,
} from "lucide-react";

import api from "../services/api";

import {
  currency,
  amountToWords,
  todayDate,
  errorMessage,
} from "../services/finance";


export default function OfferingForm({
  families,
  categories,
  onClose,
  onSaved,
}) {

  const [form, setForm] = useState({

    family: "",
    donor_name: "",
    donor_phone: "",
    date: todayDate(),
    payment_method: "cash",
    transaction_reference: "",
    notes: "",

  });

  const [amounts, setAmounts] = useState({});

  const [purposes, setPurposes] = useState({});

  const [extraItems, setExtraItems] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");


  // ========================================
  // ACTIVE CATEGORIES
  // ========================================

  const activeCategories = categories.filter(
    (category) => category.is_active
  );

  const localCategories = activeCategories.filter(
    (category) => category.group === "local"
  );

  const denominationCategories =
    activeCategories.filter(
      (category) =>
        category.group === "denomination"
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


  const handleFamilyChange = (event) => {

    const selectedId = event.target.value;

    const family = families.find(
      (item) =>
        String(item.id) === selectedId
    );

    setForm((previous) => ({

      ...previous,

      family: selectedId,

      donor_name: family?.family_head || "",

      donor_phone:
        family?.whatsapp_number ||
        family?.mobile_number ||
        "",

    }));

  };


  const handleAmountChange = (id, value) => {

    setAmounts((previous) => ({

      ...previous,

      [id]: value,

    }));

  };


  // ========================================
  // ADDITIONAL OFFERING ITEMS
  // ========================================

  const addExtraItem = () => {

    setExtraItems((previous) => [

      ...previous,

      {
        key: crypto.randomUUID(),
        category: "",
        purpose: "",
        amount: "",
      },

    ]);

  };


  const updateExtraItem = (key, field, value) => {

    setExtraItems((previous) =>

      previous.map((item) =>

        item.key === key
          ? { ...item, [field]: value }
          : item

      )

    );

  };


  const removeExtraItem = (key) => {

    setExtraItems((previous) =>

      previous.filter(
        (item) => item.key !== key
      )

    );

  };


  // ========================================
  // TOTAL CALCULATIONS
  // ========================================

  const groupTotal = (group) => {

    const standardTotal = activeCategories
      .filter((category) => category.group === group)
      .reduce(
        (total, category) =>
          total + Math.round(
            Number(amounts[category.id] || 0) * 100
          ),
        0
      );

    const extraTotal = extraItems
      .filter((item) =>

        activeCategories.some(
          (category) =>
            String(category.id) ===
              String(item.category) &&
            category.group === group
        )

      )
      .reduce(
        (total, item) =>
          total + Math.round(
            Number(item.amount || 0) * 100
          ),
        0
      );

    return (standardTotal + extraTotal) / 100;

  };


  const localTotal = groupTotal("local");

  const denominationTotal =
    groupTotal("denomination");

  const totalAmount =
    Math.round(
      (localTotal + denominationTotal) * 100
    ) / 100;


  // ========================================
  // SAVE OFFERING
  // ========================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");

    if (
      !form.family &&
      !form.donor_name.trim()
    ) {

      setError(
        "Select a family or enter the donor name."
      );

      return;

    }

    if (
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0
    ) {

      setError(
        "Enter at least one valid offering amount."
      );

      return;

    }

    if (totalAmount > 9999999999.99) {

      setError(
        "Total amount exceeds the allowed limit."
      );

      return;

    }

    const items = [];

    for (const category of activeCategories) {

      const amount = Number(
        amounts[category.id] || 0
      );

      if (amount > 0) {

        items.push({

          category: category.id,

          purpose:
            purposes[category.id]?.trim() || "",

          amount: amount.toFixed(2),

        });

      }

    }

    for (const item of extraItems) {

      if (
        !item.category ||
        !item.purpose.trim() ||
        !Number.isFinite(Number(item.amount)) ||
        Number(item.amount) <= 0
      ) {

        setError(
          "Complete all additional offering fields."
        );

        return;

      }

      items.push({

        category: Number(item.category),

        purpose: item.purpose.trim(),

        amount: Number(item.amount).toFixed(2),

      });

    }

    const payload = {

      ...form,

      family: form.family
        ? Number(form.family)
        : null,

      donor_name: form.donor_name.trim(),

      items,

    };

    setLoading(true);

    try {

      const response = await api.post(
        "offerings/",
        payload
      );

      onSaved(response.data);

    } catch (err) {

      setError(errorMessage(err));

    } finally {

      setLoading(false);

    }

  };


  // ========================================
  // CATEGORY TABLE
  // ========================================

  const renderCategories = (
    categoryList,
    title,
    subtotal
  ) => (

    <div className="offering-category-panel">

      <h3>{title}</h3>

      <table className="offering-entry-table">

        <thead>

          <tr>
            <th>Particulars</th>
            <th>Amount (₹)</th>
          </tr>

        </thead>

        <tbody>

          {categoryList.map((category) => (

            <tr key={category.id}>

              <td>

                {category.name}

                {category.name
                  .toLowerCase()
                  .startsWith("other") && (

                    <input
                      className="purpose-input"
                      placeholder="Enter purpose"
                      value={
                        purposes[category.id] || ""
                      }
                      onChange={(event) =>
                        setPurposes((previous) => ({

                          ...previous,

                          [category.id]:
                            event.target.value,

                        }))
                      }
                    />

                  )}

              </td>

              <td>

                <input
                  type="number"
                  min="0"
                  max="9999999999.99"
                  step="0.01"
                  placeholder="0.00"
                  value={amounts[category.id] || ""}
                  aria-label={`${category.name} amount`}
                  onChange={(event) =>
                    handleAmountChange(
                      category.id,
                      event.target.value
                    )
                  }
                />

              </td>

            </tr>

          ))}

        </tbody>

        <tfoot>

          <tr>

            <td>Subtotal</td>

            <td>{currency(subtotal)}</td>

          </tr>

        </tfoot>

      </table>

    </div>

  );


  return (

    <div className="offering-modal-overlay">

      <div
        className="offering-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="offering-title"
      >

        <div className="offering-modal-header">

          <div>

            <h2 id="offering-title">
              New Offering
            </h2>

            <p>
              Record church contributions
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

              <h4>CASH RECEIPT</h4>

            </div>


            {/* DONOR INFORMATION */}

            <div className="offering-form-grid">

              <label className="offering-field">

                Select Family

                <select
                  value={form.family}
                  onChange={handleFamilyChange}
                >

                  <option value="">
                    Visitor / Other Donor
                  </option>

                  {families
                    .filter((family) => family.is_active)
                    .map((family) => (

                      <option
                        key={family.id}
                        value={family.id}
                      >

                        {family.family_id}
                        {" - "}
                        {family.family_head}

                      </option>

                    ))}

                </select>

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

                Received From *

                <input
                  name="donor_name"
                  value={form.donor_name}
                  onChange={handleChange}
                  required
                />

              </label>


              <label className="offering-field">

                Mobile / WhatsApp Number

                <input
                  type="tel"
                  name="donor_phone"
                  value={form.donor_phone}
                  onChange={handleChange}
                />

              </label>

            </div>


            {/* OFFERING TABLE */}

            <div className="offering-category-grid">

              {renderCategories(
                localCategories,
                "Local Church",
                localTotal
              )}

              {renderCategories(
                denominationCategories,
                "Denomination",
                denominationTotal
              )}

            </div>


            {/* ADDITIONAL ITEMS */}

            <div className="extra-offering-section">

              <button
                type="button"
                className="finance-secondary-btn"
                onClick={addExtraItem}
              >

                <Plus size={17} />

                Add Additional Offering

              </button>


              {extraItems.map((item) => (

                <div
                  className="extra-offering-row"
                  key={item.key}
                >

                  <select
                    value={item.category}
                    onChange={(event) =>
                      updateExtraItem(
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
                          {" - "}
                          {category.group}

                        </option>

                      )
                    )}

                  </select>


                  <input
                    placeholder="Offering purpose"
                    value={item.purpose}
                    onChange={(event) =>
                      updateExtraItem(
                        item.key,
                        "purpose",
                        event.target.value
                      )
                    }
                    required
                  />


                  <input
                    type="number"
                    min="0.01"
                    max="9999999999.99"
                    step="0.01"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(event) =>
                      updateExtraItem(
                        item.key,
                        "amount",
                        event.target.value
                      )
                    }
                    required
                  />


                  <button
                    type="button"
                    className="finance-delete-btn"
                    onClick={() =>
                      removeExtraItem(item.key)
                    }
                    aria-label="Remove offering"
                  >

                    <Trash2 size={18} />

                  </button>

                </div>

              ))}

            </div>


            {/* TOTAL AMOUNT */}

            <div className="offering-total-box">

              <div className="offering-total-row">

                <span>Total Amount</span>

                <h2>{currency(totalAmount)}</h2>

              </div>

              <div className="offering-words">

                <strong>Amount in Words:</strong>

                <p>
                  {amountToWords(totalAmount)}
                </p>

              </div>

            </div>


            {/* PAYMENT DETAILS */}

            <div className="offering-form-grid">

              <label className="offering-field">

                Payment Method

                <select
                  name="payment_method"
                  value={form.payment_method}
                  onChange={handleChange}
                >

                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>

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
                  placeholder="Additional information"
                />

              </label>

            </div>

          </div>


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
                ? "Saving Offering..."
                : "Save & Generate Receipt"}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}
