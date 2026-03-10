import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import api from "@/lib/api"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Globe, Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FastRegisterFormProps {
    onBack: () => void;
}

export function FastRegisterForm({ onBack }: FastRegisterFormProps) {
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const isRtl = lang === 'ar'

    const { data: countriesData, isLoading: isCountriesLoading } = useQuery({
        queryKey: ["countries"],
        queryFn: async () => (await api.get("/countries")).data,
    });

    // Schema with validation
    const formSchema = z.object({
        countryCode: z.string().min(1, {
            message: lang === 'ar' ? "يرجى اختيار البلد" : "Please select a country",
        }),
        password: z.string().min(6, {
            message: lang === 'ar' ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters.",
        }),
    })

    const setAccessToken = useAuthStore((state) => state.setAccessToken)
    const setUser = useAuthStore((state) => state.setUser)
    const [isLoading, setIsLoading] = useState(false)
    const [searchCountry, setSearchCountry] = useState("")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            countryCode: "",
            password: "",
        },
    })

    const selectedCountryCode = form.watch("countryCode")
    const selectedCountry = useMemo(() => {
        if (!countriesData) return null;
        return countriesData.find((c: any) => c.code === selectedCountryCode);
    }, [countriesData, selectedCountryCode]);

    const filteredCountries = useMemo(() => {
        if (!countriesData) return [];
        return countriesData.filter((c: any) =>
            (c.name_ar && c.name_ar.toLowerCase().includes(searchCountry.toLowerCase())) ||
            (c.name_en && c.name_en.toLowerCase().includes(searchCountry.toLowerCase()))
        );
    }, [countriesData, searchCountry]);

    const getFlagUrl = (code: string) => {
        return `${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}/uploads/flag-icons/flags/4x3/${code.toLowerCase()}.svg`;
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const randomString = Math.random().toString(36).substring(2, 8);
            const fakeName = `user_${randomString}`;
            const fakeEmail = `${fakeName}@example.com`;

            // Construct the avatar URL using the selected country's code
            const avatarUrl = getFlagUrl(values.countryCode);

            const response = await api.post("/auth/register", {
                name: fakeName,
                email: fakeEmail,
                password: values.password,
                avatar: avatarUrl
            })

            if (response.data.access_token) {
                setAccessToken(response.data.access_token)
                setUser(response.data.user)
                toast.success(lang === 'ar' ? "تم التسجيل بنجاح" : "Registered successfully")
                window.location.assign(`/${lang}`);
            } else {
                // If the backend auto-logs in the user and returns tokens, we use them.
                // Otherwise fallback to login screen.
                toast.success(lang === 'ar' ? "تم التسجيل بنجاح، جاري تسجيل الدخول..." : "Registered successfully, logging in...")
                try {
                    const loginRes = await api.post("/auth/login", {
                        name: fakeName,
                        password: values.password
                    });
                    if (loginRes.data.access_token) {
                        setAccessToken(loginRes.data.access_token)
                        setUser(loginRes.data.user)
                        window.location.assign(`/${lang}`);
                    } else {
                        navigate(`/${lang}/auth/login`)
                    }
                } catch (e) {
                    navigate(`/${lang}/auth/login`)
                }
            }

        } catch (error: any) {
            const errorMessage = error.response?.data?.error || (lang === 'ar' ? "فشل التسجيل. يرجى المحاولة مرة أخرى." : "Registration failed. Please try again.");
            toast.error(errorMessage);
            console.error(error);
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                        {/* Custom Country Select */}
                        <FormField
                            control={form.control}
                            name="countryCode"
                            render={() => (
                                <FormItem className="flex flex-col relative w-full">
                                    <FormLabel className="text-lg">
                                        {lang === 'ar' ? 'اختر البلد' : 'Select Country'}
                                    </FormLabel>

                                    <div className="relative w-full">
                                        <div
                                            className="min-h-[56px] w-full border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 text-sm flex items-center justify-between cursor-pointer focus:ring-1 focus:ring-primary"
                                            onClick={() => !isLoading && setIsDropdownOpen(!isDropdownOpen)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {selectedCountry ? (
                                                    <>
                                                        <img
                                                            src={getFlagUrl(selectedCountry.code)}
                                                            alt={selectedCountry.name_en}
                                                            className="w-8 h-6 object-cover border border-border rounded-sm shadow-sm"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                        <span className="text-lg">{lang === 'ar' ? selectedCountry.name_ar : selectedCountry.name_en}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground text-lg flex items-center gap-2">
                                                        <Globe className="w-5 h-5" />
                                                        {lang === 'ar' ? "اختر بلداً" : "Select a country"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {isDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border shadow-md z-50">
                                                <div className="p-2 border-b flex items-center gap-2 sticky top-0 bg-background z-10">
                                                    <Search className="w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="text"
                                                        placeholder={lang === 'ar' ? "ابحث عن بلد..." : "Search country..."}
                                                        className="w-full bg-transparent outline-none text-sm"
                                                        value={searchCountry}
                                                        onChange={(e) => setSearchCountry(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <ScrollArea className="h-64">
                                                    {isCountriesLoading ? (
                                                        <div className="flex items-center justify-center p-4">
                                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                        </div>
                                                    ) : filteredCountries.length === 0 ? (
                                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                                            {lang === 'ar' ? "لا توجد نتائج" : "No results found"}
                                                        </div>
                                                    ) : (
                                                        <div className="py-1">
                                                            {filteredCountries.map((country: any) => (
                                                                <div
                                                                    key={country.id || country.ID}
                                                                    className={`px-3 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 ${selectedCountryCode === country.code ? 'bg-muted' : ''}`}
                                                                    onClick={() => {
                                                                        form.setValue("countryCode", country.code, { shouldValidate: true });
                                                                        setIsDropdownOpen(false);
                                                                        setSearchCountry("");
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={getFlagUrl(country.code)}
                                                                        alt={country.name_en}
                                                                        className="w-8 h-6 object-cover border border-border rounded-sm shadow-sm"
                                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                    />
                                                                    <span className="text-base">{lang === 'ar' ? country.name_ar : country.name_en}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </ScrollArea>
                                            </div>
                                        )}
                                    </div>

                                    {/* Invisible backdrop to close dropdown */}
                                    {isDropdownOpen && (
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsDropdownOpen(false)}
                                        />
                                    )}

                                    <FormMessage className="text-red-500 mt-2" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg">
                                        {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            {...field}
                                            disabled={isLoading}
                                            className="rounded-none h-14 text-lg border-gray-300 dark:border-gray-700 focus:ring-1 focus:ring-primary"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-500" />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col gap-4 mt-6">
                            <Button
                                className="w-full h-14 rounded-none text-xl font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-lg"
                                type="submit"
                                disabled={isLoading || isCountriesLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-8 h-8 animate-spin text-white dark:text-black" />
                                ) : (
                                    lang === 'ar' ? 'إنشاء حساب وتسجيل الدخول' : 'Create Account & Login'
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={onBack}
                                className="w-full h-14 rounded-none text-lg"
                                disabled={isLoading}
                            >
                                {lang === 'ar' ? 'العودة للخلف' : 'Go Back'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
