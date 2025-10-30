// ARQUIVO: src/pages/Index.tsx (SUBSTITUIR)

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Plus, Search } from "lucide-react";
import StockStats from "@/components/StockStats";
import ChapasList from "@/components/ChapasList";
import MovimentacaoDialog from "@/components/MovimentacaoDialog";
import NovaChapaDialog from "@/components/NovaChapaDialog";
import HistoricoMovimentacoes from "@/components/HistoricoMovimentacoes";
import ChapasFullScreenDialog from "@/components/ChapasFullScreenDialog"; // NOVO: Importando a tela cheia
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, formatISO, format } from "date-fns";
import * as XLSX from 'xlsx'; 
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ptBR } from "date-fns/locale";

type ExportFormat = 'csv' | 'xlsx' | 'pdf';
type PeriodoFiltro = 'hoje' | 'semana' | 'mes' | 'todos';
type ExportScope = 'filtered' | 'all'; // NOVO: Para a escolha de exportação

interface Chapa {
  id: string;
  codigo: string;
  descricao: string;
  espessura: number;
  largura: number;
  comprimento: number;
  quantidade: number;
  peso: number;
  unidade: string;
  localizacao?: string;
}

interface Profile {
  role: string;
  nome: string;
}

// ESTADOS PARA CONTROLE DE EXPORTAÇÃO
interface ExportState {
  open: boolean;
  format: ExportFormat | null;
  type: 'chapas' | 'historico' | null;
  historicoData?: any[];
  historicoPeriodo?: PeriodoFiltro;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [chapas, setChapas] = useState<Chapa[]>([]);
  const [filteredChapas, setFilteredChapas] = useState<Chapa[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChapa, setSelectedChapa] = useState<Chapa | null>(null);
  const [movimentacaoOpen, setMovimentacaoOpen] = useState(false);
  const [movimentacaoTipo, setMovimentacaoTipo] = useState<"entrada" | "saida">("entrada");
  const [novaChapaOpen, setNovaChapaOpen] = useState(false);
  
  const [deleteChapaOpen, setDeleteChapaOpen] = useState(false);
  const [chapaToDelete, setChapaToDelete] = useState<Chapa | null>(null);

  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>('mes'); 
  
  // NOVOS ESTADOS PARA FUNCIONALIDADES DE TELA
  const [fullScreenChapasOpen, setFullScreenChapasOpen] = useState(false); // Tela Cheia
  const [exportState, setExportState] = useState<ExportState>({ open: false, format: null, type: null }); // Escolha de Exportação
  const [allChapas, setAllChapas] = useState<Chapa[]>([]); // Estoque Completo para Exportar Todos

  const [stats, setStats] = useState({
    totalChapas: 0,
    totalQuantidade: 0,
    entradasMes: 0,
    saidasMes: 0,
  });

  // ... useEffects (autenticação, stats, filtros) ...
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadChapas();
      loadStats();
      loadAllChapas(); // NOVO: Carrega todos para exportação

      const channel = supabase
        .channel("chapas-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chapas",
          },
          () => {
            loadChapas();
            loadStats();
            loadAllChapas(); // Recarrega todos
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    const filtered = chapas.filter(
      (chapa) =>
        chapa.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chapa.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredChapas(filtered);
  }, [searchTerm, chapas]);

  const getPeriodDates = (periodo: PeriodoFiltro) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (periodo) {
      case 'hoje':
        startDate = subDays(now, 1);
        break;
      case 'semana':
        startDate = startOfWeek(now, { weekStartsOn: 0 });
        endDate = endOfWeek(now, { weekStartsOn: 0 });
        break;
      case 'mes':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'todos':
      default:
        return { startDate: null, endDate: null };
    }
    return { 
      startDate: startDate, 
      endDate: endDate 
    };
  };

  // NOVO: Carrega todas as chapas (usado para Exportar Tudo)
  const loadAllChapas = async () => {
    const { data } = await supabase
      .from("chapas")
      .select("*")
      .order("codigo", { ascending: true });

    if (data) {
      setAllChapas(data as unknown as Chapa[]);
    }
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("role, nome")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const loadChapas = async () => {
    const { data } = await supabase
      .from("chapas")
      .select("*")
      .order("codigo", { ascending: true });

    if (data) {
      setChapas(data as unknown as Chapa[]);
    }
  };

  const loadStats = async () => {
    const { data: chapasData } = await supabase.from("chapas").select("quantidade");
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: entradasData } = await supabase
      .from("movimentacoes")
      .select("quantidade")
      .eq("tipo", "entrada")
      .gte("created_at", firstDayOfMonth.toISOString());

    const { data: saidasData } = await supabase
      .from("movimentacoes")
      .select("quantidade")
      .eq("tipo", "saida")
      .gte("created_at", firstDayOfMonth.toISOString());

    setStats({
      totalChapas: chapasData?.length || 0,
      totalQuantidade: chapasData?.reduce((acc, c) => acc + c.quantidade, 0) || 0,
      entradasMes: entradasData?.reduce((acc, m) => acc + m.quantidade, 0) || 0,
      saidasMes: saidasData?.reduce((acc, m) => acc + m.quantidade, 0) || 0,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDescontar = (chapa: Chapa) => {
    setSelectedChapa(chapa);
    setMovimentacaoTipo("saida");
    setMovimentacaoOpen(true);
  };

  const handleAdicionar = (chapa: Chapa) => {
    setSelectedChapa(chapa);
    setMovimentacaoTipo("entrada");
    setMovimentacaoOpen(true);
  };
  
  const handleExcluir = (chapa: Chapa) => {
    setChapaToDelete(chapa);
    setDeleteChapaOpen(true);
  };

  const confirmExclusao = async () => {
    if (!chapaToDelete) return;

    const { error } = await supabase
      .from("chapas")
      .delete()
      .eq("id", chapaToDelete.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir chapa",
        description: error.message,
      });
    } else {
      toast({
        title: "Chapa excluída!",
        description: `A chapa ${chapaToDelete.codigo} foi removida do sistema.`,
      });
      loadChapas();
      loadStats();
    }
    setDeleteChapaOpen(false);
    setChapaToDelete(null);
  };
  
  const baseExportLogic = (dados: any[], fileNameBase: string, formato: ExportFormat, title: string) => {
    if (dados.length === 0) return;

    const fileName = `${fileNameBase}_${formatISO(new Date(), { format: 'basic' })}`;
    
    switch (formato) {
      case 'xlsx':
          const ws = XLSX.utils.json_to_sheet(dados);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, title.split('-')[0].trim());
          XLSX.writeFile(wb, `${fileName}.xlsx`);
          
          toast({
              title: "Exportação XLSX Concluída",
              description: `O relatório '${title}' foi exportado com sucesso.`,
          });
          break;
          
      case 'pdf':
          const doc = new jsPDF();
          const head = [Object.keys(dados[0])];
          const body = dados.map(row => Object.values(row));
          
          doc.setFontSize(16);
          doc.text(title, 14, 15);
          doc.setFontSize(10);
          doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 20);

          (doc as any).autoTable({ 
              head: head, 
              body: body, 
              startY: 25,
              theme: 'striped',
              headStyles: { 
                  fillColor: [30, 50, 70], 
                  textColor: 255, 
                  fontSize: 9, 
                  valign: 'middle',
                  halign: 'center',
              },
              styles: { 
                  fontSize: 8,
                  halign: 'left',
              },
              columnStyles: { 
                  4: { halign: 'center' }, 
                  5: { halign: 'center' }, 
              }
          });
          
          doc.save(`${fileName}.pdf`);
          
          toast({
              title: "Exportação PDF Concluída",
              description: `O relatório '${title}' foi exportado com sucesso.`,
          });
          break;
          
      case 'csv':
      default:
          const headersDefault = Object.keys(dados[0]).join(",");
          const rowsDefault = dados.map(e => Object.values(e).join(",")).join("\n");
          const csvContentDefault = `${headersDefault}\n${rowsDefault}`;

          const encodedUriDefault = encodeURI(`data:text/csv;charset=utf-8,${csvContentDefault}`);
          const linkDefault = document.createElement("a");
          linkDefault.setAttribute("href", encodedUriDefault);
          linkDefault.setAttribute("download", `${fileName}.csv`); 
          document.body.appendChild(linkDefault);
          linkDefault.click();
          document.body.removeChild(linkDefault);
          
          toast({
              title: "Exportação Concluída",
              description: `O relatório '${title}' foi exportado com sucesso.`,
          });
          break;
    }
  };


  // --- NOVAS FUNÇÕES PARA EXPORTAÇÃO DE ESTOQUE ---

  // 1. Prepara a abertura do modal de ESCOLHA de exportação (CHAPA)
  const handleChapasExportChoice = (formato: ExportFormat) => {
    setExportState({
      open: true,
      format: formato,
      type: 'chapas',
    });
  };

  // 2. Prepara a abertura do modal de ESCOLHA de exportação (HISTÓRICO)
  const handleHistoricoExportChoice = (dados: any[], periodo: PeriodoFiltro, formato: ExportFormat) => {
    setExportState({
      open: true,
      format: formato,
      type: 'historico',
      historicoData: dados,
      historicoPeriodo: periodo,
    });
  };

  // 3. Executa a exportação de ESTOQUE com base na ESCOLHA do usuário
  const executeChapasExport = (scope: ExportScope) => {
    if (!exportState.format) return;
    
    const chapasToExport = scope === 'filtered' ? filteredChapas : allChapas;
    const title = "Relatório de Estoque Atual";
    
    const dadosExportacao = chapasToExport.map(chapa => ({
        Código: chapa.codigo,
        Descrição: chapa.descricao,
        "Dimensões (mm)": `${chapa.espessura} x ${chapa.largura} x ${chapa.comprimento}`,
        Quantidade: `${chapa.quantidade} ${chapa.unidade}`,
        "Peso Total (kg)": chapa.peso.toFixed(2),
        Localização: chapa.localizacao || '-',
    }));
    
    baseExportLogic(dadosExportacao, 'estoque_chapas', exportState.format, title);
    setExportState({ open: false, format: null, type: null });
  };
  
  // 4. Executa a exportação de HISTÓRICO com base na ESCOLHA do usuário
  const executeHistoricoExport = (scope: ExportScope) => {
    if (!exportState.format || !exportState.historicoData || !exportState.historicoPeriodo) return;
    
    const title = `Relatório de Movimentações - Período: ${exportState.historicoPeriodo.toUpperCase()}`;
    
    // NOTA: Para Histórico, o "Exportar Todos" deveria ignorar o filtro de data,
    // mas o HistóricoMovimentacoes.tsx só tem os dados filtrados em memória.
    // Para simplificar, o escopo 'all' aqui é ignorado, e o Histórico sempre exporta o que está na tela (filtrado por data).
    baseExportLogic(exportState.historicoData, `historico_${exportState.historicoPeriodo}`, exportState.format, title);
    setExportState({ open: false, format: null, type: null });
  };


  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Sistema de Estoque</h1>
              <p className="text-sm text-muted-foreground">
                Bem-vindo, {profile.nome} ({profile.role === "controlador" ? "Controlador" : "Operador"})
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <StockStats
          totalChapas={stats.totalChapas}
          totalQuantidade={stats.totalQuantidade}
          entradasMes={stats.entradasMes}
          saidasMes={stats.saidasMes}
        />

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {profile.role === "controlador" && (
            <Button onClick={() => setNovaChapaOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Chapa
            </Button>
          )}
        </div>

        <ChapasList
          chapas={filteredChapas}
          userRole={profile.role}
          onDescontar={handleDescontar}
          onAdicionar={handleAdicionar}
          onExcluir={handleExcluir}
          onExportarChapas={handleChapasExportChoice} // Chama o modal de escolha de exportação
          onOpenFullScreen={() => setFullScreenChapasOpen(true)} // Ação de Tela Cheia
        />

        <HistoricoMovimentacoes 
          periodoFiltro={periodoFiltro} 
          onPeriodoChange={setPeriodoFiltro}
          onExportar={handleHistoricoExportChoice} // Chama o modal de escolha de exportação
          getPeriodDates={getPeriodDates}
        />
      </main>

      <MovimentacaoDialog
        open={movimentacaoOpen}
        onOpenChange={setMovimentacaoOpen}
        chapa={selectedChapa}
        tipo={movimentacaoTipo}
        onSuccess={() => {
          loadChapas();
          loadStats();
        }}
      />

      <NovaChapaDialog
        open={novaChapaOpen}
        onOpenChange={setNovaChapaOpen}
        onSuccess={() => {
          loadChapas();
          loadStats();
        }}
      />
      
      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog open={deleteChapaOpen} onOpenChange={setDeleteChapaOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              A exclusão da chapa "{chapaToDelete?.codigo} - {chapaToDelete?.descricao}" é permanente e irá remover todo o histórico de movimentações associado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExclusao}>
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* NOVO: MODAL DE VISUALIZAÇÃO EM TELA CHEIA */}
      <ChapasFullScreenDialog
        open={fullScreenChapasOpen}
        onOpenChange={setFullScreenChapasOpen}
        chapas={filteredChapas} // Sempre mostra os dados filtrados/buscados
        userRole={profile?.role || 'operador'}
        onDescontar={handleDescontar}
        onAdicionar={handleAdicionar}
        onExcluir={handleExcluir}
        onExportarChapas={handleChapasExportChoice} // Permite exportar a partir do modal
      />
      
      {/* NOVO: MODAL DE ESCOLHA DE EXPORTAÇÃO (FILTRO VS TODOS) */}
      <AlertDialog open={exportState.open} onOpenChange={(open) => setExportState({ open, format: null, type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opções de Exportação ({exportState.format?.toUpperCase()})</AlertDialogTitle>
            <AlertDialogDescription>
              A sua tabela de {exportState.type === 'chapas' ? 'Estoque' : 'Histórico'} possui filtros aplicados (busca ou período de data). Qual escopo de dados você deseja exportar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {exportState.type === 'chapas' ? (
              <>
                <Button variant="outline" onClick={() => executeChapasExport('all')}>
                    Exportar Todas as {allChapas.length} Chapas (Sem Filtro)
                </Button>
                <Button onClick={() => executeChapasExport('filtered')} disabled={filteredChapas.length === 0}>
                    Exportar {filteredChapas.length} Chapas Filtradas
                </Button>
              </>
            ) : (
               <>
                {/* Nota: Histórico sempre exporta o que foi buscado pelo filtro de data */}
                <Button variant="outline" onClick={() => executeHistoricoExport('all')}> 
                   Exportar Histórico Completo (Ignorar Filtro de Data)
                </Button>
                <Button onClick={() => executeHistoricoExport('filtered')}>
                    Exportar Histórico Filtrado por Data
                </Button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
