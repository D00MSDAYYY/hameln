import type { EventRegistrantResponse } from '../api/types';
import { SearchableItemsWidget } from './SearchableItemsWidget';

interface EventParticipantsWidgetProps {
  participants?: EventRegistrantResponse[] | null;
}

const getParticipantTitle = (participant: EventRegistrantResponse) => {
  const fullName = [participant.firstname, participant.lastname]
    .filter(Boolean)
    .join(' ');

  return fullName || 'Пользователь';
};

export const EventParticipantsWidget = ({
  participants,
}: EventParticipantsWidgetProps) => {
  return (
    <SearchableItemsWidget
      items={participants}
      buttonLabel="Список участников"
      title="Список участников"
      searchPlaceholder="Поиск по имени или фамилии"
      emptyText="Пока никто не зарегистрировался"
      getItemLabel={getParticipantTitle}
      getItemKey={(participant, index) =>
        `${participant.firstname ?? ''}-${participant.lastname ?? ''}-${index}`
      }
    />
  );
};
