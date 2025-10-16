# 🚀 Configuração do Vercel - Guia Completo

## ⚠️ Problema: "Não conecta no Supabase"

### Causa Provável:
O Vercel precisa de variáveis de ambiente configuradas no painel.

---

## ✅ Passo a Passo para Configurar

### **1. Acesse o Projeto no Vercel**
```
https://vercel.com/datendesenvolvimento/metax-docs
```

### **2. Vá em Settings → Environment Variables**

### **3. Adicione TODAS estas variáveis:**

#### **A. Banco de Dados (Supabase)**

**Nome**: `DATABASE_URL`  
**Valor**: 
```
postgresql://postgres.xxx:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&schema=metax
```

⚠️ **IMPORTANTE**: 
- Use o **Pooler URL** (com `pooler.supabase.com`)
- Adicione `?pgbouncer=true&schema=metax` no final
- NÃO use a URL direta do Supabase (causa timeout no Vercel)

**Environment**: `Production`, `Preview`, `Development`

---

#### **B. NextAuth**

**Nome**: `NEXTAUTH_URL`  
**Valor**: `https://seu-projeto.vercel.app`  
**Environment**: `Production`, `Preview`

**Nome**: `NEXTAUTH_SECRET`  
**Valor**: (gere um secret seguro)
```bash
# Execute localmente para gerar:
openssl rand -base64 32
```
**Environment**: `Production`, `Preview`, `Development`

---

#### **C. Google BigQuery**

**Nome**: `GOOGLE_APPLICATION_CREDENTIALS`  
**Valor**: (base64 do seu JSON)
```bash
# Como pegar:
cat datalake_metax.json | base64 -w 0
```
**Environment**: `Production`, `Preview`, `Development`

---

#### **D. Email (SMTP)**

**Nome**: `EMAIL_CREDENCIAL`  
**Valor**: (base64 do seu JSON)
```json
{
  "smtp_server": "smtp.office365.com",
  "smtp_port": 587,
  "smtp_user": "noreply@metax.ind.br",
  "smtp_password": "sua-senha",
  "smtp_from": "noreply@metax.ind.br"
}
```
```bash
# Converter para base64:
cat emailcredential.json | base64 -w 0
```
**Environment**: `Production`, `Preview`, `Development`

---

### **4. Como pegar a URL correta do Supabase**

#### **Opção 1: Via Dashboard Supabase**
1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO
2. Vá em: **Settings** → **Database**
3. Procure por: **Connection Pooling** (não Connection String)
4. Use o formato: **Connection pooler**
5. Modo: **Transaction**
6. Copie a URL

#### **Opção 2: Formato Correto**
```
postgresql://postgres.xxx:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&schema=metax
```

Substitua:
- `xxx` = ID do seu projeto
- `[PASSWORD]` = senha do banco
- `schema=metax` = schema que você usa

---

### **5. Após Configurar as Variáveis**

#### **No Vercel:**
1. Clique em **Deployments**
2. Nos 3 pontinhos do último deploy → **Redeploy**
3. Marque: ✅ **Use existing Build Cache**
4. Clique em **Redeploy**

#### **Ou faça novo commit:**
```bash
git add .
git commit -m "chore: ajuste de configuração"
git push
```

---

## 🔍 **Como Verificar se Funcionou**

### **1. Acesse os Logs do Vercel**
```
Deployments → [seu deploy] → Building → View Function Logs
```

### **2. Procure por:**
- ✅ "Prisma Client generated" - OK
- ✅ "Compiled successfully" - OK
- ❌ "ETIMEDOUT" ou "Connection refused" - Problema no DATABASE_URL
- ❌ "invalid connection string" - Formato errado

---

## ⚡ **Solução Rápida - Se Continuar Travando**

### **Opção 1: Cancele o Deploy Atual**
1. No Vercel → Deployments
2. Clique no deploy travado
3. **Cancel Deployment**

### **Opção 2: Force Redeploy**
```bash
# Faça um commit vazio
git commit --allow-empty -m "trigger: force redeploy"
git push
```

---

## 🎯 **Checklist de Variáveis no Vercel**

- [ ] DATABASE_URL (com pooler.supabase.com)
- [ ] NEXTAUTH_URL
- [ ] NEXTAUTH_SECRET
- [ ] GOOGLE_APPLICATION_CREDENTIALS
- [ ] EMAIL_CREDENCIAL

---

## 💡 **Dica Extra**

Se o build continuar travando, tente:

1. **Remova** temporariamente o `prisma migrate deploy` do build
2. **Faça o deploy**
3. **Execute as migrations** via Supabase Dashboard ou localmente

---

## 📞 **Precisa de Ajuda?**

Me mostre:
1. Os logs do Vercel (Deployments → View Function Logs)
2. A mensagem de erro específica
3. Se as variáveis de ambiente estão configuradas

