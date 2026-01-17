/**
 * Temporary Palette Swatch Dev Page
 * Visual QA tool for verifying the new Slate + Teal brand palette
 * This page can be removed after palette verification is complete
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaletteSwatch() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Brand Palette Swatch</h1>
          <p className="text-muted-foreground">Slate + Teal Palette Verification</p>
        </div>

        {/* Background & Base Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Background & Base Colors</CardTitle>
            <CardDescription>Core surface and text colors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-background border-2 border-border"></div>
                <div className="text-sm font-medium">Background</div>
                <div className="text-xs text-muted-foreground">--background</div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-card border-2 border-border"></div>
                <div className="text-sm font-medium">Card</div>
                <div className="text-xs text-muted-foreground">--card</div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-foreground"></div>
                <div className="text-sm font-medium text-foreground">Foreground</div>
                <div className="text-xs text-muted-foreground">--foreground</div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-muted border-2 border-border"></div>
                <div className="text-sm font-medium">Muted</div>
                <div className="text-xs text-muted-foreground">--muted</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary & Accent Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Primary & Accent Colors</CardTitle>
            <CardDescription>Trajectory Teal brand colors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-primary"></div>
                <div className="text-sm font-medium text-primary-foreground bg-primary px-2 py-1 rounded">
                  Primary
                </div>
                <div className="text-xs text-muted-foreground">--primary</div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-accent border-2 border-border"></div>
                <div className="text-sm font-medium">Accent</div>
                <div className="text-xs text-muted-foreground">--accent</div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-secondary border-2 border-border"></div>
                <div className="text-sm font-medium">Secondary</div>
                <div className="text-xs text-muted-foreground">--secondary</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Status Colors</CardTitle>
            <CardDescription>Success, Warning, Error</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-success"></div>
                <div className="text-sm font-medium text-success-foreground bg-success px-2 py-1 rounded">
                  Success
                </div>
                <div className="text-xs text-muted-foreground">--success</div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-warning"></div>
                <div className="text-sm font-medium text-warning-foreground bg-warning px-2 py-1 rounded">
                  Warning
                </div>
                <div className="text-xs text-muted-foreground">--warning</div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-destructive"></div>
                <div className="text-sm font-medium text-destructive-foreground bg-destructive px-2 py-1 rounded">
                  Destructive/Error
                </div>
                <div className="text-xs text-muted-foreground">--destructive</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interface Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Interface Elements</CardTitle>
            <CardDescription>Borders, inputs, rings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-24 rounded-lg border-4 border-border bg-background"></div>
                <div className="text-sm font-medium">Border</div>
                <div className="text-xs text-muted-foreground">--border</div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg border-4 border-ring bg-background"></div>
                <div className="text-sm font-medium">Ring (Focus)</div>
                <div className="text-xs text-muted-foreground">--ring</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buttons Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>Primary, secondary, destructive buttons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90">
                Primary Button
              </button>
              <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:opacity-90">
                Secondary Button
              </button>
              <button className="px-4 py-2 bg-accent text-accent-foreground rounded-md font-medium hover:opacity-90">
                Accent Button
              </button>
              <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md font-medium hover:opacity-90">
                Destructive Button
              </button>
              <button className="px-4 py-2 border-2 border-border rounded-md font-medium hover:bg-muted">
                Outline Button
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground pt-4">
          This is a temporary dev page for palette verification. Remove after QA is complete.
        </div>
      </div>
    </div>
  );
}


