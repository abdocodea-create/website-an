import { useState } from "react";
import { RegisterForm } from "@/features/auth/components/register-form";
import { FastRegisterForm } from "@/features/auth/components/fast-register-form";
import { Header } from "@/components/header/Header";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Zap, User } from "lucide-react";

export default function RegisterPage() {
    const { i18n, t } = useTranslation();
    const lang = i18n.language;
    const isRtl = lang === 'ar';
    const [mode, setMode] = useState<'selection' | 'full' | 'fast'>('selection');

    return (
        <div className="min-h-screen bg-background font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
            <Header />
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] py-12 px-4 animate-in fade-in duration-500">
                <div className="w-full max-w-[600px] grid gap-8">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-4xl font-bold tracking-tight">
                            {mode === 'selection' ? (lang === 'ar' ? 'اختر طريقة التسجيل' : 'Choose Registration Method') :
                             mode === 'full' ? (lang === 'ar' ? 'إنشاء حساب جديد' : 'Create an Account') :
                             (lang === 'ar' ? 'التسجيل السريع' : 'Fast Registration')}
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            {mode === 'selection' ? (lang === 'ar' ? 'اختر كيف تود إنشاء حسابك' : 'Choose how you want to create your account') :
                             mode === 'full' ? (lang === 'ar' ? 'أدخل بياناتك أدناه لإنشاء حساب جديد' : 'Enter your details below to create your account') :
                             (lang === 'ar' ? 'اختر بلدك وأدخل الرقم السري للتسجيل بسرعة' : 'Select your country and enter password to register quickly')}
                        </p>
                    </div>

                    {mode === 'selection' && (
                        <div className="flex flex-col gap-4 mt-4">
                            <Button 
                                onClick={() => setMode('fast')}
                                className="w-full h-16 rounded-none text-xl font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-lg flex items-center justify-center gap-3"
                            >
                                <Zap className="w-6 h-6" />
                                {lang === 'ar' ? 'التسجيل السريع' : 'Fast Registration'}
                            </Button>
                            
                            <Button 
                                onClick={() => setMode('full')}
                                className="w-full h-16 rounded-none text-xl font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-lg flex items-center justify-center gap-3"
                            >
                                <User className="w-6 h-6" />
                                {lang === 'ar' ? 'التسجيل الكامل' : 'Full Registration'}
                            </Button>
                        </div>
                    )}

                    {mode === 'full' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-300">
                            <RegisterForm />
                            <div className="mt-4 text-center">
                                <Button variant="link" onClick={() => setMode('selection')} className="text-muted-foreground">
                                    {lang === 'ar' ? 'العودة للخلف' : 'Go Back'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {mode === 'fast' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-300">
                            <FastRegisterForm onBack={() => setMode('selection')} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
