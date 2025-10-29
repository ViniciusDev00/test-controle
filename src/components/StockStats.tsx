import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, TrendingDown, Layers } from "lucide-react";

interface StockStatsProps {
  totalChapas: number;
  totalQuantidade: number;
  entradasMes: number;
  saidasMes: number;
}

const StockStats = ({ totalChapas, totalQuantidade, entradasMes, saidasMes }: StockStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="shadow-[var(--shadow-card)] transition-all hover:scale-[1.02]" style={{ transition: "var(--transition-smooth)" }}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Tipos</CardTitle>
          <Package className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalChapas}</div>
          <p className="text-xs text-muted-foreground">tipos cadastrados</p>
        </CardContent>
      </Card>

      <Card className="shadow-[var(--shadow-card)] transition-all hover:scale-[1.02]" style={{ transition: "var(--transition-smooth)" }}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Quantidade Total</CardTitle>
          <Layers className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalQuantidade}</div>
          <p className="text-xs text-muted-foreground">unidades em estoque</p>
        </CardContent>
      </Card>

      <Card className="shadow-[var(--shadow-card)] transition-all hover:scale-[1.02]" style={{ transition: "var(--transition-smooth)" }}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Entradas (Mês)</CardTitle>
          <TrendingUp className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">{entradasMes}</div>
          <p className="text-xs text-muted-foreground">unidades adicionadas</p>
        </CardContent>
      </Card>

      <Card className="shadow-[var(--shadow-card)] transition-all hover:scale-[1.02]" style={{ transition: "var(--transition-smooth)" }}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Saídas (Mês)</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{saidasMes}</div>
          <p className="text-xs text-muted-foreground">unidades retiradas</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockStats;
