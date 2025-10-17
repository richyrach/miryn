import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'zh-CN', name: '中文' },
];

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const { toast } = useToast();

  const handleLanguageChange = async (languageCode: string) => {
    // Update i18n
    i18n.changeLanguage(languageCode);
    
    // Save to localStorage
    localStorage.setItem('language', languageCode);
    
    // Save to database preferences
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('user_id', user.id)
          .single();

        const currentPrefs = (profile?.preferences as Record<string, any>) || {};
        
        await supabase
          .from('profiles')
          .update({ 
            preferences: { 
              ...currentPrefs, 
              language: languageCode 
            } as any
          })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="language">{t('settings.language')}</Label>
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger id="language">
          <SelectValue placeholder={t('settings.selectLanguage')} />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {t('settings.selectLanguage')}
      </p>
    </div>
  );
};
