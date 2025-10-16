# ⚠️ Problema com Envio de E-mails - URGENTE

## 🔴 Erro Atual

```
SendAsDenied; noreply@metax.ind.br not allowed to send as noreply@metax.com
```

## 📋 Causa do Problema

O servidor SMTP está autenticado com `noreply@metax.ind.br`, mas o sistema está tentando enviar e-mails usando `noreply@metax.com` no campo "FROM".

## ✅ Solução

Você precisa **atualizar as credenciais de e-mail** no arquivo `.env` para que o `smtp_from` seja o MESMO e-mail usado no `smtp_user`.

### **Passo 1: Verifique suas credenciais atuais**

Suas credenciais de e-mail estão em formato base64 na variável `EMAIL_CREDENCIAL` do `.env`.

Para decodificar e ver o que tem lá:

```bash
echo "SUA_STRING_BASE64_AQUI" | base64 -d
```

### **Passo 2: Crie o JSON correto**

Crie um arquivo `emailcredential.json` com a seguinte estrutura:

```json
{
  "smtp_server": "smtp.office365.com",
  "smtp_port": 587,
  "smtp_user": "noreply@metax.ind.br",
  "smtp_password": "SUA_SENHA_AQUI",
  "smtp_from": "noreply@metax.ind.br"
}
```

**IMPORTANTE**: O `smtp_from` DEVE ser o mesmo que o `smtp_user`!

### **Passo 3: Converta para Base64**

```bash
cat emailcredential.json | base64 -w 0
```

### **Passo 4: Atualize o .env**

Atualize a variável `EMAIL_CREDENCIAL` no seu arquivo `.env` com o novo base64:

```env
EMAIL_CREDENCIAL="eyJzbXRwX3NlcnZlciI6InNtdHAub2ZmaWNlMzY1LmNvbSIsInNtdHBfcG9ydCI6NTg3LCJzbXRwX3VzZXIiOiJub3JlcGx5QG1ldGF4LmluZC5iciIsInNtdHBfcGFzc3dvcmQiOiJTVUFfU0VOSEFfIiwic210cF9mcm9tIjoibm9yZXBseUBtZXRheC5pbmQuYnIifQ=="
```

### **Passo 5: Reinicie o servidor**

```bash
# Pare o servidor
pkill -f "next dev"

# Inicie novamente
npm run dev
```

## 🔍 Verificação

Após seguir os passos acima, teste enviando um e-mail. O erro deve desaparecer.

## 📧 Configurações Comuns de SMTP

### **Office 365 / Outlook**
```json
{
  "smtp_server": "smtp.office365.com",
  "smtp_port": 587,
  "smtp_user": "seu-email@dominio.com",
  "smtp_password": "sua-senha",
  "smtp_from": "seu-email@dominio.com"
}
```

### **Gmail**
```json
{
  "smtp_server": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_user": "seu-email@gmail.com",
  "smtp_password": "sua-senha-de-app",
  "smtp_from": "seu-email@gmail.com"
}
```

**Nota Gmail**: Use uma "Senha de App" gerada nas configurações de segurança do Google.

### **Outros Provedores**
- **smtp_user** e **smtp_from** devem SEMPRE ser o mesmo e-mail
- Use STARTTLS na porta 587
- Certifique-se de que o e-mail tem permissão para enviar via SMTP

## ⚠️ Sobre o Gráfico

O gráfico foi temporariamente desabilitado devido a problemas de compatibilidade do módulo `canvas` com Next.js em ambiente de produção.

**Status atual do e-mail**:
- ✅ Logo Meta.X
- ✅ Cabeçalho com informações
- ⚠️ Placeholder do gráfico (temporário)
- ✅ Tabela de histórico das competências
- ✅ Card com % Atingido
- ✅ Lista completa de documentos
- ✅ Anexo CSV com pendências

O gráfico será reabilitado assim que encontrarmos uma solução compatível com Next.js.

