import { useState } from 'react';
import { Type, Palette, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoProject, TextSettings, BackgroundSettings, AnimationSettings } from '@/types/video-project';
import { CanvasFormatSelector } from './CanvasFormatSelector';
import { TextControls } from './TextControls';
import { BackgroundControls } from './BackgroundControls';
import { AnimationControls } from './AnimationControls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface EditorSidebarProps {
  project: VideoProject;
  onCanvasFormatChange: (format: VideoProject['canvasFormat']) => void;
  onTextChange: (updates: Partial<TextSettings>) => void;
  onBackgroundChange: (updates: Partial<BackgroundSettings>) => void;
  onAnimationChange: (updates: Partial<AnimationSettings>) => void;
}

export function EditorSidebar({
  project,
  onCanvasFormatChange,
  onTextChange,
  onBackgroundChange,
  onAnimationChange,
}: EditorSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      'relative h-full bg-card border-r border-border transition-all duration-300',
      isCollapsed ? 'w-12' : 'w-80'
    )}>
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          'absolute -right-3 top-1/2 -translate-y-1/2 z-10',
          'w-6 h-12 rounded-full bg-card border border-border shadow-soft',
          'flex items-center justify-center',
          'hover:bg-muted transition-colors'
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {isCollapsed ? (
        <div className="flex flex-col items-center gap-4 pt-6">
          <Type className="w-5 h-5 text-muted-foreground" />
          <Palette className="w-5 h-5 text-muted-foreground" />
          <Sparkles className="w-5 h-5 text-muted-foreground" />
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Canvas Format */}
          <div className="p-4 border-b border-border">
            <CanvasFormatSelector
              value={project.canvasFormat}
              onChange={onCanvasFormatChange}
            />
          </div>

          {/* Editor Tabs */}
          <Tabs defaultValue="text" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-4 grid grid-cols-3">
              <TabsTrigger value="text" className="gap-1">
                <Type className="w-4 h-4" />
                <span className="hidden sm:inline">Text</span>
              </TabsTrigger>
              <TabsTrigger value="background" className="gap-1">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">BG</span>
              </TabsTrigger>
              <TabsTrigger value="animation" className="gap-1">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Anim</span>
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-4 py-4">
              <TabsContent value="text" className="mt-0">
                <TextControls settings={project.text} onChange={onTextChange} />
              </TabsContent>

              <TabsContent value="background" className="mt-0">
                <BackgroundControls settings={project.background} onChange={onBackgroundChange} />
              </TabsContent>

              <TabsContent value="animation" className="mt-0">
                <AnimationControls settings={project.animation} onChange={onAnimationChange} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      )}
    </div>
  );
}
