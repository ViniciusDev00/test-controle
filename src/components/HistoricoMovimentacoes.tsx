// ARQUIVO: src/components/HistoricoMovimentacoes.tsx (CORRIGIDO)

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Download, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "@/components/ui/dropdown-menu";

interface ChapaData {
    codigo: string;
    descricao: string;
    quantidade: number;
    peso: number;
}

// CORRIGIDA: Tipo local de Movimentacao, incluindo 'id' e 'observacao'
interface Movimentacao {
  id: string; // CORRIGIDO: Propriedade 'id' faltante
  tipo: 'entrada' | 'saida'; // CORRIGIDO: Tipo específico (não string) para compatibilidade com Index.tsx
  quantidade: number;
  observacao: string | null;
  created_at: string;
  chapas_data: ChapaData; 
  profiles: {
    nome: string;
  } | null;
}

// REMOVIDO: MovimentacaoExport e MovimentacaoLocal (redundantes)

interface ExportData {
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

type PeriodoFiltro = 'hoje' | 'semana' | 'mes' | 'todos';
type ExportFormat = 'csv' | 'xlsx' | 'pdf';

interface HistoricoMovimentacoesProps {
  periodoFiltro: PeriodoFiltro;
  onPeriodoChange: (periodo: PeriodoFiltro) => void;
  // Agora usa Movimentacao[] (o tipo MovimentacaoLocal é compatível com MovimentacaoExport)
  onExportar: (dados: Movimentacao[], periodo: PeriodoFiltro, formato: ExportFormat) => void; 
  getPeriodDates: (periodo: PeriodoFiltro) => { startDate: Date | null, endDate: Date | null };
}

const HistoricoMovimentacoes = ({ 
  periodoFiltro, 
  onPeriodoChange, 
  onExportar,
  getPeriodDates
}: HistoricoMovimentacoesProps) => {

  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);

  // Usa useCallback para estabilizar a função e corrigir o aviso de React Hook (ESLint)
  const loadMovimentacoes = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("movimentacoes")
      .select(`
        *,
        chapas_data:chapas (codigo, descricao, quantidade, peso),
        profiles (nome)
      `)
      .order("created_at", { ascending: false });
    
    const { startDate, endDate } = getPeriodDates(periodoFiltro);

    if (startDate) {
      query = query.gte("created_at", startDate.toISOString());
    }
    if (endDate) {
      query = query.lte("created_at", endDate.toISOString());
    }
    
    if (periodoFiltro !== 'todos') { 
        query = query.limit(20); 
    } else {
        query = query.limit(500);
    }
    

    const { data, error } = await query;

    if (!error && data) {
      setMovimentacoes(data as unknown as Movimentacao[]); 
    }
    setLoading(false);
  }, [periodoFiltro, getPeriodDates]); // Dependências da função

  // useEffect que depende da função estável (loadMovimentacoes)
  useEffect(() => {
    loadMovimentacoes();

    const channel = supabase
      .channel("movimentacoes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "movimentacoes",
        },
        () => {
          loadMovimentacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMovimentacoes]);


  const handleExportClick = (formato: ExportFormat) => {
      // Aqui passamos o array completo (movimentacoes) para a função onExportar
      onExportar(movimentacoes, periodoFiltro, formato);
  };


  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Histórico de Movimentações</CardTitle>
                <CardDescription>
                  {periodoFiltro === 'todos' ? 
                   `Todas as ${movimentacoes.length} movimentações encontradas` : 
                   `Últimas movimentações registradas no período: ${periodoFiltro}`}
                </CardDescription>
            </div>
            
            <div className="flex gap-2 items-center">
                <ToggleGroup 
                  type="single" 
                  value={periodoFiltro} 
                  onValueChange={(value: PeriodoFiltro) => value && onPeriodoChange(value)}
                  className="hidden sm:flex"
                >
                    <ToggleGroupItem value="hoje" aria-label="Filtro Hoje">Hoje</ToggleGroupItem>
                    <ToggleGroupItem value="semana" aria-label="Filtro Semana">Semana</ToggleGroupItem>
                    <ToggleGroupItem value="mes" aria-label="Filtro Mês">Mês</ToggleGroupItem>
                    <ToggleGroupItem value="todos" aria-label="Filtro Todos">Todos</ToggleGroupItem>
                </ToggleGroup>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={movimentacoes.length === 0 || loading}
                            title="Exportar"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportClick('xlsx')} disabled={loading}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Exportar para XLSX (Excel)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportClick('pdf')} disabled={loading}>
                            <FileText className="h-4 w-4 mr-2" />
                            Exportar para PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportClick('csv')} disabled={loading}>
                             <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Exportar para CSV
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Chapa</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead className="text-center">Peso (kg)</TableHead>
                <TableHead>Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : movimentacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma movimentação registrada
                  </TableCell>
                </TableRow>
              ) : (
                movimentacoes.map((mov) => {
                  const chapa = mov.chapas_data;
                  const pesoUnitario = chapa.quantidade > 0 ? Math.abs(chapa.peso) / chapa.quantidade : 0;
                  const pesoMovimentado = pesoUnitario * mov.quantidade;
                  const sinal = mov.tipo === "entrada" ? '+' : '-';
                  
                  return (
                    <TableRow key={mov.id}>
                      <TableCell className="text-sm">
                        {format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={mov.tipo === "entrada" ? "default" : "secondary"}>
                          {mov.tipo === "entrada" ? (
                            <>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Entrada
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Saída
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{chapa.codigo}</div>
                          <div className="text-muted-foreground">{chapa.descricao}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {sinal}
                        {mov.quantidade}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {sinal}
                        {pesoMovimentado.toFixed(2)} kg
                      </TableCell>
                      <TableCell>{mov.profiles?.nome || 'Usuário Desconhecido'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricoMovimentacoes;