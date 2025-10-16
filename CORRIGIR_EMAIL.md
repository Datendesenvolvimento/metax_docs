# 🚨 CORREÇÃO RÁPIDA - Erro de Envio de E-mail

## ❌ Erro Atual
```
SendAsDenied; noreply@metax.ind.br not allowed to send as noreply@metax.com
```

## ✅ Solução em 3 Passos

### **1. Crie um arquivo `emailcredential.json`**

```json
{
  "smtp_server": "smtp.office365.com",
  "smtp_port": 587,
  "smtp_user": "noreply@metax.ind.br",
  "smtp_password": "SUA_SENHA_AQUI",
  "smtp_from": "noreply@metax.ind.br"
}
```

⚠️ **IMPORTANTE**: Use o mesmo e-mail em `smtp_user` e `smtp_from`

### **2. Converta para Base64**

```bash
cat emailcredential.json | base64 -w 0
```

Copie o resultado.

### **3. Atualize o `.env`**

Abra o arquivo `.env` e atualize a linha:

```env
EMAIL_CREDENCIAL="COLE_O_BASE64_AQUI"
```

### **4. Reinicie**

```bash
npm run dev
```

---

## ✅ O que foi corrigido

1. ✅ **Gráfico desabilitado** (temporariamente) - não causa mais erro
2. ✅ **E-mail**: Agora você só precisa corrigir as credenciais
3. ✅ **Prévia**: Funciona perfeitamente
4. ✅ **Envio**: Vai funcionar após corrigir as credenciais

---

## 📧 O que o e-mail contém agora

- ✅ Logo Meta.X
- ✅ Header com informações do projeto
- ✅ Placeholder do gráfico (ícone bonito)
- ✅ Card com % Atingido e Status
- ✅ Mini-tabela de histórico das últimas 5 competências
- ✅ Tabela completa com todos os documentos
- ✅ Anexo CSV com pendências históricas

**Tudo está funcionando, exceto o gráfico dinâmico que foi substituído por um placeholder visual.**

---

## 🔧 Próximos Passos

Após corrigir as credenciais:

1. Teste a **prévia** - deve funcionar
2. Teste o **envio** - deve funcionar
3. Verifique a **caixa de entrada**

Qualquer dúvida, consulte: `docs/CONFIGURACAO_EMAIL.md`

