// ARQUIVO: src/components/NovaChapaDialog.tsx

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    peso_unitario: "", // MODIFICADO: Campo para capturar o peso por unidade
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const unitWeight = parseFloat(formData.peso_unitario);
    const quantity = parseInt(formData.quantidade);

    try {
      // CÁLCULO: Inicializa o Peso Total em Estoque (Unitário * Quantidade)
      const totalWeight = unitWeight * quantity; 

      const { error } = await supabase.from("chapas").insert({
        codigo: formData.codigo,
        descricao: formData.descricao,
        espessura: parseFloat(formData.espessura),
        largura: parseFloat(formData.largura),
        comprimento: parseFloat(formData.comprimento),
        localizacao: formData.localizacao || null,
        quantidade: quantity,
        peso: totalWeight, // MODIFICADO: Insere o Peso Total Inicial na coluna 'peso'
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
        peso_unitario: "", 
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

            <div className="space-y-2">
              <Label htmlFor="peso_unitario">Peso Unitário (kg) *</Label>
              <Input
                id="peso_unitario"
                type="number"
                step="0.01"
                placeholder="Ex: 25.50"
                value={formData.peso_unitario}
                onChange={(e) => setFormData({ ...formData, peso_unitario: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="localizacao">Localização</Label>
            <Input
              id="localizacao"
              placeholder="Ex: Galpão A - Prateleira 3"
              value={formData.localizacao}
              onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
            />
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
