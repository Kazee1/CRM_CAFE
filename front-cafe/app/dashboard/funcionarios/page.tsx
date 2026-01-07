"use client";

import {
  getUsers,
  deleteUser,
} from "@/lib/user-request";

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2, Users, UserCog, Shield } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { FuncionarioForm } from "./funcSheet";

type User = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
};

type FuncionarioFormData = {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: "ADMIN" | "USER";
};

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<User[]>([]);
  const [busca, setBusca] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<FuncionarioFormData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [funcionarioParaDeletar, setFuncionarioParaDeletar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  const carregarFuncionarios = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setFuncionarios(data);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirNovo = () => {
    setFuncionarioSelecionado(null);
    setSheetOpen(true);
  };

  const abrirEdicao = (funcionario: User) => {
    setFuncionarioSelecionado({
      id: funcionario.id,
      name: funcionario.name,
      email: funcionario.email,
      role: funcionario.role,
    });
    setSheetOpen(true);
  };

  const fecharSheet = () => {
    setSheetOpen(false);
    setFuncionarioSelecionado(null);
    carregarFuncionarios();
  };

  const confirmarDelete = (id: number) => {
    setFuncionarioParaDeletar(id);
    setDeleteDialogOpen(true);
  };

  const deletarFuncionario = async () => {
    if (!funcionarioParaDeletar) return;

    try {
      await deleteUser(funcionarioParaDeletar);
      carregarFuncionarios();
    } catch (error) {
      console.error("Erro ao deletar funcionário:", error);
      alert("Erro ao deletar funcionário");
    } finally {
      setDeleteDialogOpen(false);
      setFuncionarioParaDeletar(null);
    }
  };


  const funcionariosFiltrados = funcionarios.filter((f) =>
    f.name.toLowerCase().includes(busca.toLowerCase()) ||
    f.email.toLowerCase().includes(busca.toLowerCase())
  );

  const getRoleBadge = (role: "ADMIN" | "USER") => {
    if (role === "ADMIN") {
      return (
        <Badge className="bg-amber-800 hover:bg-amber-900 text-white">
          <Shield className="h-3 w-3 mr-1" />
          Administrador
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-stone-200 text-stone-800">
        <UserCog className="h-3 w-3 mr-1" />
        Usuário
      </Badge>
    );
  };

  // No início do seu componente, adicione estes estados:
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;

  // Calcule os itens da página atual
  const indexUltimo = paginaAtual * itensPorPagina;
  const indexPrimeiro = indexUltimo - itensPorPagina;
  const funcionariosPaginados = funcionariosFiltrados.slice(indexPrimeiro, indexUltimo);
  const totalPaginas = Math.ceil(funcionariosFiltrados.length / itensPorPagina);

  return (
    <>
      {/* HEADER */}
      <div className="rounded-xl border border-stone-200 bg-white px-6 py-5 shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Funcionários
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Gerencie os usuários do sistema
            </p>
          </div>

          <Button
            onClick={abrirNovo}
            className="bg-amber-800 hover:bg-amber-900 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>
      </div>

      {/* BUSCA */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-600" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 text-stone-900 placeholder:text-stone-500"
            />
          </div>
        </div>
      </div>
      {/* TABELA */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Nome</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Perfil</th>
              <th className="text-right py-3 px-4 font-semibold text-stone-900">Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-stone-500">
                  Carregando funcionários...
                </td>
              </tr>
            ) : funcionariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-2 text-stone-400" />
                  <p className="text-stone-500">
                    {busca ? "Nenhum funcionário encontrado" : "Nenhum funcionário cadastrado"}
                  </p>
                </td>
              </tr>
            ) : (
              funcionariosPaginados.map((funcionario) => (
                <tr
                  key={funcionario.id}
                  className="border-b last:border-b-0 hover:bg-stone-50 transition-colors"
                >
                  <td className="py-3 px-4 text-stone-900">
                    {funcionario.name}
                  </td>

                  <td className="py-3 px-4 text-stone-600">
                    {funcionario.email}
                  </td>

                  <td className="py-3 px-4">
                    {getRoleBadge(funcionario.role)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => abrirEdicao(funcionario)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => confirmarDelete(funcionario.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINAÇÃO */}
        {!loading && funcionariosFiltrados.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-stone-50">
            <div className="text-sm text-stone-600">
              Mostrando {indexPrimeiro + 1} a {Math.min(indexUltimo, funcionariosFiltrados.length)} de {funcionariosFiltrados.length} funcionários
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
                className="disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm text-stone-600">
                Página {paginaAtual} de {totalPaginas}
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
                className="disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>


      {/* SHEET DE CADASTRO/EDIÇÃO */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <Users className="h-6 w-6" />
              {funcionarioSelecionado ? "Editar Funcionário" : "Novo Funcionário"}
            </SheetTitle>
            <SheetDescription>
              {funcionarioSelecionado
                ? "Atualize as informações do funcionário"
                : "Preencha os dados para cadastrar um novo funcionário"}
            </SheetDescription>
          </SheetHeader>

          <FuncionarioForm
            funcionarioSelecionado={funcionarioSelecionado}
            onClose={fecharSheet}
          />
        </SheetContent>
      </Sheet>

      {/* DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletarFuncionario}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}