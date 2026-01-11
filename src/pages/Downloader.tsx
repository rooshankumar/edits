import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Music, Video, Youtube, Instagram, Copy, Check, Terminal, FileCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const pythonScript = `#!/usr/bin/env python3
"""
Universal Video/Audio Downloader for YT Shorts & Instagram Reels
Uses yt-dlp (open-source) - supports YouTube, Instagram, and 1000+ sites
"""

import os
import re
import subprocess
import sys

def check_ffmpeg():
    """Check if ffmpeg is installed on the system."""
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def sanitize_filename(title: str) -> str:
    """Remove special characters that might break file systems."""
    sanitized = re.sub(r'[<>:"/\\\\|?*]', '', title)
    sanitized = re.sub(r'\\s+', ' ', sanitized).strip()
    return sanitized[:200] if len(sanitized) > 200 else sanitized

def download_media(url: str, format_choice: str = 'mp4') -> None:
    """
    Download media from YouTube or Instagram.
    
    Args:
        url: The video URL (YouTube or Instagram)
        format_choice: 'mp4' for video or 'mp3' for audio only
    """
    
    if not check_ffmpeg():
        print("❌ ERROR: ffmpeg is not installed!")
        print("Please install ffmpeg:")
        print("  - macOS: brew install ffmpeg")
        print("  - Ubuntu/Debian: sudo apt install ffmpeg")
        print("  - Windows: Download from https://ffmpeg.org/download.html")
        return
    
    try:
        import yt_dlp
    except ImportError:
        print("❌ ERROR: yt-dlp is not installed!")
        print("Install it with: pip install yt-dlp")
        return
    
    if format_choice.lower() == 'mp3':
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': '%(title)s.%(ext)s',
            'quiet': False,
            'no_warnings': False,
        }
        print("🎵 Downloading as MP3 (audio only)...")
    else:
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'merge_output_format': 'mp4',
            'outtmpl': '%(title)s.%(ext)s',
            'quiet': False,
            'no_warnings': False,
        }
        print("🎬 Downloading as MP4 (best quality)...")
    
    def progress_hook(d):
        if d['status'] == 'downloading':
            percent = d.get('_percent_str', 'N/A')
            speed = d.get('_speed_str', 'N/A')
            print(f"\\r⏳ Downloading... {percent} at {speed}", end='', flush=True)
        elif d['status'] == 'finished':
            print("\\n✅ Download complete! Converting...")
    
    ydl_opts['progress_hooks'] = [progress_hook]
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"📥 Fetching info from: {url}")
            info = ydl.extract_info(url, download=True)
            
            if info:
                title = sanitize_filename(info.get('title', 'video'))
                ext = 'mp3' if format_choice.lower() == 'mp3' else 'mp4'
                print(f"\\n🎉 Done! Saved as: {title}.{ext}")
            
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e).lower()
        if 'private' in error_msg:
            print("\\n❌ ERROR: This video is private or requires login.")
        elif 'unavailable' in error_msg:
            print("\\n❌ ERROR: This video is unavailable in your region.")
        else:
            print(f"\\n❌ Download failed: {e}")
    except Exception as e:
        print(f"\\n❌ Unexpected error: {e}")

def main():
    """Main function - interactive CLI."""
    print("=" * 50)
    print("🚀 Universal Video/Audio Downloader")
    print("   Supports: YouTube, Instagram, TikTok & more")
    print("=" * 50)
    
    url = input("\\n📎 Paste the video URL: ").strip()
    if not url:
        print("❌ No URL provided. Exiting.")
        return
    
    print("\\n📦 Choose format:")
    print("  1. MP4 (Video - best quality)")
    print("  2. MP3 (Audio only - 192kbps)")
    choice = input("Enter 1 or 2: ").strip()
    
    format_choice = 'mp3' if choice == '2' else 'mp4'
    
    download_media(url, format_choice)

if __name__ == "__main__":
    main()
`;

const installCommands = `# Install yt-dlp
pip install yt-dlp

# Install ffmpeg (required for merging/converting)

# macOS:
brew install ffmpeg

# Ubuntu/Debian:
sudo apt update && sudo apt install ffmpeg

# Windows (using Chocolatey):
choco install ffmpeg

# Or download directly from:
# https://ffmpeg.org/download.html`;

export default function Downloader() {
  const navigate = useNavigate();
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);

  const copyToClipboard = async (text: string, type: 'script' | 'install') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'script') {
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2000);
      } else {
        setCopiedInstall(true);
        setTimeout(() => setCopiedInstall(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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
      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          {/* Hero Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl flex items-center justify-center gap-3">
                <Download className="w-7 h-7 text-primary" />
                Universal Media Downloader
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Download videos and audio from YouTube, Instagram, TikTok, and 1000+ sites
              </p>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <Youtube className="w-5 h-5 text-red-500" />
                  <span>YouTube</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Instagram className="w-5 h-5 text-pink-500" />
                  <span>Instagram</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-5 h-5 text-blue-500" />
                  <span>TikTok</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Music className="w-5 h-5 text-green-500" />
                  <span>MP3/MP4</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Video, label: 'Best Quality', desc: 'Auto-merge video+audio' },
              { icon: Music, label: '192kbps Audio', desc: 'High quality MP3' },
              { icon: FileCode, label: 'Open Source', desc: 'Uses yt-dlp library' },
              { icon: Terminal, label: 'CLI Tool', desc: 'Run anywhere' },
            ].map(({ icon: Icon, label, desc }) => (
              <Card key={label} className="p-3">
                <Icon className="w-5 h-5 text-primary mb-2" />
                <h3 className="text-sm font-semibold">{label}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </Card>
            ))}
          </div>

          {/* Code Tabs */}
          <Tabs defaultValue="script" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="script" className="flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Python Script
              </TabsTrigger>
              <TabsTrigger value="install" className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Installation
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="script" className="mt-4">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">downloader.py</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(pythonScript, 'script')}
                    className="h-8"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed max-h-[400px] overflow-y-auto">
                    <code className="text-foreground">{pythonScript}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="install" className="mt-4">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Installation Commands</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(installCommands, 'install')}
                    className="h-8"
                  >
                    {copiedInstall ? (
                      <>
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed">
                    <code className="text-foreground">{installCommands}</code>
                  </pre>
                  
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">📋 Quick Start</h4>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Install Python 3.7+ if not already installed</li>
                      <li>Run: <code className="bg-muted px-1 rounded">pip install yt-dlp</code></li>
                      <li>Install ffmpeg for your OS (see commands above)</li>
                      <li>Save the Python script as <code className="bg-muted px-1 rounded">downloader.py</code></li>
                      <li>Run: <code className="bg-muted px-1 rounded">python downloader.py</code></li>
                      <li>Paste your URL and select format!</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Usage Examples */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">💡 Usage Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Download YouTube Short as MP4</h4>
                  <code className="text-muted-foreground block">
                    $ python downloader.py<br/>
                    📎 Paste URL: https://youtube.com/shorts/abc123<br/>
                    📦 Choose format: 1<br/>
                    🎬 Downloading as MP4...
                  </code>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Download Instagram Reel as MP3</h4>
                  <code className="text-muted-foreground block">
                    $ python downloader.py<br/>
                    📎 Paste URL: https://instagram.com/reel/xyz789<br/>
                    📦 Choose format: 2<br/>
                    🎵 Downloading as MP3...
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
