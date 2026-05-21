import { useState, useEffect } from 'react';
import { Typography, Panel, Switch, Input, IconButton, Flex, Button } from '@maxhub/max-ui';
import type { UserInfoResponse } from '../api/types';

interface SettingsPanelProps {
  onBack: () => void;
  user: UserInfoResponse;
}

export const SettingsPanel = ({ onBack, user }: SettingsPanelProps) => {
  // ---- активная вкладка ----
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');

  // ---- личные данные (из user) ----
  const [firstname, setFirstname] = useState(user.firstname ?? '');
  const [lastname, setLastname] = useState(user.lastname ?? '');
  const [middlename, setMiddlename] = useState(user.middlename ?? '');
  const [company, setCompany] = useState(user.company ?? '');

  // ---- технические настройки (из /user/settings) ----
  const [appTheme, setAppTheme] = useState('light');
  const [doNotify, setDoNotify] = useState(true);
  const [daysToNotify, setDaysToNotify] = useState('3');
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Загружаем настройки при монтировании
  useEffect(() => {
    fetch('/api/user/settings', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setAppTheme(data.app_theme ?? 'light');
        setDoNotify(data.do_notify ?? true);
        setDaysToNotify(String(data.days_to_notify ?? 3));
      })
      .catch(console.error)
      .finally(() => setSettingsLoading(false));
  }, []);
  const handleSave = async () => {
    const profileBody = {
      firstname,
      lastname,
      middlename: middlename || null,
      company: company || null,
    };
    const settingsBody = {
      app_theme: appTheme,
      do_notify: doNotify,
      days_to_notify: parseInt(daysToNotify, 10) || 3,
    };

    try {
      const [profileRes, settingsRes] = await Promise.all([
        fetch('api/user/profile', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileBody),
        }),
        fetch('/api/user/settings', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settingsBody),
        }),
      ]);

      if (!profileRes.ok) {
        const err = await profileRes.json();
        console.error('Ошибка сохранения профиля:', err.detail);
        return;
      }
      if (!settingsRes.ok) {
        const err = await settingsRes.json();
        console.error('Ошибка сохранения настроек:', err.detail);
        return;
      }

      // Обновляем профиль пользователя в родителе
      const updatedUser: UserInfoResponse = await profileRes.json();
      Object.assign(user, updatedUser);

      // Подхватываем обновлённые настройки с сервера (чтобы учесть валидацию)
      const updatedSettings = await settingsRes.json();
      setAppTheme(updatedSettings.app_theme);
      setDoNotify(updatedSettings.do_notify);
      setDaysToNotify(String(updatedSettings.days_to_notify));

      console.log('Все данные сохранены');
    } catch (err) {
      console.error(err);
    }
  };

  // Общий стиль для кнопок вкладок
  const tabButton = (tab: 'profile' | 'preferences', label: string) => (
    <Button
      mode={activeTab === tab ? 'primary' : 'tertiary'}
      onClick={() => setActiveTab(tab)}
      style={{ flex: 1, borderRadius: 12, fontWeight: 500 }}
    >
      {label}
    </Button>
  );

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
          <Typography.Title variant="medium-strong">Настройки</Typography.Title>
          <div style={{ width: 48 }} />
        </Flex>

        {/* Вкладки */}
        <Flex gap={8} style={{ marginBottom: 16 }}>
          {tabButton('profile', 'Профиль')}
          {tabButton('preferences', 'Приложение')}
        </Flex>

        {/* Содержимое вкладок */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {activeTab === 'profile' ? (
            <>
              <div>
                <Typography.Title variant="small-strong">Личные данные</Typography.Title>
                <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Input
                    placeholder="Имя"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                  />
                  <Input
                    placeholder="Фамилия"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                  />
                  <Input
                    placeholder="Отчество (необязательно)"
                    value={middlename}
                    onChange={(e) => setMiddlename(e.target.value)}
                  />
                </Panel>
              </div>

              <div>
                <Typography.Title variant="small-strong">Компания</Typography.Title>
                <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
                  <Input
                    placeholder="Введите название компании"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </Panel>
              </div>
            </>
          ) : settingsLoading ? (
            <Typography.Body>Загрузка настроек...</Typography.Body>
          ) : (
            <>
              <div>
                <Typography.Title variant="small-strong">Оформление</Typography.Title>
                <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
                  <Flex justify="space-between" align="center">
                    <Typography.Body>Тема приложения</Typography.Body>
                    <Flex gap={8}>
                      <Button
                        mode={appTheme === 'light' ? 'primary' : 'tertiary'}
                        onClick={() => setAppTheme('light')}
                        size="small"
                        style={{ borderRadius: 10 }}
                      >
                        Светлая
                      </Button>
                      <Button
                        mode={appTheme === 'dark' ? 'primary' : 'tertiary'}
                        onClick={() => setAppTheme('dark')}
                        size="small"
                        style={{ borderRadius: 10 }}
                      >
                        Тёмная
                      </Button>
                    </Flex>
                  </Flex>
                </Panel>
              </div>
              <div>
                <Typography.Title variant="small-strong">Уведомления</Typography.Title>
                <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Flex justify="space-between" align="center">
                    <Typography.Body>Присылать уведомления</Typography.Body>
                    <Switch
                      checked={doNotify}
                      onChange={(e) => setDoNotify(e.target.checked)}
                    />
                  </Flex>
                  {doNotify && (
                    <Flex justify="space-between" align="center">
                      <Typography.Body>За сколько дней напоминать</Typography.Body>
                      <Input
                        type="number"
                        value={daysToNotify}
                        onChange={(e) => setDaysToNotify(e.target.value)}
                        style={{ width: 80 }}
                        min={1}
                        max={30}
                      />
                    </Flex>
                  )}
                </Panel>
              </div>
            </>
          )}
        </div>

        {/* Кнопка сохранения */}
        <div style={{ marginTop: 16 }}>
          <Button mode="primary" stretched onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      </Panel>
    </div>
  );
};