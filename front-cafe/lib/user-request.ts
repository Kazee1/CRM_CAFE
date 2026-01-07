import { apiRequest } from './api';

/* =====================
   TIPOS
===================== */
export type Role = 'ADMIN' | 'USER';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: Role;
  createdAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserDto {
  name: string;
  email: string;
  password?: string;
  role: Role;
}

/* =====================
   LISTAR FUNCIONÁRIOS
===================== */
export function getUsers(): Promise<User[]> {
  return apiRequest('/users');
}

/* =====================
   BUSCAR POR ID
===================== */
export function getUserById(id: number): Promise<User> {
  return apiRequest(`/users/${id}`);
}

/* =====================
   CRIAR FUNCIONÁRIO
===================== */
export function createUser(data: CreateUserDto): Promise<User> {
  // Remover ID se existir (para garantir criação limpa)
  const { ...payload } = data;

  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/* =====================
   ATUALIZAR FUNCIONÁRIO
===================== */
export function updateUser(id: number, data: UpdateUserDto): Promise<User> {
  // Se a senha estiver vazia, remover do payload
  const payload = { ...data };
  if (!payload.password) {
    delete payload.password;
  }

  return apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/* =====================
   DELETAR FUNCIONÁRIO
===================== */
export function deleteUser(id: number): Promise<{ deleted: boolean }> {
  return apiRequest(`/users/${id}`, {
    method: 'DELETE',
  });
}
