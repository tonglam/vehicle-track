"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  user?: {
    firstName: string;
    lastName: string;
    roleName: string;
    email: string;
  } | null;
}

export function Header({ user }: HeaderProps = {}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-[0_4px_12px_rgba(0,0,0,0.1)] sticky top-0 z-[1020]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 relative">
          {/* Logo */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center space-x-3 text-white font-bold text-xl sm:text-2xl flex-shrink-0"
          >
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            <span className="hidden xs:inline sm:inline">Vehicle Track</span>
            <span className="xs:hidden sm:hidden">VT</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          {user && (
            <nav className="hidden lg:flex space-x-1 xl:space-x-2 absolute left-1/2 -translate-x-1/2">
              <Link
                href="/dashboard"
                className="text-white/85 hover:text-white hover:bg-white/10 hover:-translate-y-[1px] transition-all duration-200 px-4 py-2.5 rounded-lg text-sm xl:text-[0.95rem] font-medium cursor-pointer"
              >
                Dashboard
              </Link>

              {/* Fleet Dropdown */}
              <div className="relative group">
                <button className="text-white/85 hover:text-white hover:bg-white/10 hover:-translate-y-[1px] transition-all duration-200 px-4 py-2.5 rounded-lg inline-flex items-center text-sm xl:text-[0.95rem] font-medium cursor-pointer">
                  Fleet
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <div className="hidden group-hover:block absolute left-0 top-full pt-2 w-56 z-50">
                  <div className="rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-white animate-slideDown p-2">
                    <div className="px-4 py-2">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-[0.5px]">
                        Assets
                      </div>
                    </div>
                    <Link
                      href="/dashboard/vehicles"
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                    >
                      Vehicles
                    </Link>
                    <Link
                      href="/dashboard/vehicles/groups"
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                    >
                      Vehicle Groups
                    </Link>
                    <div className="border-t border-gray-100 my-2"></div>
                    <div className="px-4 py-2">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-[0.5px]">
                        Personnel
                      </div>
                    </div>
                    <Link
                      href="/dashboard/drivers"
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                    >
                      Drivers
                    </Link>
                  </div>
                </div>
              </div>

              {/* Operations Dropdown */}
              <div className="relative group">
                <button className="text-white/85 hover:text-white hover:bg-white/10 hover:-translate-y-[1px] transition-all duration-200 px-4 py-2.5 rounded-lg inline-flex items-center text-sm xl:text-[0.95rem] font-medium cursor-pointer">
                  Operations
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <div className="hidden group-hover:block absolute left-0 top-full pt-2 w-48 z-50">
                  <div className="rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-white animate-slideDown p-2">
                    <Link
                      href="/dashboard/agreements"
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                    >
                      Agreements
                    </Link>
                    <Link
                      href="/dashboard/inspections"
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                    >
                      Inspections
                    </Link>
                  </div>
                </div>
              </div>

              {/* Compliance Dropdown */}
              <div className="relative group">
                <button className="text-white/85 hover:text-white hover:bg-white/10 hover:-translate-y-[1px] transition-all duration-200 px-4 py-2.5 rounded-lg inline-flex items-center text-sm xl:text-[0.95rem] font-medium cursor-pointer">
                  Compliance
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <div className="hidden group-hover:block absolute left-0 top-full pt-2 w-64 z-50">
                  <div className="rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-white animate-slideDown p-2">
                    <Link
                      href="/dashboard/compliance"
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                    >
                      Compliance Dashboard
                    </Link>
                    <Link
                      href="/dashboard/compliance/contractor-checks"
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                    >
                      Contractor Checks
                    </Link>
                  </div>
                </div>
              </div>

              {/* Admin Dropdown - Role-based */}
              {(user.roleName === "admin" || user.roleName === "manager") && (
                <div className="relative group">
                  <button className="text-white/85 hover:text-white hover:bg-white/10 hover:-translate-y-[1px] transition-all duration-200 px-4 py-2.5 rounded-lg inline-flex items-center text-sm xl:text-[0.95rem] font-medium cursor-pointer">
                    Admin
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <div className="hidden group-hover:block absolute left-0 top-full pt-2 w-48 z-50">
                    <div className="rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-white animate-slideDown p-2">
                      <Link
                        href="/dashboard/admin/users"
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                      >
                        User Management
                      </Link>
                      <Link
                        href="/dashboard/admin/email"
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                      >
                        Email Configuration
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </nav>
          )}

          {/* Unauthenticated - Centered Dashboard link */}
          {!user && (
            <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2">
              <Link
                href="/dashboard"
                className="text-white/85 hover:text-white hover:bg-white/10 hover:-translate-y-[1px] transition-all duration-200 px-4 py-2.5 rounded-lg text-sm xl:text-[0.95rem] font-medium cursor-pointer"
              >
                Dashboard
              </Link>
            </nav>
          )}

          {/* User Menu or Sign In - Desktop only */}
          <div className="hidden lg:flex items-center flex-shrink-0">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none text-white hover:text-white hover:bg-white/10 hover:-translate-y-[1px] transition-all duration-200 px-3 py-2.5 rounded-lg cursor-pointer"
                >
                  <div className="h-[34px] w-[34px] rounded-full bg-white/16 hover:bg-white/20 transition-colors duration-200 flex items-center justify-center text-white font-bold text-xs tracking-wide">
                    {user.firstName.charAt(0)}
                  </div>
                  <span className="text-sm xl:text-base font-medium hidden xl:inline">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-sm font-medium xl:hidden">
                    {user.firstName}
                  </span>
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full pt-2 min-w-[12rem] z-50">
                    <div className="rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-white animate-slideDown p-2">
                      {/* Profile Link */}
                      <Link
                        href="/dashboard/profile"
                        className="flex items-center w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <svg
                          className="w-4 h-4 mr-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Profile
                      </Link>

                      {/* Sign Out Button */}
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-white/85 hover:text-white hover:bg-white/10 hover:-translate-y-[1px] transition-all duration-200 px-4 py-2.5 rounded-lg text-sm xl:text-[0.95rem] font-medium cursor-pointer"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile/Tablet User Avatar + Menu Button */}
          <div className="flex lg:hidden items-center space-x-3">
            {user && (
              <>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:bg-blue-700 transition-colors duration-200"
                >
                  {user.firstName.charAt(0)}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-12 top-full pt-2 min-w-[12rem] z-50">
                    <div className="rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-white animate-slideDown p-2">
                      {/* Profile Link */}
                      <Link
                        href="/dashboard/profile"
                        className="flex items-center w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <svg
                          className="w-4 h-4 mr-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Profile
                      </Link>

                      {/* Sign Out Button */}
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            <button
              type="button"
              className="text-white hover:text-blue-200 p-2 -mr-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 pt-2 space-y-1 border-t border-blue-800">
            {user ? (
              /* Authenticated Mobile Menu */
              <>
                <Link
                  href="/dashboard"
                  className="block text-white hover:text-blue-200 transition-colors py-3 px-2 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>

                {/* Fleet Section */}
                <div className="border-t border-blue-800 pt-3 mt-2">
                  <div className="text-blue-200 text-xs font-semibold px-2 py-2 uppercase tracking-wider">
                    Fleet
                  </div>
                  <div className="pl-2">
                    <div className="text-blue-300 text-xs font-medium px-2 py-1 uppercase">
                      Assets
                    </div>
                    <Link
                      href="/dashboard/vehicles"
                      className="block text-white hover:text-blue-200 transition-colors py-2 pl-4"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Vehicles
                    </Link>
                    <Link
                      href="/dashboard/vehicles/groups"
                      className="block text-white hover:text-blue-200 transition-colors py-2 pl-4"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Vehicle Groups
                    </Link>
                    <div className="text-blue-300 text-xs font-medium px-2 py-1 mt-2 uppercase">
                      Personnel
                    </div>
                    <Link
                      href="/dashboard/drivers"
                      className="block text-white hover:text-blue-200 transition-colors py-2 pl-4"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Drivers
                    </Link>
                  </div>
                </div>

                {/* Operations Section */}
                <div className="border-t border-blue-800 pt-3 mt-2">
                  <div className="text-blue-200 text-xs font-semibold px-2 py-2 uppercase tracking-wider">
                    Operations
                  </div>
                  <Link
                    href="/dashboard/agreements"
                    className="block text-white hover:text-blue-200 transition-colors py-2 pl-4"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Agreements
                  </Link>
                  <Link
                    href="/dashboard/inspections"
                    className="block text-white hover:text-blue-200 transition-colors py-2 pl-4"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Inspections
                  </Link>
                </div>

                {/* Compliance Section */}
                <div className="border-t border-blue-800 pt-3 mt-2">
                  <div className="text-blue-200 text-xs font-semibold px-2 py-2 uppercase tracking-wider">
                    Compliance
                  </div>
                  <Link
                    href="/dashboard/compliance"
                    className="block text-white hover:text-blue-200 transition-colors py-2 pl-4"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Compliance Dashboard
                  </Link>
                  <Link
                    href="/dashboard/compliance/contractor-checks"
                    className="block text-white hover:text-blue-200 transition-colors py-2 pl-4"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contractor Checks
                  </Link>
                </div>

                {/* Admin Section - Role-based */}
                {(user.roleName === "admin" || user.roleName === "manager") && (
                  <div className="border-t border-blue-800 pt-3 mt-2">
                    <div className="text-blue-200 text-xs font-semibold px-2 py-2 uppercase tracking-wider">
                      Admin
                    </div>
                    <Link
                      href="/dashboard/admin/users"
                      className="block text-white hover:text-blue-200 transition-colors py-2 pl-4"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      User Management
                    </Link>
                    <Link
                      href="/dashboard/admin/email"
                      className="block text-white hover:text-blue-200 transition-colors py-2 pl-4"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Email Configuration
                    </Link>
                  </div>
                )}

                {/* User Profile Section */}
                <div className="border-t border-blue-800 pt-3 mt-2">
                  <div className="text-blue-200 text-xs font-semibold px-2 py-2 uppercase tracking-wider">
                    Account
                  </div>
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center text-white hover:text-blue-200 transition-colors py-2 pl-4"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center w-full text-left text-white hover:text-blue-200 transition-colors py-2 pl-4"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              /* Unauthenticated Mobile Menu */
              <>
                <Link
                  href="/dashboard"
                  className="block text-white hover:text-blue-200 transition-colors py-3 px-2 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/login"
                  className="block text-white hover:text-blue-200 transition-colors py-3 px-2 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
