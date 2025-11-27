import { ResearchLibrary } from '@/components/ResearchLibrary';
import StockUniverseViewer from '@/components/StockUniverseViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LibraryPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="stock-universe" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="stock-universe">Stock Universe</TabsTrigger>
          <TabsTrigger value="research-files">Research Files</TabsTrigger>
        </TabsList>

        <TabsContent value="stock-universe">
          <StockUniverseViewer
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
          />
        </TabsContent>

        <TabsContent value="research-files">
          <ResearchLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
