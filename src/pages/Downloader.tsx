import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Music, Video, Loader2, CheckCircle2, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type DownloadStatus = 'idle' | 'fetching' | 'downloading' | 'complete' | 'error';

export default function Downloader() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  const isValidUrl = (input: string) => {
    const patterns = [
      /youtube\.com\/shorts\//i,
      /youtu\.be\//i,
      /youtube\.com\/watch/i,
      /instagram\.com\/(reel|p)\//i,
    ];
    return patterns.some(p => p.test(input));
  };

  const handleDownload = async (format: 'mp3' | 'mp4') => {
    if (!url.trim()) {
      setError('Please paste a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid YouTube or Instagram URL');
      return;
    }

    setError('');
    setStatus('fetching');
    setProgress(10);
    setDownloadUrl('');

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          format,
        }),
      });

      setProgress(40);

      const data = await response.json().catch(() => null);
      setProgress(60);

      if (!response.ok) {
        throw new Error((data && (data.error || data.message)) || 'Failed to fetch download link');
      }

      if (!data || !data.downloadUrl) {
        throw new Error('No download URL returned by server');
      }

      setStatus('downloading');
      setProgress(80);

      const downloadLink = data.downloadUrl as string;

      setDownloadUrl(downloadLink);
      setProgress(100);
      setStatus('complete');

      // Auto-trigger download
      window.open(downloadLink, '_blank');
    } catch (err) {
      setStatus('error');
      setProgress(0);
      setError(err instanceof Error ? err.message : 'Download failed. Try again or use a different URL.');
    }
  };

  const resetDownloader = () => {
    setUrl('');
    setStatus('idle');
    setProgress(0);
    setError('');
    setDownloadUrl('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-12 flex items-center px-4 border-b border-border bg-card">
        <Link to="/editor" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Link>
        <h1 className="flex-1 text-center text-sm font-semibold">Media Downloader</h1>
        <div className="w-16" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Icon & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Download className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Download Videos & Audio</h2>
            <p className="text-sm text-muted-foreground">
              YouTube & Instagram
            </p>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="url"
                placeholder="Paste video URL here..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError('');
                  if (status === 'complete' || status === 'error') {
                    setStatus('idle');
                    setProgress(0);
                  }
                }}
                className="pl-10 h-12 text-base"
                disabled={status === 'fetching' || status === 'downloading'}
              />
            </div>
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          {/* Download Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              variant="outline"
              className="h-14 flex-col gap-1"
              onClick={() => handleDownload('mp3')}
              disabled={status === 'fetching' || status === 'downloading'}
            >
              {status === 'fetching' || status === 'downloading' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Music className="h-5 w-5" />
              )}
              <span className="text-xs">MP3 Audio</span>
            </Button>
            <Button
              size="lg"
              className="h-14 flex-col gap-1"
              onClick={() => handleDownload('mp4')}
              disabled={status === 'fetching' || status === 'downloading'}
            >
              {status === 'fetching' || status === 'downloading' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Video className="h-5 w-5" />
              )}
              <span className="text-xs">MP4 Video</span>
            </Button>
          </div>

          {/* Progress Bar */}
          {(status === 'fetching' || status === 'downloading') && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {status === 'fetching' ? 'Fetching download link...' : 'Preparing download...'}
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'complete' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Download Started!</span>
              </div>
              {downloadUrl && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    If download didn't start automatically:
                  </p>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Download className="h-3 w-3" />
                    Click here to download
                  </a>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={resetDownloader}>
                Download Another
              </Button>
            </div>
          )}

          {/* Supported Sites */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">Supported platforms:</p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span>YouTube</span>
              <span>•</span>
              <span>Instagram</span>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground text-center">
            ⚠️ Uses external API. Only download content you have rights to use.
          </p>
        </div>
      </main>
    </div>
  );
}
