import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  criarClienteBigQuery, 
  consultarCompetencia, 
  consultarCards,
  consultarPendenciasHistoricas 
} from '@/lib/documentos/bigquery-client'
import { 
  gerarUltimos5Meses 
} from '@/lib/documentos/regras-negocio'
import { 
  criarTransporter,
  montarEmailHTML,
  enviarEmail,
  lerLogoBase64
} from '@/lib/documentos/email-sender'
import { EmailPayload, HistoricoMensal, EmailConfig } from '@/types/documentos'
import path from 'path'

/**
 * POST /api/documentos/enviar
 * Envia e-mails com relatórios de pendências de documentos
 */
export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se é admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado - Apenas administradores' }, 
        { status: 403 }
      )
    }

    // Valida o body da requisição
    const body = await request.json()
    const envios: EmailPayload[] = body.envios

    if (!Array.isArray(envios) || envios.length === 0) {
      return NextResponse.json(
        { error: 'Lista de envios é obrigatória' },
        { status: 400 }
      )
    }

    // Obtém credenciais do .env
    const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS
    const emailCredBase64 = process.env.EMAIL_CREDENCIAL
    
    if (!credentialsBase64 || !emailCredBase64) {
      return NextResponse.json(
        { error: 'Credenciais não configuradas no servidor' },
        { status: 500 }
      )
    }

    // Decodifica credenciais de email
    const emailCredJson = Buffer.from(emailCredBase64, 'base64').toString('utf-8')
    const emailConfig: EmailConfig = JSON.parse(emailCredJson)

    // Cria cliente BigQuery e transporter de email
    const bqClient = criarClienteBigQuery(credentialsBase64)
    const transporter = criarTransporter(emailConfig)

    // Lê logo em base64
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png')
    const logoBase64 = lerLogoBase64(logoPath)

    const resultados = []
    const erros = []

    // Processa cada envio
    for (const envio of envios) {
      try {
        const { projeto, prestador, contrato, competencia, emails } = envio

        // Valida emails
        if (!emails || emails.length === 0) {
          erros.push({
            prestador,
            contrato,
            erro: 'Nenhum email fornecido'
          })
          continue
        }

        // Consulta dados do BigQuery
        const [documentos, cards] = await Promise.all([
          consultarCompetencia(bqClient, competencia),
          consultarCards(bqClient, competencia)
        ])

        // Filtra documentos do contrato específico
        const docsContrato = documentos.filter(
          d => d.PROJETO === projeto &&
               d.PRESTADOR === prestador &&
               d.CONTRATO === contrato
        )

        if (docsContrato.length === 0) {
          erros.push({
            prestador,
            contrato,
            erro: 'Nenhum documento encontrado'
          })
          continue
        }

        // Prepara histórico dos últimos 5 meses
        const ultimos5 = gerarUltimos5Meses(competencia)
        const cardsContrato = cards.filter(
          c => c.PROJETO === projeto &&
               c.PRESTADOR === prestador &&
               c.CONTRATO === contrato
        )

        const historicoMensal: HistoricoMensal[] = ultimos5.map(comp => {
          const card = cardsContrato.find(c => c.COMPETENCIA.startsWith(comp))
          return {
            COMPETENCIA: comp,
            total_pendencias: card?.total_pendencias || 0,
            total_criticos: card?.total_criticos || 0,
            perc_atingido: card?.perc_atingido || 0,
            PROJETO: projeto,
            PRESTADOR: prestador,
            CONTRATO: contrato
          }
        })

        // Monta HTML do email (com gráfico SVG)
        const html = await montarEmailHTML(
          projeto,
          prestador,
          contrato,
          competencia,
          historicoMensal,
          docsContrato,
          emails,
          logoBase64,
          true // Gera gráfico SVG (leve, compatível e funciona perfeitamente em e-mails)
        )

        // Prepara CSV de pendências históricas (opcional)
        const pendenciasHist = await consultarPendenciasHistoricas(bqClient)
        const pendenciasContrato = pendenciasHist.filter(
          d => d.PROJETO === projeto &&
               d.PRESTADOR === prestador &&
               d.CONTRATO === contrato
        )

        let csvBuffer: Buffer | undefined
        let csvNome: string | undefined

        if (pendenciasContrato.length > 0) {
          // Converte para CSV
          const headers = [
            'PROJETO', 'COMPETENCIA', 'DOCUMENTO', 'PRESTADOR', 
            'CNPJ_PRESTADOR', 'CONTRATO', 'STATUS_GERAL_Regra', 
            'CRITICO', 'RELEVANCIA', 'DOCUMENTO_APROV_OBS2', 
            'DOCUMENTO_APROV_REGULARIZA2'
          ]
          
          let csv = headers.join(';') + '\n'
          
          for (const pend of pendenciasContrato) {
            const linha = [
              pend.PROJETO,
              pend.COMPETENCIA,
              pend.DOCUMENTO,
              pend.PRESTADOR,
              pend.CNPJ_PRESTADOR,
              pend.CONTRATO,
              pend.STATUS_GERAL_Regra,
              pend.CRITICO,
              pend.RELEVANCIA,
              pend.DOCUMENTO_APROV_OBS2,
              pend.DOCUMENTO_APROV_REGULARIZA2
            ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(';')
            
            csv += linha + '\n'
          }

          csvBuffer = Buffer.from('\ufeff' + csv, 'utf-8') // BOM para Excel
          csvNome = `pendencias_${prestador.replace(/[^a-zA-Z0-9]/g, '_')}_${contrato}.csv`
        }

        // Envia o email
        const assunto = `[Pendências Docs] ${prestador} | Contrato ${contrato} | ${competencia}`
        
        await enviarEmail(
          transporter,
          emails,
          assunto,
          html,
          emailConfig.smtp_from,
          csvBuffer,
          csvNome
        )

        resultados.push({
          prestador,
          contrato,
          emails,
          status: 'enviado'
        })

      } catch (erro) {
        console.error(`Erro ao enviar para ${envio.prestador}:`, erro)
        erros.push({
          prestador: envio.prestador,
          contrato: envio.contrato,
          erro: erro instanceof Error ? erro.message : String(erro)
        })
      }
    }

    return NextResponse.json({
      success: true,
      total_enviados: resultados.length,
      total_erros: erros.length,
      resultados,
      erros
    })
    
  } catch (error) {
    console.error('Erro ao enviar e-mails:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar envio de e-mails',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

