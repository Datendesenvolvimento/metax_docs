import { NextResponse } from "next/server"
import { Resend } from 'resend'
import { prisma } from "@/lib/prisma"
import { generateResetToken } from "@/lib/utils/auth/token_password_recovery"

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${resetToken}`

    await resend.emails.send({
      from: `${process.env.RESEND_NAME_TO_FROM} <naoresponda@${process.env.RESEND_DOMAIN}>`,
      to: email,
      subject: 'Recuperação de Senha',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <tr>
                <td style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                  <!-- Cabeçalho -->
                  <div style="text-align: center; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #e5e7eb;">
                    <h1 style="color: #1a1f36; font-size: 24px; font-weight: 600; margin: 0;">
                      Recuperação de Senha
                    </h1>
                  </div>

                  <!-- Conteúdo -->
                  <div style="color: #1a1f36; line-height: 1.5;">
                    <p style="color: #4b5563; margin-bottom: 24px;">
                      Olá,
                    </p>
                    
                    <p style="color: #4b5563; margin-bottom: 24px;">
                      Recebemos uma solicitação para redefinir sua senha. Se você não fez esta solicitação, por favor, ignore este email.
                    </p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${resetLink}"
                         style="display: inline-block; background-color: #1a1f36; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; text-align: center;">
                        Redefinir Senha
                      </a>
                    </div>
                    
                    <p style="color: #4b5563; margin-bottom: 24px;">
                      Este link é válido por 1 hora. Após esse período, você precisará solicitar um novo link de recuperação.
                    </p>
                    
                    <p style="color: #4b5563; margin-bottom: 24px;">
                      Se você não conseguir clicar no botão acima, copie e cole o link abaixo no seu navegador:
                    </p>
                    
                    <p style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 14px; color: #4b5563;">
                      ${resetLink}
                    </p>
                  </div>

                  <!-- Rodapé -->
                  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                      © ${new Date().getFullYear()} Daten Consultoria. Todos os direitos reservados.
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    })

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