"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  ArrowRightLeft, 
  Plus, 
  Save, 
  Trash2, 
  Edit, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { analyzersApi } from "@/lib/api";

interface TestMapping {
  id: string;
  analyzerId: string;
  analyzerName: string;
  labCoreTestId: string;
  labCoreTestCode: string;
  labCoreTestName: string;
  analyzerTestCode: string;
  analyzerTestName?: string;
  unit?: string;
  referenceRange?: string;
  sampleType?: string;
  isActive: boolean;
  isValid: boolean;
}

interface ParameterCodeMappingToolProps {
  analyzerId?: string;
  onClose?: () => void;
}

export default function ParameterCodeMappingTool({ analyzerId, onClose }: ParameterCodeMappingToolProps) {
  const [mappings, setMappings] = useState<TestMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<TestMapping | null>(null);
  const [newMapping, setNewMapping] = useState({
    labCoreTestCode: "",
    labCoreTestName: "",
    analyzerTestCode: "",
    analyzerTestName: "",
    unit: "",
    referenceRange: "",
    sampleType: "",
  });

  const fetchMappings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (analyzerId) params.append("analyzerId", analyzerId);
      if (filter !== "ALL") params.append("isActive", filter === "ACTIVE" ? "true" : "false");

      const response = await analyzersApi.getTestMappings(params.toString());
      if (response.success) {
        setMappings(response.data.mappings);
      }
    } catch (error) {
      console.error("Failed to fetch test mappings:", error);
    } finally {
      setLoading(false);
    }
  }, [analyzerId, filter]);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const handleCreateMapping = async () => {
    try {
      const response = await analyzersApi.createTestMapping({
        analyzerId: analyzerId || "demo-analyzer-id",
        labCoreTestId: "demo-test-id",
        labCoreTestCode: newMapping.labCoreTestCode,
        labCoreTestName: newMapping.labCoreTestName,
        analyzerTestCode: newMapping.analyzerTestCode,
        analyzerTestName: newMapping.analyzerTestName,
        unit: newMapping.unit,
        referenceRange: newMapping.referenceRange,
        sampleType: newMapping.sampleType,
      });
      if (response.success) {
        setShowAddModal(false);
        setNewMapping({
          labCoreTestCode: "",
          labCoreTestName: "",
          analyzerTestCode: "",
          analyzerTestName: "",
          unit: "",
          referenceRange: "",
          sampleType: "",
        });
        fetchMappings();
      }
    } catch (error) {
      console.error("Failed to create mapping:", error);
    }
  };

  const handleUpdateMapping = async (id: string) => {
    try {
      const response = await analyzersApi.updateTestMapping(id, {
        analyzerTestName: newMapping.analyzerTestName,
        unit: newMapping.unit,
        referenceRange: newMapping.referenceRange,
        sampleType: newMapping.sampleType,
      });
      if (response.success) {
        setEditingMapping(null);
        setNewMapping({
          labCoreTestCode: "",
          labCoreTestName: "",
          analyzerTestCode: "",
          analyzerTestName: "",
          unit: "",
          referenceRange: "",
          sampleType: "",
        });
        fetchMappings();
      }
    } catch (error) {
      console.error("Failed to update mapping:", error);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mapping?")) return;
    
    try {
      const response = await analyzersApi.deleteTestMapping(id);
      if (response.success) {
        fetchMappings();
      }
    } catch (error) {
      console.error("Failed to delete mapping:", error);
    }
  };

  const handleEdit = (mapping: TestMapping) => {
    setEditingMapping(mapping);
    setNewMapping({
      labCoreTestCode: mapping.labCoreTestCode,
      labCoreTestName: mapping.labCoreTestName,
      analyzerTestCode: mapping.analyzerTestCode,
      analyzerTestName: mapping.analyzerTestName || "",
      unit: mapping.unit || "",
      referenceRange: mapping.referenceRange || "",
      sampleType: mapping.sampleType || "",
    });
    setShowAddModal(true);
  };

  const filteredMappings = filter === "ALL" 
    ? mappings 
    : mappings.filter(mapping => 
        filter === "ACTIVE" ? mapping.isActive : !mapping.isActive
      );

  const searchedMappings = searchTerm 
    ? filteredMappings.filter(mapping => 
        mapping.labCoreTestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapping.labCoreTestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapping.analyzerTestCode.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredMappings;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Parameter Code Mapping</h3>
              <p className="text-sm text-gray-500">
                Map machine codes to LIMS test parameters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingMapping(null);
                setNewMapping({
                  labCoreTestCode: "",
                  labCoreTestName: "",
                  analyzerTestCode: "",
                  analyzerTestName: "",
                  unit: "",
                  referenceRange: "",
                  sampleType: "",
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Mapping
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

        {/* Mapping Matrix Explanation */}
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <ArrowRightLeft className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 mb-2">Code Mapping Matrix:</h4>
              <p className="text-sm text-purple-800">
                This tool allows you to map analyzer-specific test codes (e.g., <code className="bg-purple-100 px-1 rounded">WBC_CONC</code>) 
                to your LIMS database parameters (e.g., <code className="bg-purple-100 px-1 rounded">White Blood Cell Count</code>). 
                This ensures that when results are received from the analyzer, they are correctly interpreted and stored in your system.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by test name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="ALL">All Mappings</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Mapping Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                LIMS Parameter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Machine Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Reference Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Sample Type
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
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                </td>
              </tr>
            ) : searchedMappings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="text-3xl mb-4">🔄</div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">No parameter mappings found</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchTerm || filter !== "ALL" 
                      ? "Try adjusting your filters or search terms" 
                      : "Add your first parameter mapping to begin"}
                  </p>
                  {!searchTerm && filter === "ALL" && (
                    <button
                      onClick={() => {
                        setEditingMapping(null);
                        setNewMapping({
                          labCoreTestCode: "",
                          labCoreTestName: "",
                          analyzerTestCode: "",
                          analyzerTestName: "",
                          unit: "",
                          referenceRange: "",
                          sampleType: "",
                        });
                        setShowAddModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Mapping
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              searchedMappings.map((mapping) => (
                <tr key={mapping.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{mapping.labCoreTestName}</div>
                      <div className="text-sm text-gray-500 font-mono">{mapping.labCoreTestCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{mapping.analyzerTestName || mapping.analyzerTestCode}</div>
                      <div className="text-sm text-gray-500 font-mono">{mapping.analyzerTestCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{mapping.unit || "—"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={mapping.referenceRange}>
                      {mapping.referenceRange || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{mapping.sampleType || "—"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        mapping.isActive 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}>
                        {mapping.isActive ? (
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
                      {mapping.isValid && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          Valid
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(mapping)}
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit Mapping"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMapping(mapping.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Mapping"
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

      {/* Add/Edit Mapping Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingMapping ? "Edit Parameter Mapping" : "Add Parameter Mapping"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {editingMapping ? "Update the mapping configuration" : "Create a new parameter mapping"}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LIMS Test Code *
                  </label>
                  <input
                    type="text"
                    value={newMapping.labCoreTestCode}
                    onChange={(e) => setNewMapping({ ...newMapping, labCoreTestCode: e.target.value })}
                    disabled={!!editingMapping}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="e.g., CBC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LIMS Test Name *
                  </label>
                  <input
                    type="text"
                    value={newMapping.labCoreTestName}
                    onChange={(e) => setNewMapping({ ...newMapping, labCoreTestName: e.target.value })}
                    disabled={!!editingMapping}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="e.g., Complete Blood Count"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Machine Test Code *
                  </label>
                  <input
                    type="text"
                    value={newMapping.analyzerTestCode}
                    onChange={(e) => setNewMapping({ ...newMapping, analyzerTestCode: e.target.value })}
                    disabled={!!editingMapping}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="e.g., WBC_CONC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Machine Test Name
                  </label>
                  <input
                    type="text"
                    value={newMapping.analyzerTestName}
                    onChange={(e) => setNewMapping({ ...newMapping, analyzerTestName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., WBC Concentration"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={newMapping.unit}
                    onChange={(e) => setNewMapping({ ...newMapping, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., g/dL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sample Type
                  </label>
                  <input
                    type="text"
                    value={newMapping.sampleType}
                    onChange={(e) => setNewMapping({ ...newMapping, sampleType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Blood"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Range
                </label>
                <textarea
                  rows={2}
                  value={newMapping.referenceRange}
                  onChange={(e) => setNewMapping({ ...newMapping, referenceRange: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 4.0-11.0 x10^9/L"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMapping(null);
                  setNewMapping({
                    labCoreTestCode: "",
                    labCoreTestName: "",
                    analyzerTestCode: "",
                    analyzerTestName: "",
                    unit: "",
                    referenceRange: "",
                    sampleType: "",
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingMapping) {
                    handleUpdateMapping(editingMapping.id);
                  } else {
                    handleCreateMapping();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingMapping ? "Update Mapping" : "Create Mapping"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}