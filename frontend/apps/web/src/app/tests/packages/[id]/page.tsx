"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { testApi } from "@/lib/api";

interface Test {
  id: string;
  testCode: string;
  testName: string;
  price: number;
  sampleType: string;
}

interface PackageItem {
  testId: string;
  testPrice: number;
  discount: number;
  displayOrder: number;
}

export default function PackageDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';
  const { id } = useParams<{ id: string }>();
  
  const [tests, setTests] = useState<Test[]>([]);
  const [packageData, setPackageData] = useState<any>(null);
  const [formData, setFormData] = useState({
    packageCode: "",
    packageName: "",
    description: "",
    totalPrice: 0,
    offerPrice: 0,
    discountPercentage: 0,
    gstPercentage: 0,
    tatHours: 24,
    tatDisplay: "",
    targetAudience: "",
    recommendedFor: "",
    isActive: true,
    isPopular: false,
    displayOrder: 0,
    color: "#10B981",
    icon: "📦",
  });
  const [selectedTests, setSelectedTests] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingTests, setLoadingTests] = useState(true);

  useEffect(() => {
    fetchPackage();
    fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPackage = async () => {
    try {
      setLoading(true);
      const response = await testApi.getPackage(id);
      if (response.success && response.data) {
        const pkg = response.data;
        setPackageData(pkg);
        setFormData({
          packageCode: pkg.packageCode || "",
          packageName: pkg.packageName || "",
          description: pkg.description || "",
          totalPrice: pkg.totalPrice || 0,
          offerPrice: pkg.offerPrice || 0,
          discountPercentage: pkg.discountPercentage || 0,
          gstPercentage: pkg.gstPercentage || 0,
          tatHours: pkg.tatHours || 24,
          tatDisplay: pkg.tatDisplay || "",
          targetAudience: pkg.targetAudience || "",
          recommendedFor: pkg.recommendedFor || "",
          isActive: pkg.isActive !== false,
          isPopular: pkg.isPopular || false,
          displayOrder: pkg.displayOrder || 0,
          color: pkg.color || "#10B981",
          icon: pkg.icon || "📦",
        });
        
        // Set selected tests from package items
        if (pkg.items && Array.isArray(pkg.items)) {
          setSelectedTests(pkg.items.map((item: any) => ({
            testId: item.testId,
            testPrice: item.testPrice || item.price || 0,
            discount: item.discount || 0,
            displayOrder: item.displayOrder || 0,
          })));
        }
      } else {
        setError(response.message || "Failed to fetch package");
      }
    } catch (err) {
      console.error("Error fetching package:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch package");
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      setLoadingTests(true);
      const response = await testApi.getAll();
      if (response.success && response.data) {
        const testsData = response.data.tests || response.data || [];
        setTests(Array.isArray(testsData) ? testsData : []);
      }
    } catch (err) {
      console.error("Error fetching tests:", err);
    } finally {
      setLoadingTests(false);
    }
  };

  const handleAddTest = (test: Test) => {
    if (selectedTests.find(item => item.testId === test.id)) {
      return; // Test already added
    }

    setSelectedTests([
      ...selectedTests,
      {
        testId: test.id,
        testPrice: test.price,
        discount: 0,
        displayOrder: selectedTests.length,
      },
    ]);

    // Update total price
    setFormData({
      ...formData,
      totalPrice: formData.totalPrice + test.price,
    });
  };

  const handleRemoveTest = (testId: string) => {
    const item = selectedTests.find(item => item.testId === testId);
    if (item) {
      setSelectedTests(selectedTests.filter(item => item.testId !== testId));
      setFormData({
        ...formData,
        totalPrice: formData.totalPrice - item.testPrice,
      });
    }
  };

  const handleUpdateTestPrice = (testId: string, newPrice: number) => {
    const updatedTests = selectedTests.map(item =>
      item.testId === testId ? { ...item, testPrice: newPrice } : item
    );
    setSelectedTests(updatedTests);

    // Recalculate total
    const newTotal = updatedTests.reduce((sum, item) => sum + item.testPrice, 0);
    setFormData({ ...formData, totalPrice: newTotal });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const packageUpdateData: any = {
        packageCode: formData.packageCode,
        packageName: formData.packageName,
        totalPrice: formData.totalPrice,
        tests: selectedTests.map(item => ({
          testId: item.testId,
          testPrice: item.testPrice,
          discount: item.discount,
          displayOrder: item.displayOrder,
        })),
      };

      // Only add optional fields if they have values
      if (formData.description) packageUpdateData.description = formData.description;
      if (formData.offerPrice) packageUpdateData.offerPrice = formData.offerPrice;
      if (formData.discountPercentage) packageUpdateData.discountPercentage = formData.discountPercentage;
      if (formData.gstPercentage) packageUpdateData.gstPercentage = formData.gstPercentage;
      if (formData.tatHours) packageUpdateData.tatHours = formData.tatHours;
      if (formData.tatDisplay) packageUpdateData.tatDisplay = formData.tatDisplay;
      if (formData.targetAudience) packageUpdateData.targetAudience = formData.targetAudience;
      if (formData.recommendedFor) packageUpdateData.recommendedFor = formData.recommendedFor;
      if (formData.isActive !== undefined) packageUpdateData.isActive = formData.isActive;
      if (formData.isPopular !== undefined) packageUpdateData.isPopular = formData.isPopular;
      if (formData.displayOrder) packageUpdateData.displayOrder = formData.displayOrder;
      if (formData.color) packageUpdateData.color = formData.color;
      if (formData.icon) packageUpdateData.icon = formData.icon;

      const response = await testApi.updatePackage(id, packageUpdateData);

      if (response.success) {
        alert("Package updated successfully!");
        router.push(`/tests/packages/${id}`);
      } else {
        setError(response.message || "Failed to update package");
      }
    } catch (err) {
      console.error("Error updating package:", err);
      setError(err instanceof Error ? err.message : "Failed to update package");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${packageData?.packageName || 'this package'}?`)) {
      return;
    }

    try {
      await testApi.deletePackage(id);
      alert("Package deleted successfully!");
      router.push("/tests/packages");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete package");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={["ADMIN", "FRONT_DESK", "LAB_TECH", "PATHOLOGIST", "DOCTOR"]}>
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-500">Loading package details...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !packageData) {
    return (
      <ProtectedRoute requiredRoles={["ADMIN", "FRONT_DESK", "LAB_TECH", "PATHOLOGIST", "DOCTOR"]}>
        <div className="max-w-6xl">
          <div className="mb-6">
            <Link
              href="/tests/packages"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Back to Packages
            </Link>
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={["ADMIN", "FRONT_DESK", "LAB_TECH", "PATHOLOGIST", "DOCTOR"]}>
      <div className="max-w-6xl">
        <div className="mb-6">
          <Link
            href="/tests/packages"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to Packages
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {editMode ? "Edit Package" : "Package Details"}
            </h1>
            <div className="flex gap-2">
              {!editMode && (
                <>
                  <Link
                    href={`/tests/packages/${id}?edit=true`}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </>
              )}
              {editMode && (
                <Link
                  href={`/tests/packages/${id}`}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {editMode ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.packageName}
                      onChange={(e) =>
                        setFormData({ ...formData, packageName: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Package Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.packageCode}
                      onChange={(e) =>
                        setFormData({ ...formData, packageCode: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Total Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.totalPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, totalPrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Offer Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.offerPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, offerPrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Discount %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.discountPercentage}
                      onChange={(e) =>
                        setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      GST %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.gstPercentage}
                      onChange={(e) =>
                        setFormData({ ...formData, gstPercentage: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Package Details</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      TAT (Hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.tatHours}
                      onChange={(e) =>
                        setFormData({ ...formData, tatHours: parseInt(e.target.value) || 24 })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      TAT Display
                    </label>
                    <input
                      type="text"
                      value={formData.tatDisplay}
                      onChange={(e) =>
                        setFormData({ ...formData, tatDisplay: e.target.value })
                      }
                      placeholder="e.g., 24 hours, Same Day"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Target Audience
                    </label>
                    <input
                      type="text"
                      value={formData.targetAudience}
                      onChange={(e) =>
                        setFormData({ ...formData, targetAudience: e.target.value })
                      }
                      placeholder="e.g., GENERAL, EXECUTIVE, SENIOR_CITIZEN"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.displayOrder}
                      onChange={(e) =>
                        setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Recommended For
                    </label>
                    <textarea
                      value={formData.recommendedFor}
                      onChange={(e) =>
                        setFormData({ ...formData, recommendedFor: e.target.value })
                      }
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Visual Settings */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Visual Settings</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Color
                    </label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-full h-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Icon (Emoji)
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) =>
                        setFormData({ ...formData, icon: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPopular}
                        onChange={(e) =>
                          setFormData({ ...formData, isPopular: e.target.checked })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Popular Package</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Package Tests */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Package Tests</h2>
                
                {/* Add Test Section */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Add Tests to Package
                  </label>
                  <div className="flex gap-2">
                    <select
                      disabled={loadingTests}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      id="test-select"
                    >
                      <option value="">Select a test to add</option>
                      {tests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.testName} ({test.testCode}) - ₹{test.price}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const select = document.getElementById('test-select') as HTMLSelectElement;
                        if (select.value) {
                          const test = tests.find(t => t.id === select.value);
                          if (test) {
                            handleAddTest(test);
                            select.value = "";
                          }
                        }
                      }}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      Add Test
                    </button>
                  </div>
                </div>

                {/* Selected Tests Table */}
                {selectedTests.length > 0 && (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Test
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Price (₹)
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Discount (₹)
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedTests.map((item) => {
                          const test = tests.find(t => t.id === item.testId);
                          return (
                            <tr key={item.testId}>
                              <td className="px-4 py-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {test?.testName}
                                </div>
                                <div className="text-xs text-gray-500">{test?.testCode}</div>
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.testPrice}
                                  onChange={(e) =>
                                    handleUpdateTestPrice(item.testId, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.discount}
                                  onChange={(e) => {
                                    const updatedTests = selectedTests.map(i =>
                                      i.testId === item.testId ? { ...i, discount: parseFloat(e.target.value) || 0 } : i
                                    );
                                    setSelectedTests(updatedTests);
                                  }}
                                  className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-4 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTest(item.testId)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedTests.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
                    No tests added to package yet. Select tests from the dropdown above to add them.
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving || selectedTests.length === 0}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <Link
                  href={`/tests/packages/${id}`}
                  className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* View Mode */}
              <div className="flex items-start gap-6">
                <div 
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl"
                  style={{ backgroundColor: packageData?.color || "#10B981" }}
                >
                  {packageData?.icon || "📦"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{packageData?.packageName}</h2>
                    {packageData?.isPopular && (
                      <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 font-mono">{packageData?.packageCode}</p>
                  {packageData?.description && (
                    <p className="text-gray-600 mt-2">{packageData.description}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-500">Total Price</label>
                    <p className="text-2xl font-bold text-gray-900">₹{packageData?.totalPrice || '0'}</p>
                  </div>
                  {packageData?.offerPrice && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-500">Offer Price</label>
                      <p className="text-2xl font-bold text-green-600">₹{packageData.offerPrice}</p>
                    </div>
                  )}
                  {packageData?.discountPercentage && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-500">Discount</label>
                      <p className="text-2xl font-bold text-blue-600">{packageData.discountPercentage}% OFF</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Turnaround Time</label>
                    <p className="text-gray-900">{packageData?.tatDisplay || `${packageData?.tatHours || 0}h`}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Target Audience</label>
                    <p className="text-gray-900">{packageData?.targetAudience || "—"}</p>
                  </div>
                  {packageData?.recommendedFor && (
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Recommended For</label>
                      <p className="text-gray-900">{packageData.recommendedFor}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      packageData?.isActive !== false 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {packageData?.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tests Included</label>
                    <p className="text-gray-900">{packageData?.includesTestsCount || selectedTests.length}</p>
                  </div>
                </div>
              </div>

              {selectedTests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Included Tests</h3>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Test Name</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Code</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Price</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Discount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedTests.map((item) => {
                          const test = tests.find(t => t.id === item.testId);
                          return (
                            <tr key={item.testId}>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                {test?.testName}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 font-mono">
                                {test?.testCode}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                ₹{item.testPrice}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {item.discount > 0 ? `₹${item.discount}` : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}