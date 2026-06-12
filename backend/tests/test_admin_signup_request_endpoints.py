import pytest
from fastapi import HTTPException

from models.external import SignupRequest
from models.internal import Company, SignUpRequest
from server.endpoints.admin.signup_requests.delete import f as delete_signup_request
from server.endpoints.admin.signup_requests.get import f as get_signup_requests
from server.endpoints.admin.signup_requests.request_id.approve.post import f as approve_signup_request
from server.endpoints.admin.signup_requests.request_id.patch import f as update_signup_request


def make_signup_request(**overrides):
    data = {
        "phone": "+79990000001",
        "firstname": "Иван",
        "lastname": "Петров",
        "company": "Request Company",
    }
    data.update(overrides)
    return SignupRequest(**data)


def create_stored_request(db_session, **overrides):
    company = Company(name=overrides.pop("company", "Stored Company"))
    db_session.add(company)
    db_session.flush()
    data = {
        "phone": "+79990000001",
        "firstname": "Иван",
        "lastname": "Петров",
        "company_id": company.id,
    }
    data.update(overrides)
    request = SignUpRequest(**data)
    db_session.add(request)
    db_session.commit()
    db_session.refresh(request)
    return request


def test_signup_requests_list_update_and_delete(db_session):
    stored = create_stored_request(db_session)

    listed = get_signup_requests(db_session)
    updated = update_signup_request(
        stored.id,
        make_signup_request(phone="+79990000002", company="Updated Company"),
        db_session,
    )
    delete_result = delete_signup_request(stored.id, db_session)

    assert listed[0].company == "Stored Company"
    assert updated.firstname == "Иван"
    assert updated.company == "Updated Company"
    assert delete_result == {"message": "Заявка отклонена"}
    assert db_session.get(SignUpRequest, stored.id) is None


def test_signup_request_update_validation_errors(db_session, user_factory):
    stored = create_stored_request(db_session)
    other = create_stored_request(
        db_session,
        phone="+79990000003",
        company="Other Company",
    )
    user_factory(phone="+79990000004")

    with pytest.raises(HTTPException) as missing:
        update_signup_request(999, make_signup_request(), db_session)
    with pytest.raises(HTTPException) as existing_phone:
        update_signup_request(
            stored.id,
            make_signup_request(phone="+79990000004"),
            db_session,
        )
    with pytest.raises(HTTPException) as request_phone:
        update_signup_request(
            stored.id,
            make_signup_request(phone=other.phone),
            db_session,
        )
    with pytest.raises(HTTPException) as delete_missing:
        delete_signup_request(999, db_session)

    assert missing.value.status_code == 404
    assert existing_phone.value.status_code == 409
    assert request_phone.value.status_code == 409
    assert delete_missing.value.status_code == 404


def test_approve_signup_request_validation_errors(db_session, user_factory):
    missing_id = 999
    phone_conflict = create_stored_request(
        db_session,
        phone="+79990000001",
        company="Phone Conflict Company",
    )
    user_factory(phone=phone_conflict.phone)

    with pytest.raises(HTTPException) as missing:
        approve_signup_request(missing_id, db_session)
    with pytest.raises(HTTPException) as existing_phone:
        approve_signup_request(phone_conflict.id, db_session)

    assert missing.value.status_code == 404
    assert existing_phone.value.status_code == 400
