'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Upload } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon, FileText, Filter, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export function ResearchLibrary() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [filteredUploads, setFilteredUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [symbols, setSymbols] = useState('');
  const [tags, setTags] = useState('');
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);

  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUploads();
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [uploads, filterSymbol, filterTag]);

  async function loadUploads() {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('Error loading uploads:', error);
    }
  }

  function applyFilters() {
    let filtered = [...uploads];

    if (filterSymbol.trim()) {
      const symbolUpper = filterSymbol.trim().toUpperCase();
      filtered = filtered.filter((upload) =>
        upload.symbols.some((s) => s.toUpperCase().includes(symbolUpper))
      );
    }

    if (filterTag.trim()) {
      const tagLower = filterTag.trim().toLowerCase();
      filtered = filtered.filter((upload) =>
        upload.tags.some((t) => t.toLowerCase().includes(tagLower))
      );
    }

    setFilteredUploads(filtered);
  }

  async function handleUpload() {
    if (!selectedFile || !user) return;

    setUploading(true);

    try {
      const timestamp = Date.now();
      const filePath = `${user.id}/${timestamp}-${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from('research-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const symbolsArray = symbols
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const tagsArray = tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const { data, error: dbError } = await supabase
        .from('uploads')
        .insert({
          user_id: user.id,
          storage_path: filePath,
          filename: selectedFile.name,
          symbols: symbolsArray,
          tags: tagsArray,
          note: note || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploads([data, ...uploads]);
      setSelectedFile(null);
      setSymbols('');
      setTags('');
      setNote('');

      toast({
        title: 'File uploaded',
        description: 'Your research file has been uploaded successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }

  async function getFileUrl(storagePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('research-files')
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }


  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Research Library</h1>
          <p className="text-slate-600">Store and organize your trading research files</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">File</label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept="image/*,.pdf,.csv,.xlsx,.xls,.doc,.docx"
                />
                {selectedFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Symbols (comma-separated)
              </label>
              <Input
                placeholder="e.g., AAPL, MSFT, TSLA"
                value={symbols}
                onChange={(e) => setSymbols(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tags (comma-separated)
              </label>
              <Input
                placeholder="e.g., earnings, technical-analysis, research"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Note</label>
              <Textarea
                placeholder="Optional description or notes about this file"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
              <UploadIcon className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Filter by symbol"
                  value={filterSymbol}
                  onChange={(e) => setFilterSymbol(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Filter by tag"
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                />
              </div>
              {(filterSymbol || filterTag) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterSymbol('');
                    setFilterTag('');
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredUploads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">
                  {uploads.length === 0
                    ? 'No files uploaded yet. Upload your first research file to get started.'
                    : 'No files match your filters.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUploads.map((upload) => (
              <Card key={upload.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <FileText className="h-6 w-6 text-emerald-600" />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {upload.filename}
                      </h3>

                      {upload.symbols.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {upload.symbols.map((symbol) => (
                            <span
                              key={symbol}
                              className="px-2 py-1 bg-slate-900 text-white text-xs font-semibold rounded"
                            >
                              {symbol}
                            </span>
                          ))}
                        </div>
                      )}

                      {upload.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {upload.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {upload.note && (
                        <p className="text-sm text-slate-600 mb-3">{upload.note}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                          Uploaded {new Date(upload.uploaded_at).toLocaleString()}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const url = await getFileUrl(upload.storage_path);
                            window.open(url, '_blank');
                          }}
                        >
                          View File
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
