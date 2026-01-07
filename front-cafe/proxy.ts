// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Se for uma rota protegida
  if (pathname.startsWith("/dashboard")) {
    try {
      // Verificar autenticação via endpoint
      const authCheck = await fetch('http://localhost:4200/auth/me', {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      });
      
      if (!authCheck.ok) {
        // Não autenticado, redirecionar para login
        const loginUrl = new URL("/", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      const userData = await authCheck.json();
      
      // Verificar permissões
      if (pathname.startsWith("/dashboard/funcionarios") && userData.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/produtos", request.url));
      }
      
      // Redirecionar /dashboard para /dashboard/produtos
      if (pathname === "/dashboard") {
        return NextResponse.redirect(new URL("/dashboard/produtos", request.url));
      }
      
      return NextResponse.next();
      
    } catch (error) {
      console.error("Erro na verificação de autenticação:", error);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  // Se estiver na página inicial e já estiver autenticado
  if (pathname === "/") {
    try {
      const authCheck = await fetch('http://localhost:4200/auth/me', {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      });
      
      if (authCheck.ok) {
        return NextResponse.redirect(new URL("/dashboard/produtos", request.url));
      }
    } catch {
      // Ignorar erros, manter na página inicial
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};