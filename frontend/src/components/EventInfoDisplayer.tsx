import { Panel, Typography, Button } from '@maxhub/max-ui';

interface EventInfoDisplayerProps {
  eventName: string;
  onBack: () => void;
}

export const EventInfoDisplayer = ({ eventName, onBack }: EventInfoDisplayerProps) => {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
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
        <Typography.Title variant="large-strong" style={{ marginBottom: 16 }}>
          {eventName}
        </Typography.Title>
        <Typography.Body>
          Здесь будет подробная информация о событии.
        </Typography.Body>
        <Button 
          mode="primary" 
          onClick={onBack}
          style={{ marginTop: 'auto' }}
        >
          Назад к списку
        </Button>
      </Panel>
    </div>
  );
};