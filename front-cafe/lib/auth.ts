// src/lib/auth.ts
import { jwtDecode } from "jwt-decode";

export type UserRole = "ADMIN" | "USER";

export interface UserInfo {
  id: number;
  email: string;
  role: UserRole;
}

// Função para obter usuário atual via endpoint
export async function getCurrentUser(): Promise<UserInfo | null> {
  try {
    const res = await fetch("http://localhost:4200/auth/me", {
      method: "GET",
      credentials: "include", // Importante para enviar cookies
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.log("❌ Não autenticado");
        return null;
      }
      throw new Error(`Erro ${res.status}`);
    }

    const userData = await res.json();
    console.log("✅ Usuário obtido:", userData);
    return userData;
  } catch (error) {
    console.log("❌ Erro ao obter usuário:", error);
    return null;
  }
}

// Remova ou mantenha apenas para referência (não funcionará com httpOnly)
export function getUserFromCookie(): null {
  console.log("⚠️ Cookie httpOnly não pode ser acessado via JavaScript");
  return null;
}

export function isTokenExpired(token: string) {
  const decoded = jwtDecode(token);
  if (decoded.exp != null)
    return decoded.exp * 1000 < Date.now();
  else
    return null;
}

// Logout atualizado
export async function logout() {
  try {
    await fetch("http://localhost:4200/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    
    // Limpar estado local se necessário
    if (typeof window !== "undefined") {
      // Se tiver algum estado no localStorage ou sessionStorage
      sessionStorage.clear();
    }
    
    window.location.href = "/";
  } catch (error) {
    console.error("Erro no logout:", error);
    window.location.href = "/";
  }
}

// Função para login (opcionalmente atualizar)
export async function login(email: string, password: string) {
  try {
    const response = await fetch("http://localhost:4200/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Credenciais inválidas");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro no login:", error);
    throw error;
  }
}