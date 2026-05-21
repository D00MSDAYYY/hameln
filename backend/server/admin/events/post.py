from sqlmodel import select

from aux import event_to_response
from models.internal import Event, Role, Tag


def f(event_data, admin, session):
    event_dict = event_data.model_dump(exclude={"tags"})
    event = Event(**event_dict)
    session.add(event)
    session.flush()

    for tag_response in event_data.tags:  # type: ignore
        tag_name = tag_response.title
        tag = session.exec(select(Tag).where(Tag.title == tag_name)).first()

        if not tag:
            tag = Tag(title=tag_name)  # type: ignore
            session.add(tag)
            session.flush()

        event_tag = EventTagLink(event_id=event.id, tag_id=tag.id)  # type: ignore
        session.add(event_tag)

    session.commit()
    session.refresh(event)

    return event_to_response(event, Role.admin, session=session)
