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
import { useToast } from "@/hooks/use-toast";

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
  const [stats, setStats] = useState({
    totalChapas: 0,
    totalQuantidade: 0,
    entradasMes: 0,
    saidasMes: 0,
  });

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
      setChapas(data);
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
        />

        <HistoricoMovimentacoes />
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
    </div>
  );
};

export default Index;
