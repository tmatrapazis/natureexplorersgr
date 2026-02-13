import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, Shield, BarChart3, Target } from 'lucide-react';

const categories = [
  {
    id: 'necessary',
    title: 'Strictly Necessary Cookies',
    description: 'These cookies are essential for the website to function properly. They enable core functionality such as security, network management, and accessibility. You cannot opt-out of these cookies.',
    icon: Shield,
    required: true,
  },
  {
    id: 'analytics',
    title: 'Analytics & Performance Cookies',
    description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve the site\'s performance and user experience.',
    icon: BarChart3,
    required: false,
  },
  {
    id: 'marketing',
    title: 'Marketing & Targeting Cookies',
    description: 'These cookies are used to track visitors across websites. They are used to display ads that are relevant and engaging for individual users, and are therefore more valuable for publishers and third-party advertisers.',
    icon: Target,
    required: false,
  },
];

export default function CookiePreferencesModal({ preferences, onSave, onClose }) {
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleToggle = (categoryId) => {
    setLocalPrefs(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleSave = () => {
    onSave(localPrefs);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    onSave(allAccepted);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-background border border-border rounded-lg shadow-2xl max-w-3xl w-full my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-semibold">Cookie Preferences</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your cookie settings and privacy preferences
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            const isEnabled = localPrefs[category.id];

            return (
              <div 
                key={category.id} 
                className="border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="bg-primary/10 p-2.5 rounded-lg shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base">{category.title}</h3>
                        {category.required && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                            Always Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pt-1">
                    <Switch
                      id={category.id}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(category.id)}
                      disabled={category.required}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-border">
          <Button 
            onClick={handleAcceptAll}
            className="flex-1 sm:flex-none sm:min-w-[140px]"
            size="lg"
          >
            Accept All
          </Button>
          <Button 
            onClick={handleSave}
            variant="outline"
            className="flex-1 sm:flex-none sm:min-w-[140px]"
            size="lg"
          >
            Save Preferences
          </Button>
          <Button 
            onClick={onClose}
            variant="ghost"
            className="flex-1 sm:flex-none"
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}