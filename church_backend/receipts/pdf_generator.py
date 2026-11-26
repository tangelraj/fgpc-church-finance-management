from io import BytesIO
from decimal import Decimal
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A5, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepInFrame,
)

from offerings.utils import amount_to_words


PURPLE = colors.HexColor("#863B86")
LIGHT_PURPLE = colors.HexColor("#F8F0F8")


def format_amount(amount):

    return f"{Decimal(amount):,.2f}"


def generate_receipt_pdf(offering):

    buffer = BytesIO()

    # ======================================
    # SINGLE PAGE A5 LANDSCAPE
    # ======================================

    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A5),
        rightMargin=20,
        leftMargin=20,
        topMargin=8,
        bottomMargin=8,
        title=f"Cash Receipt {offering.receipt_number}",
        author="FGPC Yelahanka",
    )

    # Account for ReportLab frame padding

    page_width = doc.width - 12

    available_height = doc.height - 14

    elements = []

    # ======================================
    # TEXT STYLES
    # ======================================

    praise_style = ParagraphStyle(
        name="Praise",
        fontName="Helvetica",
        fontSize=9,
        leading=10,
        alignment=TA_CENTER,
        textColor=PURPLE,
    )

    church_style = ParagraphStyle(
        name="ChurchName",
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=19,
        alignment=TA_CENTER,
        textColor=PURPLE,
    )

    headquarters_style = ParagraphStyle(
        name="Headquarters",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=12,
        alignment=TA_CENTER,
        textColor=PURPLE,
    )

    registration_style = ParagraphStyle(
        name="Registration",
        fontName="Times-Italic",
        fontSize=9,
        leading=10,
        alignment=TA_CENTER,
        textColor=PURPLE,
    )

    branch_style = ParagraphStyle(
        name="Branch",
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=17,
        alignment=TA_CENTER,
        textColor=PURPLE,
    )

    address_style = ParagraphStyle(
        name="Address",
        fontName="Times-Italic",
        fontSize=10,
        leading=11,
        alignment=TA_CENTER,
        textColor=PURPLE,
    )

    receipt_style = ParagraphStyle(
        name="ReceiptTitle",
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=18,
        alignment=TA_CENTER,
        textColor=PURPLE,
    )

    normal_style = ParagraphStyle(
        name="NormalText",
        fontName="Times-Roman",
        fontSize=11,
        leading=12,
        alignment=TA_LEFT,
        textColor=PURPLE,
    )

    table_text_style = ParagraphStyle(
        name="TableText",
        fontName="Times-Roman",
        fontSize=10,
        leading=11,
        textColor=PURPLE,
    )

    signature_style = ParagraphStyle(
        name="Signature",
        fontName="Times-Italic",
        fontSize=10,
        leading=11,
        alignment=TA_CENTER,
        textColor=PURPLE,
    )

    def safe(value):

        return escape(str(value or ""))

    # ======================================
    # CHURCH HEADER
    # ======================================

    elements.append(
        Paragraph(
            "PRAISE THE LORD",
            praise_style
        )
    )

    elements.append(
        Paragraph(
            "FULL GOSPEL PENTECOSTAL CHURCH",
            church_style
        )
    )

    elements.append(
        Paragraph(
            "NHO : KADAMALAIKUNTU",
            headquarters_style
        )
    )

    elements.append(
        Paragraph(
            "(Reg. Society No.64/95 under Tamil Nadu "
            "Societies Registration act 27 of 75 "
            "&amp; under IT act of 1961.)",
            registration_style
        )
    )

    elements.append(Spacer(1, 2))

    elements.append(
        Paragraph(
            "<u>YELAHANKA</u>",
            branch_style
        )
    )

    elements.append(
        Paragraph(
            "Thirumalappa Nagar, Attur 2nd Stage, "
            "Yelahanka, Bangalore - 560064",
            address_style
        )
    )

    elements.append(Spacer(1, 2))

    elements.append(
        Paragraph(
            "CASH RECEIPT",
            receipt_style
        )
    )

    elements.append(Spacer(1, 5))

    # ======================================
    # RECEIPT NUMBER AND DATE
    # ======================================

    receipt_info = Table(
        [[
            f"No. {offering.receipt_number}",

            f"Date: {offering.date.strftime('%d/%m/%Y')}"
        ]],

        colWidths=[
            page_width * 0.60,
            page_width * 0.40,
        ]
    )

    receipt_info.setStyle(
        TableStyle([

            ('TEXTCOLOR', (0, 0), (-1, -1),
             PURPLE),

            ('FONTNAME', (0, 0), (-1, -1),
             'Helvetica-Bold'),

            ('FONTSIZE', (0, 0), (-1, -1), 10),

            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),

            ('LEFTPADDING', (0, 0), (-1, -1), 0),

            ('RIGHTPADDING', (0, 0), (-1, -1), 0),

            ('TOPPADDING', (0, 0), (-1, -1), 2),

            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),

        ])
    )

    elements.append(receipt_info)

    elements.append(Spacer(1, 3))

    # ======================================
    # DONOR NAME
    # ======================================

    donor_name = safe(offering.donor_name)

    elements.append(
        Paragraph(
            f"Received with thanks from "
            f"<b>{donor_name}</b>",
            normal_style
        )
    )

    elements.append(Spacer(1, 2))

    # ======================================
    # AMOUNT IN WORDS
    # ======================================

    amount_words = (
        offering.amount_in_words
        or amount_to_words(offering.total_amount)
    )

    elements.append(
        Paragraph(
            f"A sum of <b>{safe(amount_words)}</b> "
            f"towards:",
            normal_style
        )
    )

    elements.append(Spacer(1, 4))

    # ======================================
    # DEFAULT OFFERING CATEGORIES
    # ======================================

    local_categories = [
        "Tithe",
        "Offering",
        "Building Fund",
        "Poor Fund",
    ]

    denomination_categories = [
        "North India",
        "Charity",
        "Bible School",
        "H.Q",
        "Zerubbabel Fund",
    ]

    local_amounts = {
        name: Decimal("0.00")
        for name in local_categories
    }

    denomination_amounts = {
        name: Decimal("0.00")
        for name in denomination_categories
    }

    # ======================================
    # GET ACTUAL OFFERING ITEMS
    # ======================================

    for item in offering.items.all():

        category_name = item.category.name

        purpose = (item.purpose or "").strip()

        label = category_name

        if purpose:

            if category_name.lower().startswith("other"):

                label = purpose

            else:

                label = f"{category_name} - {purpose}"

        if item.category.group == "local":

            local_amounts[label] = (

                local_amounts.get(
                    label,
                    Decimal("0.00")
                ) + item.amount

            )

        else:

            denomination_amounts[label] = (

                denomination_amounts.get(
                    label,
                    Decimal("0.00")
                ) + item.amount

            )

    local_rows = list(local_amounts.items())

    denomination_rows = list(
        denomination_amounts.items()
    )

    # ======================================
    # MINIMUM SEVEN ROWS ON EACH SIDE
    # ======================================

    row_count = max(
        7,
        len(local_rows),
        len(denomination_rows)
    )

    while len(local_rows) < row_count:

        local_rows.append(
            ("", Decimal("0.00"))
        )

    while len(denomination_rows) < row_count:

        denomination_rows.append(
            ("", Decimal("0.00"))
        )

    # ======================================
    # OFFERING TABLE
    # ======================================

    table_data = [
        [
            "For Local Church",
            "Rs.",
            "For Denomination",
            "Rs.",
        ]
    ]

    for index in range(row_count):

        local_name, local_amount = local_rows[index]

        denomination_name, denomination_amount = (
            denomination_rows[index]
        )

        local_number = index + 1

        denomination_number = (
            row_count + index + 1
        )

        local_label = (
            f"{local_number}. {local_name}"
        )

        denomination_label = (
            f"{denomination_number}. "
            f"{denomination_name}"
        )

        table_data.append([

            Paragraph(
                safe(local_label),
                table_text_style
            ),

            format_amount(local_amount)
            if local_amount > 0 else "",

            Paragraph(
                safe(denomination_label),
                table_text_style
            ),

            format_amount(denomination_amount)
            if denomination_amount > 0 else "",

        ])

    offering_table = Table(
        table_data,

        colWidths=[
            page_width * 0.32,
            page_width * 0.18,
            page_width * 0.32,
            page_width * 0.18,
        ],

        repeatRows=1,
    )

    offering_table.setStyle(
        TableStyle([

            ('GRID', (0, 0), (-1, -1),
             0.6, PURPLE),

            ('TEXTCOLOR', (0, 0), (-1, -1),
             PURPLE),

            ('BACKGROUND', (0, 0), (-1, 0),
             LIGHT_PURPLE),

            ('FONTNAME', (0, 0), (-1, 0),
             'Times-Bold'),

            ('FONTNAME', (0, 1), (-1, -1),
             'Times-Roman'),

            ('FONTSIZE', (0, 0), (-1, -1), 10),

            ('LEADING', (0, 0), (-1, -1), 11),

            ('ALIGN', (0, 0), (-1, 0),
             'CENTER'),

            ('ALIGN', (1, 1), (1, -1),
             'RIGHT'),

            ('ALIGN', (3, 1), (3, -1),
             'RIGHT'),

            ('VALIGN', (0, 0), (-1, -1),
             'MIDDLE'),

            ('TOPPADDING', (0, 0), (-1, -1), 1.5),

            ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5),

            ('LEFTPADDING', (0, 0), (-1, -1), 5),

            ('RIGHTPADDING', (0, 0), (-1, -1), 5),

        ])
    )

    elements.append(offering_table)

    elements.append(Spacer(1, 5))

    # ======================================
    # TOTAL AMOUNT
    # ======================================

    total_table = Table(
        [[
            "Total Rs.",
            format_amount(offering.total_amount),
        ]],

        colWidths=[80, 110],

        hAlign="LEFT",
    )

    total_table.setStyle(
        TableStyle([

            ('GRID', (0, 0), (-1, -1),
             0.7, PURPLE),

            ('FONTNAME', (0, 0), (-1, -1),
             'Helvetica-Bold'),

            ('TEXTCOLOR', (0, 0), (-1, -1),
             PURPLE),

            ('FONTSIZE', (0, 0), (-1, -1), 11),

            ('ALIGN', (1, 0), (1, 0),
             'RIGHT'),

            ('BACKGROUND', (0, 0), (0, 0),
             LIGHT_PURPLE),

            ('TOPPADDING', (0, 0), (-1, -1), 2),

            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),

        ])
    )

    elements.append(total_table)

    elements.append(Spacer(1, 3))

    # ======================================
    # PAYMENT METHOD
    # ======================================

    elements.append(
        Paragraph(
            "Payment Mode: "
            f"<b>{safe(offering.get_payment_method_display())}</b>",
            normal_style
        )
    )

    # ======================================
    # PASTOR / CASHIER SIGNATURE
    # ======================================

    elements.append(Spacer(1, 12))

    signature_table = Table(
        [

            [
                "",
                Paragraph(
                    "____________________________",
                    signature_style
                ),
            ],

            [
                "",
                Paragraph(
                    "Pastor / Cashier-in-charge",
                    signature_style
                ),
            ],

        ],

        colWidths=[
            page_width * 0.55,
            page_width * 0.45,
        ]
    )

    signature_table.setStyle(
        TableStyle([

            ('TEXTCOLOR', (0, 0), (-1, -1),
             PURPLE),

            ('FONTNAME', (0, 0), (-1, -1),
             'Times-Italic'),

            ('FONTSIZE', (0, 0), (-1, -1), 10),

            ('ALIGN', (1, 0), (1, -1),
             'CENTER'),

            ('VALIGN', (0, 0), (-1, -1),
             'MIDDLE'),

            ('TOPPADDING', (0, 0), (-1, -1), 0),

            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),

        ])
    )

    elements.append(signature_table)

    # ======================================
    # AUTOMATIC SINGLE PAGE FITTING
    # ======================================

    single_page_content = KeepInFrame(

        maxWidth=page_width,

        maxHeight=available_height,

        content=elements,

        mode="shrink",

        hAlign="CENTER",

        vAlign="TOP",

    )

    # ======================================
    # GENERATE SINGLE PAGE PDF
    # ======================================

    doc.build([
        single_page_content
    ])

    buffer.seek(0)

    return buffer