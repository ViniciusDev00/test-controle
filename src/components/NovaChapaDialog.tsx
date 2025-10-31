// ARQUIVO: src/components/NovaChapaDialog.tsx

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// FATOR DE DENSIDADE FORNECIDO PELO USUÁRIO: (8 * 0.000001) * 1.8
const DENSITY_FACTOR = 0.0000144; 

interface NovaChapaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const NovaChapaDialog = ({ open, onOpenChange, onSuccess }: NovaChapaDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
    espessura: "",
    largura: "",
    comprimento: "",
    localizacao: "",
    quantidade: "",
    porta_palete: "", 
    longarina: "",
  });

  // NOVA FUNÇÃO: Calcula o peso unitário com base nas dimensões e na DENSITY_FACTOR
  const calculateUnitWeight = (espessura: number, largura: number, comprimento: number): number => {
    // Implementa a fórmula: (Comp * Larg * Esp * FATOR FIXO)
    return espessura * largura * comprimento * DENSITY_FACTOR;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const espessura = parseFloat(formData.espessura);
    const largura = parseFloat(formData.largura);
    const comprimento = parseFloat(formData.comprimento);
    const quantity = parseInt(formData.quantidade);

    try {
      // 1. CALCULA O PESO UNITÁRIO PELA FÓRMULA DO USUÁRIO
      const unitWeight = calculateUnitWeight(espessura, largura, comprimento);
      
      // 2. CALCULA O PESO TOTAL EM ESTOQUE
      const totalWeight = unitWeight * quantity; 

      const { error } = await supabase.from("chapas").insert({
        codigo: formData.codigo,
        descricao: formData.descricao,
        espessura: espessura,
        largura: largura,
        comprimento: comprimento,
        localizacao: formData.localizacao || null,
        quantidade: quantity,
        peso: totalWeight, // AGORA É O RESULTADO DA FÓRMULA * QUANTIDADE
        porta_palete: formData.porta_palete || null,
        longarina: formData.longarina || null,
      });

      if (error) throw error;

      toast({
        title: "Chapa cadastrada!",
        description: "Nova chapa adicionada ao sistema com sucesso.",
      });

      setFormData({
        codigo: "",
        descricao: "",
        espessura: "",
        largura: "",
        comprimento: "",
        localizacao: "",
        quantidade: "",
        porta_palete: "",
        longarina: "",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar chapa",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Exibe o peso unitário calculado em tempo real (para visualização)
  const previewUnitWeight = useMemo(() => {
    const e = parseFloat(formData.espessura);
    const l = parseFloat(formData.largura);
    const c = parseFloat(formData.comprimento);
    
    if (e > 0 && l > 0 && c > 0) {
      // Exibe com 4 casas decimais para maior precisão visual
      return calculateUnitWeight(e, l, c).toFixed(4);
    }
    return '0.0000';
  }, [formData.espessura, formData.largura, formData.comprimento]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Chapa</DialogTitle>
          <DialogDescription>
            Adicione uma nova chapa de aço ao sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                placeholder="Ex: CH-001"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                placeholder="Ex: Chapa de aço carbono"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="espessura">Espessura (mm) *</Label>
              <Input
                id="espessura"
                type="number"
                step="0.01"
                placeholder="Ex: 3.00"
                value={formData.espessura}
                onChange={(e) => setFormData({ ...formData, espessura: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="largura">Largura (mm) *</Label>
              <Input
                id="largura"
                type="number"
                step="0.01"
                placeholder="Ex: 1000"
                value={formData.largura}
                onChange={(e) => setFormData({ ...formData, largura: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comprimento">Comprimento (mm) *</Label>
              <Input
                id="comprimento"
                type="number"
                step="0.01"
                placeholder="Ex: 2000"
                value={formData.comprimento}
                onChange={(e) => setFormData({ ...formData, comprimento: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                step="1"
                placeholder="Ex: 10"
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                required
              />
            </div>
            
            {/* CAMPO INFORMATIVO DE PESO UNITÁRIO CALCULADO */}
            <div className="space-y-2">
              <Label htmlFor="peso_unitario_calc">Peso Unitário Calculado (kg)</Label>
              <Input
                id="peso_unitario_calc"
                type="text"
                value={previewUnitWeight}
                readOnly
                className="bg-muted text-muted-foreground cursor-default"
                title="Calculado automaticamente pela fórmula"
              />
            </div>
          </div>
          
          {/* COLUNAS DE LOCALIZAÇÃO */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="porta_palete">Porta Palete</Label>
              <Input
                id="porta_palete"
                placeholder="Ex: A1"
                value={formData.porta_palete}
                onChange={(e) => setFormData({ ...formData, porta_palete: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longarina">Longarina</Label>
              <Input
                id="longarina"
                placeholder="Ex: 3B"
                value={formData.longarina}
                onChange={(e) => setFormData({ ...formData, longarina: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="localizacao">Outra Localização</Label>
              <Input
                id="localizacao"
                placeholder="Ex: Prateleira 3"
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NovaChapaDialog;