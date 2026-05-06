"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import client from "@/lib/api/client";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Pause,
  Trash2,
  Download,
  Building,
  Mail,
  ChevronRight,
  Users,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { INDUSTRIES, getIndustryLabel } from "@wellanalytics/shared";
import { IndustrySelect } from "@/components/shared/IndustrySelect";

export default function CompaniesPage() {
  const { t, i18n } = useTranslation("admin");
  const searchParams = useSearchParams();
  const industryParam = searchParams.get("industry") || "";
  
  const language = (i18n.language as any) || "tr";
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [consultantId, setConsultantId] = useState(searchParams.get("consultant_id") || "");
  const [consultantName, setConsultantName] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    plan: "starter",
    contact_email: "",
    hr_admin_email: "",
    industry: industryParam,
    size_band: "1-50",
  });
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCompanies = async () => {
    try {
      setFetchLoading(true);
      const res = await client.get("/admin/companies", {
        params: { 
          industry: formData.industry,
          consultant_id: consultantId
        }
      });
      setCompanies(res.data.data || res.data || []);
    } catch (err) {
      console.error("Error fetching companies", err);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchConsultantName = async () => {
    if (!consultantId) return;
    try {
      const res = await client.get(`/admin/consultants/${consultantId}`);
      setConsultantName(res.data.user?.full_name || res.data.full_name);
    } catch (err) {}
  };

  useEffect(() => {
    fetchCompanies();
  }, [formData.industry, consultantId]);

  useEffect(() => {
    fetchConsultantName();
  }, [consultantId]);

  const handleExport = () => {
    if (!companies || companies.length === 0) {
      alert(t('common.error'));
      return;
    }

    const headers = [
      t("companies.table.name"),
      t("companies.table.plan"),
      t("companies.table.contact"),
      t("companies.create.hr_admin_email"),
      t("companies.table.industry"),
      t("companies.table.status"),
      t("audit.columns.date"),
    ];
    const csvData = companies.map((c) => [
      c.name,
      c.plan,
      c.contact_email,
      c.hr_admin_email,
      c.industry || "-",
      c.is_active ? t("companies.status_active") : t("companies.status_passive"),
      new Date(c.created_at).toLocaleDateString(),
    ]);

    // Use semicolon for better Excel compatibility in Turkey
    const csvContent = [
      headers.join(";"),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${t("companies.export_filename")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await client.post("/admin/companies", formData);
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        plan: "starter",
        contact_email: "",
        hr_admin_email: "",
        industry: "",
        size_band: "1-50",
      });
      fetchCompanies(); // Refresh the list
    } catch (err: any) {
      setError(
        err.response?.data?.message || t('common.error'),
      );
    } finally {
      setLoading(false);
    }
  };

  const [deleteWarning, setDeleteWarning] = useState<{
    isOpen: boolean;
    companyId: string;
    companyName: string;
    userCount: number;
  }>({
    isOpen: false,
    companyId: "",
    companyName: "",
    userCount: 0,
  });

  const handleDelete = async (id: string, name: string) => {
    if (
      !window.confirm(
        t('common.confirm_delete'),
      )
    )
      return;

    try {
      setActionLoading(true);
      await client.delete(`/admin/companies/${id}`);
      fetchCompanies(); // Refresh list
    } catch (err: any) {
      if (err.response?.data?.code === "COMPANY_HAS_USERS") {
        setDeleteWarning({
          isOpen: true,
          companyId: id,
          companyName: name,
          userCount: err.response.data.user_count,
        });
      } else {
        alert(err.response?.data?.message || t('common.error'));
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy">
            {t("companies.title")}
          </h1>
          <p className="text-sm text-gray-500">{t("companies.subtitle")}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="ghost" className="flex-1 sm:flex-none gap-2 text-xs md:text-sm" onClick={handleExport}>
            <Download size={16} />
            <span className="hidden xs:inline">{t("companies.export")}</span>
          </Button>
          <Button
            className="flex-1 sm:flex-none gap-2 text-xs md:text-sm shadow-lg shadow-primary/20"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} />
            {t("companies.new")}
          </Button>
        </div>
      </div>

      {consultantId && (
        <div className="bg-primary/5 border border-primary/10 p-5 rounded-3xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Users className="text-primary" size={24} />
             </div>
             <div>
                <p className="text-xs font-bold text-navy">{t("companies.filter_consultant_title")}</p>
                <p className="text-sm text-primary font-black uppercase tracking-widest leading-none mt-1">{consultantName || t("common.loading")}</p>
             </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setConsultantId("")} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
             <Trash2 size={16} className="mr-2" /> {t("companies.filter_remove")}
          </Button>
        </div>
      )}

      <Card>
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder={t(
                "companies.search_placeholder",
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 md:gap-3">
            <IndustrySelect
              value={formData.industry}
              onChange={(val) => {
                setFormData({ ...formData, industry: val || "" });
              }}
              language={language}
              placeholder={t("companies.filter_industry_all")}
              className="w-full sm:w-40"
            />
            <select className="w-full sm:w-auto bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              <option value="">
                {t("companies.filter_plan_all")}
              </option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select className="w-full sm:w-auto bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              <option value="">
                {t("companies.filter_status_all")}
              </option>
              <option value="active">
                {t("companies.status_active")}
              </option>
              <option value="passive">
                {t("companies.status_passive")}
              </option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="p-0 overflow-x-auto">
          {/* Desktop Table */}
          <table className="hidden md:table w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-black uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-4">{t("companies.table.name")}</th>
                <th className="py-4 px-4 text-center">
                  {t("companies.table.employee_count")}
                </th>
                <th className="py-4 px-4 text-center">
                  {t("companies.table.contact")}
                </th>
                <th className="py-4 px-4">{t("companies.table.industry")}</th>
                <th className="py-4 px-4">{t("companies.table.status")}</th>
                <th className="py-4 px-4 text-right">
                  {t("companies.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fetchLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 italic">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 font-medium">
                    {t("companies.empty")}
                  </td>
                </tr>
              ) : (
                companies.map((company, i) => (
                  <tr
                    key={company.id || i}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold uppercase shadow-sm">
                          {company.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-navy group-hover:text-primary transition-colors">
                            {company.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {company.plan}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <Badge variant="gray" className="text-navy font-black text-[10px]">
                          {company.users_count || 0}
                        </Badge>
                        <div className="flex gap-1 text-[9px] text-gray-400 mt-1 font-bold">
                          <span title="HR Admin">{company.hr_admin_count || 0} HR</span>
                          <span>•</span>
                          <span title={t("companies.table.employee_count")}>{company.employee_count || 0} {t("companies.table.employee_count_abbr")}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                       <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-gray-600">{company.contact_email}</span>
                          <span className="text-[10px] text-gray-400">{company.hr_admin_email}</span>
                       </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="gray" className="text-[10px] font-bold uppercase">
                        {company[`industry_label_${language}`] || company.industry || "-"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-2 w-2 rounded-full ${company.is_active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"}`}
                        />
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                          {company.is_active ? t("companies.status_active") : t("companies.status_passive")}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/companies/${company.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          >
                            <Eye size={16} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg transition-all"
                          disabled={actionLoading}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(company.id, company.name);
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {fetchLoading ? (
              <div className="py-12 text-center text-gray-400 italic">{t('common.loading')}</div>
            ) : companies.length === 0 ? (
              <div className="py-12 text-center text-gray-400">{t("companies.empty")}</div>
            ) : (
              companies.map((company, i) => (
                <div key={company.id || i} className="p-4 space-y-4 active:bg-gray-50 transition-colors" onClick={() => window.location.href=`/admin/companies/${company.id}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold uppercase shadow-sm">
                        {company.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-navy">{company.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{company.plan}</p>
                      </div>
                    </div>
                    <Badge variant={company.is_active ? "green" : "red"} className="text-[8px] px-1 py-0 uppercase">
                      {company.is_active ? t("companies.status_active") : t("companies.status_passive")}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t("companies.table.industry")}</p>
                      <p className="text-xs font-bold text-navy truncate">
                        {company[`industry_label_${language}`] || company.industry || "-"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t("companies.table.employee_count")}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-navy">{company.users_count || 0}</span>
                        <span className="text-[9px] text-gray-400">({company.hr_admin_count || 0} HR)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center border-t border-gray-50">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-bold text-gray-400 truncate max-w-[150px]">{company.contact_email}</span>
                       <span className="text-[9px] font-bold text-primary truncate max-w-[150px]">{company.hr_admin_email}</span>
                    </div>
                    <div className="flex gap-2">
                       <Link href={`/admin/companies/${company.id}`} onClick={(e) => e.stopPropagation()}>
                         <Button size="sm" variant="ghost" className="p-2 h-8 w-8 rounded-lg text-primary bg-primary/5">
                           <Eye size={14} />
                         </Button>
                       </Link>
                       <Button 
                         size="sm" 
                         variant="ghost" 
                         className="p-2 h-8 w-8 rounded-lg text-danger bg-danger/5"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleDelete(company.id, company.name);
                         }}
                       >
                         <Trash2 size={14} />
                       </Button>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </Card>

      {/* Create Company Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t("companies.create.title")}
        maxWidth="md"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {Array.isArray(error) ? error.join(", ") : error}
          </div>
        )}
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">
              {t("companies.create.company_name")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t(
                  "companies.create.company_name_placeholder",
                )}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">
                {t("companies.create.plan")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.plan}
                onChange={(e) =>
                  setFormData({ ...formData, plan: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">
                {t("companies.create.industry")}
              </label>
              <IndustrySelect
                value={formData.industry}
                onChange={(val) => setFormData({ ...formData, industry: val || "" })}
                language={language}
                placeholder={t(
                  "companies.create.industry_placeholder",
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">
              {t("companies.create.contact_email")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="email"
                required
                value={formData.contact_email}
                onChange={(e) =>
                  setFormData({ ...formData, contact_email: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">
              {t("companies.create.hr_admin_email")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="email"
                required
                value={formData.hr_admin_email}
                onChange={(e) =>
                  setFormData({ ...formData, hr_admin_email: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {t(
                  "companies.create.hr_admin_email_hint",
                )}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">
              {t("companies.create.size_band")}
            </label>
            <div className="relative">
              <Users
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <select
                value={formData.size_band}
                onChange={(e) =>
                  setFormData({ ...formData, size_band: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="1-50">1 - 50</option>
                <option value="51-200">51 - 200</option>
                <option value="201-500">201 - 500</option>
                <option value="501+">501+</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button loading={loading} type="submit">
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Warning Modal */}
      <Modal
        isOpen={deleteWarning.isOpen}
        onClose={() => setDeleteWarning({ ...deleteWarning, isOpen: false })}
        title={`⚠️ ${t("companies.delete_error_title")}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-700">
            <AlertTriangle className="shrink-0" size={24} />
            <div className="text-sm">
              <p className="font-bold mb-1">
                {t("companies.delete_error_desc", { name: deleteWarning.companyName, count: deleteWarning.userCount })}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href={`/admin/companies/${deleteWarning.companyId}?tab=users`}
              className="w-full"
            >
              <Button className="w-full flex gap-2 justify-center py-3">
                {t("companies.actions.manage_users")} <ChevronRight size={18} />
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() =>
                setDeleteWarning({ ...deleteWarning, isOpen: false })
              }
            >
              {t("common.close")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
