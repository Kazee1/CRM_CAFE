import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma, StatusCliente } from "@prisma/client";

import { CreateClienteDto } from "./dto/create-cliente.dto";
import { UpdateClienteDto } from "./dto/update-cliente.dto";


@Injectable()
export class ClienteService {
    constructor(private prisma: PrismaService) { }

    /* =====================
       LISTAR CLIENTES
    ===================== */
    findAll() {
        return this.prisma.cliente.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    /* =====================
       BUSCAR POR ID
    ===================== */
    async findOne(id: number) {
        const cliente = await this.prisma.cliente.findUnique({
            where: { id },
        });

        if (!cliente) {
            throw new NotFoundException("Cliente não encontrado");
        }

        return cliente;
    }

    /* =====================
       CRIAR CLIENTE
    ===================== */
    async create(data: CreateClienteDto) {
        try {
            return await this.prisma.cliente.create({
                data,
            });
        } catch (error) {
            if (error.code === "P2002") {
                throw new BadRequestException("CPF/CNPJ já cadastrado");
            }
            throw error;
        }
    }

    /* =====================
       ATUALIZAR CLIENTE
    ===================== */
    async update(id: number, data: UpdateClienteDto) {
        await this.findOne(id);

        try {
            return await this.prisma.cliente.update({
                where: { id },
                data,
            });
        } catch (error) {
            if (error.code === "P2002") {
                throw new BadRequestException("CPF/CNPJ já cadastrado");
            }
            throw error;
        }
    }

    /* =====================
       DELETAR CLIENTE
       (Hard delete)
    ===================== */
    async remove(id: number) {
        await this.findOne(id);

        await this.prisma.cliente.delete({
            where: { id },
        });

        return { deleted: true };
    }

    /* =====================
       ATIVAR / DESATIVAR
       (Soft status)
    ===================== */
    async toggleStatus(id: number) {
        const cliente = await this.findOne(id);

        const novoStatus =
            cliente.status === StatusCliente.ATIVO
                ? StatusCliente.INATIVO
                : StatusCliente.ATIVO;

        return this.prisma.cliente.update({
            where: { id },
            data: {
                status: novoStatus,
            },
        });
    }
}
