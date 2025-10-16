#!/usr/bin/env python
# coding: utf-8

# In[15]:


# --- BLOCO 1: Conexão BigQuery ---

from google.cloud import bigquery
import os

# Caminho para o arquivo de credenciais do BigQuery
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/metax/Documentos/Credencial/datalake_metax.json"

# Criar cliente BigQuery
bq_client = bigquery.Client()

# Testar conexão
try:
    bq_client.query("SELECT 1").result()
    print("✅ Conexão BigQuery estabelecida com sucesso!")
except Exception as e:
    print(f"❌ Erro na conexão BigQuery: {e}")


# In[16]:


# ============================================================
# --- BLOCO 2 (atualizado): Consulta das pendências e cards ---
# ============================================================

import pandas as pd
from google.cloud import bigquery

# 🔹 Cliente BigQuery
bq_client = bigquery.Client()

# 🔹 Parâmetro da competência alvo
COMPETENCIA_ALVO = "2025-09"

# 🔹 Nome da tabela no BigQuery
TABELA = "datalake-metax.zz_Disparo_Docs.Cubo_Documentos"

# ------------------------------------------------------------
# 1️⃣ Consulta principal - registros da competência alvo
# ------------------------------------------------------------
SQL_COMPETENCIA = f"""
SELECT
  PROJETO,
  COMPETENCIA,
  Competencia_Data,
  DOCUMENTO,
  PRESTADOR,
  CNPJ_PRESTADOR,
  CONTRATO,
  STATUS_GERAL_Regra,
  CRITICO,
  RELEVANCIA,
  DOCUMENTO_APROV_OBS2,
  DOCUMENTO_APROV_REGULARIZA2,
  Chave_Composta,
  email_envio
FROM `{TABELA}`
WHERE COMPETENCIA = @competencia
"""

# ------------------------------------------------------------
# 2️⃣ Consulta de histórico - últimos 5 meses (corrigida)
# ------------------------------------------------------------
SQL_CARDS = f"""
WITH referencia AS (
  SELECT DISTINCT Competencia_Data AS data_ref
  FROM `{TABELA}`
  WHERE COMPETENCIA = @competencia
  LIMIT 1
),
ultimas_5 AS (
  SELECT DISTINCT t.COMPETENCIA, t.Competencia_Data
  FROM `{TABELA}` AS t
  CROSS JOIN referencia r
  WHERE t.Competencia_Data BETWEEN DATE_SUB(r.data_ref, INTERVAL 4 MONTH)
                              AND r.data_ref
),
base AS (
  SELECT
    PROJETO,
    PRESTADOR,
    CONTRATO,
    COMPETENCIA,

    -- 🔹 Soma total de relevância (com conversão segura)
    SUM(SAFE_CAST(RELEVANCIA AS FLOAT64)) AS relevancia_total,

    -- 🔹 Soma apenas das relevâncias consideradas “conformes”
    SUM(
      CASE
        WHEN (
          (PROJETO IN ('Reparação Bacia do Rio Doce','Samarco - COA')
           AND STATUS_GERAL_Regra IN ('Conforme','Em Análise'))
          OR (PROJETO NOT IN ('Reparação Bacia do Rio Doce','Samarco - COA')
              AND STATUS_GERAL_Regra = 'Conforme')
        )
        THEN SAFE_CAST(RELEVANCIA AS FLOAT64)
        ELSE 0
      END
    ) AS relevancia_conforme,

    -- 🔹 Contagem total de pendências e críticos
    COUNTIF(STATUS_GERAL_Regra = 'Não Conforme') AS total_pendencias,
    COUNTIF(STATUS_GERAL_Regra = 'Não Conforme' AND SAFE_CAST(CRITICO AS INT64) = 1) AS total_criticos

  FROM `{TABELA}`
  WHERE COMPETENCIA IN (SELECT COMPETENCIA FROM ultimas_5)
  GROUP BY PROJETO, PRESTADOR, CONTRATO, COMPETENCIA
)
SELECT
  PROJETO,
  PRESTADOR,
  CONTRATO,
  COMPETENCIA,
  total_pendencias,
  total_criticos,
  relevancia_conforme AS perc_atingido
FROM base
ORDER BY COMPETENCIA
"""

# ------------------------------------------------------------
# 2️⃣b Consulta complementar - histórico de pendências (todas as competências)
# ------------------------------------------------------------
SQL_PENDENCIAS_HIST = f"""
SELECT
  PROJETO,
  COMPETENCIA,
  Competencia_Data,
  DOCUMENTO,
  PRESTADOR,
  CNPJ_PRESTADOR,
  CONTRATO,
  STATUS_GERAL_Regra,
  CRITICO,
  RELEVANCIA,
  DOCUMENTO_APROV_OBS2,
  DOCUMENTO_APROV_REGULARIZA2,
  Chave_Composta,
  email_envio
FROM `{TABELA}`
WHERE STATUS_GERAL_Regra IN ('Não Conforme', 'Não Enviado')
"""


# ------------------------------------------------------------
# 3️⃣ Função auxiliar para executar consultas parametrizadas
# ------------------------------------------------------------
def query_bq(sql, params):
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(k, v["type"], v["value"])
            for k, v in params.items()
        ]
    )
    job = bq_client.query(sql, job_config=job_config)
    return job.result().to_dataframe()

# ------------------------------------------------------------
# 4️⃣ Executar consultas
# ------------------------------------------------------------
df_base = query_bq(SQL_COMPETENCIA, {"competencia": {"type": "STRING", "value": COMPETENCIA_ALVO}})
df_cards = query_bq(SQL_CARDS, {"competencia": {"type": "STRING", "value": COMPETENCIA_ALVO}})
df_pendencias_hist = bq_client.query(SQL_PENDENCIAS_HIST).result().to_dataframe()

# ------------------------------------------------------------
# 5️⃣ Exibir prévias para verificação
# ------------------------------------------------------------
print(f"📊 Registros encontrados para {COMPETENCIA_ALVO}: {len(df_base)}")
print(f"📈 Registros no histórico (últimos 5 meses): {len(df_cards)}\n")
print(f"📚 Pendências históricas carregadas: {len(df_pendencias_hist)} registros\n")

print("🔹 Prévia df_base (competência atual):")
print(df_base.head(10))
print("\n---\n")
print("🔹 Prévia df_cards (últimos 5 meses):")
print(df_cards.head(10))


# In[17]:


# ============================================================
# 🧠 BLOCO 1: IMPORTAÇÕES E CONFIGURAÇÕES INICIAIS
# ============================================================

import base64
import matplotlib.pyplot as plt
import io
import smtplib
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dateutil import tz
import pandas as pd
import numpy as np
from scipy.interpolate import make_interp_spline
import json
import re

# 🎨 Paleta Meta.X
COR_PRINCIPAL = "#001847"
COR_FUNDO = "#F9FAFB"
COR_TEXTO = "#111827"
COR_LINHA_SUAVE = "#93C5FD"
COR_LINHA_FORTE = "#1E3A8A"
TZ_BRA = tz.gettz("America/Sao_Paulo")

# Caminhos e credenciais
EMAIL_CRED_PATH = "/home/metax/Documentos/Credencial/emailcredential.json"
LOGO_PATH = "/home/metax/Documentos/Credencial/logo.png"

with open(EMAIL_CRED_PATH, "r") as f:
    cred = json.load(f)
SMTP_SERVER, SMTP_PORT = cred["smtp_server"], cred["smtp_port"]
SMTP_USER, SMTP_PASS = cred["smtp_user"], cred["smtp_password"]
SMTP_FROM = cred.get("smtp_from", SMTP_USER)

with open(LOGO_PATH, "rb") as f:
    LOGO_B64 = base64.b64encode(f.read()).decode("utf-8")


# ============================================================
# 📊 BLOCO 2: (MANTER O SEU BLOCO DE CONSULTAS NO BQ)
# ============================================================

COMPETENCIA_REF_STR = "2025-09"   # 'YYYY-MM'
COMPETENCIA_REF_DT  = pd.to_datetime(COMPETENCIA_REF_STR + "-01")

# ============================================================
# 🔧 BLOCO 2.1: Helpers de HISTÓRICO (preenche 5 meses com zero)
# ============================================================

def _lista_ultimos_5_meses(competencia_ref_str: str):
    end = pd.Period(competencia_ref_str, freq="M")
    return [str((end - i).strftime("%Y-%m")) for i in range(4, -1, -1)]

ULTIMOS_5 = _lista_ultimos_5_meses(COMPETENCIA_REF_STR)

def historico_5_meses(df_cards_bq, projeto, prestador, contrato):
    # base com as 5 competências alvo no formato YYYY-MM
    base = pd.DataFrame({"COMPETENCIA": ULTIMOS_5})

    # 🔹 pega do df_cards as colunas que precisamos
    sub = df_cards_bq[
        (df_cards_bq["PROJETO"] == projeto)
        & (df_cards_bq["PRESTADOR"] == prestador)
        & (df_cards_bq["CONTRATO"] == contrato)
    ][["COMPETENCIA", "total_pendencias", "total_criticos", "perc_atingido"]].copy()

    # normaliza competência
    sub["COMPETENCIA"] = sub["COMPETENCIA"].astype(str).str[:7]

    # como o SQL já entrega 1 linha por (projeto, prestador, contrato, competência),
    # este groupby é apenas por segurança (se houver duplicidade, somamos contagens e
    # pegamos o maior percentual atingido da competência)
    sub = sub.groupby("COMPETENCIA", as_index=False).agg({
        "total_pendencias": "sum",
        "total_criticos": "sum",
        "perc_atingido": "max"
    })

    # junta nas 5 competências (preenchendo faltas com zero)
    out = base.merge(sub, on="COMPETENCIA", how="left")
    out["total_pendencias"] = out["total_pendencias"].fillna(0).astype(int)
    out["total_criticos"]   = out["total_criticos"].fillna(0).astype(int)
    out["perc_atingido"]    = out["perc_atingido"].fillna(0.0).astype(float)

    # adiciona chaves para referência (não são usadas na tabela, mas pode ser útil)
    out["PROJETO"], out["PRESTADOR"], out["CONTRATO"] = projeto, prestador, contrato
    return out


# ============================================================
# 🎨 BLOCO 3: FUNÇÕES AUXILIARES (gráficos, HTML e regras)
# ============================================================

def gerar_grafico(df_cards_hist5):
    if df_cards_hist5.empty:
        return None
    sub = df_cards_hist5.sort_values("COMPETENCIA")
    x = np.arange(len(sub))
    y = sub["total_pendencias"].astype(float).values
    competencias = sub["COMPETENCIA"].astype(str).values
    plt.figure(figsize=(5.2, 2.2), dpi=160)
    ax = plt.gca()
    if len(x) >= 3 and len(np.unique(y)) > 1:
        x_smooth = np.linspace(x.min(), x.max(), 150)
        try:
            y_smooth = make_interp_spline(x, y, k=2)(x_smooth)
            plt.plot(x_smooth, y_smooth, color=COR_LINHA_FORTE, linewidth=1.8)
            plt.fill_between(x_smooth, y_smooth, color=COR_LINHA_SUAVE, alpha=0.2)
        except Exception:
            plt.plot(x, y, color=COR_LINHA_FORTE, linewidth=1.8)
    else:
        plt.plot(x, y, color=COR_LINHA_FORTE, linewidth=1.8)
    plt.scatter(x, y, color=COR_PRINCIPAL, s=26)
    for xi, yi in zip(x, y):
        plt.text(xi, yi + 0.1, f"{int(yi)}", ha="center", va="bottom", fontsize=7.5, color=COR_PRINCIPAL)
    plt.xticks(x, competencias, fontsize=8.5, color="#374151")
    plt.yticks([])
    for side in ["top", "right", "left"]:
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color("#D1D5DB")
    plt.grid(axis="y", linestyle="--", alpha=0.25)
    plt.title("Pendências nas últimas competências", fontsize=9.5, color=COR_PRINCIPAL)
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", transparent=True)
    plt.close()
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def calcular_relevancia_e_legenda(df_mes_atual, projeto):
    """
    Regras de negócio por projeto para % atingido e legenda.
    Entrada: df_mes_atual = registros da competência do envio.
    Campos usados: STATUS_GERAL_Regra, CRITICO, RELEVANCIA
    """
    if df_mes_atual.empty:
        return 0.0, "Sem dados"

    df = df_mes_atual.copy()
    df["RELEVANCIA"] = pd.to_numeric(df["RELEVANCIA"], errors="coerce").fillna(0.0)
    df["CRITICO"] = df["CRITICO"].astype(str)

    # 🔹 Regra do que conta como "conforme"
    if projeto in ["Reparação Bacia do Rio Doce", "Samarco - COA"]:
        cond_conforme = df["STATUS_GERAL_Regra"].isin(["Conforme", "Em Análise"])
    else:
        cond_conforme = df["STATUS_GERAL_Regra"].eq("Conforme")

    # 🔹 Soma direta das relevâncias conforme a regra (sem divisão)
    relevancia_conforme = df.loc[cond_conforme, "RELEVANCIA"].sum()

    # 🔹 O valor final já é o percentual (0–1)
    perc = float(relevancia_conforme)

    # 🔹 Conta de críticos
    critico = ((df["STATUS_GERAL_Regra"] == "Não Conforme") & (df["CRITICO"] == "1")).sum()

    # 🔹 Legenda (sem alteração)
    if projeto == "Vallourec":
        if perc <= 0.9:
            legenda = "Não Atende"
        elif critico >= 1:
            legenda = "Não Atende"
        elif perc > 0.99:
            legenda = "Atende"
        elif perc >= 0.9:
            legenda = "Atende Parcial"
        else:
            legenda = "Não Atende"

    elif projeto in ["MSFC FLORESTAL LTDA", "BRACELL BAHIA FLORESTAL", "BRACELL BAHIA SPECIALTY CELLULOSE"]:
        if perc < 0.5:
            legenda = "Crítico"
        elif critico >= 1:
            legenda = "Não Atende"
        elif perc >= 0.8:
            legenda = "Atende"
        elif 0.5 <= perc < 0.8:
            legenda = "Não Atende"
        else:
            legenda = "Crítico"

    elif projeto == "Projeto Sucuriú":
        if perc <= 0.7:
            legenda = "Crítico"
        elif critico >= 1:
            legenda = "Não Atende"
        elif perc >= 0.93:
            legenda = "Atende"
        elif 0.8 <= perc < 0.93:
            legenda = "Atende Parcial"
        elif 0.7 <= perc < 0.8:
            legenda = "Baixa Performance"
        else:
            legenda = "Não Atende"

    else:
        if perc >= 0.99:
            legenda = "Atende"
        elif perc <= 0.9:
            legenda = "Crítico"
        elif perc <= 0.96:
            legenda = "Não Atende"
        else:
            legenda = "Atende Parcial"

    return perc, legenda



# ============================================================
# 🆕 BLOCO 3.1: TABELA HISTÓRICO DAS ÚLTIMAS 5 COMPETÊNCIAS
# ============================================================

# ============================================================
# 🆕 BLOCO 3.1 (versão final): HISTÓRICO DAS ÚLTIMAS 5 COMPETÊNCIAS
# ============================================================

def gerar_tabela_historico(df_cards_hist5, projeto):
    if df_cards_hist5.empty:
        return ""
    
    linhas_html = ""
    for _, row in df_cards_hist5.iterrows():
        comp = row["COMPETENCIA"]
        
        # 🔹 Percentual atingido real (0–1 → 0–100)
        perc = float(row.get("perc_atingido", 0) or 0)
        perc_fmt = f"{perc*100:.1f}%"
        total_criticos = int(row.get("total_criticos", 0) or 0)
        
        # 🔹 Simula um df realista para reutilizar a função principal
        df_tmp = pd.DataFrame([{
            "STATUS_GERAL_Regra": "Conforme" if perc >= 0.99 else "Não Conforme",
            "CRITICO": str(total_criticos),
            "RELEVANCIA": perc
        }])
        
        _, legenda = calcular_relevancia_e_legenda(df_tmp, projeto)

        # 🔹 Cores conforme legenda
        cor = {
            "Atende": "#16A34A",
            "Atende Parcial": "#FACC15",
            "Não Atende": "#DC2626",
            "Crítico": "#7F1D1D",
            "Baixa Performance": "#F97316",
            "Sem dados": "#6B7280"
        }.get(legenda, "#6B7280")

        linhas_html += f"""
        <tr>
          <td style='padding:6px 8px;font-size:12px;'>{comp}</td>
          <td style='padding:6px 8px;font-size:12px;text-align:right;color:#374151;'>{perc_fmt}</td>
          <td style='padding:6px 8px;font-size:12px;color:{cor};font-weight:bold;'>{legenda}</td>
        </tr>
        """

    # 🔹 Monta o HTML completo da tabela
    return f"""
    <table style='width:100%;margin-top:10px;border-collapse:collapse;
                 font-family:Arial,sans-serif;background:white;border-radius:6px;'>
      <thead>
        <tr style='background:{COR_PRINCIPAL};color:white;font-size:12px;'>
          <th style='padding:6px 8px;text-align:left;'>Competência</th>
          <th style='padding:6px 8px;text-align:right;'>% Atingido</th>
          <th style='padding:6px 8px;text-align:left;'>Status</th>
        </tr>
      </thead>
      <tbody>{linhas_html}</tbody>
    </table>
    """

# ============================================================
# 🧩 FUNÇÃO AUXILIAR: CONVERTE DATAFRAME EM TABELA HTML
# ============================================================

def dataframe_to_html(df: pd.DataFrame) -> str:
    """
    Converte o df de documentos em uma tabela HTML formatada.
    - Mostra apenas colunas relevantes.
    - Adiciona estilos consistentes com o layout Meta.X.
    """
    if df.empty:
        return "<p style='font-size:13px;color:#6b7280;'>Nenhum documento encontrado.</p>"

    # 🔹 Seleciona e renomeia colunas principais (só as úteis)
    colunas = [
        "DOCUMENTO",
        "DOCUMENTO_APROV_OBS2",
        "DOCUMENTO_APROV_REGULARIZA2",
        "STATUS_GERAL_Regra"
    ]
    df_exibir = df[[c for c in colunas if c in df.columns]].copy()
    df_exibir.rename(columns={
        "DOCUMENTO": "Documento",
        "DOCUMENTO_APROV_OBS2": "Observação",
        "DOCUMENTO_APROV_REGULARIZA2": "Regularização",
        "STATUS_GERAL_Regra": "Status"
    }, inplace=True)

    # 🔹 Limita tamanho dos textos para evitar e-mails muito longos
    df_exibir["Observação"] = df_exibir["Observação"].astype(str).str.slice(0, 200)
    df_exibir["Regularização"] = df_exibir["Regularização"].astype(str).str.slice(0, 200)

    # 🔹 Monta a tabela HTML
    html = "<table style='width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;'>"
    html += "<thead><tr style='background:#001847;color:white;'>"
    for col in df_exibir.columns:
        html += f"<th style='padding:6px 8px;text-align:left;'>{col}</th>"
    html += "</tr></thead><tbody>"

    for _, row in df_exibir.iterrows():
        html += "<tr style='border-bottom:1px solid #E5E7EB;'>"
        for col in df_exibir.columns:
            valor = row[col] if pd.notna(row[col]) else ""
            html += f"<td style='padding:6px 8px;'>{valor}</td>"
        html += "</tr>"

    html += "</tbody></table>"
    return html

# ============================================================
# ✉️ BLOCO 4: CONSTRUÇÃO DO HTML DO E-MAIL
# ============================================================


def montar_email(projeto, prestador, contrato, competencia_dt, df_cards_hist5, df_mes_atual, emails):
    """
    Mantém o layout anterior (gráfico à esquerda e card à direita no desktop),
    com fallback natural para empilhar no mobile via flex-wrap.
    Imagens (logo e gráfico) seguem como CID inline para funcionar no Gmail.
    Retorna: html, grafico_bytes, logo_bytes
    """
    # --- gráfico como CID (Gmail/Outlook safe) ---
    grafico_bytes = None
    grafico_html = "<p style='color:#6b7280;font-size:12px;margin:0;'>Sem histórico recente.</p>"
    if df_cards_hist5 is not None and not df_cards_hist5.empty:
        # gera o mesmo gráfico leve que já está no projeto
        buf = io.BytesIO()
        sub = df_cards_hist5.sort_values("COMPETENCIA")
        x = np.arange(len(sub))
        y = sub["total_pendencias"].astype(float).values
        competencias = sub["COMPETENCIA"].astype(str).values

        plt.figure(figsize=(5.2, 2.2), dpi=160)
        ax = plt.gca()
        if len(x) >= 3 and len(np.unique(y)) > 1:
            x_smooth = np.linspace(x.min(), x.max(), 150)
            try:
                y_smooth = make_interp_spline(x, y, k=2)(x_smooth)
                plt.plot(x_smooth, y_smooth, color=COR_LINHA_FORTE, linewidth=1.8, zorder=2)
                plt.fill_between(x_smooth, y_smooth, color=COR_LINHA_SUAVE, alpha=0.2, zorder=1)
            except Exception:
                plt.plot(x, y, color=COR_LINHA_FORTE, linewidth=1.8, zorder=2)
        else:
            plt.plot(x, y, color=COR_LINHA_FORTE, linewidth=1.8, zorder=2)

        plt.scatter(x, y, color=COR_PRINCIPAL, s=26, zorder=3)
        y_min, y_max = y.min(), y.max()
        margem = max(0.5, (y_max - y_min) * 0.3)
        plt.ylim(y_min - 0.2, y_max + margem)
        for xi, yi in zip(x, y):
            plt.text(xi, yi + 0.1, f"{int(yi)}", ha="center", va="bottom",
                     fontsize=7.5, color=COR_PRINCIPAL, fontweight="medium")
        plt.xticks(x, competencias, fontsize=8.5, color="#374151")
        plt.yticks([])
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.spines["left"].set_visible(False)
        ax.spines["bottom"].set_color("#D1D5DB")
        plt.grid(axis="y", linestyle="--", alpha=0.25, linewidth=0.5)
        plt.title("Pendências nas últimas competências", fontsize=9.5, color=COR_PRINCIPAL, pad=8)
        plt.tight_layout()
        plt.savefig(buf, format="png", bbox_inches="tight", transparent=True)
        plt.close()
        grafico_bytes = buf.getvalue()
        # usa a imagem pelo CID
        grafico_html = "<img src='cid:grafico_pendencias' style='width:100%;max-width:100%;border-radius:8px;display:block;'>"

    # --- logo como CID ---
    with open(LOGO_PATH, "rb") as f:
        logo_bytes = f.read()

    # --- mini-tabela de histórico (já criada no seu código) ---
    tabela_hist_html = gerar_tabela_historico(df_cards_hist5, projeto)

    # --- tabela principal e KPI ---
    tabela_html = dataframe_to_html(df_mes_atual)
    perc, legenda = calcular_relevancia_e_legenda(df_mes_atual, projeto)
    perc_fmt = f"{perc*100:.1f}%"
    cor_legenda = {
        "Atende":"#16A34A","Atende Parcial":"#FACC15",
        "Não Atende":"#DC2626","Crítico":"#7F1D1D",
        "Baixa Performance":"#F97316","Sem dados":"#6B7280"
    }.get(legenda,"#6B7280")

    # --- info auxiliares ---
    emails_listados = "<br>".join([f"• {e}" for e in emails])
    data_geracao = datetime.now(TZ_BRA).strftime("%d/%m/%Y %H:%M")

    # --- HTML mantendo o layout anterior (flex) + responsivo básico ---
    html = f"""
    <div style="font-family:Arial,sans-serif;color:{COR_TEXTO};background:{COR_FUNDO};padding:24px;">
      <div style="background:white;border-radius:12px;padding:28px;max-width:800px;margin:auto;">
        <!-- Cabeçalho -->
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:260px;">
            <h2 style="color:{COR_PRINCIPAL};margin:0;">Relatório de Pendências de Documentos</h2>
            <p style="font-size:13px;color:#4b5563;margin-top:6px;line-height:1.4;">
              <b>Projeto:</b> {projeto}<br>
              <b>Prestador:</b> {prestador}<br>
              <b>Contrato:</b> {contrato}<br>
              <b>Competência:</b> {competencia_dt.strftime('%Y-%m')}<br>
              <b>Gerado em:</b> {data_geracao}
            </p>
          </div>
          <div style="flex:0 0 auto;">
            <img src="cid:logo_metax" alt="Meta.X" style="height:50px;max-width:150px;display:block;">
          </div>
        </div>

        <hr style="margin:18px 0;border:0;border-top:1px solid #e5e7eb;">

        <!-- Gráfico (esquerda) + Card (direita) -->
        <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;">
          <!-- Gráfico -->
          <div style="flex:1;min-width:320px;">
            {grafico_html}
          </div>

          <!-- Card KPI -->
          <div style="flex:0 0 220px;text-align:center;border:1px solid #E5E7EB;padding:14px 10px;border-radius:10px;background:#F9FAFB;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div style="font-size:12px;color:#4B5563;">% Atingido</div>
            <div style="font-size:28px;color:{COR_PRINCIPAL};font-weight:900;">{perc_fmt}</div>
            <div style="font-size:11px;color:{cor_legenda};font-weight:bold;margin-bottom:8px;">{legenda}</div>

            <!-- Mini-tabela de histórico ABAIXO do card -->
            <div style="margin-top:6px;border-top:1px solid #E5E7EB;padding-top:6px;">
              <div style="font-size:11px;color:{COR_PRINCIPAL};font-weight:bold;margin-bottom:4px;">
                Últimas Competências
              </div>
              <div style="font-size:10px;line-height:1.35;color:#111827;max-height:none;overflow:visible;">
                {tabela_hist_html}
              </div>
            </div>
          </div>
        </div>

        <!-- Tabela principal -->
        <h3 style="color:{COR_PRINCIPAL};margin-top:24px;">Lista de Documentos</h3>
        {tabela_html}

        <p style="margin-top:12px;font-size:12px;color:#6b7280;">
          * Listagem de situação atual
        </p>

        <hr style="margin:20px 0;border:0;border-top:1px solid #e5e7eb;">
        <p style="font-size:11px;color:#9ca3af;">
          Enviado automaticamente pela Meta.X<br>
          <b>Destinatários:</b><br>{emails_listados}
        </p>
      </div>
    </div>
    """

    # retorna também os bytes para anexar via CID no envio
    return html, grafico_bytes, logo_bytes

# ============================================================
# 🚀 BLOCO 5: LOOP DE ENVIO (gráfico + logo inline)
# ============================================================

def enviar_html(to_list, subject, html, grafico_bytes=None, logo_bytes=None, csv_buffer=None):
    msg = MIMEMultipart("related")
    msg["From"], msg["To"], msg["Subject"] = SMTP_FROM, ", ".join(to_list), subject

    msg_alt = MIMEMultipart("alternative")
    msg.attach(msg_alt)
    msg_alt.attach(MIMEText(html, "html", "utf-8"))

    # adiciona o gráfico inline
    if grafico_bytes:
        img = MIMEImage(grafico_bytes, "png")
        img.add_header("Content-ID", "<grafico_pendencias>")
        img.add_header("Content-Disposition", "inline", filename="grafico_pendencias.png")
        msg.attach(img)

    # adiciona o logo inline
    if logo_bytes:
        logo = MIMEImage(logo_bytes, "png")
        logo.add_header("Content-ID", "<logo_metax>")
        logo.add_header("Content-Disposition", "inline", filename="logo_metax.png")
        msg.attach(logo)

    # 🔹 adiciona o CSV de pendências como anexo (se existir)
    if csv_buffer:
        from email.mime.application import MIMEApplication

        # Garante extensão e nome limpo
        safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', subject)
        filename = f"pendencias_{safe_name}.csv"

        # Cria anexo CSV corretamente identificado
        part = MIMEApplication(csv_buffer.getvalue(), _subtype="csv")
        part.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(part)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as s:
        s.starttls()
        s.login(SMTP_USER, SMTP_PASS)
        s.send_message(msg)

# ============================================================
# 🔧 Normalização e envio
# ============================================================

df_base = df_base.copy()
df_base["COMPETENCIA"] = df_base["COMPETENCIA"].astype(str).str[:7]
df_envio = df_base[df_base["COMPETENCIA"] == COMPETENCIA_REF_STR].copy()
grupos = df_envio.groupby(["PROJETO","PRESTADOR","CONTRATO","COMPETENCIA","email_envio"])

print(f"📧 Enviando {len(grupos)} e-mails (competência {COMPETENCIA_REF_STR})...\n")

for (projeto, prestador, contrato, competencia_str, email_raw), grupo in grupos:
    if not email_raw or str(email_raw).strip() == "":
        print(f"⚠️ Sem e-mail para {prestador} - {contrato}")
        continue

    emails = [e.strip() for e in re.split(r"[;,]", str(email_raw)) if e.strip()]
    df_cards_hist5 = historico_5_meses(df_cards, projeto, prestador, contrato)
    df_mes_atual = grupo.copy()

    # 🔹 Filtra pendências históricas (todas as competências) para o mesmo projeto/prestador/contrato
    df_anexo = df_pendencias_hist[
        (df_pendencias_hist["PROJETO"] == projeto)
        & (df_pendencias_hist["PRESTADOR"] == prestador)
        & (df_pendencias_hist["CONTRATO"] == contrato)
    ].copy()

    # 🔹 Gera CSV em memória (ou None se vazio)
    if df_anexo.empty:
        csv_buffer = None
        print(f"📎 Nenhuma pendência histórica para {prestador} - {contrato}")
    else:
        from io import BytesIO
        csv_buffer = BytesIO()
        df_anexo.to_csv(csv_buffer, index=False, sep=";", encoding="utf-8-sig")
        csv_buffer.seek(0)
        print(f"📎 {len(df_anexo)} pendências anexadas → {prestador} | {contrato}")

    # 🔹 Monta HTML do e-mail
    html, grafico_bytes, logo_bytes = montar_email(
        projeto, prestador, contrato, pd.to_datetime(competencia_str + "-01"),
        df_cards_hist5, df_mes_atual, emails
    )

    # 🔹 Envia com anexo
    assunto = f"[Pendências Docs] {prestador} | Contrato {contrato} | {competencia_str}"
    try:
        enviar_html(emails, assunto, html, grafico_bytes, logo_bytes, csv_buffer)
        print(f"✅ Enviado → {prestador} | {contrato} | {competencia_str} → {', '.join(emails)}")
    except Exception as e:
        print(f"❌ Erro ao enviar para {prestador} - {contrato}: {e}")


print("\n🏁 Processo concluído.")


# In[ ]:




