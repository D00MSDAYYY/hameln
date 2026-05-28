import { useState } from 'react';
import { Panel, Typography, Flex, Button, Input, IconButton } from '@maxhub/max-ui';

interface RegisterPageProps {
  onBack: () => void;
  onSuccess: (user: any) => void;
}

export const SignUpPage = ({ onBack, onSuccess }: RegisterPageProps) => {
  const [email, setEmail] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [middlename, setMiddlename] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'Обязательное поле';
    if (!firstname.trim()) newErrors.firstname = 'Обязательное поле';
    if (!lastname.trim()) newErrors.lastname = 'Обязательное поле';
    if (!middlename.trim()) newErrors.middlename = 'Обязательное поле';
    if (!company.trim()) newErrors.company = 'Обязательное поле';
    return newErrors;
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
      const res = await fetch('/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstname, lastname, middlename, company }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Ошибка регистрации');
      }
      const user = await res.json();
      onSuccess(user);
    } catch (err: any) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getFieldStyle = (field: string) => ({
    borderColor: errors[field] ? '#d32f2f' : undefined,
  });

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
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              style={getFieldStyle('email')}
            />
            {errors.email && <Typography.Body style={{ color: '#d32f2f', fontSize: 12, marginTop: 4 }}>{errors.email}</Typography.Body>}
          </div>

          <div>
            <Input
              placeholder="Имя"
              value={firstname}
              onChange={(e) => {
                setFirstname(e.target.value);
                if (errors.firstname) setErrors((prev) => ({ ...prev, firstname: '' }));
              }}
              style={getFieldStyle('firstname')}
            />
            {errors.firstname && <Typography.Body style={{ color: '#d32f2f', fontSize: 12, marginTop: 4 }}>{errors.firstname}</Typography.Body>}
          </div>

          <div>
            <Input
              placeholder="Фамилия"
              value={lastname}
              onChange={(e) => {
                setLastname(e.target.value);
                if (errors.lastname) setErrors((prev) => ({ ...prev, lastname: '' }));
              }}
              style={getFieldStyle('lastname')}
            />
            {errors.lastname && <Typography.Body style={{ color: '#d32f2f', fontSize: 12, marginTop: 4 }}>{errors.lastname}</Typography.Body>}
          </div>

          <div>
            <Input
              placeholder="Отчество"
              value={middlename}
              onChange={(e) => {
                setMiddlename(e.target.value);
                if (errors.middlename) setErrors((prev) => ({ ...prev, middlename: '' }));
              }}
              style={getFieldStyle('middlename')}
            />
            {errors.middlename && <Typography.Body style={{ color: '#d32f2f', fontSize: 12, marginTop: 4 }}>{errors.middlename}</Typography.Body>}
          </div>

          <div>
            <Input
              placeholder="Компания"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                if (errors.company) setErrors((prev) => ({ ...prev, company: '' }));
              }}
              style={getFieldStyle('company')}
            />
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