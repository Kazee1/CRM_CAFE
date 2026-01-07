import { apiRequest } from "./api";

/* =====================
   TIPOS
===================== */

export type TipoCliente = "FISICA" | "JURIDICA";
export type StatusCliente = "ATIVO" | "INATIVO";

export interface Cliente {
  id: number;
  nome: string;
  tipo: TipoCliente;
  cpfCnpj: string;
  email?: string;
  telefone: string;
  endereco: string;
  observacao?: string;
  status: StatusCliente;
  createdAt: string;
}

export interface CreateClienteDto {
  nome: string;
  tipo: TipoCliente;
  cpfCnpj: string;
  email?: string;
  telefone: string;
  endereco: string;
  observacao?: string;
}

export interface UpdateClienteDto {
  nome: string;
  tipo: TipoCliente;
  cpfCnpj: string;
  email?: string;
  telefone: string;
  endereco: string;
  observacao?: string;
}

/* =====================
   LISTAR CLIENTES
===================== */
export function getClientes(): Promise<Cliente[]> {
  return apiRequest("/clientes");
}

/* =====================
   BUSCAR CLIENTE POR ID
===================== */
export function getClienteById(id: number): Promise<Cliente> {
  return apiRequest(`/clientes/${id}`);
}

/* =====================
   CRIAR CLIENTE
===================== */
export function createCliente(data: CreateClienteDto): Promise<Cliente> {
  const payload = { ...data };

  return apiRequest("/clientes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =====================
   ATUALIZAR CLIENTE
===================== */
export function updateCliente(
  id: number,
  data: UpdateClienteDto
): Promise<Cliente> {
  const payload = { ...data };

  return apiRequest(`/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/* =====================
   DELETAR CLIENTE
===================== */
export function deleteCliente(
  id: number
): Promise<{ deleted: boolean }> {
  return apiRequest(`/clientes/${id}`, {
    method: "DELETE",
  });
}

/* =====================
   ATIVAR / DESATIVAR CLIENTE
===================== */
export function toggleClienteStatus(
  id: number
): Promise<Cliente> {
  return apiRequest(`/clientes/${id}/toggle-status`, {
    method: "PATCH",
  });
}