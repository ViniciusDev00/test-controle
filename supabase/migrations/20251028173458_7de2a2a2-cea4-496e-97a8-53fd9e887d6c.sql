-- Criar enum para tipos de usuário
CREATE TYPE public.user_role AS ENUM ('controlador', 'operador');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'operador',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Tabela de chapas de aço
CREATE TABLE public.chapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  espessura DECIMAL(10,2) NOT NULL,
  largura DECIMAL(10,2) NOT NULL,
  comprimento DECIMAL(10,2) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'un',
  localizacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chapas ENABLE ROW LEVEL SECURITY;

-- Policies para chapas - todos podem ver
CREATE POLICY "Todos podem visualizar chapas"
  ON public.chapas FOR SELECT
  TO authenticated
  USING (true);

-- Apenas controladores podem inserir
CREATE POLICY "Controladores podem adicionar chapas"
  ON public.chapas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'controlador'
    )
  );

-- Apenas controladores podem atualizar
CREATE POLICY "Controladores podem atualizar chapas"
  ON public.chapas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'controlador'
    )
  );

-- Tabela de movimentações
CREATE TABLE public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapa_id UUID NOT NULL REFERENCES public.chapas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade INTEGER NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;

-- Policies para movimentações - todos podem ver
CREATE POLICY "Todos podem visualizar movimentações"
  ON public.movimentacoes FOR SELECT
  TO authenticated
  USING (true);

-- Controladores podem registrar entradas
CREATE POLICY "Controladores podem registrar entradas"
  ON public.movimentacoes FOR INSERT
  TO authenticated
  WITH CHECK (
    tipo = 'entrada' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'controlador'
    )
  );

-- Operadores podem registrar saídas
CREATE POLICY "Operadores podem registrar saídas"
  ON public.movimentacoes FOR INSERT
  TO authenticated
  WITH CHECK (
    tipo = 'saida' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'operador'
    )
  );

-- Trigger para criar perfil ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'operador')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_chapas_updated_at
  BEFORE UPDATE ON public.chapas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para atualizações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.chapas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.movimentacoes;