import { useState } from 'react';
import {
    Typography,
    Panel,
    Flex,
    Button,
    IconButton,
    Input,
} from '@maxhub/max-ui';
import { adminApi } from '../../api/admin';

interface ReportPanelProps {
    onBack: () => void;
}

export const ReportPanel = ({ onBack }: ReportPanelProps) => {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateReport = async () => {
        if (!dateFrom || !dateTo) {
            setError('Выберите обе даты');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const blob = await adminApi.downloadReport({
                date_from: dateFrom,
                date_to: dateTo,
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');

            a.href = url;
            a.download = `report_${dateFrom}_${dateTo}.xlsx`;
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка генерации отчёта');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Panel
                mode="primary"
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 12,
                    borderRadius: 16,
                    overflow: 'hidden',
                }}
            >
                {/* Заголовок с кнопкой назад */}
                <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
                    <IconButton mode="tertiary" onClick={onBack}>
                        <span style={{ fontSize: 20 }}>←</span>
                    </IconButton>
                    <Typography.Title variant="medium-strong">Создание отчёта</Typography.Title>
                    <div style={{ width: 48 }} />
                </Flex>

                {/* Содержимое */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <Typography.Title variant="small-strong">Временной промежуток</Typography.Title>
                        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setError('');
                                }}
                            />
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setError('');
                                }}
                            />
                        </Panel>
                    </div>

                    {error && <Typography.Body style={{ color: '#d32f2f' }}>{error}</Typography.Body>}

                    <Button
                        mode="primary"
                        stretched
                        onClick={handleGenerateReport}
                        loading={loading}
                    >
                        Создать
                    </Button>
                </div>
            </Panel>
        </div>
    );
};

export default ReportPanel;
