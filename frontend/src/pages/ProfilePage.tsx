import { Typography, Panel, CellList, CellSimple } from '@maxhub/max-ui';

interface ProfilePageProps {
  nickname: string;
  points: number;
}

const ProfilePage = ({ nickname, points }: ProfilePageProps) => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Panel
        mode="primary"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 20,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Верхняя часть с ником и баллами */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Typography.Body style={{ fontWeight: 500 }}>@{nickname}</Typography.Body>
          {/* Горчичный бейдж с очками */}
          <div style={{
            backgroundColor: '#e5b73b',
            color: '#000',
            padding: '4px 8px',
            borderRadius: '16px',
            fontWeight: 600,
            fontSize: '14px',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }}>
            🏆 {points}
          </div>
        </div>

        {/* Прокручиваемый список */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <CellList>
            <CellSimple title="Настройки" showChevron />
            <CellSimple title="Посещенные мероприятия" showChevron />
            <CellSimple title="О приложении" showChevron />
          </CellList>
        </div>
      </Panel>
    </div>
  );
};

export default ProfilePage;