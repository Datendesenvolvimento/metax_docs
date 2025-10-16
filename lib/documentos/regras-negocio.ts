/**
 * Regras de negócio para cálculo de relevância e legendas
 * Mantém fidelidade total às regras do script Python original
 */

import { DocumentoRegistro, RelevanciaResultado, StatusLegenda } from '@/types/documentos'

/**
 * Calcula a relevância e legenda baseado no projeto e documentos do mês
 * Replica exatamente a função calcular_relevancia_e_legenda do Python
 */
export function calcularRelevanciaELegenda(
  documentos: DocumentoRegistro[],
  projeto: string
): RelevanciaResultado {
  if (!documentos || documentos.length === 0) {
    return { percentual: 0.0, legenda: "Sem dados" }
  }

  // Converte RELEVANCIA para número e CRITICO para string
  const docs = documentos.map(doc => ({
    ...doc,
    RELEVANCIA: typeof doc.RELEVANCIA === 'string' 
      ? parseFloat(doc.RELEVANCIA) || 0.0 
      : doc.RELEVANCIA || 0.0,
    CRITICO: String(doc.CRITICO)
  }))

  // 🔹 Regra do que conta como "conforme"
  let relevanciaConforme = 0.0
  
  if (projeto === "Reparação Bacia do Rio Doce" || projeto === "Samarco - COA") {
    // Para estes projetos: APENAS Conforme
    relevanciaConforme = docs
      .filter(doc => doc.STATUS_GERAL_Regra === "Conforme")
      .reduce((sum, doc) => sum + Number(doc.RELEVANCIA), 0.0)
  } else {
    // Para outros projetos: Conforme OU Em Análise
    relevanciaConforme = docs
      .filter(doc => 
        doc.STATUS_GERAL_Regra === "Conforme" || 
        doc.STATUS_GERAL_Regra === "Em Análise"
      )
      .reduce((sum, doc) => sum + Number(doc.RELEVANCIA), 0.0)
  }

  // 🔹 O valor final já é o percentual (0–1)
  const perc = relevanciaConforme

  // 🔹 Conta de críticos (Não Conforme E CRITICO = "1")
  const critico = docs.filter(doc => 
    doc.STATUS_GERAL_Regra === "Não Conforme" && doc.CRITICO === "1"
  ).length

  // 🔹 Legenda conforme regras de cada projeto
  let legenda: StatusLegenda

  if (projeto === "Vallourec") {
    if (perc <= 0.9) {
      legenda = "Não Atende"
    } else if (critico >= 1) {
      legenda = "Não Atende"
    } else if (perc > 0.99) {
      legenda = "Atende"
    } else if (perc >= 0.9) {
      legenda = "Atende Parcial"
    } else {
      legenda = "Não Atende"
    }
  } else if (
    projeto === "MSFC FLORESTAL LTDA" || 
    projeto === "BRACELL BAHIA FLORESTAL" || 
    projeto === "BRACELL BAHIA SPECIALTY CELLULOSE"
  ) {
    if (perc < 0.5) {
      legenda = "Crítico"
    } else if (critico >= 1) {
      legenda = "Não Atende"
    } else if (perc >= 0.8) {
      legenda = "Atende"
    } else if (perc >= 0.5 && perc < 0.8) {
      legenda = "Não Atende"
    } else {
      legenda = "Crítico"
    }
  } else if (projeto === "Projeto Sucuriú") {
    if (perc <= 0.7) {
      legenda = "Crítico"
    } else if (critico >= 1) {
      legenda = "Não Atende"
    } else if (perc >= 0.93) {
      legenda = "Atende"
    } else if (perc >= 0.8 && perc < 0.93) {
      legenda = "Atende Parcial"
    } else if (perc >= 0.7 && perc < 0.8) {
      legenda = "Baixa Performance"
    } else {
      legenda = "Não Atende"
    }
  } else {
    // Regra padrão para outros projetos
    if (perc >= 0.99) {
      legenda = "Atende"
    } else if (perc <= 0.9) {
      legenda = "Crítico"
    } else if (perc <= 0.96) {
      legenda = "Não Atende"
    } else {
      legenda = "Atende Parcial"
    }
  }

  return { percentual: perc, legenda }
}

/**
 * Retorna a cor associada a uma legenda
 */
export function getCorLegenda(legenda: StatusLegenda | 'Fora da Vigência'): string {
  const cores: Record<StatusLegenda | 'Fora da Vigência', string> = {
    "Atende": "#16A34A",
    "Atende Parcial": "#FACC15",
    "Não Atende": "#DC2626",
    "Crítico": "#7F1D1D",
    "Baixa Performance": "#F97316",
    "Sem dados": "#6B7280",
    "Fora da Vigência": "#9CA3AF"
  }
  return cores[legenda] || "#6B7280"
}

/**
 * Gera lista dos últimos 5 meses a partir de uma competência de referência
 * Formato: 'YYYY-MM'
 */
export function gerarUltimos5Meses(competenciaRef: string): string[] {
  const [ano, mes] = competenciaRef.split('-').map(Number)
  const competencias: string[] = []
  
  for (let i = 4; i >= 0; i--) {
    let mesCalc = mes - i
    let anoCalc = ano
    
    while (mesCalc <= 0) {
      mesCalc += 12
      anoCalc -= 1
    }
    
    const mesStr = mesCalc.toString().padStart(2, '0')
    competencias.push(`${anoCalc}-${mesStr}`)
  }
  
  return competencias
}

