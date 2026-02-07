import { supabase } from './supabaseClient';

export const getRequesters = async () => {
  const { data, error } = await supabase
    .from('solicitantes')
    .select('*')
    .order('name', { ascending: true });
  if (error) {
    console.error('Erro ao buscar solicitantes:', error);
    return null;
  }
  return data;
};

export const addRequester = async (requester) => {
  const { data, error } = await supabase
    .from('solicitantes')
    .insert([requester])
    .select();
  if (error) {
    console.error('Erro ao adicionar solicitante:', error);
    return null;
  }
  return data[0];
};

// Aliases para compatibilidade se necessário
export const fetchClients = getRequesters;
export const upsertClient = async (client) => {
  const { data, error } = await supabase
    .from('solicitantes')
    .upsert([client])
    .select();
  if (error) {
    console.error('Erro ao atualizar solicitante:', error);
    return null;
  }
  return data[0];
};

export async function deleteClient(id) {
  const { error } = await supabase
    .from('solicitantes')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Erro ao deletar solicitante:', error);
    return false;
  }
  return true;
}

export const authenticateClient = async (email, password) => {
  const { data, error } = await supabase
    .from('solicitantes')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('password', password)
    .single();

  if (error || !data) {
    console.error('Falha na autenticação do cliente:', error);
    return null;
  }
  return data;
};
