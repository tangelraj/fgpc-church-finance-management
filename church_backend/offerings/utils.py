from decimal import Decimal, ROUND_HALF_UP
from num2words import num2words


def amount_to_words(amount):

    amount = Decimal(str(amount)).quantize(
        Decimal('0.01'),
        rounding=ROUND_HALF_UP
    )

    if amount < 0:
        raise ValueError(
            "Amount cannot be negative."
        )

    rupees = int(amount)

    paise = int(
        (amount - Decimal(rupees)) * 100
    )

    rupees_words = num2words(
        rupees,
        lang='en_IN'
    ).replace('-', ' ').replace(',', '')

    result = f"Rupees {rupees_words.title()}"

    if paise > 0:

        paise_words = num2words(
            paise,
            lang='en_IN'
        ).replace('-', ' ').replace(',', '')

        result += (
            f" and {paise_words.title()} Paise"
        )

    return result + " Only"