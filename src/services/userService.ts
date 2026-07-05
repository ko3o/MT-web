import { supabase } from '../db';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  customer_phone?: string;
  address?: string;
  city?: string;
  district?: string;
  avatar_url?: string;
  updated_at?: string;
  gender?: string;
  email?: string; // May be null if not in DB
}

export const getMembers = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
  return data as Profile[];
};

export const deleteMember = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const updateMember = async (id: string, data: Partial<Profile>): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', id);

  if (error) throw error;
};

export const upsertMembers = async (members: Profile[]): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .upsert(members, { onConflict: 'id' });

  if (error) throw error;
};
