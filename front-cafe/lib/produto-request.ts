import { apiRequest } from './api';
import { Produto, ComboItemDto } from './produto';

/* =====================
   LISTAR PRODUTOS
===================== */
export function getProdutos(): Promise<Produto[]> {
  return apiRequest('/produtos');
}

/* =====================
   DELETAR PRODUTO
===================== */
export function deleteProduto(id: number): Promise<{ deleted: boolean }> {
  return apiRequest(`/produtos/${id}`, {
    method: 'DELETE',
  });
}

/* =====================
   BUSCAR POR ID
===================== */
export function getProdutoById(id: number): Promise<Produto> {
  return apiRequest(`/produtos/${id}`);
}

/* =====================
   CRIAR PRODUTO
===================== */
export function createProduto(data: any): Promise<Produto> {
  // Remover ID se existir (para garantir criação limpa)
  const { id, ...payload } = data;

  return apiRequest('/produtos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/* =====================
   ATUALIZAR PRODUTO
===================== */
export function updateProduto(id: number, data: any): Promise<Produto> {
  // Remover campos que não devem ser enviados no update
  const { id: _, ...payload } = data;

  return apiRequest(`/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/* =====================
   TOGGLE STATUS
===================== */
export function toggleProdutoStatus(id: number): Promise<Produto> {
  return apiRequest(`/produtos/${id}/status`, {
    method: 'PATCH',
  });
}
