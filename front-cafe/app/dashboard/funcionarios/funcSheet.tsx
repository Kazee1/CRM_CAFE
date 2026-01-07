"use client";

import {
    createUser,
    CreateUserDto,
    updateUser,
} from "@/lib/user-request";


import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock, Shield, UserCog } from "lucide-react";

const funcionarioSchema = z.object({
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
    role: z.enum(["ADMIN", "USER"]),
});

const funcionarioEditSchema = z.object({
    id: z.number(),
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional().or(z.literal("")),
    role: z.enum(["ADMIN", "USER"]),
});

type FuncionarioFormData = z.infer<typeof funcionarioSchema> & { id?: number };

type Props = {
    funcionarioSelecionado?: FuncionarioFormData | null;
    onClose: () => void;
};

export function FuncionarioForm({ funcionarioSelecionado, onClose }: Props) {
    const isEdit = funcionarioSelecionado && "id" in funcionarioSelecionado;

    const form = useForm<FuncionarioFormData>({
        resolver: zodResolver(isEdit ? funcionarioEditSchema : funcionarioSchema),
        defaultValues: funcionarioSelecionado ?? {
            name: "",
            email: "",
            password: "",
            role: "USER",
        },
    });

    useEffect(() => {
        if (funcionarioSelecionado) {
            form.reset(funcionarioSelecionado);
        } else {
            form.reset({
                name: "",
                email: "",
                password: "",
                role: "USER",
            });
        }
    }, [funcionarioSelecionado, form]);

    const onSubmit = async (data: FuncionarioFormData) => {
        try {
            const payload = { ...data };

            // Se estiver editando e senha vazia → remove
            if (isEdit && !payload.password) {
                delete payload.password;
            }

            if (isEdit && payload.id) {
                await updateUser(payload.id, payload);
            } else {
                const payload: CreateUserDto = {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    password: data.password!, // garantido pelo form
                };

                await createUser(payload);
            }

            onClose();
        } catch (error) {
            console.error("Erro ao salvar funcionário:", error);
            alert("Erro ao salvar funcionário. Verifique os dados e tente novamente.");
        }
    };


    return (
        <div className="space-y-6 mt-6">
            {/* INFORMAÇÕES BÁSICAS */}
            <div className="space-y-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
                <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informações do Funcionário
                </h3>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-stone-700">Nome Completo *</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-stone-500" />
                        <Input
                            placeholder="Ex: João Silva"
                            {...form.register("name")}
                            className="h-11 pl-10"
                        />
                    </div>
                    {form.formState.errors.name && (
                        <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-stone-700">Email *</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-stone-500" />
                        <Input
                            type="email"
                            placeholder="usuario@exemplo.com"
                            {...form.register("email")}
                            className="h-11 pl-10"
                        />
                    </div>
                    {form.formState.errors.email && (
                        <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-stone-700">
                        Senha {isEdit ? "(deixe em branco para manter a atual)" : "*"}
                    </Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-stone-500" />
                        <Input
                            type="password"
                            placeholder={isEdit ? "••••••••" : "Mínimo 6 caracteres"}
                            {...form.register("password")}
                            className="h-11 pl-10"
                        />
                    </div>
                    {form.formState.errors.password && (
                        <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
                    )}
                </div>
            </div>

            {/* PERFIL DE ACESSO */}
            <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-900 text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Perfil de Acesso
                </h3>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-stone-700">Tipo de Usuário *</Label>
                    <Controller
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="h-11 bg-white">
                                    <SelectValue placeholder="Selecione o perfil" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">
                                        <div className="flex items-center gap-2">
                                            <UserCog className="h-4 w-4" />
                                            <div>
                                                <p className="font-medium">Usuário</p>
                                                <p className="text-xs text-stone-500">Acesso padrão ao sistema</p>
                                            </div>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="ADMIN">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            <div>
                                                <p className="font-medium">Administrador</p>
                                                <p className="text-xs text-stone-500">Acesso total ao sistema</p>
                                            </div>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {form.formState.errors.role && (
                        <p className="text-xs text-red-600">{form.formState.errors.role.message}</p>
                    )}
                </div>

                <div className="bg-white border border-amber-200 rounded p-3 text-xs text-stone-600">
                    <p className="font-medium text-amber-900 mb-1">ℹ️ Sobre os perfis:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                        <li><strong>Usuário:</strong> Pode acessar funcionalidades básicas</li>
                        <li><strong>Administrador:</strong> Acesso completo, incluindo gestão de usuários</li>
                    </ul>
                </div>
            </div>

            {/* AÇÕES */}
            <div className="flex gap-3 pt-4 border-t border-stone-200">
                <Button variant="outline" className="flex-1 h-11" onClick={onClose}>
                    Cancelar
                </Button>

                <Button
                    onClick={form.handleSubmit(onSubmit)}
                    className="flex-1 h-11 bg-amber-800 hover:bg-amber-900 text-white font-semibold"
                >
                    {isEdit ? "Salvar Alterações" : "Criar Funcionário"}
                </Button>
            </div>
        </div>
    );
}