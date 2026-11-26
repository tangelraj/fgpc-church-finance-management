from io import BytesIO
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


def generate_voucher_pdf(expense):

    buffer = BytesIO()

    purple = colors.HexColor("#863B86")

    light_purple = colors.HexColor("#F7EFF7")

    page_width, page_height = landscape(A5)

    # ======================================
    # SINGLE PAGE PDF SIZE
    # ======================================

    document = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A5),
        rightMargin=20,
        leftMargin=20,
        topMargin=8,
        bottomMargin=8,
        title=f"Payment Voucher {expense.voucher_number}",
        author="FGPC Yelahanka Church",
    )

    # Account for ReportLab frame padding

    width = document.width - 12

    available_height = document.height - 14

    elements = []

    # ======================================
    # TEXT STYLES
    # ======================================

    small_center = ParagraphStyle(
        name="SmallCenter",
        fontName="Helvetica",
        fontSize=7,
        leading=8,
        alignment=TA_CENTER,
        textColor=purple,
        spaceBefore=0,
        spaceAfter=0,
    )

    heading = ParagraphStyle(
        name="ChurchHeading",
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=18,
        alignment=TA_CENTER,
        textColor=purple,
        spaceBefore=0,
        spaceAfter=0,
    )

    subheading = ParagraphStyle(
        name="Subheading",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=11,
        alignment=TA_CENTER,
        textColor=purple,
        spaceBefore=0,
        spaceAfter=0,
    )

    voucher_heading = ParagraphStyle(
        name="VoucherHeading",
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=16,
        alignment=TA_CENTER,
        textColor=purple,
        spaceBefore=0,
        spaceAfter=0,
    )

    normal = ParagraphStyle(
        name="NormalText",
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        alignment=TA_LEFT,
        textColor=purple,
        spaceBefore=0,
        spaceAfter=0,
    )

    signature_style = ParagraphStyle(
        name="Signature",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        alignment=TA_CENTER,
        textColor=purple,
    )

    def safe(value):

        return escape(str(value or ""))

    # ======================================
    # CHURCH HEADER
    # ======================================

    elements.append(
        Paragraph(
            "<b>PRAISE THE LORD</b>",
            small_center
        )
    )

    elements.append(
        Paragraph(
            "FULL GOSPEL PENTECOSTAL CHURCH",
            heading
        )
    )

    elements.append(
        Paragraph(
            "NHO : KADAMALAIKUNTU",
            subheading
        )
    )

    elements.append(
        Paragraph(
            "(Reg. Society No.64/95 under Tamil Nadu "
            "Societies Registration act 27 of 75 "
            "&amp; under IT act of 1961.)",
            small_center
        )
    )

    elements.append(
        Paragraph(
            "<u>YELAHANKA</u>",
            subheading
        )
    )

    elements.append(
        Paragraph(
            "Thirumalappa Nagar, Attur 2nd Stage, "
            "Yelahanka, Bangalore - 560064",
            small_center
        )
    )

    elements.append(Spacer(1, 3))

    elements.append(
        Paragraph(
            "<u>PAYMENT VOUCHER</u>",
            voucher_heading
        )
    )

    elements.append(Spacer(1, 4))

    # ======================================
    # VOUCHER NUMBER AND DATE
    # ======================================

    voucher_info = Table(
        [[
            f"No. {expense.voucher_number}",

            f"Date: {expense.date.strftime('%d/%m/%Y')}"
        ]],
        colWidths=[
            width * 0.60,
            width * 0.40,
        ]
    )

    voucher_info.setStyle(
        TableStyle([

            ('TEXTCOLOR', (0, 0), (-1, -1), purple),

            ('FONTNAME', (0, 0), (-1, -1),
             'Helvetica-Bold'),

            ('FONTSIZE', (0, 0), (-1, -1), 9),

            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),

            ('LEFTPADDING', (0, 0), (-1, -1), 0),

            ('RIGHTPADDING', (0, 0), (-1, -1), 0),

            ('TOPPADDING', (0, 0), (-1, -1), 2),

            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),

        ])
    )

    elements.append(voucher_info)

    elements.append(Spacer(1, 3))

    # ======================================
    # RECEIVER DETAILS
    # ======================================

    elements.append(
        Paragraph(
            f"<b>Paid to:</b> {safe(expense.paid_to)}",
            normal
        )
    )

    if expense.phone_number:

        elements.append(
            Paragraph(
                f"<b>Phone:</b> "
                f"{safe(expense.phone_number)}",
                normal
            )
        )

    words = (
        expense.amount_in_words
        or amount_to_words(expense.total_amount)
    )

    elements.append(
        Paragraph(
            f"<b>Amount in words:</b> {safe(words)}",
            normal
        )
    )

    elements.append(Spacer(1, 4))

    # ======================================
    # EXPENSE PARTICULARS TABLE
    # ======================================

    rows = [
        [
            "No.",
            "Particulars",
            "Amount (Rs.)",
        ]
    ]

    items = list(
        expense.items.select_related(
            "category"
        ).all()
    )

    for index, item in enumerate(items, start=1):

        rows.append([

            str(index),

            Paragraph(
                safe(item.particulars),
                normal
            ),

            f"{item.amount:,.2f}",

        ])

    # Minimum five expense rows

    minimum_rows = 5

    if len(items) < minimum_rows:

        for index in range(
            len(items) + 1,
            minimum_rows + 1
        ):

            rows.append([
                str(index),
                "",
                "",
            ])

    # Total amount row

    rows.append([
        "",
        "Total Rs.",
        f"{expense.total_amount:,.2f}",
    ])

    particulars_table = Table(
        rows,
        colWidths=[
            width * 0.08,
            width * 0.67,
            width * 0.25,
        ],
        repeatRows=1,
    )

    particulars_table.setStyle(
        TableStyle([

            ('GRID', (0, 0), (-1, -1),
             0.6, purple),

            ('BACKGROUND', (0, 0), (-1, 0),
             light_purple),

            ('TEXTCOLOR', (0, 0), (-1, -1),
             purple),

            ('FONTNAME', (0, 0), (-1, 0),
             'Helvetica-Bold'),

            ('FONTNAME', (0, -1), (-1, -1),
             'Helvetica-Bold'),

            ('FONTSIZE', (0, 0), (-1, -1), 9),

            ('LEADING', (0, 0), (-1, -1), 11),

            ('ALIGN', (0, 0), (0, -1), 'CENTER'),

            ('ALIGN', (1, 0), (1, 0), 'CENTER'),

            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),

            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),

            ('TOPPADDING', (0, 0), (-1, -1), 2),

            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),

            ('LEFTPADDING', (0, 0), (-1, -1), 5),

            ('RIGHTPADDING', (0, 0), (-1, -1), 5),

            ('BACKGROUND', (0, -1), (-1, -1),
             light_purple),

        ])
    )

    elements.append(particulars_table)

    elements.append(Spacer(1, 4))

    # ======================================
    # PAYMENT DETAILS
    # ======================================

    elements.append(
        Paragraph(
            f"<b>Payment Mode:</b> "
            f"{safe(expense.get_payment_method_display())}"
            f" &nbsp;&nbsp;&nbsp; "
            f"<b>Fund:</b> "
            f"{safe(expense.get_fund_display())}",
            normal
        )
    )

    if expense.transaction_reference:

        elements.append(
            Paragraph(
                "<b>Transaction Reference:</b> "
                f"{safe(expense.transaction_reference)}",
                normal
            )
        )

    if expense.notes:

        elements.append(
            Paragraph(
                f"<b>Notes:</b> {safe(expense.notes)}",
                normal
            )
        )

    # ======================================
    # SIGNATURES
    # ======================================

    elements.append(Spacer(1, 18))

    signature_table = Table(

        [[
            Paragraph(
                "________________________",
                signature_style
            ),

            Paragraph(
                "________________________",
                signature_style
            ),

            Paragraph(
                "________________________",
                signature_style
            ),
        ],

        [
            Paragraph(
                "Receiver Signature",
                signature_style
            ),

            Paragraph(
                "Cashier-in-charge",
                signature_style
            ),

            Paragraph(
                "Pastor",
                signature_style
            ),
        ]],

        colWidths=[
            width / 3,
            width / 3,
            width / 3,
        ]

    )

    signature_table.setStyle(
        TableStyle([

            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),

            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),

            ('TOPPADDING', (0, 0), (-1, -1), 1),

            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),

        ])
    )

    elements.append(signature_table)

    # ======================================
    # AUTOMATIC SINGLE PAGE FITTING
    # ======================================

    single_page_content = KeepInFrame(

        maxWidth=width,

        maxHeight=available_height,

        content=elements,

        mode="shrink",

        hAlign="CENTER",

        vAlign="TOP",

    )

    # ======================================
    # GENERATE SINGLE PAGE PDF
    # ======================================

    single_page_content = KeepInFrame(
        maxWidth=document.width - 12,
        maxHeight=document.height - 14,
        content=elements,
        mode="shrink",
        hAlign="CENTER",
        vAlign="TOP",
    )
    document.build([
        single_page_content
    ])

    buffer.seek(0)

    return buffer