/**
 * Gerador de gráfico SVG de pendências
 * Alternativa leve ao canvas, funciona perfeitamente em e-mails
 */

import { HistoricoMensal } from '@/types/documentos'
import sharp from 'sharp'

// Paleta de cores Meta.X
const COR_PRINCIPAL = "#001847"
const COR_LINHA_FORTE = "#1E3A8A"
const COR_LINHA_SUAVE = "#93C5FD"

/**
 * Gera um gráfico SVG de linha das pendências dos últimos 5 meses
 */
export function gerarGraficoSVG(historico: HistoricoMensal[]): string | null {
  if (!historico || historico.length === 0) {
    return null
  }

  // Ordena por competência
  const dadosOrdenados = [...historico].sort((a, b) => 
    a.COMPETENCIA.localeCompare(b.COMPETENCIA)
  )

  const competencias = dadosOrdenados.map(d => d.COMPETENCIA)
  const pendencias = dadosOrdenados.map(d => d.total_pendencias)

  // Dimensões do gráfico
  const width = 520
  const height = 220
  const padding = { top: 40, right: 20, bottom: 40, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Escalas
  const maxValue = Math.max(...pendencias, 1)
  const minValue = Math.min(...pendencias, 0)
  const range = maxValue - minValue || 1

  // Função para calcular posição X
  const getX = (index: number) => {
    return padding.left + (chartWidth / (competencias.length - 1 || 1)) * index
  }

  // Função para calcular posição Y
  const getY = (value: number) => {
    return padding.top + chartHeight - ((value - minValue) / range) * chartHeight
  }

  // Gera pontos da linha
  const points = pendencias.map((value, index) => ({
    x: getX(index),
    y: getY(value),
    value
  }))

  // Gera path da linha (com curva suave)
  let pathD = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    
    // Curva bezier para suavizar
    const cpx = prev.x + (curr.x - prev.x) / 2
    pathD += ` Q ${cpx} ${prev.y}, ${cpx} ${(prev.y + curr.y) / 2}`
    pathD += ` Q ${cpx} ${curr.y}, ${curr.x} ${curr.y}`
  }

  // Gera path do preenchimento (área abaixo da linha)
  const fillPath = pathD + ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`

  // Grid horizontal
  const gridLines = []
  const numGridLines = 4
  for (let i = 0; i <= numGridLines; i++) {
    const y = padding.top + (chartHeight / numGridLines) * i
    gridLines.push(`<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" stroke="#E5E7EB" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.5"/>`)
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="font-family:Arial,sans-serif;">
      <!-- Grid -->
      ${gridLines.join('\n      ')}
      
      <!-- Área preenchida -->
      <path d="${fillPath}" fill="${COR_LINHA_SUAVE}" opacity="0.2"/>
      
      <!-- Linha -->
      <path d="${pathD}" stroke="${COR_LINHA_FORTE}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      
      <!-- Pontos e valores -->
      ${points.map((point, index) => `
        <!-- Ponto ${index} -->
        <circle cx="${point.x}" cy="${point.y}" r="4.5" fill="${COR_PRINCIPAL}" stroke="white" stroke-width="1.5"/>
        <text x="${point.x}" y="${point.y - 12}" text-anchor="middle" font-size="11" font-weight="600" fill="${COR_PRINCIPAL}">${point.value}</text>
      `).join('\n      ')}
      
      <!-- Labels das competências (eixo X) -->
      ${competencias.map((comp, index) => `
        <text x="${getX(index)}" y="${padding.top + chartHeight + 25}" text-anchor="middle" font-size="11" fill="#374151">${comp}</text>
      `).join('\n      ')}
      
      <!-- Título -->
      <text x="${width / 2}" y="20" text-anchor="middle" font-size="13" font-weight="500" fill="${COR_PRINCIPAL}">Pendências nas últimas competências</text>
      
      <!-- Borda inferior -->
      <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${padding.left + chartWidth}" y2="${padding.top + chartHeight}" stroke="#D1D5DB" stroke-width="1"/>
    </svg>
  `
}

/**
 * Converte o SVG para PNG e retorna base64
 * Isso garante que funciona em todos os clientes de e-mail (Outlook, Gmail, etc)
 */
export async function gerarGraficoPNG(historico: HistoricoMensal[]): Promise<string | null> {
  const svg = gerarGraficoSVG(historico)
  
  if (!svg) {
    return null
  }

  try {
    // Converte SVG para PNG usando sharp
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer()
    
    // Retorna base64
    return pngBuffer.toString('base64')
  } catch (error) {
    console.error('Erro ao converter SVG para PNG:', error)
    return null
  }
}

