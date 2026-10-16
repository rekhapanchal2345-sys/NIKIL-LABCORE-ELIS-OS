"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  ShieldCheck, 
  Plus, 
  Save, 
  Trash2, 
  Edit, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Sliders
} from "lucide-react";
import { analyzersApi } from "@/lib/api";

interface QCRule {
  id: string;
  analyzerId?: string;
  analyzerName?: string;
  testId?: string;
  testParameterId?: string;
  ruleName: string;
  ruleType: "AUTO_APPROVAL" | "QC_CHECK" | "DELTA_CHECK" | "RANGE_CHECK";
  ruleCondition: string;
  minValue?: number;
  maxValue?: number;
  criticalLowThreshold?: number;
  criticalHighThreshold?: number;
  deltaThreshold?: number;
  requireQCPass?: boolean;
  qcLevel?: string;
  qcSampleType?: string;
  autoApprove?: boolean;
  requirePathologistReview?: boolean;
  requireTechnicianReview?: boolean;
  priority: number;
  generateAlertOnFailure?: boolean;
  alertSeverity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  description?: string;
  notes?: string;
  isActive: boolean;
}

interface AutoApprovalQCProps {
  analyzerId?: string;
  onClose?: () => void;
}

export default function AutoApprovalQC({ analyzerId, onClose }: AutoApprovalQCProps) {
  const [qcRules, setQcRules] = useState<QCRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<QCRule | null>(null);
  const [newRule, setNewRule] = useState({
    ruleName: "",
    ruleType: "AUTO_APPROVAL" as "AUTO_APPROVAL" | "QC_CHECK" | "DELTA_CHECK" | "RANGE_CHECK",
    ruleCondition: "WITHIN_NORMAL_RANGE",
    minValue: undefined as number | undefined,
    maxValue: undefined as number | undefined,
    criticalLowThreshold: undefined as number | undefined,
    criticalHighThreshold: undefined as number | undefined,
    deltaThreshold: undefined as number | undefined,
    requireQCPass: true,
    qcLevel: "LEVEL_1",
    qcSampleType: "NORMAL",
    autoApprove: false,
    requirePathologistReview: false,
    requireTechnicianReview: true,
    priority: 0,
    generateAlertOnFailure: true,
    alertSeverity: "WARNING" as "INFO" | "WARNING" | "ERROR" | "CRITICAL",
    description: "",
    notes: "",
  });

  const fetchQCRules = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (analyzerId) params.append("analyzerId", analyzerId);
      if (filter !== "ALL") params.append("isActive", filter === "ACTIVE" ? "true" : "false");

      const response = await analyzersApi.getQCRules(params.toString());
      if (response.success) {
        setQcRules(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch QC rules:", error);
    } finally {
      setLoading(false);
    }
  }, [analyzerId, filter]);

  useEffect(() => {
    fetchQCRules();
  }, [fetchQCRules]);

  const handleCreateRule = async () => {
    try {
      const response = await analyzersApi.createQCRule({
        analyzerId: analyzerId || "demo-analyzer-id",
        ...newRule,
      });
      if (response.success) {
        setShowAddModal(false);
        setNewRule({
          ruleName: "",
          ruleType: "AUTO_APPROVAL",
          ruleCondition: "WITHIN_NORMAL_RANGE",
          minValue: undefined,
          maxValue: undefined,
          criticalLowThreshold: undefined,
          criticalHighThreshold: undefined,
          deltaThreshold: undefined,
          requireQCPass: true,
          qcLevel: "LEVEL_1",
          qcSampleType: "NORMAL",
          autoApprove: false,
          requirePathologistReview: false,
          requireTechnicianReview: true,
          priority: 0,
          generateAlertOnFailure: true,
          alertSeverity: "WARNING",
          description: "",
          notes: "",
        });
        fetchQCRules();
      }
    } catch (error) {
      console.error("Failed to create QC rule:", error);
    }
  };

  const handleUpdateRule = async (id: string) => {
    try {
      const response = await analyzersApi.updateQCRule(id, newRule);
      if (response.success) {
        setEditingRule(null);
        setNewRule({
          ruleName: "",
          ruleType: "AUTO_APPROVAL",
          ruleCondition: "WITHIN_NORMAL_RANGE",
          minValue: undefined,
          maxValue: undefined,
          criticalLowThreshold: undefined,
          criticalHighThreshold: undefined,
          deltaThreshold: undefined,
          requireQCPass: true,
          qcLevel: "LEVEL_1",
          qcSampleType: "NORMAL",
          autoApprove: false,
          requirePathologistReview: false,
          requireTechnicianReview: true,
          priority: 0,
          generateAlertOnFailure: true,
          alertSeverity: "WARNING",
          description: "",
          notes: "",
        });
        fetchQCRules();
      }
    } catch (error) {
      console.error("Failed to update QC rule:", error);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this QC rule?")) return;
    
    try {
      // This would need a delete endpoint in the API
      console.log("Delete rule:", id);
      fetchQCRules();
    } catch (error) {
      console.error("Failed to delete QC rule:", error);
    }
  };

  const handleEdit = (rule: QCRule) => {
    setEditingRule(rule);
    setNewRule({
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      ruleCondition: rule.ruleCondition,
      minValue: rule.minValue,
      maxValue: rule.maxValue,
      criticalLowThreshold: rule.criticalLowThreshold,
      criticalHighThreshold: rule.criticalHighThreshold,
      deltaThreshold: rule.deltaThreshold,
      requireQCPass: rule.requireQCPass ?? true,
      qcLevel: rule.qcLevel ?? "LEVEL_1",
      qcSampleType: rule.qcSampleType ?? "NORMAL",
      autoApprove: rule.autoApprove ?? false,
      requirePathologistReview: rule.requirePathologistReview ?? false,
      requireTechnicianReview: rule.requireTechnicianReview ?? true,
      priority: rule.priority,
      generateAlertOnFailure: rule.generateAlertOnFailure ?? true,
      alertSeverity: rule.alertSeverity,
      description: rule.description || "",
      notes: rule.notes || "",
    });
    setShowAddModal(true);
  };

  const filteredRules = filter === "ALL" 
    ? qcRules 
    : qcRules.filter(rule => 
        filter === "ACTIVE" ? rule.isActive : !rule.isActive
      );

  const searchedRules = searchTerm 
    ? filteredRules.filter(rule => 
        rule.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.ruleType.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredRules;

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case "AUTO_APPROVAL": return "bg-green-50 text-green-700 border-green-200";
      case "QC_CHECK": return "bg-blue-50 text-blue-700 border-blue-200";
      case "DELTA_CHECK": return "bg-purple-50 text-purple-700 border-purple-200";
      case "RANGE_CHECK": return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "INFO": return "bg-blue-50 text-blue-700";
      case "WARNING": return "bg-yellow-50 text-yellow-700";
      case "ERROR": return "bg-red-50 text-red-700";
      case "CRITICAL": return "bg-red-100 text-red-800";
      default: return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Auto-Approval & QC Rules</h3>
              <p className="text-sm text-gray-500">
                Configure automatic result approval and quality control thresholds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingRule(null);
                setNewRule({
                  ruleName: "",
                  ruleType: "AUTO_APPROVAL",
                  ruleCondition: "WITHIN_NORMAL_RANGE",
                  minValue: undefined,
                  maxValue: undefined,
                  criticalLowThreshold: undefined,
                  criticalHighThreshold: undefined,
                  deltaThreshold: undefined,
                  requireQCPass: true,
                  qcLevel: "LEVEL_1",
                  qcSampleType: "NORMAL",
                  autoApprove: false,
                  requirePathologistReview: false,
                  requireTechnicianReview: true,
                  priority: 0,
                  generateAlertOnFailure: true,
                  alertSeverity: "WARNING",
                  description: "",
                  notes: "",
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* QC Rules Explanation */}
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Sliders className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900 mb-2">Auto-Approval & QC Threshold Configuration:</h4>
              <p className="text-sm text-green-800 mb-2">
                Configure rules for automatic result approval based on reference ranges and QC checks. Results that meet these criteria can be automatically approved without manual technician review.
              </p>
              <div className="text-sm text-green-800 space-y-1">
                <p><strong>• Auto-Approval:</strong> Approve results automatically when within normal ranges and QC passes</p>
                <p><strong>• QC Check:</strong> Require Quality Control samples to pass before auto-approval</p>
                <p><strong>• Delta Check:</strong> Compare results with previous values for consistency</p>
                <p><strong>• Range Check:</strong> Validate results against defined reference ranges</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by rule name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="ALL">All Rules</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* QC Rules Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Rule Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Condition
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Thresholds
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Auto-Approve
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Alert Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                </td>
              </tr>
            ) : searchedRules.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="text-3xl mb-4">🛡️</div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">No QC rules configured</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchTerm || filter !== "ALL" 
                      ? "Try adjusting your filters or search terms" 
                      : "Add your first QC rule to enable auto-approval"}
                  </p>
                  {!searchTerm && filter === "ALL" && (
                    <button
                      onClick={() => {
                        setEditingRule(null);
                        setNewRule({
                          ruleName: "",
                          ruleType: "AUTO_APPROVAL",
                          ruleCondition: "WITHIN_NORMAL_RANGE",
                          minValue: undefined,
                          maxValue: undefined,
                          criticalLowThreshold: undefined,
                          criticalHighThreshold: undefined,
                          deltaThreshold: undefined,
                          requireQCPass: true,
                          qcLevel: "LEVEL_1",
                          qcSampleType: "NORMAL",
                          autoApprove: false,
                          requirePathologistReview: false,
                          requireTechnicianReview: true,
                          priority: 0,
                          generateAlertOnFailure: true,
                          alertSeverity: "WARNING",
                          description: "",
                          notes: "",
                        });
                        setShowAddModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Rule
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              searchedRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{rule.ruleName}</div>
                    {rule.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{rule.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getRuleTypeColor(rule.ruleType)}`}>
                      {rule.ruleType.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{rule.ruleCondition}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {rule.minValue !== undefined && rule.maxValue !== undefined && (
                        <span>Range: {rule.minValue} - {rule.maxValue}</span>
                      )}
                      {rule.criticalLowThreshold !== undefined && (
                        <span className="block text-xs text-red-600">Critical Low: {rule.criticalLowThreshold}</span>
                      )}
                      {rule.criticalHighThreshold !== undefined && (
                        <span className="block text-xs text-red-600">Critical High: {rule.criticalHighThreshold}</span>
                      )}
                      {rule.deltaThreshold !== undefined && (
                        <span className="block text-xs text-purple-600">Delta: {rule.deltaThreshold}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {rule.autoApprove ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                          <CheckCircle className="w-3 h-3" />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-700 rounded text-xs">
                          <XCircle className="w-3 h-3" />
                          Disabled
                        </span>
                      )}
                      {rule.requireQCPass && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          QC Required
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityColor(rule.alertSeverity)}`}>
                      {rule.alertSeverity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        rule.isActive 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}>
                        {rule.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">Priority: {rule.priority}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Rule"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingRule ? "Edit QC Rule" : "Add QC Rule"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {editingRule ? "Update the quality control rule configuration" : "Create a new quality control rule"}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={newRule.ruleName}
                    onChange={(e) => setNewRule({ ...newRule, ruleName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Hematology Auto-Approval"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Type *
                  </label>
                  <select
                    value={newRule.ruleType}
                    onChange={(e) => setNewRule({ ...newRule, ruleType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="AUTO_APPROVAL">Auto-Approval</option>
                    <option value="QC_CHECK">QC Check</option>
                    <option value="DELTA_CHECK">Delta Check</option>
                    <option value="RANGE_CHECK">Range Check</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Condition *
                </label>
                <input
                  type="text"
                  value={newRule.ruleCondition}
                  onChange={(e) => setNewRule({ ...newRule, ruleCondition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., WITHIN_NORMAL_RANGE"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Value
                  </label>
                  <input
                    type="number"
                    value={newRule.minValue || ""}
                    onChange={(e) => setNewRule({ ...newRule, minValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 4.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Value
                  </label>
                  <input
                    type="number"
                    value={newRule.maxValue || ""}
                    onChange={(e) => setNewRule({ ...newRule, maxValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 11.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Critical Low Threshold
                  </label>
                  <input
                    type="number"
                    value={newRule.criticalLowThreshold || ""}
                    onChange={(e) => setNewRule({ ...newRule, criticalLowThreshold: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 2.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Critical High Threshold
                  </label>
                  <input
                    type="number"
                    value={newRule.criticalHighThreshold || ""}
                    onChange={(e) => setNewRule({ ...newRule, criticalHighThreshold: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 15.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delta Threshold
                  </label>
                  <input
                    type="number"
                    value={newRule.deltaThreshold || ""}
                    onChange={(e) => setNewRule({ ...newRule, deltaThreshold: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={newRule.priority}
                    onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QC Level
                  </label>
                  <select
                    value={newRule.qcLevel}
                    onChange={(e) => setNewRule({ ...newRule, qcLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="LEVEL_1">Level 1</option>
                    <option value="LEVEL_2">Level 2</option>
                    <option value="LEVEL_3">Level 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QC Sample Type
                  </label>
                  <select
                    value={newRule.qcSampleType}
                    onChange={(e) => setNewRule({ ...newRule, qcSampleType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="CONTROL">Control</option>
                    <option value="PATHOLOGICAL">Pathological</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRule.autoApprove}
                      onChange={(e) => setNewRule({ ...newRule, autoApprove: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Auto-Approve Results</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRule.requireQCPass}
                      onChange={(e) => setNewRule({ ...newRule, requireQCPass: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Require QC Pass</span>
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRule.requireTechnicianReview}
                      onChange={(e) => setNewRule({ ...newRule, requireTechnicianReview: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Require Technician Review</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRule.requirePathologistReview}
                      onChange={(e) => setNewRule({ ...newRule, requirePathologistReview: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Require Pathologist Review</span>
                  </label>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRule.generateAlertOnFailure}
                    onChange={(e) => setNewRule({ ...newRule, generateAlertOnFailure: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Generate Alert on Failure</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Severity
                </label>
                <select
                  value={newRule.alertSeverity}
                  onChange={(e) => setNewRule({ ...newRule, alertSeverity: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="ERROR">Error</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describe the purpose of this rule..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={newRule.notes}
                  onChange={(e) => setNewRule({ ...newRule, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRule(null);
                  setNewRule({
                    ruleName: "",
                    ruleType: "AUTO_APPROVAL",
                    ruleCondition: "WITHIN_NORMAL_RANGE",
                    minValue: undefined,
                    maxValue: undefined,
                    criticalLowThreshold: undefined,
                    criticalHighThreshold: undefined,
                    deltaThreshold: undefined,
                    requireQCPass: true,
                    qcLevel: "LEVEL_1",
                    qcSampleType: "NORMAL",
                    autoApprove: false,
                    requirePathologistReview: false,
                    requireTechnicianReview: true,
                    priority: 0,
                    generateAlertOnFailure: true,
                    alertSeverity: "WARNING",
                    description: "",
                    notes: "",
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingRule) {
                    handleUpdateRule(editingRule.id);
                  } else {
                    handleCreateRule();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingRule ? "Update Rule" : "Create Rule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}