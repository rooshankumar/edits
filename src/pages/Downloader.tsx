import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Music, Video, Youtube, Instagram, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type Format = 'mp3' | 'mp4';
type Quality = '360p' | '720p' | '1080p';

export default function Downloader() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<Format>('mp4');
  const [quality, setQuality] = useState<Quality>('720p');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectPlatform = (url: string): 'youtube' | 'instagram' | null => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    return null;
  };

  const platform = detectPlatform(url);

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    if (!platform) {
      setError('Only YouTube and Instagram URLs are supported');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate processing - In production, this would call a backend API
    setTimeout(() => {
      setIsLoading(false);
      setError('Backend integration required. Connect Lovable Cloud to enable downloads.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-card">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <img src="/globe-favicon.png" alt="Logo" className="h-6" />
          <span className="text-sm font-bold text-foreground">Media Downloader</span>
        </div>
        <div className="w-16" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Download Media
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Paste a YouTube or Instagram URL to download
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* URL Input */}
            <div className="relative">
              <Input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                placeholder="Paste URL here..."
                className="pr-10"
              />
              {platform && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {platform === 'youtube' ? (
                    <Youtube className="w-4 h-4 text-red-500" />
                  ) : (
                    <Instagram className="w-4 h-4 text-pink-500" />
                  )}
                </div>
              )}
            </div>

            {/* Format Selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat('mp3')}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                  format === 'mp3'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Music className="w-4 h-4" />
                <span className="text-sm font-medium">MP3</span>
              </button>
              <button
                onClick={() => setFormat('mp4')}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                  format === 'mp4'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Video className="w-4 h-4" />
                <span className="text-sm font-medium">MP4</span>
              </button>
            </div>

            {/* Quality Selection (MP4 only) */}
            {format === 'mp4' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Video Quality</label>
                <Select value={quality} onValueChange={(v) => setQuality(v as Quality)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="360p">360p (Smaller file)</SelectItem>
                    <SelectItem value="720p">720p (Recommended)</SelectItem>
                    <SelectItem value="1080p">1080p (Best quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            {/* Download Button */}
            <Button
              onClick={handleDownload}
              disabled={isLoading || !url.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download {format.toUpperCase()}
                </>
              )}
            </Button>

            {/* Supported Platforms */}
            <div className="pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center mb-2">Supported Platforms</p>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Youtube className="w-4 h-4 text-red-500" />
                  YouTube
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  Instagram
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
