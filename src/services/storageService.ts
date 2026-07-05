import { supabase } from '../db';

export const uploadImage = async (
  file: File, 
  bucket: string = 'products', 
  pathPrefix: string = '', 
  useOriginalName: boolean = false,
  customFileName?: string
): Promise<string> => {
  let fileName = '';
  const fileExt = file.name.split('.').pop();

  if (customFileName) {
    if (customFileName.endsWith(`.${fileExt}`)) {
      fileName = customFileName;
    } else {
      fileName = `${customFileName}.${fileExt}`;
    }
  } else if (useOriginalName) {
    fileName = file.name;
    
    // Check if file already exists (Basic deduplication)
    const { data: existingFiles } = await supabase.storage
      .from(bucket)
      .list(pathPrefix || undefined);
    
    const duplicate = existingFiles?.find(f => f.name === file.name);
    if (duplicate) {
      const existingPath = pathPrefix ? `${pathPrefix}/${file.name}` : file.name;
      console.log(`File ${file.name} already exists at ${existingPath}, skipping upload.`);
      const { data } = supabase.storage.from(bucket).getPublicUrl(existingPath);
      return `${data.publicUrl}?t=${Date.now()}`;
    }
  } else {
    fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  }
  const filePath = pathPrefix ? `${pathPrefix}/${fileName}` : fileName;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true // Allow overwriting if same name
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return `${data.publicUrl}?t=${Date.now()}`;
};

export const deleteFile = async (path: string, bucket: string = 'products'): Promise<void> => {
  if (!path) return;
  
  let cleanPath = path;
  if (cleanPath.includes('?')) {
    cleanPath = cleanPath.split('?')[0];
  }
  
  let relativePath = cleanPath;
  if (cleanPath.startsWith('http')) {
    const searchStr = `/public/${bucket}/`;
    const index = cleanPath.indexOf(searchStr);
    if (index !== -1) {
      relativePath = cleanPath.substring(index + searchStr.length);
    } else {
      console.log('Skipping deletion of external/unmatched URL:', cleanPath);
      return;
    }
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove([relativePath]);

  if (error) {
    console.error(`Error deleting file ${relativePath} from bucket ${bucket}:`, error);
    // Don't throw here to avoid breaking the UI for a failed cleanup
  } else {
    console.log(`Successfully deleted old file: ${relativePath}`);
  }
};
