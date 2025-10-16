import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  criarClienteBigQuery, 
  consultarCompetencia, 
  consultarCards 
} from '@/lib/documentos/bigquery-client'
import { gerarUltimos5Meses } from '@/lib/documentos/regras-negocio'
import { montarEmailHTML, lerLogoBase64 } from '@/lib/documentos/email-sender'
import { HistoricoMensal } from '@/types/documentos'
import path from 'path'

/**
 * POST /api/documentos/preview
 * Gera uma prévia do HTML do e-mail sem enviar
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
    const { projeto, prestador, contrato, competencia } = body

    if (!projeto || !prestador || !contrato || !competencia) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Obtém credenciais do BigQuery do .env
    const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS
    
    if (!credentialsBase64) {
      return NextResponse.json(
        { error: 'Credenciais do BigQuery não configuradas' },
        { status: 500 }
      )
    }

    // Cria cliente BigQuery
    const bqClient = criarClienteBigQuery(credentialsBase64)

    // Faz as consultas em paralelo
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
      return NextResponse.json(
        { error: 'Nenhum documento encontrado para este contrato' },
        { status: 404 }
      )
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

    // Lê logo em base64
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png')
    const logoBase64 = lerLogoBase64(logoPath)

    // Emails de exemplo para a prévia
    const emailsPrevia = docsContrato[0]?.email_envio 
      ? docsContrato[0].email_envio.split(/[;,]/).map(e => e.trim()).filter(e => e)
      : ['exemplo@email.com']

    // Monta HTML do email (com gráfico SVG)
    const html = await montarEmailHTML(
      projeto,
      prestador,
      contrato,
      competencia,
      historicoMensal,
      docsContrato,
      emailsPrevia,
      logoBase64,
      true // Gera gráfico SVG (leve e compatível)
    )

    return NextResponse.json({
      success: true,
      html
    })
    
  } catch (error) {
    console.error('Erro ao gerar prévia:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao gerar prévia do e-mail',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

