// ARQUIVO: src/components/ChapasList.tsx

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Edit, Trash2 } from "lucide-react";

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
}

const ChapasList = ({ chapas, userRole, onDescontar, onAdicionar, onEditar, onExcluir }: ChapasListProps) => {
  return (
    <Card className="shadow-[var(--shadow-card)]">
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
                    <span className="font-medium">{chapa.peso} kg</span>
                  </TableCell>
                  <TableCell>{chapa.localizacao || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      
                      {/* Controlador pode ADICIONAR, DESCONTAR, EDITAR e EXCLUIR */}
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
                      
                      {/* Operador pode apenas DESCONTAR */}
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
    </Card>
  );
};

export default ChapasList;
