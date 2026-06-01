from typing import Annotated

from pydantic import AfterValidator


def validate_person_name(value: str):
    value = value.strip()

    if not value:
        raise ValueError("Поле обязательно")

    if not all(char.isalpha() or char == "-" for char in value):
        raise ValueError("Можно использовать только буквы и дефис")

    return value


PersonName = Annotated[str, AfterValidator(validate_person_name)]


def normalize_russian_phone(value):
    if value is None:
        return None

    if not isinstance(value, str):
        return value

    digits = "".join(char for char in value if char.isdigit())
    if len(digits) == 11 and digits[0] in {"7", "8"}:
        digits = digits[1:]

    if len(digits) != 10:
        raise ValueError("Телефон должен содержать 10 цифр после +7")

    return f"+7{digits}"
