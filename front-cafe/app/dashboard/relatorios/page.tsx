"use client"
import React, { useState, useEffect } from 'react';
import {
  FileText, BarChart3, TrendingUp, Package, Users,
  Coffee, ShoppingCart, DollarSign, AlertTriangle,
  Download, Filter, Calendar, Search, X, Loader2,
  CheckCircle, Clock, User, Box, Tag, Hash, Percent
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { RelatorioService } from '@/lib/relatorio-request';

const ReportsScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [periodType, setPeriodType] = useState('7');
  const [customDays, setCustomDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportStats, setReportStats] = useState(null);

  const reportCategories = [
    { id: 'all', label: 'Todos', icon: FileText },
    { id: 'basic', label: 'Operacionais', icon: ShoppingCart },
    { id: 'medium', label: 'Gerenciais', icon: BarChart3 },
    { id: 'advanced', label: 'Estratégicos', icon: TrendingUp }
  ];

  const reports = [
    // BÁSICOS (OPERACIONAIS)
    {
      id: 1,
      category: 'basic',
      title: 'Pedidos Detalhado',
      description: 'Lista completa de pedidos com cliente, status, total e data',
      icon: ShoppingCart,
      filters: ['Período', 'Status', 'Cliente'],
      exports: ['Excel', 'PDF'],
      apiEndpoint: 'pedidos',
      columns: ['ID', 'Status', 'Total', 'Data', 'Cliente', 'CPF/CNPJ'],
      stats: ['totalPedidos', 'valorTotal', 'ticketMedio']
    },
    {
      id: 2,
      category: 'basic',
      title: 'Vendas por Produto',
      description: 'Produtos com quantidade vendida e receita total',
      icon: Package,
      filters: ['Período', 'Categoria', 'Produto'],
      exports: ['Excel', 'PDF'],
      apiEndpoint: 'vendasPorProduto',
      columns: ['Produto', 'Tipo', 'Quantidade', 'Receita', 'Receita Média'],
      stats: ['totalVendas', 'receitaTotal', 'produtosVendidos']
    },
    {
      id: 3,
      category: 'basic',
      title: 'Clientes',
      description: 'Lista de clientes com tipo (PF/PJ), total comprado e nº de pedidos',
      icon: Users,
      filters: ['Tipo', 'Período'],
      exports: ['Excel', 'PDF'],
      apiEndpoint: 'clientes',
      columns: ['Cliente', 'Tipo', 'Total Comprado', 'Pedidos', 'Ticket Médio'],
      stats: ['totalClientes', 'comprasTotal', 'pedidosTotal']
    },
    {
      id: 4,
      category: 'basic',
      title: 'Estoque Atual',
      description: 'Produtos com estoque atual e status',
      icon: Package,
      filters: ['Status', 'Categoria'],
      exports: ['Excel', 'PDF'],
      apiEndpoint: 'estoquePorPeriodo',
      columns: ['Produto', 'Tipo', 'Status', 'Estoque Atual', 'Vendido Período', 'Estoque Inicial'],
      stats: ['totalProdutos', 'estoqueTotal', 'giroEstoque']
    },
    {
      id: 5,
      category: 'basic',
      title: 'Cafés (Cadastro)',
      description: 'Lotes, fornecedor, tipo, torra e validade',
      icon: Coffee,
      filters: ['Fornecedor', 'Tipo', 'Status'],
      exports: ['Excel', 'PDF'],
      apiEndpoint: 'cafesPorPeriodo',
      columns: ['Café', 'Lote', 'Fornecedor', 'Tipo', 'Pontuação', 'Validade', 'Status'],
      stats: ['totalCafes', 'cafesAtivos', 'cafesProximosVencer']
    },
    // ... (outros relatórios mantidos)
  ];

  const calculatePeriodo = () => {
    let days;
    if (periodType === 'custom') {
      days = parseInt(customDays) || 7;
    } else {
      days = parseInt(periodType) || 7;
    }
    return days;
  };

  // Funções de transformação dos dados
  const transformPedidosData = (data) => {
    return data.map(item => ({
      ID: item.id,
      Status: item.status,
      Total: `R$ ${parseFloat(item.total).toFixed(2)}`,
      Data: new Date(item.createdAt).toLocaleDateString('pt-BR'),
      Cliente: item.cliente?.nome || 'N/A',
      'CPF/CNPJ': item.cliente?.cpfCnpj || 'N/A',
      'Tipo Cliente': item.cliente?.tipo || 'N/A'
    }));
  };

  const transformVendasProdutoData = (data) => {
    return data.map(item => ({
      Produto: item.nomeProduto,
      Tipo: item.tipoProduto,
      Quantidade: item.quantidadeVendida,
      Receita: `R$ ${parseFloat(item.receitaTotal).toFixed(2)}`,
      'Receita Média': `R$ ${(parseFloat(item.receitaTotal) / item.quantidadeVendida).toFixed(2)}`,
      'Produto ID': item.produtoId
    }));
  };

  const transformClientesData = (data) => {
    return data.map(item => ({
      Cliente: item.nome,
      Tipo: item.tipo === 'FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica',
      'Total Comprado': `R$ ${parseFloat(item.totalComprado).toFixed(2)}`,
      Pedidos: item.numeroPedidos,
      'Ticket Médio': `R$ ${(parseFloat(item.totalComprado) / item.numeroPedidos).toFixed(2)}`,
      'Cliente ID': item.clienteId
    }));
  };

  const transformEstoqueData = (data) => {
    return data.map(item => ({
      Produto: item.nome,
      Tipo: item.tipoProduto,
      Status: item.status,
      'Estoque Atual': item.estoqueAtual,
      'Vendido Período': item.vendidoPeriodo,
      'Estoque Inicial': item.estoqueNoInicioPeriodo,
      'Giro': item.vendidoPeriodo > 0 ? 
        ((item.vendidoPeriodo / item.estoqueNoInicioPeriodo) * 100).toFixed(1) + '%' : '0%',
      'Produto ID': item.produtoId
    }));
  };

  const transformCafesData = (data) => {
    return data.map(item => {
      const dataValidade = new Date(item.dataValidade);
      const hoje = new Date();
      const diasValidade = Math.ceil((dataValidade - hoje) / (1000 * 60 * 60 * 24));
      
      let statusValidade = 'OK';
      if (diasValidade <= 30) statusValidade = 'PRÓXIMO VENCER';
      if (diasValidade <= 0) statusValidade = 'VENCIDO';

      return {
        Café: item.nomeProduto,
        Lote: item.numeroLote,
        Fornecedor: item.fornecedor,
        Tipo: item.tipoCafe,
        Pontuação: item.pontuacaoSCA || 'N/A',
        Validade: new Date(item.dataValidade).toLocaleDateString('pt-BR'),
        Torra: new Date(item.dataTorra).toLocaleDateString('pt-BR'),
        'Dias Validade': diasValidade > 0 ? diasValidade : 'VENCIDO',
        Status: `${item.statusProduto} | ${statusValidade}`,
        'Café ID': item.cafeId,
        'Produto ID': item.produtoId
      };
    });
  };

  // Calcular estatísticas
  const calculateStats = (data, reportType) => {
    if (!data || data.length === 0) return null;

    switch (reportType) {
      case 'pedidos':
        const totalPedidos = data.length;
        const valorTotal = data.reduce((sum, item) => sum + parseFloat(item.total), 0);
        const ticketMedio = valorTotal / totalPedidos;
        return {
          totalPedidos,
          valorTotal: `R$ ${valorTotal.toFixed(2)}`,
          ticketMedio: `R$ ${ticketMedio.toFixed(2)}`
        };

      case 'vendasPorProduto':
        const totalVendas = data.reduce((sum, item) => sum + item.quantidadeVendida, 0);
        const receitaTotal = data.reduce((sum, item) => sum + parseFloat(item.receitaTotal), 0);
        return {
          totalVendas,
          receitaTotal: `R$ ${receitaTotal.toFixed(2)}`,
          produtosVendidos: data.length,
          receitaMedia: `R$ ${(receitaTotal / totalVendas).toFixed(2)}`
        };

      case 'clientes':
        const totalClientes = data.length;
        const comprasTotal = data.reduce((sum, item) => sum + parseFloat(item.totalComprado), 0);
        const pedidosTotal = data.reduce((sum, item) => sum + item.numeroPedidos, 0);
        return {
          totalClientes,
          comprasTotal: `R$ ${comprasTotal.toFixed(2)}`,
          pedidosTotal,
          pedidosPorCliente: (pedidosTotal / totalClientes).toFixed(1)
        };

      case 'estoquePorPeriodo':
        const totalProdutos = data.length;
        const estoqueTotal = data.reduce((sum, item) => sum + item.estoqueAtual, 0);
        const vendidoPeriodo = data.reduce((sum, item) => sum + item.vendidoPeriodo, 0);
        const giroEstoque = estoqueTotal > 0 ? (vendidoPeriodo / estoqueTotal) : 0;
        return {
          totalProdutos,
          estoqueTotal,
          vendidoPeriodo,
          giroEstoque: `${(giroEstoque * 100).toFixed(1)}%`,
          valorEstoque: `R$ ${(estoqueTotal * 50).toFixed(2)}` // Exemplo: R$50 por produto
        };

      case 'cafesPorPeriodo':
        const totalCafes = data.length;
        const cafesAtivos = data.filter(item => item.statusProduto === 'ATIVO').length;
        const cafesProximosVencer = data.filter(item => {
          const dataValidade = new Date(item.dataValidade);
          const hoje = new Date();
          const dias = Math.ceil((dataValidade - hoje) / (1000 * 60 * 60 * 24));
          return dias <= 30 && dias > 0;
        }).length;
        return {
          totalCafes,
          cafesAtivos,
          cafesProximosVencer,
          percentAtivos: `${((cafesAtivos / totalCafes) * 100).toFixed(1)}%`
        };

      default:
        return null;
    }
  };

  const fetchReportData = async () => {
    if (!selectedReport || !selectedReport.apiEndpoint) {
      console.error('Relatório não suportado ou sem endpoint');
      return;
    }

    setLoading(true);
    setReportData(null);
    setReportStats(null);
    
    try {
      const periodo = calculatePeriodo();
      let rawData;
      
      switch (selectedReport.apiEndpoint) {
        case 'pedidos':
          rawData = await RelatorioService.pedidos({ periodo });
          break;
        case 'vendasPorProduto':
          rawData = await RelatorioService.vendasPorProduto({ periodo });
          break;
        case 'clientes':
          rawData = await RelatorioService.clientes({ periodo });
          break;
        case 'estoquePorPeriodo':
          rawData = await RelatorioService.estoquePorPeriodo({ periodo });
          break;
        case 'cafesPorPeriodo':
          rawData = await RelatorioService.cafesPorPeriodo({ periodo });
          break;
        default:
          console.error('Endpoint não implementado:', selectedReport.apiEndpoint);
          return;
      }

      // Transformar dados
      let transformedData;
      switch (selectedReport.apiEndpoint) {
        case 'pedidos':
          transformedData = transformPedidosData(rawData);
          break;
        case 'vendasPorProduto':
          transformedData = transformVendasProdutoData(rawData);
          break;
        case 'clientes':
          transformedData = transformClientesData(rawData);
          break;
        case 'estoquePorPeriodo':
          transformedData = transformEstoqueData(rawData);
          break;
        case 'cafesPorPeriodo':
          transformedData = transformCafesData(rawData);
          break;
        default:
          transformedData = rawData;
      }

      // Calcular estatísticas
      const stats = calculateStats(rawData, selectedReport.apiEndpoint);
      
      setReportData(transformedData);
      setReportStats(stats);
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData || reportData.length === 0) return;
    
    // Criar múltiplas abas
    const workbook = XLSX.utils.book_new();
    
    // Dados principais
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
    
    // Estatísticas
    if (reportStats) {
      const statsData = Object.entries(reportStats).map(([key, value]) => ({
        Métrica: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        Valor: value
      }));
      const statsSheet = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estatísticas');
    }
    
    // Informações do relatório
    const infoData = [
      { Campo: 'Relatório', Valor: selectedReport.title },
      { Campo: 'Período', Valor: `${calculatePeriodo()} dias` },
      { Campo: 'Gerado em', Valor: new Date().toLocaleString('pt-BR') },
      { Campo: 'Total de Registros', Valor: reportData.length }
    ];
    const infoSheet = XLSX.utils.json_to_sheet(infoData);
    XLSX.utils.book_append_sheet(workbook, infoSheet, 'Informações');
    
    const filename = `${selectedReport.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const exportToPDF = () => {
    if (!reportData || reportData.length === 0) return;
    
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.width;
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(139, 69, 19); // Âmbar
    doc.text(selectedReport.title, 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${calculatePeriodo()} dias`, 14, 22);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 27);
    doc.text(`Total de registros: ${reportData.length}`, 14, 32);
    
    // Tabela
    const headers = Object.keys(reportData[0]);
    const data = reportData.map(item => headers.map(header => item[header] || ''));
    
    doc.autoTable({
      startY: 40,
      head: [headers],
      body: data,
      theme: 'grid',
      headStyles: { 
        fillColor: [139, 69, 19],
        textColor: [255, 255, 255],
        fontSize: 9
      },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 40 },
      styles: { overflow: 'linebreak', cellWidth: 'wrap' }
    });
    
    // Estatísticas na última página
    if (reportStats) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(139, 69, 19);
      doc.text('Estatísticas do Relatório', 14, 20);
      
      let y = 30;
      Object.entries(reportStats).forEach(([key, value]) => {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`${key}:`, 14, y);
        doc.setTextColor(139, 69, 19);
        doc.text(String(value), 60, y);
        y += 7;
      });
    }
    
    const filename = `${selectedReport.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const handleGenerateReport = async () => {
    if (selectedReport.category === 'basic' && selectedReport.apiEndpoint) {
      await fetchReportData();
    } else {
      // Para relatórios gerenciais e estratégicos
      console.log('Gerando relatório avançado:', {
        report: selectedReport,
        periodType,
        customDays
      });
      setSelectedReport(null);
      setPeriodType('7');
      setCustomDays('');
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (category) => {
    const badges = {
      basic: { label: 'Operacional', color: 'bg-blue-100 text-blue-700' },
      medium: { label: 'Gerencial', color: 'bg-purple-100 text-purple-700' },
      advanced: { label: 'Estratégico', color: 'bg-amber-100 text-amber-700' }
    };
    return badges[category];
  };

  const renderReportData = () => {
    if (!reportData || reportData.length === 0) {
      return (
        <div className="text-center py-12 border-2 border-dashed border-stone-300 rounded-xl">
          <FileText className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-stone-600 mb-2">
            Nenhum dado encontrado
          </h3>
          <p className="text-stone-500">
            Não há registros para o período selecionado
          </p>
        </div>
      );
    }

    const headers = Object.keys(reportData[0]);
    
    return (
      <div className="mt-6">
        {/* Estatísticas */}
        {reportStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(reportStats).map(([key, value]) => (
              <div key={key} className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-600 font-medium mb-1 uppercase">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-2xl font-bold text-amber-900">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-stone-700">
                Dados do Relatório
              </h3>
              <p className="text-sm text-stone-500">
                {reportData.length} registro{reportData.length !== 1 ? 's' : ''} encontrado{reportData.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedReport.exports.includes('Excel') && (
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
              )}
              {selectedReport.exports.includes('PDF') && (
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {reportData.slice(0, 50).map((row, index) => (
                  <tr key={index} className="hover:bg-stone-50 transition-colors">
                    {headers.map((header) => (
                      <td 
                        key={`${index}-${header}`} 
                        className="px-6 py-4 whitespace-nowrap text-sm text-stone-900"
                      >
                        {(() => {
                          const value = row[header];
                          if (typeof value === 'string' && value.includes('R$')) {
                            return <span className="font-medium text-green-700">{value}</span>;
                          }
                          if (header.includes('Status')) {
                            const isPositive = value.includes('ATIVO') || value.includes('PAGO') || value.includes('OK');
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {isPositive ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                {value}
                              </span>
                            );
                          }
                          if (header.includes('Quantidade') || header.includes('Estoque') || header.includes('Pedidos')) {
                            return <span className="font-medium text-blue-700">{value}</span>;
                          }
                          return value;
                        })()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {reportData.length > 50 && (
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone-500">
                  Mostrando 50 de {reportData.length} registros
                </p>
                <p className="text-sm text-amber-600 font-medium">
                  Exporte para ver todos os dados
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Relatórios</h1>
          </div>
          <p className="text-amber-100">
            Análises operacionais, gerenciais e estratégicas do seu negócio
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filtros e Busca */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar relatórios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-5 h-5 text-stone-400 hover:text-stone-600" />
                </button>
              )}
            </div>

            {/* Categorias */}
            <div className="flex gap-2 flex-wrap">
              {reportCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${isActive
                      ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-white shadow-md'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const Icon = report.icon;
            const badge = getCategoryBadge(report.category);

            return (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-amber-200"
                onClick={() => setSelectedReport(report)}
              >
                <div className="p-6">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                      <Icon className="w-6 h-6 text-amber-700" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color} border`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Título e Descrição */}
                  <h3 className="text-lg font-bold text-stone-800 mb-2 group-hover:text-amber-700 transition-colors">
                    {report.title}
                  </h3>
                  <p className="text-sm text-stone-600 mb-4 leading-relaxed">
                    {report.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {report.apiEndpoint && (
                      <span className="px-2 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-xs rounded-md font-medium border border-blue-200">
                        API Integrada
                      </span>
                    )}
                  </div>

                  {/* Filtros disponíveis */}
                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-3">
                    <Filter className="w-4 h-4" />
                    <span className="font-medium">Filtros:</span>
                    <span>{report.filters.join(', ')}</span>
                  </div>

                  {/* Exportação */}
                  <div className="flex items-center gap-2 pt-3 border-t border-stone-200">
                    <Download className="w-4 h-4 text-stone-400" />
                    <span className="text-xs text-stone-500 font-medium">
                      Exportar: {report.exports.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Botão de Ação */}
                <div className="px-6 pb-6">
                  <button 
                    className="w-full py-2 bg-gradient-to-r from-amber-700 to-amber-900 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReport(report);
                      setReportData(null);
                      setReportStats(null);
                    }}
                  >
                    Gerar Relatório
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mensagem de Nenhum Resultado */}
        {filteredReports.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-stone-300 rounded-xl bg-white">
            <FileText className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-600 mb-2">
              Nenhum relatório encontrado
            </h3>
            <p className="text-stone-500">
              Tente ajustar os filtros ou termo de busca
            </p>
          </div>
        )}
      </div>

      {/* Modal de Visualização */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto"
          onClick={() => {
            setSelectedReport(null);
            setReportData(null);
            setReportStats(null);
            setPeriodType('7');
            setCustomDays('');
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {(() => {
                    const Icon = selectedReport.icon;
                    return <Icon className="w-8 h-8 text-amber-600" />;
                  })()}
                  <h2 className="text-2xl font-bold text-stone-800">
                    {selectedReport.title}
                  </h2>
                </div>
                <p className="text-stone-600">{selectedReport.description}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setReportData(null);
                  setReportStats(null);
                  setPeriodType('7');
                  setCustomDays('');
                }}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Configurações */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-5 rounded-xl mb-6 border border-amber-200">
              <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Configurações do Relatório
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-2">
                    Período de análise
                  </label>
                  <select
                    className="w-full p-3 border border-amber-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-700"
                    value={periodType}
                    onChange={(e) => {
                      setPeriodType(e.target.value);
                      if (e.target.value !== 'custom') {
                        setCustomDays('');
                      }
                    }}
                  >
                    <option value="7">Últimos 7 dias</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="90">Últimos 90 dias</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                {periodType === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-2">
                      Quantidade de dias
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      placeholder="Digite o número de dias"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      className="w-full p-3 border border-amber-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-700"
                    />
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                <button 
                  className="flex-1 py-3 bg-gradient-to-r from-amber-700 to-amber-900 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
                  onClick={handleGenerateReport}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Gerando Relatório...
                    </>
                  ) : (
                    <>
                      <FileText className="w-6 h-6" />
                      Gerar Relatório
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Área de Resultados */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-amber-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-lg font-medium text-stone-700">
                  Buscando dados...
                </p>
                <p className="text-sm text-stone-500 mt-2">
                  Por favor, aguarde enquanto processamos sua solicitação
                </p>
              </div>
            )}

            {reportData && (
              <>
                {/* Exportação rápida */}
                <div className="flex gap-2 mb-6">
                  {selectedReport.exports.includes('Excel') && (
                    <button
                      onClick={exportToExcel}
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                    >
                      <Download className="w-5 h-5" />
                      Exportar Excel
                    </button>
                  )}
                  {selectedReport.exports.includes('PDF') && (
                    <button
                      onClick={exportToPDF}
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                    >
                      <Download className="w-5 h-5" />
                      Exportar PDF
                    </button>
                  )}
                </div>

                {/* Dados */}
                {renderReportData()}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsScreen;