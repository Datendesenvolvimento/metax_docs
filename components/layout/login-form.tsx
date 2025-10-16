'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      })

      if (result?.error) {
        setError('Credenciais inválidas')
        return
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      setError('Ocorreu um erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      {resetSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">✓ Senha redefinida com sucesso! Faça login com sua nova senha.</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">✕ {error}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-metax-primary font-medium">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border-gray-300 focus:border-metax-secondary focus:ring-metax-secondary"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-metax-primary font-medium">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="digite sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border-gray-300 focus:border-metax-secondary focus:ring-metax-secondary"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full bg-metax-secondary hover:bg-metax-primary text-white font-semibold py-3 rounded-lg transition-colors shadow-md"
        disabled={loading}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}

