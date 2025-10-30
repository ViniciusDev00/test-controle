// ARQUIVO: src/components/ChapasList.tsx

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Edit, Trash2, Download, FileSpreadsheet, FileText, Maximize } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "@/components/ui/dropdown-menu";

type ExportFormat = 'csv' | 'xlsx' | 'pdf';

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

interface ChapasListProps {
  chapas: Chapa[];
  userRole: string;
  onDescontar: (chapa: Chapa) => void;
  onAdicionar: (chapa: Chapa) => void;
  onEditar?: (chapa: Chapa) => void;
  onExcluir: (chapa: Chapa) => void;
  onExportarChapas: (formato: ExportFormat) => void;
  onOpenFullScreen: () => void;
  isFullScreen?: boolean;
}

const ChapasList = ({ chapas, userRole, onDescontar, onAdicionar, onEditar, onExcluir, onExportarChapas, onOpenFullScreen, isFullScreen = false }: ChapasListProps) => {

  const handleExport = (formato: ExportFormat) => {
    onExportarChapas(formato);
  };

  const headerContent = (
    <div className="flex flex-row items-center justify-between p-4 w-full">
      <CardTitle className="text-xl font-bold">Estoque de Chapas</CardTitle>
      <div className="flex gap-2 items-center">
        {!isFullScreen && (
            <Button variant="outline" size="sm" onClick={onOpenFullScreen} title="Visualizar em Tela Cheia">
                <Maximize className="h-4 w-4" />
            </Button>
        )}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={chapas.length === 0}
                    title="Exportar Estoque"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Estoque
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar para XLSX (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar para PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                     <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar para CSV
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const tableContent = (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-center">Dimensões (mm)</TableHead>
            <TableHead className="text-center">Quantidade</TableHead>
            <TableHead className="text-center">Peso Total (kg)</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chapas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhuma chapa cadastrada ainda
              </TableCell>
            </TableRow>
          ) : (
            chapas.map((chapa) => (
              <TableRow key={chapa.id} className="hover:bg-muted/50" style={{ transition: "var(--transition-smooth)" }}>
                <TableCell className="font-medium">{chapa.codigo}</TableCell>
                <TableCell>{chapa.descricao}</TableCell>
                <TableCell className="text-center">
                  <div className="text-sm">
                    <div>{chapa.espessura} x {chapa.largura} x {chapa.comprimento}</div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={chapa.quantidade === 0 ? "destructive" : chapa.quantidade < 10 ? "secondary" : "default"}>
                    {chapa.quantidade} {chapa.unidade}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{chapa.peso.toFixed(2)} kg</span>
                </TableCell>
                <TableCell>{chapa.localizacao || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    
                    {userRole === "controlador" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => onAdicionar(chapa)} title="Adicionar">
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onDescontar(chapa)} title="Descontar"> 
                          <Minus className="h-4 w-4" />
                        </Button>
                        {onEditar && (
                          <Button size="sm" variant="outline" onClick={() => onEditar(chapa)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => onExcluir(chapa)} 
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {userRole === "operador" && chapa.quantidade > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDescontar(chapa)}
                        title="Descontar"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isFullScreen) {
    return tableContent;
  }

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader className="p-0">
        {headerContent}
      </CardHeader>
      <CardContent className="p-0">
        {tableContent}
      </CardContent>
    </Card>
  );
};

export default ChapasList;