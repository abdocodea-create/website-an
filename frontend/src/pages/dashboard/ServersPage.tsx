import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { PageLoader } from "@/components/ui/page-loader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash, Server, Search, Upload } from "lucide-react";
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

export default function ServersPage() {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [nameAr, setNameAr] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [type, setType] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [editingServer, setEditingServer] = useState<any>(null);

    const { data: servers, isLoading } = useQuery({
        queryKey: ["servers", searchTerm],
        queryFn: async () => (await api.get("/servers", { params: { search: searchTerm } })).data,
    });

    const createMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            return await api.post("/servers", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["servers"] });
            toast.success(i18n.language === 'ar' ? 'تم إنشاء السيرفر بنجاح' : 'Server created successfully');
            setIsAddModalOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            toast.error("Failed to create server: " + (err.response?.data?.error || err.message));
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const id = editingServer?.id || editingServer?.ID;
            if (!id) throw new Error("No server selected");
            return await api.put(`/servers/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["servers"] });
            toast.success(i18n.language === 'ar' ? 'تم تحديث السيرفر بنجاح' : 'Server updated successfully');
            setIsEditModalOpen(false);
            setEditingServer(null);
            resetForm();
        },
        onError: (err: any) => {
            toast.error("Failed to update server: " + (err.response?.data?.error || err.message));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/servers/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["servers"] });
            toast.success(i18n.language === 'ar' ? 'تم حذف السيرفر' : 'Server deleted');
        },
        onError: (err: any) => {
            toast.error("Failed to delete server: " + (err.response?.data?.error || err.message));
        }
    });

    const resetForm = () => {
        setNameAr("");
        setNameEn("");
        setType("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (editFileInputRef.current) editFileInputRef.current.value = "";
    };

    const handleEditClick = (server: any) => {
        setEditingServer(server);
        setNameAr(server.name_ar || "");
        setNameEn(server.name_en || "");
        setType(server.type || "");
        setSelectedFile(null);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        if (confirm(i18n.language === 'ar' ? 'هل أنت متأكد من حذف هذا السيرفر؟' : 'Are you sure you want to delete this server?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleCreate = () => {
        const formData = new FormData();
        formData.append("name_ar", nameAr);
        formData.append("name_en", nameEn);
        formData.append("type", type);
        if (selectedFile) {
            formData.append("image", selectedFile);
        }
        createMutation.mutate(formData);
    };

    const handleUpdate = () => {
        const formData = new FormData();
        formData.append("name_ar", nameAr);
        formData.append("name_en", nameEn);
        formData.append("type", type);
        if (selectedFile) {
            formData.append("image", selectedFile);
        }
        updateMutation.mutate(formData);
    };

    if (isLoading) return <PageLoader />;

    return (
        <div className="space-y-6 text-right rtl:text-right" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Server className="h-8 w-8 text-primary" />
                        {i18n.language === 'ar' ? 'السيرفرات' : 'Servers'}
                    </h2>
                    <p className="text-muted-foreground mr-1">
                        {i18n.language === 'ar' ? 'إدارة السيرفرات وصورها.' : 'Manage servers and their images.'}
                    </p>
                </div>
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="ml-2 h-4 w-4" />
                            {t('common.add')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{t('common.add')} {i18n.language === 'ar' ? 'سيرفر' : 'Server'}</DialogTitle>
                            <DialogDescription>
                                {i18n.language === 'ar' ? 'إضافة سيرفر جديد للنظام.' : 'Create a new server entry.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nameAr">الاسم بالعربي</Label>
                                <Input id="nameAr" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: سيرفر 1" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nameEn">Name (English)</Label>
                                <Input id="nameEn" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Server 1" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">{i18n.language === 'ar' ? 'نوع السيرفر' : 'Server Type'}</Label>
                                <Input id="type" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. VDrive, OkRu" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="image">{i18n.language === 'ar' ? 'الصورة' : 'Image'}</Label>
                                <div
                                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Input
                                        type="file"
                                        id="image"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        accept="image/*"
                                    />
                                    {selectedFile ? (
                                        <div className="text-sm font-medium text-primary flex items-center justify-center gap-2">
                                            <Server className="h-4 w-4" />
                                            {selectedFile.name}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground flex flex-col items-center gap-1">
                                            <Upload className="h-6 w-6 mb-1 opacity-50" />
                                            <span>{i18n.language === 'ar' ? 'اضغط لرفع صورة' : 'Click to upload image'}</span>
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

            <div className="flex items-center gap-2 max-w-sm ml-auto rtl:mr-auto rtl:ml-0">
                <div className="relative w-full">
                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('common.search', 'Search...')}
                        className="pr-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('common.edit')} {i18n.language === 'ar' ? 'سيرفر' : 'Server'}</DialogTitle>
                        <DialogDescription>
                            {i18n.language === 'ar' ? 'تحديث بيانات السيرفر.' : 'Update server details.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-nameAr">الاسم بالعربي</Label>
                            <Input id="edit-nameAr" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-nameEn">Name (English)</Label>
                            <Input id="edit-nameEn" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-type">{i18n.language === 'ar' ? 'نوع السيرفر' : 'Server Type'}</Label>
                            <Input id="edit-type" value={type} onChange={(e) => setType(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-image">{i18n.language === 'ar' ? 'الصورة' : 'Image'}</Label>
                            <div
                                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => editFileInputRef.current?.click()}
                            >
                                <Input
                                    type="file"
                                    id="edit-image"
                                    ref={editFileInputRef}
                                    className="hidden"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    accept="image/*"
                                />
                                {selectedFile ? (
                                    <div className="text-sm font-medium text-primary flex items-center justify-center gap-2">
                                        <Server className="h-4 w-4" />
                                        {selectedFile.name}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground flex flex-col items-center gap-1">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            {editingServer?.image && (
                                                <img
                                                    src={getImageUrl(editingServer.image)}
                                                    alt={editingServer.name_en}
                                                    className="h-10 w-10 object-cover rounded shadow-sm border border-border"
                                                />
                                            )}
                                            <Upload className="h-6 w-6 opacity-50" />
                                        </div>
                                        <span>{i18n.language === 'ar' ? 'اضغط لتغيير الصورة' : 'Click to replace image'}</span>
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
                    <CardTitle>{t('common.all', 'All')} {i18n.language === 'ar' ? 'السيرفرات' : 'Servers'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">{i18n.language === 'ar' ? 'الصورة' : 'Image'}</TableHead>
                                <TableHead>{t('common.name_ar', 'الاسم بالعربي')}</TableHead>
                                <TableHead>{t('common.name_en', 'Name (En)')}</TableHead>
                                <TableHead>{i18n.language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                                <TableHead className="text-left">{t('common.actions', 'Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {servers?.map((server: any, index: number) => (
                                <TableRow key={server.id || server.ID || index}>
                                    <TableCell>
                                        {server.image ? (
                                            <img
                                                src={getImageUrl(server.image)}
                                                alt={server.name_en}
                                                className="h-10 w-10 object-cover rounded shadow-sm border border-border"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <Server className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{server.name_ar}</TableCell>
                                    <TableCell>{server.name_en}</TableCell>
                                    <TableCell><code className="bg-muted px-1.5 py-0.5 rounded text-xs uppercase">{server.type}</code></TableCell>
                                    <TableCell className="text-left">
                                        <div className="flex justify-start gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(server)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(server.id || server.ID)}>
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {servers?.length === 0 && (
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
