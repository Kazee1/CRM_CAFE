// prisma/seed.ts
import { PrismaClient, TipoProduto, TipoCafe, StatusProduto, TipoCliente, StatusCliente, StatusPedido } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: 'file:./dev.db',
  }),
});

// ============================================
// CONFIGURAÇÃO DA SIMULAÇÃO
// ============================================

const CONFIG = {
    ano: 2024,
    seed: 42, // Seed para reprodutibilidade
    basePedidosDia: 5,
    baseClientesMes: 10,

    // Quantidade de produtos a criar durante o ano
    qtdProdutos: {
        CAFE: 30,
        ACESSORIO: 15,
        COMBO: 9
    },

    // Eventos excepcionais (quebra de curva)
    eventosExcepcionais: [
        { mes: 3, tipo: 'campanha', impacto: 1.4, descricao: 'Campanha de mídia agressiva' },
        { mes: 7, tipo: 'crise', impacto: 0.6, descricao: 'Problema logístico com fornecedor' },
        { mes: 9, tipo: 'recuperacao', impacto: 1.25, descricao: 'Recuperação pós-crise' }
    ],

    // Churn de clientes
    churn: {
        probabilidadeBase: 0.03, // 3% ao mês para clientes regulares
        VIP: 0.01,               // VIPs têm menos churn
        REGULAR: 0.03,
        OCASIONAL: 0.08          // Ocasionais têm mais churn
    } as Record<string, number>,

    // Reativação de clientes
    reativacao: {
        probabilidade: 0.15,     // 15% de chance de reativar por mês
        aposInativoDias: 90      // Após 90 dias sem comprar
    },

    // Sazonalidade mensal (1.0 = normal)
    sazonalidade: {
        1: 0.7,   // Janeiro - férias
        2: 0.8,   // Fevereiro
        3: 0.9,   // Março
        4: 1.0,   // Abril
        5: 1.1,   // Maio - Dia das Mães
        6: 1.2,   // Junho - Dia dos Namorados
        7: 1.0,   // Julho
        8: 1.1,   // Agosto - Dia dos Pais
        9: 1.3,   // Setembro
        10: 1.4,  // Outubro
        11: 1.6,  // Novembro - Black Friday
        12: 2.0   // Dezembro - Natal
    },

    // Validade de cafés (dias)
    validadeCafeDias: 180,

    // Margem alvo (para cálculos)
    margemAlvo: {
        CAFE: 0.45,       // 45% de margem
        ACESSORIO: 0.50,  // 50% de margem
        COMBO: 0.40       // 40% de margem (desconto)
    },

    // Limites estatísticos (evitar outliers)
    limites: {
        maxItensPorPedidoPF: 5,
        maxItensPorPedidoPJ: 12,
        maxQuantidadeItemPF: 4,
        maxQuantidadeItemPJ: 10,
        maxTicketPF: 500,
        maxTicketPJ: 1500
    },

    // Distribuição de tipo de cliente
    distribuicaoCliente: {
        VIP: 0.20,        // 20% são VIPs
        REGULAR: 0.50,    // 50% são regulares
        OCASIONAL: 0.30   // 30% são ocasionais
    },

    // Distribuição pessoa física/jurídica
    distribuicaoTipoPessoa: {
        FISICA: 0.75,     // 75% são PF
        JURIDICA: 0.25    // 25% são PJ
    },

    // Distribuição de produtos por pedido
    distribuicaoProduto: {
        CAFE: 0.60,
        COMBO: 0.25,
        ACESSORIO: 0.15
    },

    // Distribuição de status (agora considerando fluxo lógico)
    distribuicaoStatus: {
        CONCLUIDO: 0.85,
        CANCELADO: 0.05,
        PAGO: 0.05,
        EM_PREPARO: 0.03,
        PENDENTE: 0.02
    },

    // Quantidade de itens por pedido
    minItensPorPedido: 1,
    maxItensPorPedido: 7,

    // Probabilidade de cancelamento por estágio
    probabilidadeCancelamento: {
        PENDENTE: 0.7,    // 70% dos cancelamentos são em PENDENTE
        PAGO: 0.2,        // 20% dos cancelamentos são em PAGO
        EM_PREPARO: 0.1   // 10% dos cancelamentos são em EM_PREPARO
    },

    // Configuração para refinos
    refinamentos: {
        // 2.2: Se true, não cria pedido quando cancelado em PENDENTE
        naoCriarPedidoCanceladoPendente: true,
        // 2.3: Se true, inativa combos que dependem de produtos vencidos
        inativarCombosComProdutosVencidos: true
    }
};

// ============================================
// BASE DE DADOS DE ENDEREÇOS
// ============================================

const CIDADES = [
    { cidade: 'Espírito Santo do Pinhal', estado: 'SP', cep: '13990-000' },
    { cidade: 'Belo Horizonte', estado: 'MG', cep: '30100-000' },
    { cidade: 'São Paulo', estado: 'SP', cep: '01000-000' },
    { cidade: 'Rio de Janeiro', estado: 'RJ', cep: '20000-000' },
    { cidade: 'Curitiba', estado: 'PR', cep: '80000-000' },
    { cidade: 'Porto Alegre', estado: 'RS', cep: '90000-000' },
    { cidade: 'Salvador', estado: 'BA', cep: '40000-000' },
    { cidade: 'Fortaleza', estado: 'CE', cep: '60000-000' },
    { cidade: 'Brasília', estado: 'DF', cep: '70000-000' },
    { cidade: 'Recife', estado: 'PE', cep: '50000-000' },
    { cidade: 'Manaus', estado: 'AM', cep: '69000-000' },
    { cidade: 'Belém', estado: 'PA', cep: '66000-000' },
    { cidade: 'Goiânia', estado: 'GO', cep: '74000-000' },
    { cidade: 'Campinas', estado: 'SP', cep: '13000-000' },
    { cidade: 'Uberlândia', estado: 'MG', cep: '38400-000' },
    { cidade: 'Florianópolis', estado: 'SC', cep: '88000-000' },
    { cidade: 'Vitória', estado: 'ES', cep: '29000-000' },
    { cidade: 'São Luís', estado: 'MA', cep: '65000-000' },
    { cidade: 'Natal', estado: 'RN', cep: '59000-000' },
    { cidade: 'Aracaju', estado: 'SE', cep: '49000-000' }
];

const RUAS = [
    'Rua Valdemar da Silva Costa', 'Rua das Flores', 'Rua dos Bandeirantes',
    'Avenida Paulista', 'Rua XV de Novembro', 'Rua Barão do Rio Branco',
    'Avenida Afonso Pena', 'Rua Sete de Setembro', 'Rua Marechal Deodoro',
    'Avenida Brasil', 'Rua Santos Dumont', 'Rua Tiradentes',
    'Avenida Getúlio Vargas', 'Rua Dom Pedro II', 'Rua José Bonifácio',
    'Rua Floriano Peixoto', 'Avenida Rio Branco', 'Rua Quinze de Novembro',
    'Rua Coronel José Justino', 'Avenida Independência'
];

const BAIRROS = [
    'Residencial Vereadora Hermengarda Leme Marinelli', 'Centro', 'Jardim América',
    'Vila Nova', 'Santa Maria', 'Boa Vista', 'Alto da Glória',
    'Jardim Paulista', 'Vila Mariana', 'Pinheiros', 'Mooca',
    'Cidade Jardim', 'São Francisco', 'Jardim Europa', 'Santa Cecília',
    'Vila Madalena', 'Perdizes', 'Tatuapé', 'Ipiranga', 'Santana'
];

const COMPLEMENTOS = ['casa', 'apto 101', 'apto 202', 'apto 305', 'bloco A', 'bloco B', 'casa 1', 'casa 2', 'sobrado', 'sala 201', 'sala 305', 'loja 12'];

// Nomes para empresas
const EMPRESAS = [
    'Café & Cia Ltda', 'Coffee Shop Brasil', 'Grãos Especiais Comércio',
    'Aroma Cafés', 'Sabor & Arte Cafeteria', 'Coffee Point',
    'Cafeteria Moderna', 'Expresso Gourmet', 'Café Premium',
    'Coffee Masters', 'Aroma & Sabor', 'Café do Centro',
    'Coffee House Brasil', 'Cafeteria Elite', 'Grãos Nobres'
];

// ============================================
// UTILIDADES
// ============================================

// Gerador de números pseudo-aleatórios com seed
class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    nextFloat(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }
}

const rng = new SeededRandom(CONFIG.seed);

function random(min: number, max: number): number {
    return rng.nextFloat(min, max);
}

function randomInt(min: number, max: number): number {
    return rng.nextInt(min, max);
}

function escolherPonderado<T>(opcoes: Record<string, number>): T {
    const rand = random(0, 1);
    let acumulado = 0;

    for (const [chave, peso] of Object.entries(opcoes)) {
        acumulado += peso;
        if (rand <= acumulado) {
            return chave as T;
        }
    }

    return Object.keys(opcoes)[0] as T;
}

function gerarData(ano: number, mes: number, dia: number): Date {
    return new Date(ano, mes - 1, dia);
}

function getDiasNoMes(ano: number, mes: number): number {
    return new Date(ano, mes, 0).getDate();
}

// ============================================
// CATÁLOGO DE PRODUTOS (DINÂMICO)
// ============================================

// Armazena produtos ativos
const produtosAtivos = {
    cafes: [] as any[],
    acessorios: [] as any[],
    combos: [] as any[]
};

// Templates de produtos
const TEMPLATES_CAFE = [
    { nome: 'Café Especial 250g - Grão', tipo: TipoCafe.GRAO, peso: 250, preco: 45, custo: 25, sca: 85.5 },
    { nome: 'Café Especial 250g - Moído', tipo: TipoCafe.MOIDO, peso: 250, preco: 42, custo: 23, sca: 84.0 },
    { nome: 'Café Premium 500g - Grão', tipo: TipoCafe.GRAO, peso: 500, preco: 85, custo: 45, sca: 88.0 },
    { nome: 'Café Premium 500g - Moído', tipo: TipoCafe.MOIDO, peso: 500, preco: 82, custo: 43, sca: 87.0 },
    { nome: 'Café Cápsula - Intenso (10 un)', tipo: TipoCafe.CAPSULA, peso: 50, preco: 35, custo: 18, sca: 82.0 },
    { nome: 'Café Cápsula - Suave (10 un)', tipo: TipoCafe.CAPSULA, peso: 50, preco: 33, custo: 17, sca: 81.0 },
    { nome: 'Café Gourmet 1kg - Grão', tipo: TipoCafe.GRAO, peso: 1000, preco: 165, custo: 90, sca: 90.0 },
    { nome: 'Café Gourmet 1kg - Moído', tipo: TipoCafe.MOIDO, peso: 1000, preco: 160, custo: 88, sca: 89.5 },
    { nome: 'Café Cápsula - Descafeinado (10 un)', tipo: TipoCafe.CAPSULA, peso: 50, preco: 38, custo: 20, sca: 80.0 },
    { nome: 'Café Orgânico 250g - Grão', tipo: TipoCafe.GRAO, peso: 250, preco: 52, custo: 30, sca: 86.0 },
    { nome: 'Café Blend Especial 500g - Grão', tipo: TipoCafe.GRAO, peso: 500, preco: 78, custo: 42, sca: 85.0 },
    { nome: 'Café Torrado Claro 250g - Grão', tipo: TipoCafe.GRAO, peso: 250, preco: 48, custo: 27, sca: 84.5 },
    { nome: 'Café Torrado Médio 250g - Moído', tipo: TipoCafe.MOIDO, peso: 250, preco: 45, custo: 25, sca: 83.5 },
    { nome: 'Café Cápsula - Forte (10 un)', tipo: TipoCafe.CAPSULA, peso: 50, preco: 36, custo: 19, sca: 81.5 },
    { nome: 'Café Single Origin 250g - Grão', tipo: TipoCafe.GRAO, peso: 250, preco: 55, custo: 32, sca: 87.5 }
];

const TEMPLATES_ACESSORIO = [
    { nome: 'Caneca Cerâmica Premium', preco: 45, custo: 20 },
    { nome: 'Coador V60 Hario', preco: 65, custo: 35 },
    { nome: 'Moedor Manual', preco: 120, custo: 60 },
    { nome: 'Prensa Francesa 600ml', preco: 95, custo: 50 },
    { nome: 'Kit Filtros de Papel (100 un)', preco: 25, custo: 12 },
    { nome: 'Chaleira Gooseneck', preco: 180, custo: 95 },
    { nome: 'Balança Digital Para Café', preco: 85, custo: 45 },
    { nome: 'Espumador de Leite Elétrico', preco: 110, custo: 58 },
    { nome: 'Aeropress', preco: 250, custo: 130 },
    { nome: 'Kit Barista Iniciante', preco: 150, custo: 80 },
    { nome: 'Termômetro Digital', preco: 55, custo: 28 },
    { nome: 'Porta-filtro Profissional', preco: 135, custo: 70 },
    { nome: 'Jarra de Leite Inox', preco: 68, custo: 35 },
    { nome: 'Tamper Profissional', preco: 95, custo: 50 },
    { nome: 'Garrafa Térmica 500ml', preco: 75, custo: 40 }
];

async function criarCafe(template: typeof TEMPLATES_CAFE[0], data: Date) {
    const variacao = randomInt(1, 999);
    const produto = await prisma.produto.create({
        data: {
            nome: `${template.nome} #${variacao}`,
            tipoProduto: TipoProduto.CAFE,
            status: StatusProduto.ATIVO,
            precoVenda: template.preco,
            custoUnitario: template.custo,
            estoque: randomInt(200, 600),
            createdAt: data,
            cafe: {
                create: {
                    tipoCafe: template.tipo,
                    pontuacaoSCA: template.sca,
                    pesoGramas: template.peso,
                    numeroLote: `LOTE-2024-${randomInt(100, 999)}`,
                    dataTorra: data,
                    dataValidade: new Date(data.getTime() + CONFIG.validadeCafeDias * 24 * 60 * 60 * 1000),
                    fornecedor: `Fazenda ${['Santa Clara', 'Boa Vista', 'Monte Alegre', 'Vale Verde'][randomInt(0, 3)]}`
                }
            }
        }
    });

    produtosAtivos.cafes.push(produto);
    return produto;
}

async function criarAcessorio(template: typeof TEMPLATES_ACESSORIO[0], data: Date) {
    const variacao = randomInt(1, 999);
    const produto = await prisma.produto.create({
        data: {
            nome: `${template.nome} #${variacao}`,
            tipoProduto: TipoProduto.ACESSORIO,
            status: StatusProduto.ATIVO,
            precoVenda: template.preco,
            custoUnitario: template.custo,
            estoque: randomInt(100, 300),
            createdAt: data,
            acessorio: {
                create: {
                    descricao: `Acessório de alta qualidade para preparo de café`
                }
            }
        }
    });

    produtosAtivos.acessorios.push(produto);
    return produto;
}

// CORREÇÃO: Função para criar combo baseada no seu schema
async function criarCombo(nome: string, preco: number, data: Date) {
    const variacao = randomInt(1, 999);
    
    // Criar o produto do tipo COMBO
    const produtoCombo = await prisma.produto.create({
        data: {
            nome: `${nome} #${variacao}`,
            tipoProduto: TipoProduto.COMBO,
            status: StatusProduto.ATIVO,
            precoVenda: preco,
            custoUnitario: preco * 0.6,
            estoque: randomInt(50, 150), // Combos podem ter estoque próprio
            createdAt: data
        }
    });

    // Adicionar itens ao combo (2-4 produtos aleatórios)
    const qtdItensCombo = randomInt(2, 4);
    const produtosParaCombo: number[] = [];
    
    for (let i = 0; i < qtdItensCombo; i++) {
        const todosProdutos = [...produtosAtivos.cafes, ...produtosAtivos.acessorios];
        if (todosProdutos.length === 0) break;
        
        const produtoBase = todosProdutos[randomInt(0, todosProdutos.length - 1)];
        
        // Não adicionar o mesmo produto duas vezes no combo
        if (!produtosParaCombo.includes(produtoBase.id)) {
            produtosParaCombo.push(produtoBase.id);
            
            await prisma.comboItem.create({
                data: {
                    comboId: produtoCombo.id,
                    produtoId: produtoBase.id,
                    quantidade: randomInt(1, 3)
                }
            });
        }
    }

    produtosAtivos.combos.push(produtoCombo);
    return produtoCombo;
}

// Distribui criação de produtos ao longo do ano
function calcularMesCriacaoProduto(index: number, total: number): number {
    return Math.floor((index / total) * 12) + 1;
}

async function criarProdutosDoMes(mes: number, data: Date) {
    const produtosCriados = { cafes: 0, acessorios: 0, combos: 0 };

    // Cafés
    for (let i = 0; i < CONFIG.qtdProdutos.CAFE; i++) {
        if (calcularMesCriacaoProduto(i, CONFIG.qtdProdutos.CAFE) === mes) {
            const template = TEMPLATES_CAFE[i % TEMPLATES_CAFE.length];
            await criarCafe(template, data);
            produtosCriados.cafes++;
        }
    }

    // Acessórios
    for (let i = 0; i < CONFIG.qtdProdutos.ACESSORIO; i++) {
        if (calcularMesCriacaoProduto(i, CONFIG.qtdProdutos.ACESSORIO) === mes) {
            const template = TEMPLATES_ACESSORIO[i % TEMPLATES_ACESSORIO.length];
            await criarAcessorio(template, data);
            produtosCriados.acessorios++;
        }
    }

    // Combos (após ter produtos para combinar)
    if (produtosAtivos.cafes.length > 0 && produtosAtivos.acessorios.length > 0) {
        for (let i = 0; i < CONFIG.qtdProdutos.COMBO; i++) {
            if (calcularMesCriacaoProduto(i, CONFIG.qtdProdutos.COMBO) === mes) {
                const combos = [
                    { nome: 'Combo Iniciante', preco: 110 },
                    { nome: 'Combo Premium', preco: 200 },
                    { nome: 'Combo Barista', preco: 250 },
                    { nome: 'Combo Casa & Café', preco: 180 },
                    { nome: 'Combo Profissional', preco: 300 }
                ];
                const comboTemplate = combos[i % combos.length];
                await criarCombo(comboTemplate.nome, comboTemplate.preco, data);
                produtosCriados.combos++;
            }
        }
    }

    return produtosCriados;
}

// CORREÇÃO: Inativar combos que dependem de produtos vencidos
async function inativarCombosComProdutosVencidos() {
    let combosInativados = 0;
    
    // Buscar todos os combos ativos
    const combosAtivos = await prisma.produto.findMany({
        where: {
            tipoProduto: TipoProduto.COMBO,
            status: StatusProduto.ATIVO
        },
        include: {
            comboComoCombo: { // Relação correta: comboComoCombo
                include: {
                    produto: {
                        include: {
                            cafe: true
                        }
                    }
                }
            }
        }
    });

    for (const combo of combosAtivos) {
        let inativarCombo = false;
        
        // Verificar cada item do combo
        for (const item of combo.comboComoCombo) {
            const produto = item.produto;
            
            // Se o produto for café e estiver vencido
            if (produto.cafe && produto.cafe.dataValidade && produto.cafe.dataValidade < new Date()) {
                inativarCombo = true;
                break;
            }
            
            // Se o produto for inativo
            if (produto.status === StatusProduto.INATIVO) {
                inativarCombo = true;
                break;
            }
        }
        
        if (inativarCombo) {
            await prisma.produto.update({
                where: { id: combo.id },
                data: { status: StatusProduto.INATIVO }
            });
            
            // Remover da lista de produtos ativos
            const index = produtosAtivos.combos.findIndex(c => c.id === combo.id);
            if (index !== -1) {
                produtosAtivos.combos.splice(index, 1);
            }
            
            combosInativados++;
        }
    }
    
    return combosInativados;
}

// Reposição de estoque
async function reporEstoque(mes: number) {
    const chanceReposicao = mes >= 11 ? 0.8 : 0.4;

    if (random(0, 1) < chanceReposicao) {
        const todosAtivos = [...produtosAtivos.cafes, ...produtosAtivos.acessorios, ...produtosAtivos.combos];

        for (const produto of todosAtivos) {
            const estoqueAtual = await prisma.produto.findUnique({
                where: { id: produto.id },
                select: { estoque: true, tipoProduto: true }
            });

            if (estoqueAtual && estoqueAtual.estoque !== null && estoqueAtual.estoque < 100) {
                const novoEstoque = estoqueAtual.tipoProduto === TipoProduto.COMBO ? 
                    randomInt(50, 150) : randomInt(200, 500);
                
                await prisma.produto.update({
                    where: { id: produto.id },
                    data: { estoque: estoqueAtual.estoque + novoEstoque }
                });
            }
        }

        return true;
    }

    return false;
}

// ============================================
// GERADOR DE CLIENTES
// ============================================

type TipoClienteSimulacao = 'VIP' | 'REGULAR' | 'OCASIONAL';

interface ClienteSimulacao {
    id: number;
    tipo: TipoClienteSimulacao;
    tipoPessoa: TipoCliente;
    frequenciaCompra: number;
    ticketMedio: number;
    ultimaCompra?: Date;
    inativo: boolean;
    dataChurn?: Date;
}

const clientesSimulacao: ClienteSimulacao[] = [];

function gerarNomeCliente(): string {
    const nomes = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia', 'Lucas', 'Beatriz', 'Rafael', 'Camila'];
    const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Ferreira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento'];
    return `${nomes[randomInt(0, nomes.length - 1)]} ${sobrenomes[randomInt(0, sobrenomes.length - 1)]}`;
}

function gerarNomeEmpresa(): string {
    return EMPRESAS[randomInt(0, EMPRESAS.length - 1)];
}

function gerarCPF(): string {
    const num = randomInt(10000000000, 99999999999);
    return String(num).padStart(11, '0');
}

function gerarCNPJ(): string {
    const num = randomInt(10000000000000, 99999999999999);
    return String(num).padStart(14, '0');
}

function gerarTelefone(): string {
    return `(${randomInt(11, 99)}) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;
}

function gerarEndereco(): string {
    const rua = RUAS[randomInt(0, RUAS.length - 1)];
    const numero = randomInt(1, 999);
    const complemento = COMPLEMENTOS[randomInt(0, COMPLEMENTOS.length - 1)];
    const bairro = BAIRROS[randomInt(0, BAIRROS.length - 1)];
    const localidade = CIDADES[randomInt(0, CIDADES.length - 1)];
    const cepBase = parseInt(localidade.cep.replace('-', ''));
    const cep = `${String(cepBase + randomInt(0, 999)).padStart(8, '0')}`;
    const cepFormatado = `${cep.slice(0, 5)}-${cep.slice(5)}`;

    return `${rua}, ${numero} - ${complemento} - ${bairro} - ${localidade.cidade}/${localidade.estado} - ${cepFormatado}`;
}

async function criarCliente(tipoCliente: TipoClienteSimulacao, data: Date): Promise<ClienteSimulacao> {
    const tipoPessoa = escolherPonderado<TipoCliente>(CONFIG.distribuicaoTipoPessoa);

    const cliente = await prisma.cliente.create({
        data: {
            nome: tipoPessoa === TipoCliente.FISICA ? gerarNomeCliente() : gerarNomeEmpresa(),
            tipo: tipoPessoa,
            cpfCnpj: tipoPessoa === TipoCliente.FISICA ? gerarCPF() : gerarCNPJ(),
            email: `cliente${Date.now()}${randomInt(1000, 9999)}@email.com`,
            telefone: gerarTelefone(),
            endereco: gerarEndereco(),
            status: StatusCliente.ATIVO,
            createdAt: data
        }
    });

    let frequencia: number;
    let ticket: number;

    switch (tipoCliente) {
        case 'VIP':
            frequencia = randomInt(7, 14);
            ticket = tipoPessoa === TipoCliente.JURIDICA ? random(300, 600) : random(150, 300);
            break;
        case 'REGULAR':
            frequencia = randomInt(20, 40);
            ticket = tipoPessoa === TipoCliente.JURIDICA ? random(180, 350) : random(80, 150);
            break;
        case 'OCASIONAL':
            frequencia = randomInt(60, 120);
            ticket = tipoPessoa === TipoCliente.JURIDICA ? random(100, 200) : random(40, 90);
            break;
        default:
            frequencia = randomInt(20, 40);
            ticket = random(80, 150);
    }

    const clienteSim: ClienteSimulacao = {
        id: cliente.id,
        tipo: tipoCliente,
        tipoPessoa,
        frequenciaCompra: frequencia,
        ticketMedio: ticket,
        ultimaCompra: undefined,
        inativo: false
    };

    clientesSimulacao.push(clienteSim);
    return clienteSim;
}

async function gerarClientesParaMes(mes: number) {
    const fatorSazonalidade = CONFIG.sazonalidade[mes as keyof typeof CONFIG.sazonalidade];
    const evento = CONFIG.eventosExcepcionais.find(e => e.mes === mes);
    const fatorEvento = evento ? evento.impacto : 1.0;
    const qtdClientes = Math.round(CONFIG.baseClientesMes * fatorSazonalidade * fatorEvento);

    for (let i = 0; i < qtdClientes; i++) {
        const tipoCliente = escolherPonderado<TipoClienteSimulacao>(CONFIG.distribuicaoCliente);
        const diaAleatorio = randomInt(1, getDiasNoMes(CONFIG.ano, mes));
        const data = gerarData(CONFIG.ano, mes, diaAleatorio);
        await criarCliente(tipoCliente, data);
    }
}

// ============================================
// GESTÃO DE CHURN E REATIVAÇÃO
// ============================================

async function processarChurn(mes: number, dataAtual: Date) {
    let clientesChurned = 0;
    for (const cliente of clientesSimulacao) {
        if (cliente.inativo || !cliente.ultimaCompra) continue;
        
        const diasSemComprar = Math.floor(
            (dataAtual.getTime() - cliente.ultimaCompra.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasSemComprar > cliente.frequenciaCompra * 2) {
            const taxaChurn = CONFIG.churn[cliente.tipo];
            if (random(0, 1) < taxaChurn) {
                cliente.inativo = true;
                cliente.dataChurn = dataAtual;
                clientesChurned++;

                await prisma.cliente.update({
                    where: { id: cliente.id },
                    data: { status: StatusCliente.INATIVO }
                });
            }
        }
    }
    return clientesChurned;
}

async function processarReativacao(mes: number, dataAtual: Date) {
    let clientesReativados = 0;
    for (const cliente of clientesSimulacao) {
        if (!cliente.inativo || !cliente.dataChurn) continue;
        
        const diasInativo = Math.floor(
            (dataAtual.getTime() - cliente.dataChurn.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasInativo >= CONFIG.reativacao.aposInativoDias) {
            if (random(0, 1) < CONFIG.reativacao.probabilidade) {
                cliente.inativo = false;
                cliente.dataChurn = undefined;
                clientesReativados++;

                await prisma.cliente.update({
                    where: { id: cliente.id },
                    data: { status: StatusCliente.ATIVO }
                });
            }
        }
    }
    return clientesReativados;
}

// ============================================
// GERADOR DE PEDIDOS
// ============================================

async function verificarValidadeCafe(produtoId: number, dataAtual: Date): Promise<boolean> {
    const cafe = await prisma.cafe.findFirst({
        where: { produtoId }
    });

    if (!cafe || !cafe.dataValidade) return true;
    return cafe.dataValidade > dataAtual;
}

async function marcarProdutoVencido(produtoId: number) {
    await prisma.produto.update({
        where: { id: produtoId },
        data: { status: StatusProduto.INATIVO }
    });
}

async function processarProdutosVencidos(dataAtual: Date) {
    let produtosVencidos = 0;

    const cafes = await prisma.cafe.findMany({
        where: {
            dataValidade: { lte: dataAtual },
            produto: { status: StatusProduto.ATIVO }
        },
        select: { produtoId: true }
    });

    for (const cafe of cafes) {
        await marcarProdutoVencido(cafe.produtoId);

        const index = produtosAtivos.cafes.findIndex(c => c.id === cafe.produtoId);
        if (index !== -1) {
            produtosAtivos.cafes.splice(index, 1);
            produtosVencidos++;
        }
    }

    return produtosVencidos;
}

// CORREÇÃO: Consumo de estoque de combo baseado no seu schema
async function consumirEstoqueCombo(comboId: number, quantidade: number) {
    // Buscar os itens do combo
    const comboItens = await prisma.comboItem.findMany({
        where: { comboId },
        include: { produto: true }
    });

    // Primeiro, verificar se todos os itens têm estoque suficiente
    for (const item of comboItens) {
        const produto = await prisma.produto.findUnique({
            where: { id: item.produtoId },
            select: { estoque: true, tipoProduto: true }
        });

        // Para produtos base (não combos), verificar estoque
        if (produto && produto.tipoProduto !== TipoProduto.COMBO && produto.estoque !== null) {
            const qtdNecessaria = item.quantidade * quantidade;
            if (produto.estoque < qtdNecessaria) {
                throw new Error(`Estoque insuficiente para o produto base ${item.produtoId} no combo ${comboId}`);
            }
        }
    }

    // Consumir estoque dos produtos base
    for (const item of comboItens) {
        const produto = await prisma.produto.findUnique({
            where: { id: item.produtoId },
            select: { tipoProduto: true }
        });

        if (produto && produto.tipoProduto !== TipoProduto.COMBO) {
            const qtdConsumida = item.quantidade * quantidade;
            await prisma.produto.update({
                where: { id: item.produtoId },
                data: { estoque: { decrement: qtdConsumida } }
            });
        }
    }

    // Consumir estoque do próprio combo (se tiver)
    await prisma.produto.update({
        where: { id: comboId },
        data: { estoque: { decrement: quantidade } }
    });
}

async function restaurarEstoqueCombo(comboId: number, quantidade: number) {
    // Buscar os itens do combo
    const comboItens = await prisma.comboItem.findMany({
        where: { comboId },
        include: { produto: true }
    });

    // Restaurar estoque dos produtos base
    for (const item of comboItens) {
        const produto = await prisma.produto.findUnique({
            where: { id: item.produtoId },
            select: { tipoProduto: true }
        });

        if (produto && produto.tipoProduto !== TipoProduto.COMBO) {
            const qtdRestaurada = item.quantidade * quantidade;
            await prisma.produto.update({
                where: { id: item.produtoId },
                data: { estoque: { increment: qtdRestaurada } }
            });
        }
    }

    // Restaurar estoque do próprio combo (se tiver)
    await prisma.produto.update({
        where: { id: comboId },
        data: { estoque: { increment: quantidade } }
    });
}

// FEATURE 6: Cliente inativo não compra
async function criarPedido(cliente: ClienteSimulacao, data: Date) {
    // Verificar se cliente está inativo
    if (cliente.inativo) {
        return null;
    }

    const todosDisponiveis = [
        ...produtosAtivos.cafes,
        ...produtosAtivos.acessorios,
        ...produtosAtivos.combos
    ].filter(p => p.estoque !== null && p.estoque > 0);

    if (todosDisponiveis.length === 0) return null;

    const limites = cliente.tipoPessoa === TipoCliente.JURIDICA
        ? {
            maxItens: CONFIG.limites.maxItensPorPedidoPJ,
            maxQtd: CONFIG.limites.maxQuantidadeItemPJ,
            maxTicket: CONFIG.limites.maxTicketPJ
        }
        : {
            maxItens: CONFIG.limites.maxItensPorPedidoPF,
            maxQtd: CONFIG.limites.maxQuantidadeItemPF,
            maxTicket: CONFIG.limites.maxTicketPF
        };

    const qtdItensBase = randomInt(CONFIG.minItensPorPedido, Math.min(CONFIG.maxItensPorPedido, limites.maxItens));
    
    // FEATURE 1: Consolidar produtos duplicados
    const itensPedidoMap = new Map<number, {
        produtoId: number;
        quantidade: number;
        precoUnit: number;
        subtotal: number;
        custoUnit: number;
        tipoProduto: TipoProduto;
    }>();

    for (let i = 0; i < qtdItensBase; i++) {
        if (itensPedidoMap.size >= limites.maxItens) break;

        const tipoProduto = escolherPonderado<TipoProduto>(CONFIG.distribuicaoProduto);
        let produtoEscolhido: any;
        let quantidade: number;

        switch (tipoProduto) {
            case TipoProduto.CAFE:
                if (produtosAtivos.cafes.length === 0) {
                    produtoEscolhido = todosDisponiveis[randomInt(0, todosDisponiveis.length - 1)];
                } else {
                    const cafesDisponiveis = produtosAtivos.cafes.filter(c => c.estoque !== null && c.estoque > 0);
                    if (cafesDisponiveis.length === 0) continue;
                    produtoEscolhido = cafesDisponiveis[randomInt(0, cafesDisponiveis.length - 1)];
                    
                    const valido = await verificarValidadeCafe(produtoEscolhido.id, data);
                    if (!valido) continue;
                }
                quantidade = Math.min(randomInt(1, cliente.tipo === 'VIP' ? 4 : 2), limites.maxQtd);
                break;

            case TipoProduto.COMBO:
                if (produtosAtivos.combos.length === 0) {
                    produtoEscolhido = todosDisponiveis[randomInt(0, todosDisponiveis.length - 1)];
                } else {
                    const combosDisponiveis = produtosAtivos.combos.filter(c => c.estoque !== null && c.estoque > 0);
                    if (combosDisponiveis.length === 0) continue;
                    produtoEscolhido = combosDisponiveis[randomInt(0, combosDisponiveis.length - 1)];
                }
                quantidade = Math.min(
                    cliente.tipoPessoa === TipoCliente.JURIDICA ? randomInt(1, 3) : 1,
                    limites.maxQtd
                );
                break;

            case TipoProduto.ACESSORIO:
                if (produtosAtivos.acessorios.length === 0) {
                    produtoEscolhido = todosDisponiveis[randomInt(0, todosDisponiveis.length - 1)];
                } else {
                    const acessoriosDisponiveis = produtosAtivos.acessorios.filter(a => a.estoque !== null && a.estoque > 0);
                    if (acessoriosDisponiveis.length === 0) continue;
                    produtoEscolhido = acessoriosDisponiveis[randomInt(0, acessoriosDisponiveis.length - 1)];
                }
                quantidade = Math.min(randomInt(1, 2), limites.maxQtd);
                break;

            default:
                continue;
        }

        const produtoAtual = await prisma.produto.findUnique({
            where: { id: produtoEscolhido.id },
            select: { estoque: true, precoVenda: true, custoUnitario: true, tipoProduto: true, status: true }
        });

        if (!produtoAtual || produtoAtual.status !== StatusProduto.ATIVO || produtoAtual.estoque === null) {
            continue;
        }

        // FEATURE 5: Estoque nunca negativo - verificar estoque suficiente
        let estoqueDisponivel = produtoAtual.estoque;
        
        // Se for combo, também precisamos verificar estoque dos produtos base
        if (produtoAtual.tipoProduto === TipoProduto.COMBO) {
            const comboItens = await prisma.comboItem.findMany({
                where: { comboId: produtoEscolhido.id },
                include: { produto: true }
            });
            
            let menorEstoque = Infinity;
            for (const item of comboItens) {
                const produtoItem = await prisma.produto.findUnique({
                    where: { id: item.produtoId },
                    select: { estoque: true, tipoProduto: true, status: true }
                });
                
                // Se o produto base for outro combo, não verificamos estoque infinitamente
                if (produtoItem && produtoItem.tipoProduto !== TipoProduto.COMBO && 
                    produtoItem.status === StatusProduto.ATIVO && produtoItem.estoque !== null) {
                    const disponivelPorItem = Math.floor(produtoItem.estoque / item.quantidade);
                    menorEstoque = Math.min(menorEstoque, disponivelPorItem);
                }
            }
            estoqueDisponivel = Math.min(estoqueDisponivel, menorEstoque === Infinity ? produtoAtual.estoque : menorEstoque);
        }

        if (estoqueDisponivel < quantidade) {
            quantidade = Math.min(quantidade, estoqueDisponivel);
            if (quantidade <= 0) continue;
        }

        const precoUnit = Number(produtoAtual.precoVenda);
        const custoUnit = Number(produtoAtual.custoUnitario);
        
        // Verificar limite de ticket
        const subtotal = precoUnit * quantidade;
        const subtotalAtual = Array.from(itensPedidoMap.values())
            .reduce((sum, item) => sum + item.subtotal, 0);
        
        if (subtotalAtual + subtotal > limites.maxTicket) {
            const espacoRestante = limites.maxTicket - subtotalAtual;
            const qtdPossivel = Math.floor(espacoRestante / precoUnit);
            if (qtdPossivel <= 0) break;
            quantidade = Math.min(quantidade, qtdPossivel);
        }

        const subtotalFinal = precoUnit * quantidade;

        // FEATURE 1: Consolidar produtos duplicados
        if (itensPedidoMap.has(produtoEscolhido.id)) {
            const itemExistente = itensPedidoMap.get(produtoEscolhido.id)!;
            itemExistente.quantidade += quantidade;
            itemExistente.subtotal += subtotalFinal;
        } else {
            itensPedidoMap.set(produtoEscolhido.id, {
                produtoId: produtoEscolhido.id,
                quantidade,
                precoUnit,
                subtotal: subtotalFinal,
                custoUnit,
                tipoProduto: produtoAtual.tipoProduto
            });
        }
    }

    if (itensPedidoMap.size === 0) return null;

    // FEATURE 2.2 e 3: Ordem temporal dos status com tratamento para cancelamento inicial
    let status: StatusPedido;
    const statusAleatorio = random(0, 1);
    
    if (statusAleatorio < 0.85) {
        // 85% chance de concluir normalmente
        const progresso = random(0, 1);
        if (progresso < 0.02) {
            status = StatusPedido.PENDENTE;
        } else if (progresso < 0.07) {
            status = StatusPedido.PAGO;
        } else if (progresso < 0.10) {
            status = StatusPedido.EM_PREPARO;
        } else {
            status = StatusPedido.CONCLUIDO;
        }
    } else {
        // 15% chance de cancelamento (distribuído conforme estágio)
        const cancelamentoRand = random(0, 1);
        if (cancelamentoRand < CONFIG.probabilidadeCancelamento.PENDENTE) {
            // FEATURE 2.2: Não criar pedido quando cancelado em PENDENTE
            if (CONFIG.refinamentos.naoCriarPedidoCanceladoPendente) {
                console.log(`  ⚠️  Pedido cancelado em PENDENTE não criado (cliente ${cliente.id})`);
                return null;
            }
            status = StatusPedido.CANCELADO;
        } else if (cancelamentoRand < CONFIG.probabilidadeCancelamento.PENDENTE + CONFIG.probabilidadeCancelamento.PAGO) {
            status = StatusPedido.CANCELADO;
        } else {
            status = StatusPedido.CANCELADO;
        }
    }

    const itensPedido = Array.from(itensPedidoMap.values());
    const totalPedido = itensPedido.reduce((sum, item) => sum + item.subtotal, 0);

    const pedido = await prisma.pedido.create({
        data: {
            clienteId: cliente.id,
            status,
            total: totalPedido,
            createdAt: data,
            updatedAt: data,
            itens: {
                create: itensPedido.map(item => ({
                    produtoId: item.produtoId,
                    quantidade: item.quantidade,
                    precoUnit: item.precoUnit,
                    subtotal: item.subtotal
                }))
            }
        }
    });

    // FEATURE 2 e 4: Coerência entre status e consumo de estoque
    if (status !== StatusPedido.CANCELADO && status !== StatusPedido.PENDENTE) {
        for (const item of itensPedido) {
            if (item.tipoProduto === TipoProduto.COMBO) {
                // FEATURE 4: Consumo correto de combo (estoque do combo + produtos base)
                await consumirEstoqueCombo(item.produtoId, item.quantidade);
            } else {
                // FEATURE 5: Garantir que estoque não fique negativo
                await prisma.produto.update({
                    where: { id: item.produtoId },
                    data: { estoque: { decrement: item.quantidade } }
                });
            }
        }
    }

    cliente.ultimaCompra = data;
    return pedido;
}

// Função para simular evolução de status
async function simularEvolucaoStatusPedidos(dataAtual: Date) {
    // Buscar pedidos que podem evoluir
    const pedidosParaEvoluir = await prisma.pedido.findMany({
        where: {
            status: { in: [StatusPedido.PENDENTE, StatusPedido.PAGO, StatusPedido.EM_PREPARO] },
            createdAt: { lt: dataAtual }
        }
    });

    for (const pedido of pedidosParaEvoluir) {
        const diasCriado = Math.floor(
            (dataAtual.getTime() - pedido.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        let novoStatus = pedido.status;
        
        switch (pedido.status) {
            case StatusPedido.PENDENTE:
                if (diasCriado >= 1) {
                    // 90% chance de pagar, 10% de cancelar
                    novoStatus = random(0, 1) < 0.9 ? StatusPedido.PAGO : StatusPedido.CANCELADO;
                }
                break;
                
            case StatusPedido.PAGO:
                if (diasCriado >= 2) {
                    // 95% chance de ir para preparo, 5% de cancelar
                    novoStatus = random(0, 1) < 0.95 ? StatusPedido.EM_PREPARO : StatusPedido.CANCELADO;
                }
                break;
                
            case StatusPedido.EM_PREPARO:
                if (diasCriado >= 3) {
                    // 98% chance de concluir, 2% de cancelar
                    novoStatus = random(0, 1) < 0.98 ? StatusPedido.CONCLUIDO : StatusPedido.CANCELADO;
                }
                break;
        }

        if (novoStatus !== pedido.status) {
            // FEATURE 2: Se foi cancelado, restaurar estoque
            if (pedido.status !== StatusPedido.CANCELADO && novoStatus === StatusPedido.CANCELADO) {
                const itensPedido = await prisma.pedidoItem.findMany({
                    where: { pedidoId: pedido.id },
                    include: { produto: true }
                });

                for (const item of itensPedido) {
                    if (item.produto.tipoProduto === TipoProduto.COMBO) {
                        await restaurarEstoqueCombo(item.produtoId, item.quantidade);
                    } else {
                        await prisma.produto.update({
                            where: { id: item.produtoId },
                            data: { estoque: { increment: item.quantidade } }
                        });
                    }
                }
            }

            await prisma.pedido.update({
                where: { id: pedido.id },
                data: { status: novoStatus, updatedAt: dataAtual }
            });
        }
    }
}

async function gerarPedidosParaDia(dia: Date, mes: number) {
    const fatorSazonalidade = CONFIG.sazonalidade[mes as keyof typeof CONFIG.sazonalidade];
    const evento = CONFIG.eventosExcepcionais.find(e => e.mes === mes);
    const fatorEvento = evento ? evento.impacto : 1.0;
    const variacaoDiaria = random(0.8, 1.2);
    const qtdPedidos = Math.round(CONFIG.basePedidosDia * fatorSazonalidade * fatorEvento * variacaoDiaria);

    // FEATURE 6: Cliente inativo não compra
    const clientesDisponiveis = clientesSimulacao.filter(c => {
        if (c.inativo) return false;
        if (!c.ultimaCompra) return true;

        const diasDesdeUltimaCompra = Math.floor((dia.getTime() - c.ultimaCompra.getTime()) / (1000 * 60 * 60 * 24));
        const frequenciaVariada = c.frequenciaCompra * random(0.8, 1.2);
        return diasDesdeUltimaCompra >= frequenciaVariada;
    });

    if (clientesDisponiveis.length === 0) return 0;

    let pedidosCriados = 0;
    const clientesCopia = [...clientesDisponiveis];

    for (let i = 0; i < qtdPedidos && clientesCopia.length > 0; i++) {
        const clienteIndex = randomInt(0, clientesCopia.length - 1);
        const cliente = clientesCopia[clienteIndex];
        const pedido = await criarPedido(cliente, dia);
        if (pedido) pedidosCriados++;

        clientesCopia.splice(clienteIndex, 1);
    }

    // Simular evolução de status de pedidos anteriores
    await simularEvolucaoStatusPedidos(dia);

    return pedidosCriados;
}

// ============================================
// SIMULAÇÃO PRINCIPAL
// ============================================

async function simularAno() {
    console.log('🚀 Iniciando simulação de 12 meses...');
    console.log(`🌱 Seed: ${CONFIG.seed} (reprodutível)\n`);

    if (CONFIG.eventosExcepcionais.length > 0) {
        console.log('⚡ Eventos excepcionais programados:');
        CONFIG.eventosExcepcionais.forEach(e => {
            const nomeMes = new Date(CONFIG.ano, e.mes - 1).toLocaleDateString('pt-BR', { month: 'long' });
            console.log(`${nomeMes}: ${e.descricao} (${e.impacto > 1 ? '+' : ''}${((e.impacto - 1) * 100).toFixed(0)}%)`);
        });
        console.log('');
    }

    console.log('👥 Simulando operação ao longo do ano...');
    console.log('🔧 Refinamentos ativados:');
    console.log(`  2.1 Combos com estoque próprio: ✅`);
    console.log(`  2.2 Não criar pedido cancelado em PENDENTE: ${CONFIG.refinamentos.naoCriarPedidoCanceladoPendente ? '✅' : '❌'}`);
    console.log(`  2.3 Inativar combos com produtos vencidos: ${CONFIG.refinamentos.inativarCombosComProdutosVencidos ? '✅' : '❌'}\n`);

    let estatisticas = {
        totalChurns: 0,
        totalReativacoes: 0,
        totalProdutosVencidos: 0,
        totalReposicoes: 0,
        pedidosCancelados: 0,
        pedidosConcluidos: 0,
        estoqueNegativoPrevenido: 0,
        combosInativadosPorProdutosVencidos: 0,
        pedidosNaoCriadosPorCancelamentoInicial: 0
    };

    for (let mes = 1; mes <= 12; mes++) {
        const nomeMes = new Date(CONFIG.ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long' });
        console.log(`\n📅 ${nomeMes.toUpperCase()}`);
        const dataInicioMes = gerarData(CONFIG.ano, mes, 1);

        // Criar produtos do mês
        const produtosCriados = await criarProdutosDoMes(mes, dataInicioMes);
        if (produtosCriados.cafes > 0 || produtosCriados.acessorios > 0 || produtosCriados.combos > 0) {
            console.log(`  📦 Produtos lançados: ${produtosCriados.cafes} cafés, ${produtosCriados.acessorios} acessórios, ${produtosCriados.combos} combos`);
        }

        // Processar produtos vencidos
        const produtosVencidos = await processarProdutosVencidos(dataInicioMes);
        if (produtosVencidos > 0) {
            console.log(`  ⚠️  ${produtosVencidos} produtos vencidos e inativados`);
            estatisticas.totalProdutosVencidos += produtosVencidos;
        }

        // FEATURE 2.3: Inativar combos que dependem de produtos vencidos
        if (CONFIG.refinamentos.inativarCombosComProdutosVencidos) {
            const combosInativados = await inativarCombosComProdutosVencidos();
            if (combosInativados > 0) {
                console.log(`  🚫 ${combosInativados} combos inativados (produtos vencidos/inativos)`);
                estatisticas.combosInativadosPorProdutosVencidos += combosInativados;
            }
        }

        // Repor estoque
        const reposicaoFeita = await reporEstoque(mes);
        if (reposicaoFeita) {
            console.log(`  📦 Reposição de estoque realizada`);
            estatisticas.totalReposicoes++;
        }

        // Processar churn
        const churns = await processarChurn(mes, dataInicioMes);
        if (churns > 0) {
            console.log(`  👋 ${churns} clientes entraram em churn`);
            estatisticas.totalChurns += churns;
        }

        // Processar reativação
        const reativacoes = await processarReativacao(mes, dataInicioMes);
        if (reativacoes > 0) {
            console.log(`  🎉 ${reativacoes} clientes reativados`);
            estatisticas.totalReativacoes += reativacoes;
        }

        // Gerar novos clientes
        await gerarClientesParaMes(mes);
        const clientesAtivos = clientesSimulacao.filter(c => !c.inativo).length;
        console.log(`  👥 ${clientesAtivos} clientes ativos (${clientesSimulacao.length} total)`);

        // Gerar pedidos para o mês
        const diasNoMes = getDiasNoMes(CONFIG.ano, mes);
        let pedidosMes = 0;
        let pedidosCanceladosNaoCriados = 0;

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const data = gerarData(CONFIG.ano, mes, dia);
            const pedidosDia = await gerarPedidosParaDia(data, mes);
            pedidosMes += pedidosDia;
        }

        console.log(`  🛒 ${pedidosMes} pedidos gerados`);

        const evento = CONFIG.eventosExcepcionais.find(e => e.mes === mes);
        if (evento) {
            console.log(`  ⚡ ${evento.descricao}`);
        }

        console.log(`  📊 Produtos ativos: ${produtosAtivos.cafes.length} cafés, ${produtosAtivos.acessorios.length} acessórios, ${produtosAtivos.combos.length} combos`);
    }

    console.log('\n📊 RESUMO DA SIMULAÇÃO');
    console.log('========================');

    const totalClientes = await prisma.cliente.count();
    const totalClientesPF = await prisma.cliente.count({ where: { tipo: TipoCliente.FISICA } });
    const totalClientesPJ = await prisma.cliente.count({ where: { tipo: TipoCliente.JURIDICA } });
    const clientesAtivos = await prisma.cliente.count({ where: { status: StatusCliente.ATIVO } });
    const clientesInativos = await prisma.cliente.count({ where: { status: StatusCliente.INATIVO } });
    const totalPedidos = await prisma.pedido.count();
    const totalProdutos = await prisma.produto.count();

    // FEATURE 2: Pedidos cancelados não entram no faturamento
    const pedidosConcluidos = await prisma.pedido.findMany({
        where: { status: { in: [StatusPedido.CONCLUIDO, StatusPedido.PAGO] } },
        include: { itens: true }
    });

    const pedidosCancelados = await prisma.pedido.count({
        where: { status: StatusPedido.CANCELADO }
    });

    let faturamentoTotal = 0;
    let custoTotalVendas = 0;

    for (const pedido of pedidosConcluidos) {
        faturamentoTotal += Number(pedido.total);
        for (const item of pedido.itens) {
            const produto = await prisma.produto.findUnique({
                where: { id: item.produtoId },
                select: { custoUnitario: true }
            });

            if (produto) {
                custoTotalVendas += Number(produto.custoUnitario) * item.quantidade;
            }
        }
    }

    const lucroTotal = faturamentoTotal - custoTotalVendas;
    const margemReal = faturamentoTotal > 0 ? (lucroTotal / faturamentoTotal * 100) : 0;
    const ticketMedioReal = pedidosConcluidos.length > 0 ? faturamentoTotal / pedidosConcluidos.length : 0;
    const itensTotais = await prisma.pedidoItem.count();
    const itensMediaPorPedido = totalPedidos > 0 ? (itensTotais / totalPedidos).toFixed(2) : '0';

    console.log(`Clientes: ${totalClientes} (${totalClientesPF} PF, ${totalClientesPJ} PJ)`);
    console.log(`├─ Ativos: ${clientesAtivos} (${(clientesAtivos / totalClientes * 100).toFixed(1)}%)`);
    console.log(`└─ Inativos (churn): ${clientesInativos} (${(clientesInativos / totalClientes * 100).toFixed(1)}%)`);

    console.log(`\nPedidos: ${totalPedidos}`);
    console.log(`├─ Concluídos/Pagos: ${pedidosConcluidos.length} (${(pedidosConcluidos.length / totalPedidos * 100).toFixed(1)}%)`);
    console.log(`├─ Cancelados: ${pedidosCancelados} (${(pedidosCancelados / totalPedidos * 100).toFixed(1)}%)`);
    console.log(`└─ Outros status: ${totalPedidos - pedidosConcluidos.length - pedidosCancelados}`);
    
    console.log(`Itens vendidos: ${itensTotais} (média de ${itensMediaPorPedido} itens / pedido)`);

    console.log(`\nProdutos criados: ${totalProdutos}`);
    console.log(`├─ Cafés: ${produtosAtivos.cafes.length}`);
    console.log(`├─ Acessórios: ${produtosAtivos.acessorios.length}`);
    console.log(`└─ Combos: ${produtosAtivos.combos.length}`);

    console.log(`\n💰 ANÁLISE FINANCEIRA (apenas pedidos concluídos/pagos)`);
    console.log(`Faturamento: R$ ${faturamentoTotal.toFixed(2)}`);
    console.log(`Custo: R$ ${custoTotalVendas.toFixed(2)}`);
    console.log(`Lucro Bruto: R$ ${lucroTotal.toFixed(2)}`);
    console.log(`Margem: ${margemReal.toFixed(2)}%`);
    console.log(`Ticket Médio: R$ ${ticketMedioReal.toFixed(2)}`);

    const vips = clientesSimulacao.filter(c => c.tipo === 'VIP').length;
    const regulares = clientesSimulacao.filter(c => c.tipo === 'REGULAR').length;
    const ocasionais = clientesSimulacao.filter(c => c.tipo === 'OCASIONAL').length;

    console.log(`\n👥 SEGMENTAÇÃO DE CLIENTES`);
    console.log(`VIP: ${vips} (${(vips / totalClientes * 100).toFixed(1)}%)`);
    console.log(`Regular: ${regulares} (${(regulares / totalClientes * 100).toFixed(1)}%)`);
    console.log(`Ocasional: ${ocasionais} (${(ocasionais / totalClientes * 100).toFixed(1)}%)`);

    console.log(`\n📈 MÉTRICAS DE RETENÇÃO`);
    console.log(`Total de churns: ${estatisticas.totalChurns}`);
    console.log(`Total de reativações: ${estatisticas.totalReativacoes}`);
    console.log(`Taxa de reativação: ${estatisticas.totalChurns > 0 ? (estatisticas.totalReativacoes / estatisticas.totalChurns * 100).toFixed(1) : 0}%`);

    const produtosComEstoqueBaixo = await prisma.produto.count({
        where: { estoque: { lt: 50 }, status: StatusProduto.ATIVO }
    });

    const produtosSemEstoque = await prisma.produto.count({
        where: { estoque: 0, status: StatusProduto.ATIVO }
    });

    const produtosInativos = await prisma.produto.count({
        where: { status: StatusProduto.INATIVO }
    });

    // FEATURE 5: Verificar se há estoque negativo
    const produtosEstoqueNegativo = await prisma.produto.count({
        where: { estoque: { lt: 0 } }
    });

    console.log(`\n📦 SITUAÇÃO DE ESTOQUE`);
    console.log(`Produtos com estoque baixo (<50): ${produtosComEstoqueBaixo}`);
    console.log(`Produtos sem estoque: ${produtosSemEstoque}`);
    console.log(`Produtos inativos / vencidos: ${produtosInativos}`);
    console.log(`⚠️  Produtos com estoque negativo: ${produtosEstoqueNegativo} (deveria ser 0)`);
    console.log(`Reposições realizadas: ${estatisticas.totalReposicoes}`);

    console.log(`\n🔄 REFINAMENTOS APLICADOS`);
    console.log(`2.1 Combos com estoque próprio: ✅ (estoque decrementado ao vender)`);
    console.log(`2.2 Não criar pedido cancelado em PENDENTE: ${CONFIG.refinamentos.naoCriarPedidoCanceladoPendente ? '✅ Ativado' : '❌ Desativado'}`);
    console.log(`2.3 Combos inativados por produtos vencidos: ${estatisticas.combosInativadosPorProdutosVencidos}`);

    console.log(`\n⚡ EVENTOS EXCEPCIONAIS`);
    CONFIG.eventosExcepcionais.forEach(e => {
        const nomeMes = new Date(CONFIG.ano, e.mes - 1).toLocaleDateString('pt-BR', { month: 'long' });
        console.log(`${nomeMes}: ${e.descricao} (impacto: ${e.impacto > 1 ? '+' : ''}${((e.impacto - 1) * 100).toFixed(0)}%)`);
    });

    console.log(`\n✅ FEATURES IMPLEMENTADAS`);
    console.log(`1. ✅ Impedir duplicação de produto no mesmo pedido`);
    console.log(`2. ✅ Coerência entre status do pedido e impacto financeiro`);
    console.log(`3. ✅ Ordem temporal dos status do pedido`);
    console.log(`4. ✅ Consumo correto de combo (estoque do combo + produtos base)`);
    console.log(`5. ✅ Estoque nunca negativo (protegido)`);
    console.log(`6. ✅ Cliente inativo não compra`);
    console.log(`\n✅ REFINAMENTOS ADICIONAIS`);
    console.log(`2.1 ✅ Combos com estoque próprio (conforme seu schema)`);
    console.log(`2.2 ✅ ${CONFIG.refinamentos.naoCriarPedidoCanceladoPendente ? 'Não criar pedidos cancelados em PENDENTE' : 'Criar pedidos mesmo se cancelado'}`);
    console.log(`2.3 ✅ ${CONFIG.refinamentos.inativarCombosComProdutosVencidos ? 'Inativar combos com produtos vencidos' : 'Manter combos ativos mesmo com produtos vencidos'}`);
}

// ============================================
// EXECUÇÃO
// ============================================

async function main() {
    try {
        console.log('🗑️  Limpando banco de dados...');
        await prisma.pedidoItem.deleteMany();
        await prisma.pedido.deleteMany();
        await prisma.cliente.deleteMany();
        await prisma.comboItem.deleteMany();
        await prisma.cafe.deleteMany();
        await prisma.acessorio.deleteMany();
        await prisma.produto.deleteMany();

        await simularAno();

        console.log('\n✅ Simulação concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro na simulação:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();