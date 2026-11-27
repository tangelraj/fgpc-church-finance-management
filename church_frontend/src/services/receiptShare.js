import api from "./api";
import { currency, formatDate } from "./finance";


// ==========================================
// FETCH ACTUAL RECEIPT PDF
// ==========================================

export async function prepareReceiptPDF(offering) {

  const response = await api.get(
    `receipts/${offering.id}/download/`,
    {
      responseType: "blob",
    }
  );

  const blob = response.data;

  if (
    !blob ||
    !blob.size ||
    !blob.type.includes("application/pdf")
  ) {
    throw new Error("Invalid receipt PDF.");
  }

  const filename =
    `${offering.receipt_number}.pdf`;

  return new File(
    [blob],
    filename,
    {
      type: "application/pdf",
    }
  );
}


// ==========================================
// WHATSAPP MESSAGE
// ==========================================

export function buildReceiptMessage(offering) {

  return [
    "Praise the Lord!",
    "",
    "*FGPC YELAHANKA CHURCH*",
    "*CASH RECEIPT*",
    "",
    `Receipt No: ${offering.receipt_number}`,
    `Date: ${formatDate(offering.date)}`,
    `Received From: ${offering.donor_name}`,
    "",
    `*Total: ${currency(offering.total_amount)}*`,
    offering.amount_in_words || "",
    "",
    "Thank you for your contribution.",
    "God Bless You!",
  ].join("\n");
}


// ==========================================
// CHECK FILE SHARING SUPPORT
// ==========================================

export function canShareReceiptPDF(file) {

  try {

    return Boolean(
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({
        files: [file],
      })
    );

  } catch {

    return false;

  }

}


// ==========================================
// SHARE ACTUAL PDF FILE
// ==========================================

export async function shareReceiptPDF(
  file,
  offering
) {

  if (!canShareReceiptPDF(file)) {

    throw new Error(
      "Direct PDF sharing is not supported on this browser."
    );

  }

  await navigator.share({

    title: offering.receipt_number,

    text: buildReceiptMessage(offering),

    files: [file],

  });

}


// ==========================================
// DOWNLOAD PREPARED PDF
// ==========================================

export function saveReceiptPDF(file) {

  const url = URL.createObjectURL(file);

  const link = document.createElement("a");

  link.href = url;

  link.download = file.name;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => {

    URL.revokeObjectURL(url);

  }, 30000);

}


// ==========================================
// OPEN WHATSAPP CHAT
// ==========================================

export function openReceiptWhatsApp(offering) {

  let phone = String(
    offering.donor_phone || ""
  ).replace(/\D/g, "");

  if (phone.length === 10) {

    phone = `91${phone}`;

  }

  if (
    phone.length < 10 ||
    phone.length > 15
  ) {

    phone = "";

  }

  const message = encodeURIComponent(
    buildReceiptMessage(offering)
  );

  const url =
    `https://wa.me/${phone}?text=${message}`;

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

}