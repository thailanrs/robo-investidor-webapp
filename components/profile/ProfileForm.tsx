"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Upload, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/contexts/UserContext";

const profileSchema = z.object({
  nome_completo: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  nova_senha: z.string().optional(),
  confirmar_senha: z.string().optional(),
}).refine((data) => {
  if (data.nova_senha && data.nova_senha.length > 0 && data.nova_senha.length < 6) {
    return false;
  }
  return true;
}, {
  message: "A senha deve ter pelo menos 6 caracteres.",
  path: ["nova_senha"],
}).refine((data) => {
  if (data.nova_senha && data.nova_senha !== data.confirmar_senha) {
    return false;
  }
  return true;
}, {
  message: "As senhas não coincidem.",
  path: ["confirmar_senha"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const user = useUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.profile?.avatar_url || null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nome_completo: user.profile?.nome_completo || "",
      nova_senha: "",
      confirmar_senha: "",
    },
  });

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setMessage(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Você precisa selecionar uma imagem para fazer upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      // Salva localmente, mas NÃO envia para o banco ainda
      setPendingAvatarUrl(data.publicUrl);
      setAvatarUrl(data.publicUrl);
      setMessage({ type: 'success', text: 'Imagem carregada! Clique em "Salvar Alterações" para confirmar.' });
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao fazer upload do avatar' });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setMessage(null);
    try {
      const supabase = createClient();

      // 1. Atualizar perfil no banco
      const profileData: any = { 
        id: user.id, 
        nome_completo: data.nome_completo,
        data_atualizacao: new Date().toISOString()
      };

      // Se houve upload pendente, inclui a URL do avatar
      if (pendingAvatarUrl) {
        profileData.avatar_url = pendingAvatarUrl;
      } else if (avatarUrl) {
        profileData.avatar_url = avatarUrl;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profileData);

      if (profileError) throw profileError;

      // 2. Se uma nova senha foi informada, atualizar via Auth
      if (data.nova_senha && data.nova_senha.length >= 6) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.nova_senha,
        });
        if (passwordError) throw passwordError;
      }
      
      setPendingAvatarUrl(null);
      reset({ 
        nome_completo: data.nome_completo, 
        nova_senha: "", 
        confirmar_senha: "" 
      });
      setMessage({ type: 'success', text: 'Perfil salvo com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar perfil' });
    }
  };

  const displayAvatar = avatarUrl;

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 max-w-xl mx-auto shadow-sm">
      <h2 className="text-2xl font-semibold mb-6 text-zinc-900 dark:text-zinc-100">Configurações de Perfil</h2>
      
      {message && (
        <div className={`p-4 mb-6 rounded-md text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' 
            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}

      {/* Seção Avatar */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
          Foto de Perfil
        </label>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0">
            {displayAvatar ? (
              <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10 text-zinc-400" />
            )}
          </div>
          <div>
            <label className="relative cursor-pointer bg-white dark:bg-zinc-900 py-2 px-4 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus-within:ring-2 focus-within:ring-emerald-500">
              <span>{uploading ? "Enviando..." : "Alterar Foto"}</span>
              <input 
                type="file" 
                className="sr-only" 
                accept="image/*" 
                onChange={uploadAvatar} 
                disabled={uploading} 
              />
            </label>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              JPG, GIF ou PNG. Máx de 2MB.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 my-6" />

      {/* Formulário Dados Pessoais */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Nome Completo
          </label>
          <input
            {...register("nome_completo")}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-shadow"
            placeholder="Seu nome aqui"
          />
          {errors.nome_completo && (
            <p className="text-xs text-red-500 mt-1">{errors.nome_completo.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Email de Cadastro
          </label>
          <input
            type="text"
            value={user.email || ""}
            disabled
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-500 dark:text-zinc-500 text-sm cursor-not-allowed"
          />
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 my-6" />

        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Alterar Senha</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-2">
          Deixe em branco para manter a senha atual. Caso tenha se registrado via Google, use estes campos para criar uma senha.
        </p>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Nova Senha
          </label>
          <div className="relative">
            <input
              {...register("nova_senha")}
              type={showPassword ? "text" : "password"}
              className="w-full px-3 py-2 pr-10 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-shadow"
              placeholder="Mínimo de 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.nova_senha && (
            <p className="text-xs text-red-500 mt-1">{errors.nova_senha.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Confirmar Nova Senha
          </label>
          <div className="relative">
            <input
              {...register("confirmar_senha")}
              type={showConfirmPassword ? "text" : "password"}
              className="w-full px-3 py-2 pr-10 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-shadow"
              placeholder="Repita a nova senha"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmar_senha && (
            <p className="text-xs text-red-500 mt-1">{errors.confirmar_senha.message}</p>
          )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
              </span>
            ) : (
              "Salvar Alterações"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
