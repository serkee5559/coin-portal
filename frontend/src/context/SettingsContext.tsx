import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

type Theme = 'dark' | 'light' | 'system';

interface SettingsContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    compactMode: boolean;
    setCompactMode: (mode: boolean) => void;
    showBalance: boolean;
    setShowBalance: (show: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
    const [compactMode, setCompactMode] = useState(() => localStorage.getItem('compactMode') === 'true');
    const [showBalance, setShowBalance] = useState(() => localStorage.getItem('showBalance') !== 'false');

    // Supabase에서 설정 불러오기
    useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .single();

            if (data && !error) {
                setTheme(data.theme);
                setCompactMode(data.compact_mode);
                setShowBalance(data.show_balance);
            }
        };
        fetchSettings();
    }, []);

    // 설정 변경 시 Supabase 및 LocalStorage 동기화
    const syncSettings = async (updates: any) => {
        await supabase
            .from('settings')
            .upsert({ id: 'default-user', ...updates }, { onConflict: 'id' });
    };

    useEffect(() => {
        localStorage.setItem('theme', theme);
        syncSettings({ theme });
        const root = window.document.documentElement;
        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.toggle('dark', systemTheme === 'dark');
            root.classList.toggle('light', systemTheme === 'light');
        } else {
            root.classList.toggle('dark', theme === 'dark');
            root.classList.toggle('light', theme === 'light');
        }
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('compactMode', JSON.stringify(compactMode));
        syncSettings({ compact_mode: compactMode });
    }, [compactMode]);

    useEffect(() => {
        localStorage.setItem('showBalance', JSON.stringify(showBalance));
        syncSettings({ show_balance: showBalance });
    }, [showBalance]);

    return (
        <SettingsContext.Provider value={{
            theme, setTheme,
            compactMode, setCompactMode,
            showBalance, setShowBalance
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
