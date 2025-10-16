# Estrutura do Projeto

## Organização das Pastas

```
app/                      # Diretório principal do Next.js (App Router)
├── layout.tsx           # Layout principal
├── page.tsx             # Página inicial
│
components/              # Componentes reutilizáveis
├── ui/                  # Componentes de UI básicos
│   ├── buttons/
│   ├── forms/
│   └── cards/
├── layout/             # Componentes de layout
│   ├── header/
│   ├── footer/
│   └── sidebar/
└── shared/            # Componentes compartilhados
│
hooks/                 # Custom hooks
lib/                   # Funções utilitárias e configurações
services/             # Serviços externos e APIs
styles/               # Arquivos de estilo globais
types/                # Definições de tipos TypeScript
utils/                # Funções utilitárias
public/               # Arquivos estáticos
prisma/
├── schema.prisma      # Schema do banco de dados
├── migrations/        # Migrações do banco de dados
└── seed.ts           # Arquivo para seed do banco (opcional)
```

## Variáveis de Ambiente

O projeto utiliza diferentes arquivos de ambiente para cada contexto:

- `.env` - variáveis de desenvolvimento
- `.env.test` - variáveis do ambiente de teste
- `.env.production` - variáveis do ambiente de produção

## Começando

Para configurar o projeto em seu ambiente local, siga estes passos:

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
```

2. Entre na pasta do projeto
```bash
cd seu-repositorio
```

3. Instale todas as dependências
```bash
npm install
```

4. Copie o arquivo de exemplo de variáveis de ambiente
```bash
cp .env.example .env
```

5. Configure o Prisma
```bash
npx prisma generate
npx prisma migrate dev
```

6. Inicie o projeto em modo desenvolvimento
```bash
npm run dev
```