import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { PageLoader } from "@/components/ui/page-loader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash, Globe, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getImageUrl } from "@/utils/image-utils";
import { useTranslation } from "react-i18next";

export default function CountriesPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [nameAr, setNameAr] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [code, setCode] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [editingCountry, setEditingCountry] = useState<any>(null);

    const { data: countries, isLoading } = useQuery({
        queryKey: ["countries", searchTerm],
        queryFn: async () => (await api.get("/countries", { params: { search: searchTerm } })).data,
    });

    const createMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            return await api.post("/countries", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["countries"] });
            toast.success(t('common.success_create', 'Country created successfully'));
            setIsAddModalOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            toast.error("Failed to create country: " + (err.response?.data?.error || err.message));
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const id = editingCountry?.id || editingCountry?.ID;
            if (!id) throw new Error("No country selected");
            return await api.put(`/countries/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["countries"] });
            toast.success(t('common.success_update', 'Country updated successfully'));
            setIsEditModalOpen(false);
            setEditingCountry(null);
            resetForm();
        },
        onError: (err: any) => {
            toast.error("Failed to update country: " + (err.response?.data?.error || err.message));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/countries/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["countries"] });
            toast.success(t('common.success_delete', 'Country deleted'));
        },
        onError: (err: any) => {
            toast.error("Failed to delete country: " + (err.response?.data?.error || err.message));
        }
    });

    const resetForm = () => {
        setNameAr("");
        setNameEn("");
        setCode("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (editFileInputRef.current) editFileInputRef.current.value = "";
    };

    const handleEditClick = (country: any) => {
        setEditingCountry(country);
        setNameAr(country.name_ar || "");
        setNameEn(country.name_en || "");
        setCode(country.code || "");
        setSelectedFile(null);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        if (confirm(t('common.confirm_delete', 'Are you sure you want to delete this country?'))) {
            deleteMutation.mutate(id);
        }
    };

    const handleCreate = () => {
        const formData = new FormData();
        formData.append("name_ar", nameAr);
        formData.append("name_en", nameEn);
        formData.append("code", code);
        if (selectedFile) {
            formData.append("flag", selectedFile);
        }
        createMutation.mutate(formData);
    };

    const handleUpdate = () => {
        const formData = new FormData();
        formData.append("name_ar", nameAr);
        formData.append("name_en", nameEn);
        formData.append("code", code);
        if (selectedFile) {
            formData.append("flag", selectedFile);
        }
        updateMutation.mutate(formData);
    };

    if (isLoading) return <PageLoader />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Globe className="h-8 w-8 text-primary" />
                        {t('common.countries')}
                    </h2>
                    <p className="text-muted-foreground">Manage countries and their flags.</p>
                </div>
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('common.add')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{t('common.add')} {t('common.countries')}</DialogTitle>
                            <DialogDescription>
                                Create a new country entry.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 text-right rtl:text-right">
                            <div className="grid gap-2">
                                <Label htmlFor="nameAr" className="rtl:text-right text-right">الاسم بالعربي</Label>
                                <Input id="nameAr" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: السعودية" className="text-right" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nameEn">Name (English)</Label>
                                <Input id="nameEn" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Saudi Arabia" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="code">Country Code (ISO)</Label>
                                <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. sa" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="flag">Flag Icon (SVG)</Label>
                                <div
                                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Input
                                        type="file"
                                        id="flag"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        accept=".svg"
                                    />
                                    {selectedFile ? (
                                        <div className="text-sm font-medium text-primary flex items-center justify-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            {selectedFile.name}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground flex flex-col items-center gap-1">
                                            <Upload className="h-6 w-6 mb-1 opacity-50" />
                                            <span>Click to upload SVG</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="flex-row-reverse gap-2">
                            <Button onClick={handleCreate} disabled={createMutation.isPending || !nameAr.trim() || !nameEn.trim()}>
                                {createMutation.isPending ? t('common.saving', "Saving...") : t('common.add', "Add")}
                            </Button>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>{t('common.cancel', "Cancel")}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('common.search', 'Search...')}
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('common.edit')} {t('common.countries')}</DialogTitle>
                        <DialogDescription>Update country details.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-nameAr" className="text-right">الاسم بالعربي</Label>
                            <Input id="edit-nameAr" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="text-right" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-nameEn">Name (English)</Label>
                            <Input id="edit-nameEn" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-code">Country Code</Label>
                            <Input id="edit-code" value={code} onChange={(e) => setCode(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-flag">Flag Icon (Optional)</Label>
                            <div
                                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => editFileInputRef.current?.click()}
                            >
                                <Input
                                    type="file"
                                    id="edit-flag"
                                    ref={editFileInputRef}
                                    className="hidden"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    accept=".svg"
                                />
                                {selectedFile ? (
                                    <div className="text-sm font-medium text-primary flex items-center justify-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        {selectedFile.name}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground flex flex-col items-center gap-1">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            {editingCountry?.code && (
                                                <img
                                                    src={`${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}/uploads/flag-icons/flags/4x3/${editingCountry.code.toLowerCase()}.svg`}
                                                    alt={editingCountry.name_en}
                                                    style={{ width: '36px', height: '26px', objectFit: 'cover', borderRadius: '3px' }}
                                                />
                                            )}
                                            <Upload className="h-6 w-6 opacity-50" />
                                        </div>
                                        <span>Click to replace SVG</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex-row-reverse gap-2">
                        <Button onClick={handleUpdate} disabled={updateMutation.isPending || !nameAr.trim()}>
                            {updateMutation.isPending ? t('common.saving', "Saving...") : t('common.save', "Save Changes")}
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>{t('common.cancel', "Cancel")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>{t('common.all', 'All')} {t('common.countries')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">{t('common.flag', 'Flag')}</TableHead>
                                <TableHead>{t('common.name_ar', 'الاسم بالعربي')}</TableHead>
                                <TableHead>{t('common.name_en', 'Name (En)')}</TableHead>
                                <TableHead>{t('common.code', 'Code')}</TableHead>
                                <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {countries?.map((country: any, index: number) => (
                                <TableRow key={country.id || country.ID || index}>
                                    <TableCell>
                                        {country.code ? (
                                            <img
                                                src={`${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}/uploads/flag-icons/flags/4x3/${country.code.toLowerCase()}.svg`}
                                                alt={country.name_en}
                                                className="h-5 rounded shadow-sm border border-border"
                                                style={{ width: '28px', height: '20px', objectFit: 'cover' }}
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <Globe className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{country.name_ar}</TableCell>
                                    <TableCell>{country.name_en}</TableCell>
                                    <TableCell><code className="bg-muted px-1.5 py-0.5 rounded text-xs uppercase">{country.code}</code></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(country)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(country.id || country.ID)}>
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {countries?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        {t('common.no_results', 'No results found.')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
