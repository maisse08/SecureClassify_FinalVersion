import { createContext, useState, useEffect, ReactNode } from "react";
import { Language, translations } from "../i18n/translations";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

const STORAGE_KEY = "sc_language";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === "en" || saved === "fr" || saved === "ar" ? (saved as Language) : "en";
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, language);
        document.documentElement.setAttribute("lang", language);
        document.documentElement.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
    }, [language]);

    const setLanguage = (lang: Language) => setLanguageState(lang);

    const t = (key: string): string => {
        return translations[language]?.[key] ?? translations.en[key] ?? key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
