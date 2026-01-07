"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCog,
  Coffee,
  LogOut,
  Menu,
  X,
  Package,
  ShoppingCart,
  LayoutDashboard, 
  FileText,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { getCurrentUser, logout, type UserInfo } from "@/lib/auth";
import path from "path";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  // ✅ Obter usuário atual via API endpoint
  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser();

        if (user) {
          setUserInfo(user);
          setIsAdmin(user.role === "ADMIN");
        } else {
          // Se não estiver autenticado, redirecionar para login
          // O middleware já faz isso, mas é uma segurança extra
          router.push("/");
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      } finally {
        setLoading(false);
        setMounted(true);
      }
    }

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await logout();
      // O logout já redireciona para "/"
    } catch (error) {
      console.error("Erro no logout:", error);
      window.location.href = "/";
    }
  };

  const menuItems = [
    {
      id: "overview",
      label: "Dashboard",
      icon: LayoutDashboard ,
      path: "/dashboard/overview",
    },
    {
      id: "clientes",
      label: 'Clientes',
      icon: Users,
      path: "/dashboard/clientes",
    },
    {
      id: "pedidos",
      label: "Pedidos",
      icon: ShoppingCart,
      path: "/dashboard/pedidos",
    },
    {
      id: "produtos",
      label: "Produtos",
      icon: Package,
      path: "/dashboard/produtos",
    },
    {
      id: "relatorios",
      label: "Relatorios",
      icon: FileText,
      path: "/dashboard/relatorios" 
    },
    {
      id: "funcionarios",
      label: "Funcionários",
      icon: UserCog,
      path: "/dashboard/funcionarios",
      adminOnly: true,
    },
  ];

  // ✅ Mostrar loading enquanto carrega
  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-700">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não houver usuário (não autenticado), mostrar mensagem
  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Coffee className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-stone-800 mb-2">
            Acesso não autorizado
          </h2>
          <p className="text-stone-600 mb-6">
            Você precisa estar autenticado para acessar esta página.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-900 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  // Gerar iniciais do nome do usuário
  const getInitials = () => {
    if (!userInfo.email) return "US";

    const nameParts = userInfo.email.split("@")[0].split(/[._-]/);
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return userInfo.email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-stone-800 shadow-sm z-50">
        <div className="flex h-full items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors"
              aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-stone-700" />
              ) : (
                <Menu className="w-5 h-5 text-stone-700" />
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center">
                <Coffee className="w-5 h-5 text-amber-50" />
              </div>
              <span className="text-lg font-bold text-stone-800 hidden sm:block">
                Enterprise
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-stone-800">
                {userInfo.email.split("@")[0]}
              </p>
              <p className="text-xs text-stone-500">
                {isAdmin ? "Administrador" : "Usuário"}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-white flex items-center justify-center font-semibold">
              {getInitials()}
            </div>

            <button
              className="p-2 rounded-lg hover:bg-red-50 group relative"
              onClick={handleLogout}
              aria-label="Sair"
              title="Sair do sistema"
            >
              <LogOut className="w-5 h-5 text-stone-600 group-hover:text-red-600 transition-colors" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-stone-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Sair
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="pt-16 flex">
        {/* SIDEBAR */}
        <aside
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-stone-200 transition-transform duration-300 z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <nav className="p-4 space-y-1">
            {menuItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => {
                const active = pathname === item.path;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${active
                      ? "bg-gradient-to-r from-amber-700 to-amber-900 text-white shadow-md"
                      : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                      }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className={`w-5 h-5 ${active ? "" : "group-hover:scale-110 transition-transform"}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
          </nav>

          {/* Footer da sidebar com informações do usuário (mobile) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-200 md:hidden">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-white flex items-center justify-center font-semibold text-sm">
                {getInitials()}
              </div>
              <div>
                <p className="text-sm font-medium text-stone-800 truncate">
                  {userInfo.email.split("@")[0]}
                </p>
                <p className="text-xs text-stone-500">
                  {isAdmin ? "Administrador" : "Usuário"}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* OVERLAY para mobile quando sidebar está aberta */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* MAIN */}
        <main
          className={`flex-1 p-6 lg:p-8 transition-all duration-300 min-h-[calc(100vh-4rem)] ${sidebarOpen ? "lg:ml-64" : ""
            }`}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}