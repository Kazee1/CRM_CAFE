"use client";

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2, Users, Power, FileText } from "lucide-react";
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
import { ClienteForm } from "./clientesSheet";
import { ClienteHistorico } from "./historicoSheet";
import {
  getClientes,
  deleteCliente,
  toggleClienteStatus,
  type Cliente
} from "@/lib/cliente-request";

import { toast } from "sonner";

// Função para parsear o endereço em campos separados (incluindo CEP)
const parseEndereco = (endereco: string) => {
  // Novo padrão incluindo CEP no final: Rua, Número - Complemento - Bairro - Cidade/UF - CEP
  const padraoComCEP = /^(.*?), (\d+.*?) - (.*?) - (.*?) - (.*?)\/([A-Z]{2}) - (\d{5}-\d{3})$/;
  const matchComCEP = endereco.match(padraoComCEP);

  if (matchComCEP) {
    return {
      logradouro: matchComCEP[1].trim(),
      numero: matchComCEP[2].trim(),
      complemento: matchComCEP[3].trim(),
      bairro: matchComCEP[4].trim(),
      cidade: matchComCEP[5].trim(),
      uf: matchComCEP[6].trim(),
      cep: matchComCEP[7].trim()
    };
  }

  // Padrão antigo sem CEP (para compatibilidade com dados antigos)
  const padraoSemCEP = /^(.*?), (\d+.*?) - (.*?) - (.*?)\/([A-Z]{2})$/;
  const matchSemCEP = endereco.match(padraoSemCEP);

  if (matchSemCEP) {
    return {
      logradouro: matchSemCEP[1].trim(),
      numero: matchSemCEP[2].trim(),
      bairro: matchSemCEP[3].trim(),
      complemento: "",
      cidade: matchSemCEP[4].trim(),
      uf: matchSemCEP[5].trim(),
      cep: ""
    };
  }

  // Se não bater com nenhum padrão, tenta extrair o que conseguir
  const partes = endereco.split(" - ");
  const ultimaParte = partes[partes.length - 1];

  // Tenta extrair CEP (formato 00000-000)
  const cepMatch = ultimaParte.match(/(\d{5}-\d{3})$/);
  const cep = cepMatch ? cepMatch[1] : "";

  return {
    logradouro: "",
    numero: "",
    bairro: "",
    complemento: "",
    cidade: "",
    uf: "",
    cep
  };
};

type ClienteFormData = {
  id?: number;
  nome: string;
  tipo: "FISICA" | "JURIDICA";
  cpfCnpj: string;
  email?: string;
  telefone: string;
  // Campos de endereço separados
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  observacao?: string;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteFormData | null>(null);
  const [clienteHistorico, setClienteHistorico] = useState<Cliente | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteParaDeletar, setClienteParaDeletar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const data = await getClientes();
      setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro", {
        description: "Não foi possível carregar os clientes. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirNovo = () => {
    setClienteSelecionado(null);
    setSheetOpen(true);
  };

  const abrirEdicao = (cliente: Cliente) => {
    // Parseia o endereço para extrair os campos (incluindo CEP)
    const enderecoParsed = parseEndereco(cliente.endereco);

    setClienteSelecionado({
      id: cliente.id,
      nome: cliente.nome,
      tipo: cliente.tipo,
      cpfCnpj: cliente.cpfCnpj,
      email: cliente.email,
      telefone: cliente.telefone,
      cep: enderecoParsed.cep,
      logradouro: enderecoParsed.logradouro,
      numero: enderecoParsed.numero,
      complemento: enderecoParsed.complemento,
      bairro: enderecoParsed.bairro,
      cidade: enderecoParsed.cidade,
      uf: enderecoParsed.uf,
      observacao: cliente.observacao,
    });
    setSheetOpen(true);
  };

  const abrirHistorico = (cliente: Cliente) => {
    setClienteHistorico(cliente);
    setHistoricoOpen(true);
  };

  const fecharSheet = () => {
    setSheetOpen(false);
    setClienteSelecionado(null);
    carregarClientes();
  };

  const fecharHistorico = () => {
    setHistoricoOpen(false);
    setClienteHistorico(null);
  };

  const confirmarDelete = (id: number) => {
    setClienteParaDeletar(id);
    setDeleteDialogOpen(true);
  };

  const deletarCliente = async () => {
    if (!clienteParaDeletar) return;

    try {
      await deleteCliente(clienteParaDeletar);
      toast.success("Sucesso", {
        description: "Cliente excluído com sucesso."
      });
      carregarClientes();
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      toast.error("Erro", {
        description: "Não foi possível excluir o cliente. Tente novamente."
      });
    } finally {
      setDeleteDialogOpen(false);
      setClienteParaDeletar(null);
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      await toggleClienteStatus(id);
      toast.success("Sucesso", {
        description: "Status do cliente alterado com sucesso."
      });
      carregarClientes();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro", {
        description: "Não foi possível alterar o status. Tente novamente.",
      });
    }
  };

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.cpfCnpj.includes(busca) ||
    c.telefone.includes(busca) ||
    c.endereco.toLowerCase().includes(busca.toLowerCase())
  );

  const formatarDocumento = (doc: string, tipo: "FISICA" | "JURIDICA") => {
    const docLimpo = doc.replace(/\D/g, "");

    if (tipo === "FISICA") {
      return docLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return docLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  // No início do seu componente, adicione estes estados:
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;

  // Calcule os itens da página atual
  const indexUltimo = paginaAtual * itensPorPagina;
  const indexPrimeiro = indexUltimo - itensPorPagina;
  const clientesPaginados = clientesFiltrados.slice(indexPrimeiro, indexUltimo);
  const totalPaginas = Math.ceil(clientesFiltrados.length / itensPorPagina);

  return (
    <>
      {/* HEADER */}
      <div className="rounded-xl border border-stone-200 bg-white px-6 py-5 shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Clientes
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Gerencie os clientes da empresa
            </p>
          </div>

          <Button
            onClick={abrirNovo}
            className="bg-amber-800 hover:bg-amber-900 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* BUSCA */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-600" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ, telefone ou endereço..."
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
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Tipo</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">CPF/CNPJ</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Telefone</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Endereço</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Status</th>
              <th className="text-right py-3 px-4 font-semibold text-stone-900">Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-stone-500">
                  Carregando clientes...
                </td>
              </tr>
            ) : clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-2 text-stone-400" />
                  <p className="text-stone-500">
                    {busca ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                  </p>
                </td>
              </tr>
            ) : (
              clientesPaginados.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="border-b last:border-b-0 hover:bg-stone-50 transition-colors"
                >
                  <td className="py-3 px-4 text-stone-900 font-medium">
                    {cliente.nome}
                  </td>

                  <td className="py-3 px-4">
                    <Badge
                      className={
                        cliente.tipo === "FISICA"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }
                    >
                      {cliente.tipo === "FISICA" ? "Pessoa Física" : "Pessoa Jurídica"}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-stone-600">
                    {formatarDocumento(cliente.cpfCnpj, cliente.tipo)}
                  </td>

                  <td className="py-3 px-4 text-stone-600">
                    {cliente.telefone}
                  </td>

                  <td className="py-3 px-4 text-stone-600 max-w-[200px] truncate" title={cliente.endereco}>
                    {cliente.endereco}
                  </td>

                  <td className="py-3 px-4">
                    <Badge
                      className={
                        cliente.status === "ATIVO"
                          ? "bg-green-100 text-green-700"
                          : "bg-stone-200 text-stone-700"
                      }
                    >
                      {cliente.status === "ATIVO" ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => abrirHistorico(cliente)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        title="Histórico"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => abrirEdicao(cliente)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleStatus(cliente.id)}
                        className="text-stone-600 hover:text-stone-800 hover:bg-stone-100"
                        title={cliente.status === "ATIVO" ? "Desativar" : "Ativar"}
                      >
                        <Power className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => confirmarDelete(cliente.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir"
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
        {!loading && clientesFiltrados.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-stone-50">
            <div className="text-sm text-stone-600">
              Mostrando {indexPrimeiro + 1} a {Math.min(indexUltimo, clientesFiltrados.length)} de {clientesFiltrados.length} clientes
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
              {clienteSelecionado ? "Editar Cliente" : "Novo Cliente"}
            </SheetTitle>
            <SheetDescription>
              {clienteSelecionado
                ? "Atualize as informações do cliente"
                : "Preencha os dados para cadastrar um novo cliente"}
            </SheetDescription>
          </SheetHeader>

          <ClienteForm
            clienteSelecionado={clienteSelecionado}
            onClose={fecharSheet}
          />
        </SheetContent>
      </Sheet>

      {/* SHEET DE HISTÓRICO */}
      <Sheet open={historicoOpen} onOpenChange={setHistoricoOpen}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Histórico do Cliente
            </SheetTitle>
            <SheetDescription>
              Visualize todas as transações e interações com {clienteHistorico?.nome}
            </SheetDescription>
          </SheetHeader>

          {clienteHistorico && (
            <ClienteHistorico
              cliente={clienteHistorico}
              onClose={fecharHistorico}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletarCliente}
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