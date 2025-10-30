// ARQUIVO: src/components/ChapasFullScreenDialog.tsx

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ChapasList from "@/components/ChapasList";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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

type ExportFormat = 'csv' | 'xlsx' | 'pdf';

interface ChapasFullScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapas: Chapa[]; 
  userRole: string;
  onDescontar: (chapa: Chapa) => void;
  onAdicionar: (chapa: Chapa) => void;
  onExcluir: (chapa: Chapa) => void;
  onExportarChapas: (formato: ExportFormat) => void;
  // PROPS PARA A BUSCA
  searchTerm: string; 
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

const ChapasFullScreenDialog = ({ 
  open, 
  onOpenChange, 
  chapas, 
  userRole, 
  onDescontar, 
  onAdicionar, 
  onExcluir, 
  onExportarChapas,
  searchTerm,
  setSearchTerm
}: ChapasFullScreenDialogProps) => {
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] h-[95vh] p-0 flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()} 
      >
        
        {/* CORREÇÃO DO BUG: Remove o botão de fechar padrão do Dialog que se sobrepõe. */}
        {/* O seletor CSS foi corrigido para remover os caracteres de escape desnecessários. */}
        <style dangerouslySetInnerHTML={{
             __html: `
              /* Esconde o botão de fechar padrão do Radix UI (que é o segundo filho do DialogContent) */
              .fixed.left-\\[50\\%\\] > button.absolute {
                display: none !important;
              }
            `
        }} />
        
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Maximize2 className="h-6 w-6" /> Visualização de Estoque (Tela Cheia)
          </DialogTitle>
          <div className="flex justify-between items-center mt-2">
             {/* CAMPO DE BUSCA */}
            <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por código ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                />
            </div>
          </div>
          
          {/* BOTÃO FECHAR CUSTOMIZADO: ESTE É O BOTÃO FUNCIONAL */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
            title="Fechar"
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* O ChapasList é reutilizado */}
          <ChapasList
            chapas={chapas}
            userRole={userRole}
            onDescontar={onDescontar}
            onAdicionar={onAdicionar}
            onExcluir={onExcluir}
            onExportarChapas={onExportarChapas}
            onOpenFullScreen={() => {}} 
            isFullScreen={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChapasFullScreenDialog;