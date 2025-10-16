import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  criarClienteBigQuery, 
  consultarCompetencia, 
  consultarCards 
} from '@/lib/documentos/bigquery-client'
import { gerarUltimos5Meses, calcularRelevanciaELegenda } from '@/lib/documentos/regras-negocio'
import { ContratoParaEnvio, DocumentoRegistro, CardHistorico } from '@/types/documentos'

/**
 * POST /api/documentos/consultar
 * Consulta dados do BigQuery para uma competência específica
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
    const { competencia } = body

    if (!competencia || typeof competencia !== 'string') {
      return NextResponse.json(
        { error: 'Competência é obrigatória (formato: YYYY-MM)' },
        { status: 400 }
      )
    }

    // Valida formato da competência (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(competencia)) {
      return NextResponse.json(
        { error: 'Formato de competência inválido. Use YYYY-MM' },
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

    // Agrupa por projeto, prestador e contrato
    const grupos = new Map<string, DocumentoRegistro[]>()
    
    for (const doc of documentos) {
      const chave = `${doc.PROJETO}|${doc.PRESTADOR}|${doc.CONTRATO}`
      if (!grupos.has(chave)) {
        grupos.set(chave, [])
      }
      grupos.get(chave)!.push(doc)
    }

    // Prepara lista de contratos para envio
    const contratos: ContratoParaEnvio[] = []
    
    for (const [chave, docs] of grupos.entries()) {
      const [projeto, prestador, contrato] = chave.split('|')
      
      if (!docs[0].email_envio || String(docs[0].email_envio).trim() === '') {
        continue // Pula contratos sem email
      }

      // Calcula relevância e legenda
      const { percentual, legenda } = calcularRelevanciaELegenda(docs, projeto)
      
      // Conta pendências
      const totalPendencias = docs.filter(
        d => d.STATUS_GERAL_Regra === 'Não Conforme'
      ).length

      contratos.push({
        projeto,
        prestador,
        contrato,
        competencia,
        email_envio: docs[0].email_envio,
        total_documentos: docs.length,
        total_pendencias: totalPendencias,
        perc_atingido: percentual,
        legenda,
        selecionado: false
      })
    }

    return NextResponse.json({
      success: true,
      competencia,
      total_contratos: contratos.length,
      total_documentos: documentos.length,
      contratos: contratos.sort((a, b) => 
        a.prestador.localeCompare(b.prestador)
      )
    })
    
  } catch (error) {
    console.error('Erro ao consultar documentos:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao consultar dados do BigQuery',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

