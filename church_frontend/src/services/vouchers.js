import api from "./api";

import {
  currency,
  formatDate,
  amountToWords,
} from "./finance";


// ==========================================
// VIEW AND PRINT VOUCHER
// ==========================================

export async function viewVoucher(id) {

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
      `vouchers/${id}/pdf/`,
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
// DOWNLOAD VOUCHER PDF
// ==========================================

export async function downloadVoucher(expense) {

  const response = await api.get(
    `vouchers/${expense.id}/download/`,
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
    `${expense.voucher_number || "Voucher"}.pdf`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );

}


// ==========================================
// WHATSAPP VOUCHER
// ==========================================

export function shareVoucher(expense) {

  let phone = String(
    expense.phone_number || ""
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

    "*PAYMENT VOUCHER*",

    "",

    `Voucher No: ${expense.voucher_number}`,

    `Date: ${formatDate(expense.date)}`,

    `Paid To: ${expense.paid_to}`,

    "",

    ...(expense.items || []).map(
      (item) =>
        `${item.particulars}: ${currency(item.amount)}`
    ),

    "",

    `*Total Amount: ${currency(expense.total_amount)}*`,

    expense.amount_in_words ||
      amountToWords(expense.total_amount),

    "",

    `Payment Method: ${
      expense.payment_method_name ||
      expense.payment_method
    }`,

    "",

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