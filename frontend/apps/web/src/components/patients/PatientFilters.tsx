"use client";

import React, { ChangeEvent } from "react";

interface PatientFiltersProps {
  search: string;
  gender: string;
  status: string;
  onSearchChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReset: () => void;
}

export default function PatientFilters({
  search,
  gender,
  status,
  onSearchChange,
  onGenderChange,
  onStatusChange,
  onReset,
}: PatientFiltersProps) {
  function handleSearch(
    event: ChangeEvent<HTMLInputElement>
  ) {
    onSearchChange(
      event.target.value
    );
  }

  function handleGender(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    onGenderChange(
      event.target.value
    );
  }

  function handleStatus(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    onStatusChange(
      event.target.value
    );
  }

  const hasFilters =
    Boolean(search) ||
    Boolean(gender) ||
    Boolean(status);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}

        <div className="lg:col-span-2">
          <label
            htmlFor="patient-search"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Search Patients
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>

            <input
              id="patient-search"
              type="search"
              value={search}
              onChange={handleSearch}
              placeholder="Search by name, ID, phone or email..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </div>
        </div>

        {/* Gender */}

        <div>
          <label
            htmlFor="patient-gender"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Gender
          </label>

          <select
            id="patient-gender"
            value={gender}
            onChange={handleGender}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
          >
            <option value="">
              All genders
            </option>

            <option value="male">
              Male
            </option>

            <option value="female">
              Female
            </option>

            <option value="other">
              Other
            </option>

            <option value="unknown">
              Unknown
            </option>
          </select>
        </div>

        {/* Status */}

        <div>
          <label
            htmlFor="patient-status"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Status
          </label>

          <select
            id="patient-status"
            value={status}
            onChange={handleStatus}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
          >
            <option value="">
              All statuses
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      </div>

      {/* Bottom row */}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-500">
          Use the filters to quickly find
          patients.
        </p>

        <button
          type="button"
          onClick={onReset}
          disabled={!hasFilters}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset Filters
        </button>
      </div>
    </section>
  );
}