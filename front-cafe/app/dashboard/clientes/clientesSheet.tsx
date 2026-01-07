"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Building2, FileText, Mail, Phone, MapPin, MessageSquare, Search } from "lucide-react";
import { createCliente, updateCliente, type CreateClienteDto, type UpdateClienteDto } from "@/lib/cliente-request";
import { toast } from "sonner";

// Schema atualizado com campos separados de endereço
const clienteSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  tipo: z.enum(["FISICA", "JURIDICA"]),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().min(10, "Telefone inválido"),
  // Campos de endereço separados
  cep: z.string().min(8, "CEP inválido").max(9, "CEP inválido"),
  logradouro: z.string().min(2, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(2, "Bairro é obrigatório"),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  uf: z.string().min(2, "UF é obrigatória").max(2, "UF deve ter 2 caracteres"),
  observacao: z.string().optional(),
});

const clienteEditSchema = clienteSchema.extend({
  id: z.number(),
});

type ClienteFormData = z.infer<typeof clienteSchema> & { id?: number };

type Props = {
  clienteSelecionado?: ClienteFormData | null;
  onClose: () => void;
};

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export function ClienteForm({ clienteSelecionado, onClose }: Props) {
  const isEdit = clienteSelecionado && "id" in clienteSelecionado;
  const [loadingCEP, setLoadingCEP] = useState(false);

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(isEdit ? clienteEditSchema : clienteSchema),
    defaultValues: clienteSelecionado ?? {
      nome: "",
      tipo: "FISICA",
      cpfCnpj: "",
      email: "",
      telefone: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
      observacao: "",
    },
  });

  const tipoCliente = form.watch("tipo");

  useEffect(() => {
    if (clienteSelecionado) {
      form.reset(clienteSelecionado);
    } else {
      form.reset({
        nome: "",
        tipo: "FISICA",
        cpfCnpj: "",
        email: "",
        telefone: "",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: "",
        observacao: "",
      });
    }
  }, [clienteSelecionado, form]);

  // Função para buscar CEP no ViaCEP
  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");
    
    if (cepLimpo.length !== 8) return;
    
    setLoadingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data: ViaCEPResponse = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      
      // Preenche os campos com os dados do ViaCEP
      form.setValue("logradouro", data.logradouro || "");
      form.setValue("complemento", data.complemento || "");
      form.setValue("bairro", data.bairro || "");
      form.setValue("cidade", data.localidade || "");
      form.setValue("uf", data.uf || "");
      
      // Foca no campo número após preencher os dados
      const numeroInput = document.getElementById("numero");
      if (numeroInput) numeroInput.focus();
      
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setLoadingCEP(false);
    }
  };

  const onSubmit = async (data: ClienteFormData) => {
    try {
      // Concatena o endereço completo no formato desejado com CEP
      const enderecoCompleto = `${data.logradouro}, ${data.numero}${data.complemento ? ` - ${data.complemento}` : ''} - ${data.bairro} - ${data.cidade}/${data.uf} - ${data.cep}`;
      
      if (isEdit && data.id) {
        const updateData: UpdateClienteDto = {
          nome: data.nome,
          tipo: data.tipo,
          cpfCnpj: data.cpfCnpj,
          email: data.email || undefined,
          telefone: data.telefone,
          endereco: enderecoCompleto,
          observacao: data.observacao || undefined,
        };
        await updateCliente(data.id, updateData);
        toast.success("Sucesso", {
          description: "Cliente atualizado com sucesso.",
        });
      } else {
        const createData: CreateClienteDto = {
          nome: data.nome,
          tipo: data.tipo,
          cpfCnpj: data.cpfCnpj,
          email: data.email || undefined,
          telefone: data.telefone,
          endereco: enderecoCompleto,
          observacao: data.observacao || undefined,
        };
        await createCliente(createData);
        toast.success("Sucesso", {
          description: "Cliente cadastrado com sucesso.",
        });
      }
      onClose();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro", {
        description: "Não foi possível salvar o cliente. Verifique os dados e tente novamente.",
      });
    }
  };

  const formatarCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatarCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const formatarTelefone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const formatarCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  return (
    <div className="space-y-6 mt-6">
      {/* TIPO DE CLIENTE */}
      <div className="space-y-2 ml-4">
        <Label className="text-sm font-medium text-stone-700">Tipo de Cliente *</Label>
        <Controller
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FISICA">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Pessoa Física
                  </div>
                </SelectItem>
                <SelectItem value="JURIDICA">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Pessoa Jurídica
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.tipo && (
          <p className="text-xs text-red-600">{form.formState.errors.tipo.message}</p>
        )}
      </div>

      {/* INFORMAÇÕES BÁSICAS */}
      <div className="space-y-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
        <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
          {tipoCliente === "FISICA" ? (
            <User className="h-4 w-4" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
          Informações {tipoCliente === "FISICA" ? "Pessoais" : "da Empresa"}
        </h3>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-stone-700">
            {tipoCliente === "FISICA" ? "Nome Completo" : "Razão Social"} *
          </Label>
          <div className="relative">
            {tipoCliente === "FISICA" ? (
              <User className="absolute left-3 top-3 h-5 w-5 text-stone-500" />
            ) : (
              <Building2 className="absolute left-3 top-3 h-5 w-5 text-stone-500" />
            )}
            <Input
              placeholder={
                tipoCliente === "FISICA" ? "Ex: João Silva" : "Ex: Empresa XYZ Ltda"
              }
              {...form.register("nome")}
              className="h-11 pl-10"
            />
          </div>
          {form.formState.errors.nome && (
            <p className="text-xs text-red-600">{form.formState.errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-stone-700">
            {tipoCliente === "FISICA" ? "CPF" : "CNPJ"} *
          </Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-5 w-5 text-stone-500" />
            <Input
              placeholder={
                tipoCliente === "FISICA" ? "000.000.000-00" : "00.000.000/0000-00"
              }
              {...form.register("cpfCnpj")}
              onChange={(e) => {
                const formatted =
                  tipoCliente === "FISICA"
                    ? formatarCPF(e.target.value)
                    : formatarCNPJ(e.target.value);
                form.setValue("cpfCnpj", formatted);
              }}
              className="h-11 pl-10"
              maxLength={tipoCliente === "FISICA" ? 14 : 18}
            />
          </div>
          {form.formState.errors.cpfCnpj && (
            <p className="text-xs text-red-600">{form.formState.errors.cpfCnpj.message}</p>
          )}
        </div>
      </div>

      {/* CONTATO */}
      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 text-sm flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Informações de Contato
        </h3>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-stone-700">Telefone *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-5 w-5 text-stone-500" />
            <Input
              placeholder="(00) 00000-0000"
              {...form.register("telefone")}
              onChange={(e) => {
                const formatted = formatarTelefone(e.target.value);
                form.setValue("telefone", formatted);
              }}
              className="h-11 pl-10 bg-white"
              maxLength={15}
            />
          </div>
          {form.formState.errors.telefone && (
            <p className="text-xs text-red-600">{form.formState.errors.telefone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-stone-700">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-stone-500" />
            <Input
              type="email"
              placeholder="exemplo@email.com"
              {...form.register("email")}
              className="h-11 pl-10 bg-white"
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>
      </div>

      {/* ENDEREÇO */}
      <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="font-semibold text-green-900 text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Endereço
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CEP */}
          <div className="space-y-2 md:col-span-1">
            <Label className="text-sm font-medium text-stone-700">CEP *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-stone-500" />
              <Input
                placeholder="00000-000"
                {...form.register("cep")}
                onChange={(e) => {
                  const formatted = formatarCEP(e.target.value);
                  form.setValue("cep", formatted);
                  
                  // Busca CEP automaticamente quando completo
                  if (formatted.replace(/\D/g, "").length === 8) {
                    buscarCEP(formatted);
                  }
                }}
                className="h-11 pl-10 bg-white"
                maxLength={9}
              />
              {loadingCEP && (
                <div className="absolute right-3 top-3">
                  <div className="h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {form.formState.errors.cep && (
              <p className="text-xs text-red-600">{form.formState.errors.cep.message}</p>
            )}
          </div>

          {/* Logradouro */}
          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm font-medium text-stone-700">Logradouro *</Label>
            <Input
              placeholder="Rua, Avenida, etc."
              {...form.register("logradouro")}
              className="h-11 bg-white"
            />
            {form.formState.errors.logradouro && (
              <p className="text-xs text-red-600">{form.formState.errors.logradouro.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Número */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-stone-700">Número *</Label>
            <Input
              id="numero"
              placeholder="Nº"
              {...form.register("numero")}
              className="h-11 bg-white"
            />
            {form.formState.errors.numero && (
              <p className="text-xs text-red-600">{form.formState.errors.numero.message}</p>
            )}
          </div>

          {/* Complemento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-stone-700">Complemento</Label>
            <Input
              placeholder="Apto, Sala, etc."
              {...form.register("complemento")}
              className="h-11 bg-white"
            />
          </div>

          {/* Bairro */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-stone-700">Bairro *</Label>
            <Input
              placeholder="Bairro"
              {...form.register("bairro")}
              className="h-11 bg-white"
            />
            {form.formState.errors.bairro && (
              <p className="text-xs text-red-600">{form.formState.errors.bairro.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cidade */}
          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm font-medium text-stone-700">Cidade *</Label>
            <Input
              placeholder="Cidade"
              {...form.register("cidade")}
              className="h-11 bg-white"
            />
            {form.formState.errors.cidade && (
              <p className="text-xs text-red-600">{form.formState.errors.cidade.message}</p>
            )}
          </div>

          {/* UF */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-stone-700">UF *</Label>
            <Input
              placeholder="SP"
              {...form.register("uf")}
              className="h-11 bg-white uppercase"
              maxLength={2}
              onChange={(e) => form.setValue("uf", e.target.value.toUpperCase())}
            />
            {form.formState.errors.uf && (
              <p className="text-xs text-red-600">{form.formState.errors.uf.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* OBSERVAÇÕES */}
      <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-amber-900 text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Observações
        </h3>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-stone-700">
            Observações Adicionais
          </Label>
          <Textarea
            placeholder="Informações adicionais sobre o cliente..."
            {...form.register("observacao")}
            className="min-h-[100px] bg-white resize-none"
          />
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
          {isEdit ? "Salvar Alterações" : "Criar Cliente"}
        </Button>
      </div>
    </div>
  );
}