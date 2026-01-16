import { useNavigate } from 'react-router-dom';
import { Video, Sparkles, Palette, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <img src="/globe-favicon.png" alt="roshLingua Logo" className="h-8" />
          <span className="text-base font-bold text-foreground">editbyroshLingua</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Professional Video Editor
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Create Stunning<br />
            <span className="text-primary">Scrolling Text Videos</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto mb-8">
            Design beautiful lyrics videos, social media reels, and scrolling text content with our powerful editor.
          </p>
          <Button 
            size="lg" 
            className="h-14 px-10 text-lg font-semibold"
            onClick={() => navigate('/editor')}
          >
            <Video className="w-5 h-5 mr-2" />
            Open Editor
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full mt-8">
          {[
            { icon: Type, label: 'Custom Fonts', description: 'Choose from 25+ beautiful fonts with full control over size, spacing, and alignment' },
            { icon: Palette, label: 'Rich Themes', description: 'Solid colors, images, and video backgrounds with blur and opacity controls' },
            { icon: Video, label: 'HD Export', description: 'Export in multiple formats for TikTok, Instagram Reels, YouTube Shorts & more' },
          ].map(({ icon: Icon, label, description }) => (
            <div key={label} className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{label}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
        © 2025 editbyroshLingua. All rights reserved.
      </footer>
    </div>
  );
}
