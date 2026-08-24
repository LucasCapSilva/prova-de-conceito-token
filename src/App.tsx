import { lazy, Suspense, useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { AuthProvider } from "./context/AuthContext";
import { CompareProvider } from "./context/CompareContext";
import ToastsProvider from "./context/ToastsContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { Skeleton } from "./components/Skeleton";
import CompareBar from "./components/CompareBar";
import ChatWidget from "./components/ChatWidget";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import NotFound from "./pages/NotFound";

const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const Search = lazy(() => import("./pages/Search"));
const Category = lazy(() => import("./pages/Category"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const SellerStore = lazy(() => import("./pages/SellerStore"));
const About = lazy(() => import("./pages/About"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Login = lazy(() => import("./pages/Login"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Returns = lazy(() => import("./pages/Returns"));
const Help = lazy(() => import("./pages/Help"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerOrders = lazy(() => import("./pages/SellerOrders"));
const SellerQuestions = lazy(() => import("./pages/SellerQuestions"));
const SellerProducts = lazy(() => import("./pages/SellerProducts"));
const Addresses = lazy(() => import("./pages/Addresses"));
const Profile = lazy(() => import("./pages/Profile"));
const Cards = lazy(() => import("./pages/Cards"));
const NotificationPrefs = lazy(() => import("./pages/NotificationPrefs"));
const Compare = lazy(() => import("./pages/Compare"));
const Alerts = lazy(() => import("./pages/Alerts"));
const FollowedStores = lazy(() => import("./pages/FollowedStores"));
const Coupons = lazy(() => import("./pages/Coupons"));
const Coins = lazy(() => import("./pages/Coins"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function PageFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6"
    >
      <span className="sr-only">Carregando página…</span>
      <Skeleton className="h-8 w-56" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <ToastsProvider>
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>
          <CompareProvider>
          <BrowserRouter>
        <ScrollToTop />
        <MotionConfig reducedMotion="user">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<PageFallback />}>
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/busca" element={<Search />} />
              <Route path="/comparar" element={<Compare />} />
              <Route path="/categoria/:slug" element={<Category />} />
              <Route path="/produto/:id" element={<ProductDetail />} />
        <Route path="/loja/:id" element={<SellerStore />} />
              <Route path="/carrinho" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
        <Route path="/pedido/:id" element={<OrderConfirmation />} />
        <Route path="/favoritos" element={<Favorites />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/lojas-seguidas" element={<FollowedStores />} />
        <Route path="/cupons" element={<Coupons />} />
        <Route path="/moedas" element={<Coins />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/pedidos/:id" element={<OrderDetail />} />
        <Route path="/devolucoes" element={<Returns />} />
        <Route path="/ajuda" element={<Help />} />
        <Route path="/vendedor" element={<SellerDashboard />} />
              <Route path="/vendedor/produtos" element={<SellerProducts />} />
              <Route path="/vendedor/pedidos" element={<SellerOrders />} />
              <Route path="/vendedor/perguntas" element={<SellerQuestions />} />
        <Route path="/enderecos" element={<Addresses />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/cartoes" element={<Cards />} />
        <Route path="/preferencias" element={<NotificationPrefs />} />
        <Route path="/sobre" element={<About />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
        </MotionConfig>
        <CompareBar />
        <ChatWidget />
          </BrowserRouter>
          </CompareProvider>
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
    </ToastsProvider>
    </ErrorBoundary>
  );
}
