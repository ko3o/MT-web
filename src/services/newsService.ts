import { supabase } from '../db';

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  publish_date: string;
  cover_url: string;
  created_at?: string;
  updated_at?: string;
}

export const getNewsArticles = async () => {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .order('publish_date', { ascending: false });

  if (error) throw error;
  return data as NewsArticle[];
};

export const getNewsArticleById = async (id: string) => {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as NewsArticle;
};

export const createNewsArticle = async (article: Omit<NewsArticle, 'id'>) => {
  const { data, error } = await supabase
    .from('news_articles')
    .insert([article])
    .select()
    .single();

  if (error) throw error;
  return data as NewsArticle;
};

export const updateNewsArticle = async (id: string, article: Partial<NewsArticle>) => {
  const { data, error } = await supabase
    .from('news_articles')
    .update(article)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as NewsArticle;
};

export const deleteNewsArticle = async (id: string) => {
  const { error } = await supabase
    .from('news_articles')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
