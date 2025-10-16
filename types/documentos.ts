/**
 * Tipos para o sistema de pendências de documentos
 */

export interface DocumentoRegistro {
  PROJETO: string
  COMPETENCIA: string
  Competencia_Data: string
  DOCUMENTO: string
  PRESTADOR: string
  CNPJ_PRESTADOR: string
  CONTRATO: string
  STATUS_GERAL_Regra: string
  CRITICO: string
  RELEVANCIA: string | number
  DOCUMENTO_APROV_OBS2: string
  DOCUMENTO_APROV_REGULARIZA2: string
  Chave_Composta: string
  email_envio: string
}

export interface CardHistorico {
  PROJETO: string
  PRESTADOR: string
  CONTRATO: string
  COMPETENCIA: string
  total_pendencias: number
  total_criticos: number
  perc_atingido: number
}

export interface HistoricoMensal {
  COMPETENCIA: string
  total_pendencias: number
  total_criticos: number
  perc_atingido: number
  PROJETO: string
  PRESTADOR: string
  CONTRATO: string
}

export type StatusLegenda = 
  | "Atende" 
  | "Atende Parcial" 
  | "Não Atende" 
  | "Crítico" 
  | "Baixa Performance" 
  | "Sem dados"

export interface ContratoParaEnvio {
  projeto: string
  prestador: string
  contrato: string
  competencia: string
  email_envio: string
  total_documentos: number
  total_pendencias: number
  perc_atingido: number
  legenda: StatusLegenda
  selecionado?: boolean
}

export interface RelevanciaResultado {
  percentual: number
  legenda: StatusLegenda
}

export interface EmailPayload {
  projeto: string
  prestador: string
  contrato: string
  competencia: string
  emails: string[]
}

export interface BigQueryConfig {
  credentialsBase64: string
  projectId?: string
}

export interface EmailConfig {
  smtp_server: string
  smtp_port: number
  smtp_user: string
  smtp_password: string
  smtp_from: string
}

