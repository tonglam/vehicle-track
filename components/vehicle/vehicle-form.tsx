"use client";

import type { Vehicle } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface VehicleFormProps {
  vehicle?: Vehicle;
  isEdit?: boolean;
}

export function VehicleForm({ vehicle, isEdit = false }: VehicleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    year: vehicle?.year?.toString() || "",
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    licensePlate: vehicle?.licensePlate || "",
    vin: vehicle?.vin || "",
    status: vehicle?.status || "available",
    ownership: vehicle?.ownership || "owned",
    ownerCompany: vehicle?.ownerCompany || "",
    fuelType: vehicle?.fuelType || "petrol",
    transmission: vehicle?.transmission || "automatic",
    engineSizeL: vehicle?.engineSizeL || "",
    odometer: vehicle?.odometer || "",
    purchaseDate: vehicle?.purchaseDate || "",
    lastServiceDate: vehicle?.lastServiceDate || "",
    nextServiceDue: vehicle?.nextServiceDue || "",
    notes: vehicle?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        year: parseInt(formData.year),
        engineSizeL: formData.engineSizeL || null,
        odometer: formData.odometer || null,
        purchaseDate: formData.purchaseDate || null,
        lastServiceDate: formData.lastServiceDate || null,
        nextServiceDue: formData.nextServiceDue || null,
        notes: formData.notes || null,
        ownerCompany: formData.ownerCompany || null,
        groupId: null,
      };

      const url = isEdit ? `/api/vehicles/${vehicle?.id}` : "/api/vehicles";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save vehicle");
      }

      router.push("/dashboard/vehicles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle Identity */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Vehicle Identity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                min="1900"
                max="2100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Make <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Plate <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VIN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Technical Specifications
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Type <span className="text-red-500">*</span>
              </label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
                <option value="lpg">LPG</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transmission <span className="text-red-500">*</span>
              </label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
                <option value="cvt">CVT</option>
                <option value="semi_automatic">Semi-Automatic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Engine Size (L)
              </label>
              <input
                type="text"
                name="engineSizeL"
                value={formData.engineSizeL}
                onChange={handleChange}
                placeholder="e.g., 2.0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Odometer
              </label>
              <input
                type="text"
                name="odometer"
                value={formData.odometer}
                onChange={handleChange}
                placeholder="e.g., 45000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Status & Ownership */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Status & Ownership
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="temporarily_assigned">
                  Temporarily Assigned
                </option>
                <option value="leased_out">Leased Out</option>
                <option value="retired">Retired</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ownership Type <span className="text-red-500">*</span>
              </label>
              <select
                name="ownership"
                value={formData.ownership}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="owned">Owned</option>
                <option value="external">External (borrowed/leased)</option>
                <option value="leased_out">Leased Out</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Company
              </label>
              <input
                type="text"
                name="ownerCompany"
                value={formData.ownerCompany}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Service & Dates */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Service & Dates
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Service Date
              </label>
              <input
                type="date"
                name="lastServiceDate"
                value={formData.lastServiceDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Service Due
              </label>
              <input
                type="date"
                name="nextServiceDue"
                value={formData.nextServiceDue}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Attachments
              </label>
              <input
                type="file"
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                File upload coming soon
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Saving..." : isEdit ? "Update Vehicle" : "Create Vehicle"}
        </button>
      </div>
    </form>
  );
}
