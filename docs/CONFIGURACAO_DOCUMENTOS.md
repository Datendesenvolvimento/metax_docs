# Configuração do Sistema de Pendências de Documentos

## Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis no seu arquivo `.env` ou `.env.local`:

### 1. Google BigQuery Credentials (Base64)

Converta o arquivo JSON de credenciais do BigQuery para base64:

```bash
cat datalake_metax.json | base64 -w 0
```

Adicione no `.env`:
```env
GOOGLE_APPLICATION_CREDENTIALS="eyJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsICJwcm9qZWN0X2lkIjogIi4uLiJ9"
```

### 2. Email Credentials (Base64)

⚠️ **IMPORTANTE**: O `smtp_from` DEVE ser o mesmo que o `smtp_user`!

Crie um arquivo JSON com as credenciais de email:

```json
{
  "smtp_server": "smtp.office365.com",
  "smtp_port": 587,
  "smtp_user": "noreply@metax.ind.br",
  "smtp_password": "sua-senha",
  "smtp_from": "noreply@metax.ind.br"
}
```

**Certifique-se de usar o MESMO e-mail em `smtp_user` e `smtp_from`!**

Converta para base64:
```bash
cat emailcredential.json | base64 -w 0
```

Adicione no `.env`:
```env
EMAIL_CREDENCIAL="eyJzbXRwX3NlcnZlciI6ICJzbXRwLm9mZmljZTM2NS4uLn0="
```

## Dependências Necessárias

Execute o comando abaixo para instalar as dependências:

```bash
npm install @google-cloud/bigquery nodemailer
npm install --save-dev @types/nodemailer
```

## Como Usar

1. **Acesse a página**: `/documentos`
2. **Selecione a competência**: Escolha o mês/ano no formato YYYY-MM
3. **Consulte os dados**: Clique em "Consultar" para buscar os contratos no BigQuery
4. **Selecione os contratos**: Marque os contratos que deseja enviar
5. **Envie os e-mails**: Clique em "Enviar Selecionados"

## Recursos

- ✅ Consulta dados do BigQuery mantendo todas as regras de negócio
- ✅ Cálculo de relevância por projeto (Vallourec, Bracell, Sucuriú, etc)
- ✅ Histórico dos últimos 5 meses
- ✅ Envio de e-mails com template HTML profissional
- ✅ Anexo CSV com histórico de pendências
- ✅ Interface moderna e responsiva
- ✅ Seleção múltipla de contratos
- ✅ Feedback visual de envio

## Estrutura de Arquivos

```
app/
  ├── documentos/
  │   └── page.tsx              # Interface principal
  └── api/
      └── documentos/
          ├── consultar/
          │   └── route.ts      # API para consultar BigQuery
          └── enviar/
              └── route.ts      # API para enviar e-mails

lib/
  └── documentos/
      ├── bigquery-client.ts    # Cliente BigQuery
      ├── email-sender.ts       # Sistema de envio de e-mails
      └── regras-negocio.ts     # Regras de cálculo de relevância

types/
  └── documentos.ts             # Tipos TypeScript
```

## Regras de Negócio Implementadas

### Cálculo de Relevância por Projeto

#### Vallourec
- **Atende**: perc > 99% e sem críticos
- **Atende Parcial**: perc >= 90% e perc <= 99% e sem críticos
- **Não Atende**: perc <= 90% ou críticos >= 1

#### MSFC/Bracell
- **Atende**: perc >= 80% e sem críticos
- **Não Atende**: perc >= 50% e perc < 80%, ou críticos >= 1
- **Crítico**: perc < 50%

#### Projeto Sucuriú
- **Atende**: perc >= 93% e sem críticos
- **Atende Parcial**: perc >= 80% e perc < 93% e sem críticos
- **Baixa Performance**: perc >= 70% e perc < 80% e sem críticos
- **Não Atende**: críticos >= 1
- **Crítico**: perc <= 70%

#### Outros Projetos (Padrão)
- **Atende**: perc >= 99%
- **Atende Parcial**: perc > 96% e perc < 99%
- **Não Atende**: perc > 90% e perc <= 96%
- **Crítico**: perc <= 90%

### Critérios de "Conforme"

- **Reparação Bacia do Rio Doce / Samarco - COA**: Status "Conforme" OU "Em Análise"
- **Outros projetos**: Apenas status "Conforme"

## Segurança

- ✅ Requer autenticação (NextAuth)
- ✅ Requer permissão de Admin
- ✅ Credenciais armazenadas em base64 no .env
- ✅ Validação de entrada em todas as rotas

