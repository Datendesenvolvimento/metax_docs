/**
 * Sistema de envio de e-mails com templates
 * Mantém fidelidade ao layout e estrutura do script Python
 */

import nodemailer from 'nodemailer'
import { DocumentoRegistro, HistoricoMensal, EmailConfig, StatusLegenda } from '@/types/documentos'
import { calcularRelevanciaELegenda, getCorLegenda } from './regras-negocio'
import { gerarGraficoPNG } from './grafico-svg'
import fs from 'fs'
import path from 'path'

// Paleta de cores Meta.X (do script Python)
const COR_PRINCIPAL = "#001847"
const COR_FUNDO = "#F9FAFB"
const COR_TEXTO = "#111827"

/**
 * Cria transporter do Nodemailer com credenciais
 */
export function criarTransporter(config: EmailConfig) {
  return nodemailer.createTransport({
    host: config.smtp_server,
    port: config.smtp_port,
    secure: false, // usa STARTTLS
    auth: {
      user: config.smtp_user,
      pass: config.smtp_password
    }
  })
}

/**
 * Converte dataframe de documentos em tabela HTML
 * Replica: dataframe_to_html do Python
 */
function documentosParaHTML(documentos: DocumentoRegistro[]): string {
  if (!documentos || documentos.length === 0) {
    return "<p style='font-size:13px;color:#6b7280;'>Nenhum documento encontrado.</p>"
  }

  let html = "<table style='width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;'>"
  html += "<thead><tr style='background:#001847;color:white;'>"
  html += "<th style='padding:6px 8px;text-align:left;'>Documento</th>"
  html += "<th style='padding:6px 8px;text-align:left;'>Observação</th>"
  html += "<th style='padding:6px 8px;text-align:left;'>Regularização</th>"
  html += "<th style='padding:6px 8px;text-align:left;'>Status</th>"
  html += "</tr></thead><tbody>"

  for (const doc of documentos) {
    html += "<tr style='border-bottom:1px solid #E5E7EB;'>"
    html += `<td style='padding:6px 8px;'>${doc.DOCUMENTO || ''}</td>`
    
    const obs = doc.DOCUMENTO_APROV_OBS2 ? String(doc.DOCUMENTO_APROV_OBS2).substring(0, 200) : ''
    html += `<td style='padding:6px 8px;'>${obs}</td>`
    
    const reg = doc.DOCUMENTO_APROV_REGULARIZA2 ? String(doc.DOCUMENTO_APROV_REGULARIZA2).substring(0, 200) : ''
    html += `<td style='padding:6px 8px;'>${reg}</td>`
    
    html += `<td style='padding:6px 8px;'>${doc.STATUS_GERAL_Regra || ''}</td>`
    html += "</tr>"
  }

  html += "</tbody></table>"
  return html
}

/**
 * Gera tabela HTML com histórico das últimas 5 competências
 * Replica: gerar_tabela_historico do Python
 */
function gerarTabelaHistorico(
  historico: HistoricoMensal[],
  projeto: string
): string {
  if (!historico || historico.length === 0) {
    return ""
  }

  let linhasHtml = ""
  
  for (const row of historico) {
    const perc = Number(row.perc_atingido) || 0
    const totalPendencias = Number(row.total_pendencias) || 0
    const totalCriticos = row.total_criticos || 0

    // 🔹 REGRA: Se não tem pendências E não tem percentual, está fora da vigência
    const foraVigencia = perc === 0 && totalPendencias === 0

    let percFmt: string
    let legenda: StatusLegenda | 'Fora da Vigência'
    let cor: string

    if (foraVigencia) {
      // Empresa não estava na vigência nesta competência
      percFmt = '-'
      legenda = 'Fora da Vigência'
      cor = '#9CA3AF' // Cinza
    } else {
      // Cálculo normal
      percFmt = `${(perc * 100).toFixed(1)}%`

      // Simula um documento para reutilizar a função de legenda
      const docTemp: DocumentoRegistro = {
        STATUS_GERAL_Regra: perc >= 0.99 ? "Conforme" : "Não Conforme",
        CRITICO: String(totalCriticos),
        RELEVANCIA: perc,
        PROJETO: projeto,
        COMPETENCIA: row.COMPETENCIA,
        Competencia_Data: '',
        DOCUMENTO: '',
        PRESTADOR: '',
        CNPJ_PRESTADOR: '',
        CONTRATO: '',
        DOCUMENTO_APROV_OBS2: '',
        DOCUMENTO_APROV_REGULARIZA2: '',
        Chave_Composta: '',
        email_envio: ''
      }

      const resultado = calcularRelevanciaELegenda([docTemp], projeto)
      legenda = resultado.legenda
      cor = getCorLegenda(legenda)
    }

    linhasHtml += `
    <tr>
      <td style='padding:6px 8px;font-size:12px;'>${row.COMPETENCIA}</td>
      <td style='padding:6px 8px;font-size:12px;text-align:right;color:#374151;'>${percFmt}</td>
      <td style='padding:6px 8px;font-size:12px;color:${cor};font-weight:bold;${foraVigencia ? 'font-style:italic;' : ''}'>${legenda}</td>
    </tr>
    `
  }

  return `
  <table style='width:100%;margin-top:10px;border-collapse:collapse;
               font-family:Arial,sans-serif;background:white;border-radius:6px;'>
    <thead>
      <tr style='background:${COR_PRINCIPAL};color:white;font-size:12px;'>
        <th style='padding:6px 8px;text-align:left;'>Competência</th>
        <th style='padding:6px 8px;text-align:right;'>% Atingido</th>
        <th style='padding:6px 8px;text-align:left;'>Status</th>
      </tr>
    </thead>
    <tbody>${linhasHtml}</tbody>
  </table>
  `
}

/**
 * Monta o HTML completo do e-mail
 * Replica: montar_email do Python
 */
export async function montarEmailHTML(
  projeto: string,
  prestador: string,
  contrato: string,
  competencia: string,
  historico: HistoricoMensal[],
  documentos: DocumentoRegistro[],
  emails: string[],
  logoBase64: string,
  gerarGrafico: boolean = true
): Promise<string> {
  // 🔹 Gera o gráfico PNG de pendências (base64)
  const graficoPngBase64 = gerarGrafico ? await gerarGraficoPNG(historico) : null
  
  const tabelaHistHtml = gerarTabelaHistorico(historico, projeto)
  const tabelaDocsHtml = documentosParaHTML(documentos)
  
  const { percentual, legenda } = calcularRelevanciaELegenda(documentos, projeto)
  const percFmt = `${(percentual * 100).toFixed(1)}%`
  const corLegenda = getCorLegenda(legenda)

  // 🔹 Contagem de documentos por status
  const contagemPorStatus = documentos.reduce((acc, doc) => {
    const status = doc.STATUS_GERAL_Regra || 'Sem Status'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 🔹 Ordena por quantidade (decrescente)
  const statusOrdenados = Object.entries(contagemPorStatus)
    .sort(([, a], [, b]) => b - a)

  // 🔹 Gera HTML do resumo de status
  const resumoStatusHtml = statusOrdenados.map(([status, qtd]) => {
    // Define cor para cada status
    const coresStatus: Record<string, { bg: string; text: string; border: string }> = {
      'Conforme': { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
      'Não Conforme': { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
      'Em Análise': { bg: '#FEF3C7', text: '#92400E', border: '#FDE047' },
      'Não Enviado': { bg: '#E0E7FF', text: '#3730A3', border: '#A5B4FC' },
      'Pendente': { bg: '#FCE7F3', text: '#831843', border: '#F9A8D4' }
    }
    const cor = coresStatus[status] || { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' }

    return `
      <div style="flex:1;min-width:100px;background:${cor.bg};border:1px solid ${cor.border};border-radius:6px;padding:8px 12px;text-align:center;">
        <div style="font-size:20px;font-weight:bold;color:${cor.text};margin-bottom:2px;">${qtd}</div>
        <div style="font-size:10px;color:${cor.text};text-transform:uppercase;font-weight:600;">${status}</div>
      </div>
    `
  }).join('\n      ')
  
  const emailsListados = emails.map(e => `• ${e}`).join('<br>')
  const dataGeracao = new Date().toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return `
  <div style="font-family:Arial,sans-serif;color:${COR_TEXTO};background:${COR_FUNDO};padding:24px;">
    <div style="background:white;border-radius:12px;padding:28px;max-width:800px;margin:auto;">
      <!-- Cabeçalho -->
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div style="flex:1;min-width:260px;">
          <h2 style="color:${COR_PRINCIPAL};margin:0;">Relatório de Pendências de Documentos</h2>
          <p style="font-size:13px;color:#4b5563;margin-top:6px;line-height:1.4;">
            <b>Projeto:</b> ${projeto}<br>
            <b>Prestador:</b> ${prestador}<br>
            <b>Contrato:</b> ${contrato}<br>
            <b>Competência:</b> ${competencia}<br>
            <b>Gerado em:</b> ${dataGeracao}
          </p>
        </div>
        <div style="flex:0 0 auto;">
          <img src="data:image/png;base64,${logoBase64}" alt="Meta.X" style="height:50px;max-width:150px;display:block;">
        </div>
      </div>

      <hr style="margin:18px 0;border:0;border-top:1px solid #e5e7eb;">

      <!-- Gráfico (esquerda) + Card KPI (direita) -->
      <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;">
        <!-- Gráfico de Pendências e Resumo por Status -->
        <div style="flex:1;min-width:320px;">
          ${graficoPngBase64 
            ? `<div style="background:white;border-radius:8px;padding:10px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:12px;">
                <img src="data:image/png;base64,${graficoPngBase64}" alt="Gráfico de Pendências" style="width:100%;max-width:520px;display:block;border-radius:6px;">
              </div>` 
            : `<div style="background:#F9FAFB;border:2px dashed #D1D5DB;border-radius:8px;padding:40px 20px;text-align:center;margin-bottom:12px;">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" style="margin:0 auto 12px;">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <p style="color:#6B7280;font-size:14px;margin:0;font-weight:500;">Gráfico de Pendências</p>
                <p style="color:#9CA3AF;font-size:12px;margin:4px 0 0 0;">Histórico dos últimos 5 meses</p>
              </div>`
          }
          
          <!-- Resumo de Documentos por Status -->
          <div style="background:white;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size:11px;color:${COR_PRINCIPAL};font-weight:bold;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">
              📊 Documentos por Status
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${resumoStatusHtml}
            </div>
          </div>
        </div>

        <!-- Card KPI -->
        <div style="flex:0 0 220px;text-align:center;border:1px solid #E5E7EB;padding:14px 10px;border-radius:10px;background:#F9FAFB;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <div style="font-size:12px;color:#4B5563;">% Atingido</div>
          <div style="font-size:28px;color:${COR_PRINCIPAL};font-weight:900;">${percFmt}</div>
          <div style="font-size:11px;color:${corLegenda};font-weight:bold;margin-bottom:8px;">${legenda}</div>

          <!-- Mini-tabela de histórico -->
          <div style="margin-top:6px;border-top:1px solid #E5E7EB;padding-top:6px;">
            <div style="font-size:11px;color:${COR_PRINCIPAL};font-weight:bold;margin-bottom:4px;">
              Últimas Competências
            </div>
            <div style="font-size:10px;line-height:1.35;color:#111827;max-height:none;overflow:visible;">
              ${tabelaHistHtml}
            </div>
          </div>
        </div>
      </div>

      <!-- Tabela principal -->
      <h3 style="color:${COR_PRINCIPAL};margin-top:24px;">Lista de Documentos</h3>
      ${tabelaDocsHtml}

      <p style="margin-top:12px;font-size:12px;color:#6b7280;">
        * Listagem de situação atual
      </p>

      <hr style="margin:20px 0;border:0;border-top:1px solid #e5e7eb;">
      <p style="font-size:11px;color:#9ca3af;">
        Enviado automaticamente pela Meta.X<br>
        <b>Destinatários:</b><br>${emailsListados}
      </p>
    </div>
  </div>
  `
}

/**
 * Envia e-mail com HTML e anexo CSV opcional
 */
export async function enviarEmail(
  transporter: nodemailer.Transporter,
  para: string[],
  assunto: string,
  html: string,
  remetenteEmail?: string,
  csvBuffer?: Buffer,
  csvNome?: string
): Promise<void> {
  const mailOptions: nodemailer.SendMailOptions = {
    from: remetenteEmail || 'noreply@metax.com',
    to: para.join(', '),
    subject: assunto,
    html
  }

  if (csvBuffer && csvNome) {
    mailOptions.attachments = [{
      filename: csvNome,
      content: csvBuffer,
      contentType: 'text/csv'
    }]
  }

  await transporter.sendMail(mailOptions)
}

/**
 * Lê o logo e retorna em base64
 */
export function lerLogoBase64(caminhoLogo: string): string {
  const logoBuffer = fs.readFileSync(caminhoLogo)
  return logoBuffer.toString('base64')
}

