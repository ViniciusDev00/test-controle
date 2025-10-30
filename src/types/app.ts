// ARQUIVO: src/types/app.ts

import { jsPDF } from 'jspdf';

// Tipos base
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';
export type PeriodoFiltro = 'hoje' | 'semana' | 'mes' | 'todos';
export type ExportScope = 'filtered' | 'all'; 

// Estruturas de Dados do Supabase
export interface ChapaData {
    codigo: string;
    descricao: string;
    quantidade: number;
    peso: number;
}

// Tipo para dados de Movimentação que saem do Supabase com JOINs
export interface MovimentacaoExport {
    created_at: string;
    tipo: 'entrada' | 'saida';
    quantidade: number;
    profiles: { nome: string } | null;
    chapas_data: ChapaData;
    // Outras propriedades do Movimentacao original (ID, observacao, etc.)
    id: string; 
    observacao: string | null;
}

// Estrutura de Dados Limpos para Exportação (Cabeçalhos)
export interface ExportData {
    Código?: string;
    Descrição?: string;
    'Dimensões (mm)'?: string;
    Quantidade?: string;
    'Peso Total (kg)'?: string;
    Localização?: string;
    'Data / Hora'?: string;
    Tipo?: string;
    'Peso (kg)'?: string;
    Usuário?: string;
}

// Correção do erro de 'any' na tipagem do jsPDF
export interface JsPDFWithAutoTable extends jsPDF {
    autoTable: (options: unknown) => void;
}