import { useState, useEffect } from 'react';
import {
  Typography,
  Panel,
  Flex,
  Button,
  Input,
} from '@maxhub/max-ui';
import type { UserInfoResponse } from '../../api/types';
import {
  buildRussianPhone,
  getPhoneTail,
  isCompletePhoneTail,
  PhoneInput,
} from '../PhoneInput';
import { isValidPersonName } from '../../utils/personName';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Админ' },
  { value: 'user', label: 'Пользователь' },
  { value: 'observer', label: 'Наблюдатель' },
] as const;

interface UserFormPanelProps {
  initial?: UserInfoResponse;
  onSave: (body: Record<string, any>) => void | Promise<void>;
  onCancel: () => void;
}

const UserFormPanel = ({ initial, onSave, onCancel }: UserFormPanelProps) => {
  const [nickname, setNickname] = useState(initial?.nickname || '');
  const [firstname, setFirstname] = useState(initial?.firstname || '');
  const [lastname, setLastname] = useState(initial?.lastname || '');
  const [company, setCompany] = useState(initial?.company || '');
  const [phone, setPhone] = useState(getPhoneTail(initial?.phone));
  const [password, setPassword] = useState(initial?.password || '');
  const [role, setRole] = useState(initial?.role || 'user');
  const [points, setPoints] = useState(String(initial?.points ?? 0));

  useEffect(() => {
    setNickname(initial?.nickname || '');
    setFirstname(initial?.firstname || '');
    setLastname(initial?.lastname || '');
    setCompany(initial?.company || '');
    setPhone(getPhoneTail(initial?.phone));
    setPassword(initial?.password || '');
    setRole(initial?.role || 'user');
    setPoints(String(initial?.points ?? 0));
  }, [initial]);

  const handleSubmit = () => {
    if (
      !nickname.trim()
      || !isValidPersonName(firstname)
      || !isValidPersonName(lastname)
      || !isCompletePhoneTail(phone)
    ) {
      return;
    }

    const body: Record<string, any> = {
      nickname: nickname.trim(),
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      company: company.trim() || null,
      phone: buildRussianPhone(phone),
      role,
      points: parseInt(points, 10) || 0,
    };

    if (!initial || password.trim()) {
      body.password = password.trim();
    }

    onSave(body);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Typography.Title variant="small-strong">Никнейм</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input
            placeholder="Введите никнейм"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Имя</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input
            placeholder="Введите имя"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
          />
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Фамилия</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input
            placeholder="Введите фамилию"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
          />
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Компания</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input
            placeholder="Введите компанию"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </Panel>
      </div>

      <div>
          <Typography.Title variant="small-strong">Телефон</Typography.Title>
          <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <PhoneInput
            value={phone}
            onChange={setPhone}
          />
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Пароль</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input
            type="password"
            placeholder={initial ? 'Оставьте пустым, чтобы не менять' : 'Введите пароль'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Роль</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Flex gap={8}>
            {ROLE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                mode={role === opt.value ? 'primary' : 'tertiary'}
                size="small"
                onClick={() => setRole(opt.value)}
                style={{ flex: 1 }}
              >
                {opt.label}
              </Button>
            ))}
          </Flex>
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Баллы</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input
            type="number"
            placeholder="0"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
        </Panel>
      </div>

      <Flex gap={12} style={{ marginTop: 20 }}>
        <Button mode="primary" stretched onClick={handleSubmit}>
          Сохранить
        </Button>
      </Flex>
    </div>
  );
};

export default UserFormPanel;
