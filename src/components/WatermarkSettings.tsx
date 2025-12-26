import { Droplet, Type, AlignCenter } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface WatermarkOptions {
  enabled: boolean;
  text: string;
  opacity: number;
  fontSize: number;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'diagonal';
  color: { r: number; g: number; b: number };
  rotation: number;
}

export const defaultWatermarkOptions: WatermarkOptions = {
  enabled: false,
  text: "CONFIDENTIAL",
  opacity: 0.3,
  fontSize: 48,
  position: 'diagonal',
  color: { r: 0.5, g: 0.5, b: 0.5 },
  rotation: -45
};

interface WatermarkSettingsProps {
  options: WatermarkOptions;
  onChange: (options: WatermarkOptions) => void;
}

const colorPresets = [
  { name: "Gray", value: { r: 0.5, g: 0.5, b: 0.5 } },
  { name: "Red", value: { r: 0.8, g: 0.2, b: 0.2 } },
  { name: "Blue", value: { r: 0.2, g: 0.4, b: 0.8 } },
  { name: "Green", value: { r: 0.2, g: 0.6, b: 0.3 } },
  { name: "Black", value: { r: 0.1, g: 0.1, b: 0.1 } },
];

export function WatermarkSettings({ options, onChange }: WatermarkSettingsProps) {
  const updateOption = <K extends keyof WatermarkOptions>(key: K, value: WatermarkOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplet className="h-4 w-4 text-primary" />
          <Label htmlFor="watermark-enabled" className="font-medium cursor-pointer">
            Add Watermark
          </Label>
        </div>
        <Switch
          id="watermark-enabled"
          checked={options.enabled}
          onCheckedChange={(enabled) => updateOption('enabled', enabled)}
        />
      </div>

      {options.enabled && (
        <div className="space-y-4 pt-2">
          {/* Watermark Text */}
          <div className="space-y-2">
            <Label htmlFor="watermark-text" className="flex items-center gap-2">
              <Type className="h-3 w-3" />
              Watermark Text
            </Label>
            <Input
              id="watermark-text"
              value={options.text}
              onChange={(e) => updateOption('text', e.target.value)}
              placeholder="Enter watermark text"
              maxLength={50}
            />
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlignCenter className="h-3 w-3" />
              Position
            </Label>
            <RadioGroup
              value={options.position}
              onValueChange={(value) => updateOption('position', value as WatermarkOptions['position'])}
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="diagonal" id="pos-diagonal" />
                <Label htmlFor="pos-diagonal" className="text-sm cursor-pointer">Diagonal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="center" id="pos-center" />
                <Label htmlFor="pos-center" className="text-sm cursor-pointer">Center</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="top-left" id="pos-tl" />
                <Label htmlFor="pos-tl" className="text-sm cursor-pointer">Top Left</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="top-right" id="pos-tr" />
                <Label htmlFor="pos-tr" className="text-sm cursor-pointer">Top Right</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bottom-left" id="pos-bl" />
                <Label htmlFor="pos-bl" className="text-sm cursor-pointer">Bottom Left</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bottom-right" id="pos-br" />
                <Label htmlFor="pos-br" className="text-sm cursor-pointer">Bottom Right</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Font Size</Label>
              <span className="text-xs text-muted-foreground">{options.fontSize}pt</span>
            </div>
            <Slider
              value={[options.fontSize]}
              onValueChange={([value]) => updateOption('fontSize', value)}
              min={12}
              max={120}
              step={4}
            />
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Opacity</Label>
              <span className="text-xs text-muted-foreground">{Math.round(options.opacity * 100)}%</span>
            </div>
            <Slider
              value={[options.opacity * 100]}
              onValueChange={([value]) => updateOption('opacity', value / 100)}
              min={5}
              max={80}
              step={5}
            />
          </div>

          {/* Rotation (for non-diagonal positions) */}
          {options.position !== 'diagonal' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Rotation</Label>
                <span className="text-xs text-muted-foreground">{options.rotation}°</span>
              </div>
              <Slider
                value={[options.rotation + 90]}
                onValueChange={([value]) => updateOption('rotation', value - 90)}
                min={0}
                max={180}
                step={15}
              />
            </div>
          )}

          {/* Color */}
          <div className="space-y-2">
            <Label className="text-sm">Color</Label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => updateOption('color', preset.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    options.color.r === preset.value.r &&
                    options.color.g === preset.value.g &&
                    options.color.b === preset.value.b
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/50'
                  }`}
                  style={{
                    backgroundColor: `rgb(${preset.value.r * 255}, ${preset.value.g * 255}, ${preset.value.b * 255})`
                  }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-background border border-dashed border-border rounded-lg flex items-center justify-center min-h-[100px]">
            <span
              style={{
                fontSize: `${Math.min(options.fontSize, 24)}px`,
                color: `rgba(${options.color.r * 255}, ${options.color.g * 255}, ${options.color.b * 255}, ${options.opacity})`,
                transform: `rotate(${options.position === 'diagonal' ? -45 : options.rotation}deg)`,
                fontWeight: 'bold',
                letterSpacing: '0.1em'
              }}
            >
              {options.text || "WATERMARK"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}