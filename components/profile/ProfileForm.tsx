"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Upload, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const profileSchema = z.object({
  nome_completo: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Usuário não logado");
        setUser(user);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("nome_completo, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profile) {
          setValue("nome_completo", profile.nome_completo || "");
          setAvatarUrl(profile.avatar_url);
        }
      } catch (error: any) {
        console.error("Erro ao buscar perfil:", error.message);
      } finally {
        setIsLoading(false);
      }
    }
    getProfile();
  }, [setValue]);

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

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      const newAvatarUrl = data.publicUrl;
      setAvatarUrl(newAvatarUrl);

      // Save to profile
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({ 
          id: user.id, 
          avatar_url: newAvatarUrl,
          data_atualizacao: new Date().toISOString()
        });

      if (updateError) throw updateError;
      
      setMessage({ type: 'success', text: 'Avatar atualizado com sucesso!' });
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao fazer upload do avatar' });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setMessage(null);
    try {
      if (!user) throw new Error("Sessão inválida");

      const { error } = await supabase
        .from("profiles")
        .upsert({ 
          id: user.id, 
          nome_completo: data.nome_completo,
          avatar_url: avatarUrl,
          data_atualizacao: new Date().toISOString()
        });

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Perfil salvo com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar perfil' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

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
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
            Email de Cadastro (Leitura Apenas)
          </label>
          <input
            type="text"
            value={user?.email || ""}
            disabled
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-500 dark:text-zinc-500 text-sm cursor-not-allowed"
          />
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
