import { useState } from 'react';
import { Save, FolderOpen, Plus, Trash2, Copy, ChevronDown } from 'lucide-react';
import { VideoProject } from '@/types/video-project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ProjectManagerProps {
  project: VideoProject;
  savedProjects: VideoProject[];
  onSave: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
}

export function ProjectManager({
  project,
  savedProjects,
  onSave,
  onLoad,
  onDelete,
  onNew,
  onDuplicate,
  onRename,
}: ProjectManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(project.name);

  const handleSaveName = () => {
    onRename(tempName);
    setEditingName(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Project Name */}
      {editingName ? (
        <Input
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
          className="h-7 w-48 text-xs border-border"
          autoFocus
        />
      ) : (
        <button
          onClick={() => {
            setTempName(project.name);
            setEditingName(true);
          }}
          className="px-2 py-1 text-xs font-semibold text-foreground excel-hover"
        >
          {project.name}
        </button>
      )}

      {/* Save Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onSave}
        className="h-7 px-2 gap-1.5 border-border excel-hover"
      >
        <Save className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-xs">Save</span>
      </Button>

      {/* Projects Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 px-2 gap-1.5 border-border excel-hover">
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">File</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 border-border shadow-dialog">
          <DropdownMenuItem onClick={onNew} className="gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate} className="gap-2">
            <Copy className="w-4 h-4" />
            Duplicate
          </DropdownMenuItem>
          
          {savedProjects.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Saved Projects
              </div>
              {savedProjects.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  className="flex items-center justify-between"
                >
                  <button
                    onClick={() => onLoad(p.id)}
                    className="flex-1 text-left truncate"
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p.id);
                    }}
                    className="p-1 hover:bg-destructive/20 rounded"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
