import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import {
  ShoppingBag,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  ShoppingCart,
  Heart,
  Package,
  ChevronDown,
  Search,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Truck,
  Shield,
  Headphones,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const { getTotalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchFocused(false);
    }
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Melody
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <form onSubmit={handleSearch} className="w-full relative">
                <div className={`relative flex items-center transition-all duration-200 ${
                  searchFocused ? 'ring-2 ring-pink-500 ring-opacity-50' : ''
                }`}>
                  <Search className="absolute left-3 w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Search products, brands, categories..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-pink-300 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/products"
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive('/products') ? 'bg-pink-100 text-pink-700' : 'text-gray-700 hover:bg-pink-50'
                }`}
              >
                Products
              </Link>
              <Link
                to="/categories"
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive('/categories') ? 'bg-pink-100 text-pink-700' : 'text-gray-700 hover:bg-pink-50'
                }`}
              >
                Categories
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    isActive('/admin') ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              )}
            </nav>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Cart Icon */}
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 hover:text-pink-600 transition-colors"
                title="Shopping Cart"
              >
                <ShoppingCart className="w-6 h-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getTotalItems() > 9 ? '9+' : getTotalItems()}
                  </span>
                )}
              </Link>

              {/* Wishlist Icon */}
              <Link
                to="/wishlist"
                className="relative p-2 text-gray-600 hover:text-pink-600 transition-colors"
                title="Wishlist"
              >
                <Heart className="w-6 h-6" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-pink-50 transition-colors"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.first_name || user.email}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      {user.first_name || user.email}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-600 transition-transform ${
                        userMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* User Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {user.first_name || user.email}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                      </div>
                      <Link
                        to="/my-orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        <span>Wishlist</span>
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-pink-100 bg-white">
            {/* Mobile Search */}
            <div className="px-4 py-3 border-b border-pink-100">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-pink-300"
                />
              </form>
            </div>
            <nav className="px-4 py-4 space-y-2">
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg ${
                  isActive('/products') ? 'bg-pink-100 text-pink-700' : 'text-gray-700'
                }`}
              >
                Products
              </Link>
              <Link
                to="/categories"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg ${
                  isActive('/categories') ? 'bg-pink-100 text-pink-700' : 'text-gray-700'
                }`}
              >
                Categories
              </Link>
              <Link
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg flex items-center justify-between ${
                  isActive('/cart') ? 'bg-pink-100 text-pink-700' : 'text-gray-700'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Cart</span>
                </span>
                {getTotalItems() > 0 && (
                  <span className="bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getTotalItems() > 9 ? '9+' : getTotalItems()}
                  </span>
                )}
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg flex items-center justify-between ${
                  isActive('/wishlist') ? 'bg-pink-100 text-pink-700' : 'text-gray-700'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>Wishlist</span>
                </span>
                {wishlistItems.length > 0 && (
                  <span className="bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                  </span>
                )}
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg flex items-center space-x-2 ${
                    isActive('/admin') ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              )}
              {user ? (
                <div className="pt-4 border-t border-pink-100 space-y-2">
                  <div className="px-4 py-2 text-sm text-gray-600">
                    {user.first_name || user.email}
                  </div>
                  <Link
                    to="/my-orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2 rounded-lg flex items-center space-x-2 ${
                      isActive('/my-orders') ? 'bg-pink-100 text-pink-700' : 'text-gray-700'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>My Orders</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-4 py-2 rounded-lg flex items-center space-x-2 ${
                        isActive('/admin') ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-center"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 text-gray-800 mt-16 border-t border-pink-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Melody
                </span>
              </div>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Your trusted beauty destination. Discover premium makeup, skincare, and haircare products 
                curated from the world's finest brands.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-pink-500 hover:text-white transition-colors shadow-md"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-pink-500 hover:text-white transition-colors shadow-md"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-pink-500 hover:text-white transition-colors shadow-md"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-pink-500 hover:text-white transition-colors shadow-md"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-gray-800 font-semibold mb-4 text-lg">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link to="/categories" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                    Categories
                  </Link>
                </li>
                <li>
                  <Link to="/products?is_featured=true" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                    Featured Products
                  </Link>
                </li>
                {user && (
                  <li>
                    <Link to="/my-orders" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                      My Orders
                    </Link>
                  </li>
                )}
                {user && (
                  <li>
                    <Link to="/wishlist" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                      Wishlist
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h3 className="text-gray-800 font-semibold mb-4 text-lg">Customer Service</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/shipping" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-gray-800 font-semibold mb-4 text-lg">Get in Touch</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 text-sm">
                    Baku, Azerbaijan<br />
                    Delivery Nationwide
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-pink-600 flex-shrink-0" />
                  <a href="tel:+994508752744" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                    +994 50 875 27 44
                  </a>
                </li>
                <li className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-pink-600 flex-shrink-0" />
                  <a href="mailto:support@melody.az" className="text-gray-600 hover:text-pink-600 transition-colors text-sm">
                    support@melody.az
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Features Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8 border-t border-pink-300">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                <Truck className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h4 className="text-gray-800 font-semibold text-sm">Free Shipping</h4>
                <p className="text-gray-600 text-xs">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                <Shield className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h4 className="text-gray-800 font-semibold text-sm">Secure Payment</h4>
                <p className="text-gray-600 text-xs">100% Protected</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                <Headphones className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h4 className="text-gray-800 font-semibold text-sm">24/7 Support</h4>
                <p className="text-gray-600 text-xs">We're here to help</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-pink-300 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-gray-600 text-sm">
                <p>&copy; {new Date().getFullYear()} Melody. All rights reserved.</p>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <Link to="/privacy" className="text-gray-600 hover:text-pink-600 transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-gray-600 hover:text-pink-600 transition-colors">
                  Terms of Service
                </Link>
                <Link to="/cookies" className="text-gray-600 hover:text-pink-600 transition-colors">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

