import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Chapa {
  id: string;
  codigo: string;
  descricao: string;
  quantidade: number;
  peso: number;
}

interface MovimentacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapa: Chapa | null;
  tipo: "entrada" | "saida";
  onSuccess: () => void;
}

const MovimentacaoDialog = ({ open, onOpenChange, chapa, tipo, onSuccess }: MovimentacaoDialogProps) => {
  const { toast } = useToast();
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapa) return;

    const qtd = parseInt(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      toast({
        variant: "destructive",
        title: "Quantidade inválida",
        description: "Por favor, insira uma quantidade válida.",
      });
      return;
    }

    if (tipo === "saida" && qtd > chapa.quantidade) {
      toast({
        variant: "destructive",
        title: "Quantidade insuficiente",
        description: `Apenas ${chapa.quantidade} unidades disponíveis em estoque.`,
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const pesoUnitario = chapa.quantidade > 0 ? Math.abs(chapa.peso) / chapa.quantidade : 0; 
      
      const pesoMovimentado = pesoUnitario * qtd;

      const novaQuantidade = tipo === "entrada" 
        ? chapa.quantidade + qtd 
        : chapa.quantidade - qtd;

      const novoPesoTotal = tipo === "entrada" 
        ? chapa.peso + pesoMovimentado 
        : chapa.peso - pesoMovimentado;
        
      const pesoFinal = Math.max(0, novoPesoTotal); 

      const { error: movError } = await supabase.from("movimentacoes").insert({
        chapa_id: chapa.id,
        usuario_id: user.id,
        tipo,
        quantidade: qtd,
        observacao: observacao || null,
      });

      if (movError) throw movError;

      const { error: updateError } = await supabase
        .from("chapas")
        .update({ 
          quantidade: novaQuantidade, 
          peso: pesoFinal
        })
        .eq("id", chapa.id);

      if (updateError) throw updateError;

      toast({
        title: tipo === "entrada" ? "Entrada registrada!" : "Saída registrada!",
        description: `${qtd} unidades e ${pesoMovimentado.toFixed(2)}kg ${tipo === "entrada" ? "adicionados" : "retirados"} com sucesso.`,
      });

      setQuantidade("");
      setObservacao("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar movimentação",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tipo === "entrada" ? "Adicionar ao Estoque" : "Descontar do Estoque"}
          </DialogTitle>
          <DialogDescription>
            {chapa?.codigo} - {chapa?.descricao}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              placeholder="Digite a quantidade"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              required
            />
            {tipo === "saida" && chapa && (
              <p className="text-sm text-muted-foreground">
                Disponível: {chapa.quantidade} unidades
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              placeholder="Adicione uma observação sobre esta movimentação"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MovimentacaoDialog;