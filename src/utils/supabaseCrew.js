import { supabase } from './supabaseClient';

export const getCrew = async () => {
  const { data, error } = await supabase
    .from('tripulantes')
    .select('*')
    .order('name', { ascending: true });
  if (error) {
    console.error('Erro ao buscar tripulantes:', error);
    return null;
  }
  return data;
};

export const addCrewMember = async (member) => {
  const { data, error } = await supabase
    .from('tripulantes')
    .insert([member])
    .select();
  if (error) {
    console.error('Erro ao adicionar tripulante:', error);
    return null;
  }
  return data[0];
};

// Aliases para compatibilidade se necessário
export const fetchCrew = getCrew;
export const upsertCrewMember = async (member) => {
  const { data, error } = await supabase
    .from('tripulantes')
    .upsert([member])
    .select();
  if (error) {
    console.error('Erro ao atualizar tripulante:', error);
    return null;
  }
  return data[0];
};

export async function deleteCrewMember(id) {
  const { error } = await supabase
    .from('tripulantes')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Erro ao deletar tripulante:', error);
    return false;
  }
  return true;
}

export const authenticateCrew = async (email, password) => {
  const { data, error } = await supabase
    .from('tripulantes')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('password', password)
    .single();

  if (error || !data) {
    console.error('Falha na autenticação do tripulante:', error);
    return null;
  }
  return data;
};
