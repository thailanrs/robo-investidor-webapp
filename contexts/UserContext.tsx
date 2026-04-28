"use client";

import React, { createContext, useContext } from "react";

export interface UserProfile {
  nome_completo: string | null;
  avatar_url: string | null;
}

export interface UserContextType {
  id: string;
  email: string;
  profile: UserProfile | null;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: UserContextType;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
