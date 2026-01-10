import { useNavigate } from 'react-router-dom';
import { Video, Download, Sparkles, Music } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <img src="/globe-favicon.png" alt="roshLingua Logo" className="h-7" />
          <span className="text-sm font-bold text-foreground">editbyroshLingua</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Create stunning content
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Video Tools for Creators
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            Create professional lyrics videos and download media from your favorite platforms
          </p>
        </div>

        {/* Tool Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
          {/* Video Generator Card */}
          <Card 
            className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 border-2"
            onClick={() => navigate('/editor')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Video Generator</h2>
                <p className="text-xs text-muted-foreground">
                  Create scrolling text & lyrics videos for social media
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="px-2 py-0.5 bg-muted rounded">Scroll</span>
                <span className="px-2 py-0.5 bg-muted rounded">Karaoke</span>
                <span className="px-2 py-0.5 bg-muted rounded">Export</span>
              </div>
            </CardContent>
          </Card>

          {/* Media Downloader Card */}
          <Card 
            className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 border-2"
            onClick={() => navigate('/downloader')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Media Downloader</h2>
                <p className="text-xs text-muted-foreground">
                  Download YouTube & Instagram videos as MP3 or MP4
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="px-2 py-0.5 bg-muted rounded">YouTube</span>
                <span className="px-2 py-0.5 bg-muted rounded">Instagram</span>
                <span className="px-2 py-0.5 bg-muted rounded">MP3/MP4</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl w-full text-center">
          {[
            { icon: Music, label: 'Karaoke Sync' },
            { icon: Video, label: 'HD Export' },
            { icon: Download, label: 'Fast Download' },
            { icon: Sparkles, label: 'Easy to Use' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        © 2025 editbyroshLingua. All rights reserved.
      </footer>
    </div>
  );
}
