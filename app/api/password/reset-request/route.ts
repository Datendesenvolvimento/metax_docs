import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateResetToken } from "@/lib/utils/auth/token_password_recovery"
import { criarTransporter } from "@/lib/documentos/email-sender"
import { EmailConfig } from "@/types/documentos"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: "Email é obrigatório" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Mesmo se o usuário não existir, retornamos sucesso
    // Isso evita vazamento de informação sobre quais emails estão cadastrados
    if (!user) {
      return NextResponse.json(
        { message: "Se existe uma conta com este email, você receberá um link para redefinir sua senha." },
        { status: 200 }
      )
    }

    const resetToken = generateResetToken()
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/${resetToken}`

    // Verifica se EMAIL_CREDENCIAL está configurado
    const emailCredBase64 = process.env.EMAIL_CREDENCIAL
    
    if (emailCredBase64) {
      try {
        // Decodifica credenciais de email
        const emailCredJson = Buffer.from(emailCredBase64, 'base64').toString('utf-8')
        const emailConfig: EmailConfig = JSON.parse(emailCredJson)

        // Cria transporter
        const transporter = criarTransporter(emailConfig)

        // Envia e-mail
        await transporter.sendMail({
          from: emailConfig.smtp_from,
          to: email,
          subject: 'Recuperação de Senha - Meta.X',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; background-color: #F9FAFC; font-family: Arial, sans-serif;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <tr>
                    <td style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      <!-- Cabeçalho -->
                      <div style="text-align: center; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 2px solid #0F79BD;">
                        <h1 style="color: #001847; font-size: 28px; font-weight: 700; margin: 0;">
                          🔐 Recuperação de Senha
                        </h1>
                        <p style="color: #0F79BD; font-size: 14px; margin-top: 8px;">
                          Sistema Meta.X
                        </p>
                      </div>

                      <!-- Conteúdo -->
                      <div style="color: #001847; line-height: 1.6;">
                        <p style="color: #4b5563; margin-bottom: 24px; font-size: 15px;">
                          Olá,
                        </p>
                        
                        <p style="color: #4b5563; margin-bottom: 24px; font-size: 15px;">
                          Recebemos uma solicitação para redefinir sua senha. Se você não fez esta solicitação, por favor, ignore este email.
                        </p>
                        
                        <div style="text-align: center; margin: 32px 0;">
                          <a href="${resetLink}"
                             style="display: inline-block; background: linear-gradient(135deg, #001847 0%, #0F79BD 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 24, 71, 0.3);">
                            Redefinir Minha Senha
                          </a>
                        </div>
                        
                        <p style="color: #4b5563; margin-bottom: 24px; font-size: 14px;">
                          ⏱️ Este link é válido por <strong>1 hora</strong>. Após esse período, você precisará solicitar um novo link de recuperação.
                        </p>
                        
                        <p style="color: #4b5563; margin-bottom: 12px; font-size: 14px;">
                          Se você não conseguir clicar no botão acima, copie e cole o link abaixo no seu navegador:
                        </p>
                        
                        <p style="background-color: #F9FAFC; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 12px; color: #0F79BD; border: 1px solid #E5E7EB;">
                          ${resetLink}
                        </p>

                        <div style="margin-top: 32px; padding: 16px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 6px;">
                          <p style="color: #92400E; font-size: 13px; margin: 0;">
                            <strong>⚠️ Segurança:</strong> Se você não solicitou esta alteração, recomendamos que altere sua senha imediatamente.
                          </p>
                        </div>
                      </div>

                      <!-- Rodapé -->
                      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                          © ${new Date().getFullYear()} Meta.X. Todos os direitos reservados.
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `
        })
      } catch (emailError) {
        console.error('Erro ao enviar e-mail de recuperação:', emailError)
        // Continua mesmo se falhar o envio do e-mail
      }
    } else {
      console.warn('EMAIL_CREDENCIAL não configurado. E-mail de recuperação não será enviado.')
    }

    return NextResponse.json(
      { message: "Se existe uma conta com este email, você receberá um link para redefinir sua senha." },
      { status: 200 }
    )

  } catch (error) {
    console.error("[RESET_REQUEST_ERROR]", error)
    return NextResponse.json(
      { message: "Erro ao processar solicitação" },
      { status: 500 }
    )
  }
}
