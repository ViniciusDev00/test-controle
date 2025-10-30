import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ChapasList from "@/components/ChapasList";
import { Button } from "@/components/ui/button";
import { X, Maximize2 } from "lucide-react";

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

interface ChapasFullScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapas: Chapa[]; // Dados que serão exibidos (já filtrados)
  userRole: string;
  onDescontar: (chapa: Chapa) => void;
  onAdicionar: (chapa: Chapa) => void;
  onExcluir: (chapa: Chapa) => void;
  onExportarChapas: (chapasData: Chapa[], formato: 'csv' | 'xlsx' | 'pdf') => void;
}

const ChapasFullScreenDialog = ({ 
  open, 
  onOpenChange, 
  chapas, 
  userRole, 
  onDescontar, 
  onAdicionar, 
  onExcluir, 
  onExportarChapas
}: ChapasFullScreenDialogProps) => {

  // Adapta a função de exportação para ser chamada do ChapasList interno
  const handleExport = (data: Chapa[], formato: 'csv' | 'xlsx' | 'pdf') => {
    onExportarChapas(data, formato);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] h-[95vh] p-0 flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()} // Evita que o Radix tente focar algo
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Maximize2 className="h-6 w-6" /> Visualização de Estoque (Tela Cheia)
          </DialogTitle>
          <DialogDescription>
            Tabela completa de chapas. O campo de busca na tela principal filtra este conteúdo.
          </DialogDescription>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Reutiliza o componente de lista, mas sem o cabeçalho e card padrão */}
          <ChapasList
            chapas={chapas}
            userRole={userRole}
            onDescontar={onDescontar}
            onAdicionar={onAdicionar}
            onExcluir={onExcluir}
            onExportarChapas={handleExport} // Passa a função adaptada
            isFullScreen={true} // Nova prop para ocultar/ajustar UI se necessário
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChapasFullScreenDialog;
