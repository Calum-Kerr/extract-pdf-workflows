"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Highlighter,
  MessageSquare,
  Pen,
  Square,
  Circle,
  ArrowRight,
  Type,
  Stamp,
  PenTool,
  Eraser,
  Palette,
  MousePointer
} from "lucide-react"
import { cn } from "@/lib/utils"

export type AnnotationType = 
  | "select"
  | "highlight" 
  | "note" 
  | "drawing" 
  | "text" 
  | "rectangle" 
  | "circle" 
  | "arrow" 
  | "stamp"

interface AnnotationToolbarProps {
  selectedTool: AnnotationType
  onToolChange: (tool: AnnotationType) => void
  selectedColor: string
  onColorChange: (color: string) => void
  opacity: number
  onOpacityChange: (opacity: number) => void
  strokeWidth: number
  onStrokeWidthChange: (width: number) => void
  className?: string
}

const colors = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#000000", // black
  "#6b7280", // gray
]

const tools = [
  { id: "select" as const, icon: MousePointer, label: "Select", shortcut: "V" },
  { id: "highlight" as const, icon: Highlighter, label: "Highlight", shortcut: "H" },
  { id: "note" as const, icon: MessageSquare, label: "Note", shortcut: "N" },
  { id: "text" as const, icon: Type, label: "Text", shortcut: "T" },
  { id: "drawing" as const, icon: PenTool, label: "Draw", shortcut: "D" },
  { id: "rectangle" as const, icon: Square, label: "Rectangle", shortcut: "R" },
  { id: "circle" as const, icon: Circle, label: "Circle", shortcut: "C" },
  { id: "arrow" as const, icon: ArrowRight, label: "Arrow", shortcut: "A" },
  { id: "stamp" as const, icon: Stamp, label: "Stamp", shortcut: "S" },
]

export function AnnotationToolbar({
  selectedTool,
  onToolChange,
  selectedColor,
  onColorChange,
  opacity,
  onOpacityChange,
  strokeWidth,
  onStrokeWidthChange,
  className
}: AnnotationToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)

  return (
    <Card className={cn("p-2", className)}>
      <div className="flex items-center space-x-2">
        {/* Tool Selection */}
        <div className="flex items-center space-x-1">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={selectedTool === tool.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange(tool.id)}
              title={`${tool.label} (${tool.shortcut})`}
              className="relative"
            >
              <tool.icon className="h-4 w-4" />
              {selectedTool === tool.id && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                >
                  {tool.shortcut}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Color Picker */}
        <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0">
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: selectedColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Color</Label>
                <div className="grid grid-cols-9 gap-2 mt-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded border-2 transition-all",
                        selectedColor === color 
                          ? "border-primary scale-110" 
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => onColorChange(color)}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Custom Color</Label>
                <Input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="w-full h-8 mt-1"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-8" />

        {/* Opacity Control */}
        <div className="flex items-center space-x-2 min-w-24">
          <Label className="text-xs">Opacity</Label>
          <Slider
            value={[opacity]}
            onValueChange={(value) => onOpacityChange(value[0])}
            min={0.1}
            max={1}
            step={0.1}
            className="w-16"
          />
          <span className="text-xs text-muted-foreground w-8">
            {Math.round(opacity * 100)}%
          </span>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Stroke Width Control */}
        {(selectedTool === "drawing" || selectedTool === "rectangle" || selectedTool === "circle" || selectedTool === "arrow") && (
          <>
            <div className="flex items-center space-x-2 min-w-24">
              <Label className="text-xs">Width</Label>
              <Slider
                value={[strokeWidth]}
                onValueChange={(value) => onStrokeWidthChange(value[0])}
                min={1}
                max={10}
                step={1}
                className="w-16"
              />
              <span className="text-xs text-muted-foreground w-6">
                {strokeWidth}px
              </span>
            </div>
            <Separator orientation="vertical" className="h-8" />
          </>
        )}

        {/* Clear All */}
        <Button variant="outline" size="sm">
          <Eraser className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
    </Card>
  )
}
