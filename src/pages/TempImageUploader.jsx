
import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, Copy, CheckCircle } from 'lucide-react';
import useSEO from '../components/seo/useSEO';

export default function TempImageUploaderPage() {
  // Prevent indexing - this is a utility page
  useSEO({
    title: 'Image Uploader',
    description: 'Upload images',
    noindex: true
  });

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setFileUrl('');
    setError('');
    setCopied(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `temp-${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(data.path);
      setFileUrl(publicUrl);
      console.log('✅ Uploaded File URL:', publicUrl);
      console.log('📋 Copy this URL and paste it into your Organizer\'s profile_picture_url field in the dashboard.');
    } catch (err) {
      console.error('❌ Upload error:', err);
      setError('Failed to upload file. Check console for details.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Image Uploader</h1>
          <p className="text-sm text-stone-600">
            Upload an image to get a public URL for your organizer's profile picture.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="image-input" className="block mb-2">Select Image</Label>
            <Input 
              id="image-input" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={uploading || !file} 
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {uploading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </>
            )}
          </Button>

          {fileUrl && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Upload Successful!</span>
              </div>
              
              <div className="bg-stone-50 p-3 rounded-lg">
                <Label className="text-xs text-stone-600 mb-1 block">Image URL:</Label>
                <p className="text-sm break-all text-stone-800 mb-2">{fileUrl}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCopyUrl}
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </>
                  )}
                </Button>
              </div>

              {file && (
                <div className="bg-white border rounded-lg p-3">
                  <Label className="text-xs text-stone-600 mb-2 block">Preview:</Label>
                  <img 
                    src={fileUrl} 
                    alt="Uploaded preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Next Steps:</strong><br/>
                  1. Copy the URL above<br/>
                  2. Go to Dashboard → Data → Organizer<br/>
                  3. Edit an organizer record<br/>
                  4. Paste the URL into the <code className="bg-blue-100 px-1 rounded">profile_picture_url</code> field
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </Card>

      <p className="text-sm text-stone-500 mt-6 text-center max-w-md">
        💡 Tip: Open your browser's console (F12) to see the uploaded URL logged there as well.
      </p>
    </div>
  );
}
