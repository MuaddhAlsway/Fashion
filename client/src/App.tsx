import { apiEnabled } from './api/config'
import ApiAdminGuard from './api/ApiAdminGuard'
import AdminMailingList from './pages/admin/AdminMailingList'
import AdminContact from './pages/admin/AdminContact'
import WishlistPage from './pages/WishlistPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminJournal from './pages/admin/AdminJournal'
import AdminWebsite from './pages/admin/AdminWebsite'
import AdminLegal from './pages/admin/AdminLegal'
import AdminNotFound from './pages/admin/AdminNotFound'
import { BrowserRouter, Outlet, Route, Routes } from 'react-router'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import MarketplacePage from './pages/MarketplacePage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentPage from './pages/PaymentPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AccountPage from './pages/AccountPage'
import AboutPage from './pages/About'
import ContactPage from './pages/ContactPage'
import JournalPage from './pages/JournalPage'
import JournalStoryPage from './pages/JournalStoryPage'
import NotFoundPage from './pages/NotFoundPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'

function StorefrontLayout() {
  return <><Navbar /><Outlet /><Footer /></>
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/admin" element={apiEnabled ? <ApiAdminGuard><AdminLayout /></ApiAdminGuard> : <AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="journal" element={<AdminJournal />} />
          <Route path="content" element={<AdminWebsite />} />
          <Route path="legal" element={<AdminLegal />} />
          <Route path="mailing-list" element={<AdminMailingList />} />
          <Route path="contact" element={<AdminContact />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/payment" element={<PaymentPage />} />
          <Route path="/checkout/confirmation" element={<OrderConfirmationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/journal/:slug" element={<JournalStoryPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

