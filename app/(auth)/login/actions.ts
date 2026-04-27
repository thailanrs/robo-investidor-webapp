'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    process?.env?.VERCEL_URL ??
    'http://localhost:3000/'
  
  // Inclui https:// se não for localhost
  url = url.includes('http') ? url : `https://${url}`
  // Remove trailing slash se houver
  url = url.replace(/\/$/, '')
  return url
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=Não foi possível autenticar o usuário')
  }

  revalidatePath('/', 'layout')
  redirect('/carteira')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp({
    ...data,
    options: {
      emailRedirectTo: `${getURL()}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?message=Não foi possível cadastrar o usuário')
  }

  redirect('/login?message=Verifique seu e-mail para continuar')
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getURL()}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    redirect('/login?message=Não foi possível autenticar com o Google')
  }

  if (data.url) {
    redirect(data.url)
  }
}
