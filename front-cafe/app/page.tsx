// app/page.tsx
"use client";

import React, { useState } from "react";
import { Coffee, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:4200/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ⭐ IMPORTANTE
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Credenciais inválidas");
      }

      // Cookie foi salvo automaticamente pelo navegador
      router.push("/dashboard/produtos");
    } catch {
      alert("Login inválido");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-700 to-amber-900 rounded-xl flex items-center justify-center shadow-lg">
                <Coffee className="w-8 h-8 text-amber-50" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-stone-800 tracking-tight">
              Bem-vindo
            </h1>
            <p className="text-stone-500 text-sm">
              Entre com suas credenciais para continuar
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent transition-all bg-stone-50 text-stone-800 placeholder:text-stone-400"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 block">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full pl-11 pr-12 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent transition-all bg-stone-50 text-stone-800 placeholder:text-stone-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-amber-700 to-amber-900 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-amber-800 hover:to-amber-950 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Entrar
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-stone-400 text-xs">
            © 2024 Enterprise. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}