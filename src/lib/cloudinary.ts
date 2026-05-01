/**
 * Utilitário para upload de arquivos para o Cloudinary.
 * O Cloudinary é usado como alternativa ao Firebase Storage para evitar exigência de cartão.
 */

export const uploadToCloudinary = async (file: File): Promise<{ url: string; publicId: string }> => {
  // Configurações (Esses valores devem ser obtidos no console do Cloudinary)
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo'; 
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Erro no upload para Cloudinary');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  } catch (error) {
    console.error('[Cloudinary] Upload failed:', error);
    throw error;
  }
};
