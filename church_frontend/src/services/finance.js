import api from "./api";


// ==========================================
// INDIAN CURRENCY FORMAT
// ==========================================

export function currency(value) {

  return Number(value || 0).toLocaleString(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

}


// ==========================================
// DATE FORMAT
// ==========================================

export function formatDate(value) {

  if (!value) return "-";

  const [year, month, day] =
    value.slice(0, 10).split("-");

  return `${day}/${month}/${year}`;

}


export function todayDate() {

  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const get = (type) =>
    parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;

}


// ==========================================
// FETCH ALL API RECORDS
// ==========================================

export async function fetchAll(url) {

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


// ==========================================
// AMOUNT IN WORDS
// ==========================================

const ones = [
  "Zero", "One", "Two", "Three", "Four",
  "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen",
  "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty",
  "Fifty", "Sixty", "Seventy", "Eighty",
  "Ninety",
];


function numberToWords(number) {

  if (number < 20) {

    return ones[number];

  }

  if (number < 100) {

    return tens[Math.floor(number / 10)] +
      (
        number % 10
          ? " " + ones[number % 10]
          : ""
      );

  }

  const units = [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
    [100, "Hundred"],
  ];

  for (const [value, label] of units) {

    if (number >= value) {

      return (
        numberToWords(Math.floor(number / value)) +
        " " + label +
        (
          number % value
            ? " " + numberToWords(number % value)
            : ""
        )
      );

    }

  }

  return "";

}


export function amountToWords(amount) {

  const number = Number(amount);

  if (
    !Number.isFinite(number) ||
    number < 0 ||
    number > 9999999999.99
  ) {

    return "Invalid Amount";

  }

  const totalPaise = Math.round(number * 100);

  const rupees = Math.floor(totalPaise / 100);

  const paise = totalPaise % 100;

  return (
    "Rupees " +
    numberToWords(rupees) +
    (
      paise
        ? " and " + numberToWords(paise) + " Paise"
        : ""
    ) +
    " Only"
  );

}


// ==========================================
// API ERROR MESSAGE
// ==========================================

export function errorMessage(error) {

  const data = error.response?.data;

  if (!data) {

    return "Unable to connect to the server.";

  }

  if (typeof data === "string") {

    return data;

  }

  return (
    data.error ||
    data.detail ||
    JSON.stringify(data)
  );

}


// ==========================================
// VIEW / PRINT PDF
// ==========================================

export async function viewReceipt(id) {

  const pdfWindow = window.open(
    "about:blank",
    "_blank"
  );

  if (!pdfWindow) {

    throw new Error(
      "Please allow browser pop-ups."
    );

  }

  pdfWindow.opener = null;

  try {

    const response = await api.get(
      `receipts/${id}/pdf/`,
      {
        responseType: "blob",
      }
    );

    const url = URL.createObjectURL(
      new Blob(
        [response.data],
        { type: "application/pdf" }
      )
    );

    pdfWindow.location.href = url;

    setTimeout(
      () => URL.revokeObjectURL(url),
      300000
    );

  } catch (error) {

    pdfWindow.close();

    throw error;

  }

}


// ==========================================
// DOWNLOAD PDF
// ==========================================

export async function downloadReceipt(offering) {

  const response = await api.get(
    `receipts/${offering.id}/download/`,
    {
      responseType: "blob",
    }
  );

  const url = URL.createObjectURL(
    new Blob(
      [response.data],
      { type: "application/pdf" }
    )
  );

  const link = document.createElement("a");

  link.href = url;

  link.download =
    `${offering.receipt_number || "Receipt"}.pdf`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );

}


// ==========================================
// WHATSAPP RECEIPT MESSAGE
// ==========================================

export function shareReceipt(offering) {

  let phone = String(
    offering.donor_phone || ""
  ).replace(/\D/g, "");

  if (phone.length === 10) {

    phone = `91${phone}`;

  }

  if (!/^[1-9]\d{7,14}$/.test(phone)) {

    phone = "";

  }

  const message = [

    "Praise the Lord!",

    "",

    "*FGPC YELAHANKA CHURCH*",

    "*CASH RECEIPT*",

    "",

    `Receipt No: ${offering.receipt_number}`,

    `Date: ${formatDate(offering.date)}`,

    `Received From: ${offering.donor_name}`,

    "",

    ...(offering.items || []).map(
      (item) =>
        `${item.category_name || "Offering"}${
          item.purpose ? ` - ${item.purpose}` : ""
        }: ${currency(item.amount)}`
    ),

    "",

    `*Total: ${currency(offering.total_amount)}*`,

    offering.amount_in_words ||
      amountToWords(offering.total_amount),

    "",

    "Thank you for your contribution.",

    "God Bless You!",

  ].join("\n");

  window.open(
    `https://wa.me/${phone}?text=${
      encodeURIComponent(message)
    }`,
    "_blank",
    "noopener,noreferrer"
  );

}