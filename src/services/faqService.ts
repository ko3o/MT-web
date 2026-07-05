import { supabase } from '../db';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  created_at?: string;
}

export const getFaqs = async () => {
  try {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*');

    if (error) {
      console.error('Database error in getFaqs:', error);
      return [] as FaqItem[];
    }
    return (data || []) as FaqItem[];
  } catch (err) {
    console.error('Unexpected exception in getFaqs:', err);
    return [] as FaqItem[];
  }
};

export const createFaq = async (faq: Omit<FaqItem, 'id'>) => {
  try {
    const { data, error } = await supabase
      .from('faq_items')
      .insert([faq])
      .select()
      .single();

    if (error) {
      console.error('Database error in createFaq:', error);
      throw error;
    }
    return data as FaqItem;
  } catch (err) {
    console.error('Unexpected exception in createFaq:', err);
    throw err;
  }
};

export const updateFaq = async (id: string, faq: Partial<FaqItem>) => {
  try {
    const { data, error } = await supabase
      .from('faq_items')
      .update(faq)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error in updateFaq:', error);
      throw error;
    }
    return data as FaqItem;
  } catch (err) {
    console.error('Unexpected exception in updateFaq:', err);
    throw err;
  }
};

export const deleteFaq = async (id: string) => {
  try {
    const { error } = await supabase
      .from('faq_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database error in deleteFaq:', error);
      throw error;
    }
  } catch (err) {
    console.error('Unexpected exception in deleteFaq:', err);
    throw err;
  }
};
