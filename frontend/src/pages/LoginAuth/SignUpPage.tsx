import { useState } from 'react';
import { Panel, Typography, Flex, Button, Input, IconButton } from '@maxhub/max-ui';
import { authApi } from '../../api/auth';
import type { SignupRequest } from '../../api/types';
import { buildRussianPhone, isCompletePhoneTail, PhoneInput } from '../../components/PhoneInput';
import { isValidPersonName } from '../../utils/personName';

interface RegisterPageProps {
  onBack: () => void;
  onSubmitted: () => void;
}

type FieldErrors = Partial<Record<keyof SignupRequest | 'form', string>>;

const requiredMessage = 'Обязательное поле';

export const SignUpPage = ({ onBack, onSubmitted }: RegisterPageProps) => {
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = () => {
    const newErrors: FieldErrors = {};

    if (!nickname.trim()) newErrors.nickname = requiredMessage;
    if (!isCompletePhoneTail(phone)) newErrors.phone = 'Введите 10 цифр номера';
    if (!isValidPersonName(firstname)) newErrors.firstname = 'Только буквы и дефис';
    if (!isValidPersonName(lastname)) newErrors.lastname = 'Только буквы и дефис';
    if (!company.trim()) newErrors.company = requiredMessage;

    return newErrors;
  };

  const buildPayload = (): SignupRequest => {
    const payload: SignupRequest = {
      nickname: nickname.trim(),
      phone: buildRussianPhone(phone),
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      company: company.trim(),
    };

    return payload;
  };

  const handleRegister = async () => {
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await authApi.createSignupRequest(buildPayload());
      setSubmittedMessage(
        result.message || 'Заявка отправлена. После одобрения администратором вы сможете войти по телефону и паролю.',
      );
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Ошибка регистрации' });
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: keyof SignupRequest) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const getFieldStyle = (field: keyof SignupRequest) => ({
    borderColor: errors[field] ? '#d32f2f' : undefined,
  });

  if (submittedMessage) {
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
          <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
            <IconButton mode="tertiary" onClick={onBack}>
              <span style={{ fontSize: 20 }}>←</span>
            </IconButton>
            <Typography.Title variant="medium-strong">Заявка отправлена</Typography.Title>
            <div style={{ width: 48 }} />
          </Flex>

          <Typography.Body style={{ marginBottom: 16 }}>
            {submittedMessage}
          </Typography.Body>

          <Button
            mode="primary"
            stretched
            onClick={onSubmitted}
            style={{ fontWeight: 600, marginTop: 8 }}
          >
            Перейти ко входу
          </Button>
        </Panel>
      </div>
    );
  }

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
        <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
          <IconButton mode="tertiary" onClick={onBack}>
            <span style={{ fontSize: 20 }}>←</span>
          </IconButton>
          <Typography.Title variant="medium-strong">Регистрация</Typography.Title>
          <div style={{ width: 48 }} />
        </Flex>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Typography.Title variant="small-strong">Ник</Typography.Title>
            <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
              <Input
                placeholder="Введите ник"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  clearError('nickname');
                  if (errors.form) setErrors((prev) => ({ ...prev, form: '' }));
                }}
                style={getFieldStyle('nickname')}
              />
            </Panel>
            {errors.nickname && <Typography.Body style={{ color: '#d32f2f', fontSize: 12, marginTop: 4 }}>{errors.nickname}</Typography.Body>}
          </div>

          <div>
            <Typography.Title variant="small-strong">Телефон</Typography.Title>
            <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
              <PhoneInput
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  clearError('phone');
                  if (errors.form) setErrors((prev) => ({ ...prev, form: '' }));
                }}
                style={getFieldStyle('phone')}
              />
            </Panel>
            {errors.phone && <Typography.Body style={{ color: '#d32f2f', fontSize: 12, marginTop: 4 }}>{errors.phone}</Typography.Body>}
          </div>

          <Typography.Body style={{ color: '#6b7280', fontSize: 12, marginTop: -8 }}>
            Номер будет использоваться как логин.
          </Typography.Body>

          <div>
            <Typography.Title variant="small-strong">Имя</Typography.Title>
            <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
              <Input
                placeholder="Введите имя"
                value={firstname}
                onChange={(e) => {
                  setFirstname(e.target.value);
                  clearError('firstname');
                }}
                style={getFieldStyle('firstname')}
              />
            </Panel>
            {errors.firstname && <Typography.Body style={{ color: '#d32f2f', fontSize: 12, marginTop: 4 }}>{errors.firstname}</Typography.Body>}
          </div>

          <div>
            <Typography.Title variant="small-strong">Фамилия</Typography.Title>
            <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
              <Input
                placeholder="Введите фамилию"
                value={lastname}
                onChange={(e) => {
                  setLastname(e.target.value);
                  clearError('lastname');
                }}
                style={getFieldStyle('lastname')}
              />
            </Panel>
            {errors.lastname && <Typography.Body style={{ color: '#d32f2f', fontSize: 12, marginTop: 4 }}>{errors.lastname}</Typography.Body>}
          </div>

          <div>
            <Typography.Title variant="small-strong">Компания</Typography.Title>
            <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
              <Input
                placeholder="Введите компанию"
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  clearError('company');
                }}
                style={getFieldStyle('company')}
              />
            </Panel>
            {errors.company && <Typography.Body style={{ color: '#d32f2f', fontSize: 12, marginTop: 4 }}>{errors.company}</Typography.Body>}
          </div>

          {errors.form && <Typography.Body style={{ color: '#d32f2f' }}>{errors.form}</Typography.Body>}

          <Button
            mode="primary"
            stretched
            onClick={handleRegister}
            loading={loading}
            style={{ fontWeight: 600, marginTop: 8 }}
          >
            Зарегистрироваться
          </Button>
        </div>
      </Panel>
    </div>
  );
};
