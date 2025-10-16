interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = [
    { regex: /.{8,}/, text: 'Mínimo de 8 caracteres' },
    { regex: /[A-Z]/, text: 'Uma letra maiúscula' },
    { regex: /[a-z]/, text: 'Uma letra minúscula' },
    { regex: /[0-9]/, text: 'Um número' },
    { regex: /[!@#$%^&*(),.?":{}|<>]/, text: 'Um caractere especial' }
  ];

  return (
    <div className="mt-2 space-y-2 text-sm">
      <p className="text-gray-500 font-medium">A senha deve conter:</p>
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center space-x-2 ${
              req.regex.test(password) ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            <span>{req.regex.test(password) ? '✓' : '○'}</span>
            <span>{req.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}