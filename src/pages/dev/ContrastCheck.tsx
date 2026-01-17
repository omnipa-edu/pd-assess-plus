/**
 * Contrast Check Dev Page
 * 
 * Internal-only page for verifying contrast and readability of UI elements
 * in both light and dark modes. Accessible only in development mode.
 * 
 * This page can be removed after QA verification is complete.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

import { LogoWordmark } from '@/components/brand/LogoWordmark';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function ContrastCheck() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('Sample input text');

  // In production, redirect away
  if (import.meta.env.PROD) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              This page is only available in development mode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Contrast Check</h1>
            <p className="text-muted-foreground">
              Visual verification of contrast and readability in light and dark modes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to App
            </Button>
          </div>
        </div>

        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Wordmark</CardTitle>
            <CardDescription>
              Dark mode: "Adaptive" should be white; "Competency" should be primary accent (teal)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Logo on Background */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">On Background (bg-background)</Label>
                <div className="rounded-lg border-2 border-border bg-background p-6">
                  <LogoWordmark className="text-2xl" />
                </div>
              </div>

              {/* Logo on Card */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">On Card (bg-card)</Label>
                <div className="rounded-lg border-2 border-border bg-card p-6">
                  <LogoWordmark className="text-2xl" />
                </div>
              </div>

              {/* Logo on Secondary/Muted */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">On Secondary/Muted Background</Label>
                <div className="rounded-lg border-2 border-border bg-secondary p-6">
                  <LogoWordmark className="text-2xl" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Swatches */}
        <Card>
          <CardHeader>
            <CardTitle>Color Token Swatches</CardTitle>
            <CardDescription>
              Core color tokens with sample text to verify contrast
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Background / Foreground */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg border-2 border-border bg-background flex items-center justify-center">
                  <span className="text-foreground font-medium">Aa 16px / 14px</span>
                </div>
                <div className="text-sm font-medium">Background / Foreground</div>
                <div className="text-xs text-muted-foreground">--background / --foreground</div>
              </div>

              {/* Card / Card Foreground */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg border-2 border-border bg-card flex items-center justify-center">
                  <span className="text-card-foreground font-medium">Aa 16px / 14px</span>
                </div>
                <div className="text-sm font-medium">Card / Card Foreground</div>
                <div className="text-xs text-muted-foreground">--card / --card-foreground</div>
              </div>

              {/* Muted / Muted Foreground */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg border-2 border-border bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground font-medium">Aa 16px / 14px</span>
                </div>
                <div className="text-sm font-medium">Muted / Muted Foreground</div>
                <div className="text-xs text-muted-foreground">--muted / --muted-foreground</div>
              </div>

              {/* Primary / Primary Foreground */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg border-2 border-border bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-medium">Aa 16px / 14px</span>
                </div>
                <div className="text-sm font-medium">Primary / Primary Foreground</div>
                <div className="text-xs text-muted-foreground">--primary / --primary-foreground</div>
              </div>

              {/* Accent / Accent Foreground */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg border-2 border-border bg-accent flex items-center justify-center">
                  <span className="text-accent-foreground font-medium">Aa 16px / 14px</span>
                </div>
                <div className="text-sm font-medium">Accent / Accent Foreground</div>
                <div className="text-xs text-muted-foreground">--accent / --accent-foreground</div>
              </div>

              {/* Secondary / Secondary Foreground */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg border-2 border-border bg-secondary flex items-center justify-center">
                  <span className="text-secondary-foreground font-medium">Aa 16px / 14px</span>
                </div>
                <div className="text-sm font-medium">Secondary / Secondary Foreground</div>
                <div className="text-xs text-muted-foreground">--secondary / --secondary-foreground</div>
              </div>

              {/* Destructive / Destructive Foreground */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg border-2 border-border bg-destructive flex items-center justify-center">
                  <span className="text-destructive-foreground font-medium">Aa 16px / 14px</span>
                </div>
                <div className="text-sm font-medium">Destructive / Destructive Foreground</div>
                <div className="text-xs text-muted-foreground">--destructive / --destructive-foreground</div>
              </div>

              {/* Border */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg border-4 border-border bg-background flex items-center justify-center">
                  <span className="text-foreground font-medium">Border</span>
                </div>
                <div className="text-sm font-medium">Border</div>
                <div className="text-xs text-muted-foreground">--border</div>
              </div>

              {/* Success */}
              <div className="space-y-2">
                <div className="h-24 rounded-lg border-2 border-border bg-success flex items-center justify-center">
                  <span className="text-success-foreground font-medium">Aa 16px / 14px</span>
                </div>
                <div className="text-sm font-medium">Success</div>
                <div className="text-xs text-muted-foreground">--success / --success-foreground</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Component Contrast Section */}
        <Card>
          <CardHeader>
            <CardTitle>Component Contrast</CardTitle>
            <CardDescription>
              Real shadcn/ui components to verify contrast in context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Buttons */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Buttons</Label>
                <div className="flex flex-wrap gap-4">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>

              <Separator />

              {/* Inputs */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Inputs</Label>
                <div className="space-y-2">
                  <Label htmlFor="sample-input">Sample Input</Label>
                  <Input
                    id="sample-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Placeholder text"
                  />
                  <p className="text-sm text-muted-foreground">
                    Helper text with muted-foreground color
                  </p>
                </div>
              </div>

              <Separator />

              {/* Badges */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Badges</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </div>

              <Separator />

              {/* Links */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Links</Label>
                <div className="space-y-2">
                  <a href="#" className="text-primary hover:underline">
                    Primary Link
                  </a>
                  <br />
                  <a href="#" className="text-foreground hover:text-primary hover:underline">
                    Foreground Link
                  </a>
                </div>
              </div>

              <Separator />

              {/* Alerts */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Alerts</Label>
                <div className="space-y-2">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Info Alert</AlertTitle>
                    <AlertDescription>
                      This is an informational alert with default styling.
                    </AlertDescription>
                  </Alert>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Destructive Alert</AlertTitle>
                    <AlertDescription>
                      This is a destructive/error alert with proper contrast.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Focus & Keyboard Check */}
        <Card>
          <CardHeader>
            <CardTitle>Focus & Keyboard Navigation</CardTitle>
            <CardDescription>
              Verify focus rings are visible and accessible in both themes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Tab through these elements to see focus rings (uses --ring token)
                </Label>
                <div className="flex flex-wrap gap-4">
                  <Button>Focusable Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Input placeholder="Focusable Input" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Focus rings should be clearly visible using the --ring token (teal500 in dark mode).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground pt-4">
          This is a temporary dev page for contrast verification. Remove after QA is complete.
        </div>
      </div>
    </div>
  );
}


