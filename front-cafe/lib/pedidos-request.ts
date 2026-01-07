import { apiRequest } from "./api";

/* =====================
   TIPOS
===================== */

export type StatusPedido =
  | "PENDENTE"
  | "PAGO"
  | "EM_PREPARO"
  | "CONCLUIDO"
  | "CANCELADO";

export interface PedidoItemDto {
  produtoId: number;
  quantidade: number;
}

export interface CreatePedidoDto {
  clienteId: number;
  itens: PedidoItemDto[];
}

export interface UpdatePedidoDto {
  clienteId: number;
  itens: PedidoItemDto[];
}

export interface PedidoResumo {
  id: number;
  clienteId: number;
  status: StatusPedido;
  total: number;
  createdAt: string;
}


/* =====================
   LISTAR PEDIDOS
===================== */
export function getPedidos(): Promise<PedidoResumo[]> {
  return apiRequest("/pedidos");
}

/* =====================
   BUSCAR POR ID
===================== */
export function getPedidoById(id: number) {
  return apiRequest(`/pedidos/${id}`);
}

export function getPedidoCliente(id: number){
  return apiRequest(`/pedidos/cliente/${id}`)
}

/* =====================
   CRIAR PEDIDO
===================== */
export function createPedido(data: CreatePedidoDto) {
  return apiRequest("/pedidos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* =====================
   ATUALIZAR PEDIDO
===================== */
export function updatePedido(id: number, data: UpdatePedidoDto) {
  return apiRequest(`/pedidos/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/* =====================
   ALTERAR STATUS
===================== */
export function updatePedidoStatus(
  id: number,
  status: StatusPedido
) {
  return apiRequest(`/pedidos/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/* =====================
   DELETAR PEDIDO
===================== */
export function deletePedido(id: number) {
  return apiRequest(`/pedidos/${id}`, {
    method: "DELETE",
  });
}
