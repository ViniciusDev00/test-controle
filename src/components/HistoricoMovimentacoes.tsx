import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Movimentacao {
  id: string;
  tipo: string;
  quantidade: number;
  observacao: string | null;
  created_at: string;
  chapas: {
    codigo: string;
    descricao: string;
  };
  profiles: {
    nome: string;
  };
}

const HistoricoMovimentacoes = () => {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const loadMovimentacoes = async () => {
    const { data, error } = await supabase
      .from("movimentacoes")
      .select(`
        *,
        chapas (codigo, descricao),
        profiles (nome)
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setMovimentacoes(data as unknown as Movimentacao[]);
    }
    setLoading(false);
  };

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle>Histórico de Movimentações</CardTitle>
        <CardDescription>Últimas 20 movimentações registradas</CardDescription>
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
                <TableHead>Usuário</TableHead>
                <TableHead>Observação</TableHead>
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
                movimentacoes.map((mov) => (
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
                        <div className="font-medium">{mov.chapas.codigo}</div>
                        <div className="text-muted-foreground">{mov.chapas.descricao}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {mov.tipo === "entrada" ? "+" : "-"}
                      {mov.quantidade}
                    </TableCell>
                    <TableCell>{mov.profiles.nome}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {mov.observacao || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricoMovimentacoes;
