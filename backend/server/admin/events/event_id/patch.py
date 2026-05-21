from sqlmodel import select
from fastapi import HTTPException

from models.internal import Event, EventTagLink, Tag, Role
from aux import event_to_response


def f(event_id, event_data, admin, session):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")

    update_dict = event_data.model_dump(exclude_unset=True, exclude={"tags"})

    for field, value in update_dict.items():
        if hasattr(event, field):
            setattr(event, field, value)

    if event_data.tags is not None:
        old_links = session.exec(
            select(EventTagLink).where(EventTagLink.event_id == event_id)
        ).all()
        for link in old_links:
            session.delete(link)

        for tag_response in event_data.tags:
            tag_name = tag_response.title
            tag = session.exec(select(Tag).where(Tag.title == tag_name)).first()

            if not tag:
                tag = Tag(title=tag_name)  # type: ignore
                session.add(tag)
                session.flush()

            event_tag = EventTagLink(event_id=event.id, tag_id=tag.id)  # type: ignore
            session.add(event_tag)

    session.add(event)
    session.commit()
    session.refresh(event)

    return event_to_response(event, Role.admin, session=session)
