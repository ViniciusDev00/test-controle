-- Adicionar campo peso na tabela chapas
ALTER TABLE public.chapas
ADD COLUMN peso numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.chapas.peso IS 'Peso unitário da chapa em kg';