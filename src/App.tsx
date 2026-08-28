import { lazy, Suspense, useEffect, useRef, type ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "./context/authCore";
import { useMotion } from "./lib/motion";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { AuthProvider } from "./context/AuthContext";
import { CompareProvider } from "./context/CompareContext";
import ToastsProvider from "./context/ToastsContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { Skeleton } from "./components/Skeleton";
import CompareBar from "./components/CompareBar";
import ChatWidget from "./components/ChatWidget";
import RouteFocus from "./components/RouteFocus";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import StorageWarning from "./components/StorageWarning";
import OfflineBanner from "./components/OfflineBanner";
import PasswordSetupBanner from "./components/PasswordSetupBanner";
import StorageQuotaWatcher from "./components/StorageQuotaWatcher";
import UpdatePrompt from "./components/UpdatePrompt";
import GuidedTour from "./components/GuidedTour";
import NotFound from "./pages/NotFound";

const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const Search = lazy(() => import("./pages/Search"));
const Category = lazy(() => import("./pages/Category"));
const Brand = lazy(() => import("./pages/Brand"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const SellerStore = lazy(() => import("./pages/SellerStore"));
const About = lazy(() => import("./pages/About"));
const Favorites = lazy(() => import("./pages/Favorites"));
const SharedList = lazy(() => import("./pages/SharedList"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Recover = lazy(() => import("./pages/Recover"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Returns = lazy(() => import("./pages/Returns"));
const Help = lazy(() => import("./pages/Help"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerOrders = lazy(() => import("./pages/SellerOrders"));
const SellerQuestions = lazy(() => import("./pages/SellerQuestions"));
const SellerProducts = lazy(() => import("./pages/SellerProducts"));
const SellerNewProduct = lazy(() => import("./pages/SellerNewProduct"));
const SellerPromos = lazy(() => import("./pages/SellerPromos"));
const SellerCoupons = lazy(() => import("./pages/SellerCoupons"));
const SellerReviews = lazy(() => import("./pages/SellerReviews"));
const Addresses = lazy(() => import("./pages/Addresses"));
const Profile = lazy(() => import("./pages/Profile"));
const Cards = lazy(() => import("./pages/Cards"));
const NotificationPrefs = lazy(() => import("./pages/NotificationPrefs"));
const Compare = lazy(() => import("./pages/Compare"));
const Alerts = lazy(() => import("./pages/Alerts"));
const FollowedStores = lazy(() => import("./pages/FollowedStores"));
const Novidades = lazy(() => import("./pages/Novidades"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Coupons = lazy(() => import("./pages/Coupons"));
const Coins = lazy(() => import("./pages/Coins"));
const Cashback = lazy(() => import("./pages/Cashback"));
const Guides = lazy(() => import("./pages/Guides"));
const GuideDetail = lazy(() => import("./pages/GuideDetail"));

function MotionGate({ children }: { children: ReactNode }) {
  const motion = useMotion();
  if (!motion) return <>{children}</>;
  return <motion.MotionConfig reducedMotion="user">{children}</motion.MotionConfig>;
}

function SessionExpiredRedirect() {
  const { user, sessionExpired } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const done = useRef(false);
  useEffect(() => {
    if (!sessionExpired || user || done.current) return;
    if (location.pathname === "/entrar") return;
    done.current = true;
    navigate("/entrar", { state: { from: location.pathname } });
  }, [sessionExpired, user, location.pathname, navigate]);
  return null;
}

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
          <Skeleton key={`fallback-${i}`} className="aspect-square" />
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
        <SessionExpiredRedirect />
        <RouteFocus />
        <MotionGate>
        <div className="flex min-h-screen flex-col">
          <a
            href="#conteudo"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[6px] focus:border focus:border-brand focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand focus:shadow-lg focus:outline focus:outline-2 focus:outline-brand"
          >
            Pular para o conteúdo
          </a>
          <Navbar />
          <StorageWarning />
          <OfflineBanner />
          <PasswordSetupBanner />
          <StorageQuotaWatcher />
          <UpdatePrompt />
          <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
            <Suspense fallback={<PageFallback />}>
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/busca" element={<Search />} />
              <Route path="/comparar" element={<Compare />} />
                <Route path="/categoria/:slug" element={<Category />} />
                <Route path="/marca/:slug" element={<Brand />} />
              <Route path="/produto/:id" element={<ProductDetail />} />
        <Route path="/loja/:id" element={<SellerStore />} />
              <Route path="/carrinho" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
        <Route path="/pedido/:id" element={<OrderConfirmation />} />
        <Route path="/favoritos" element={<Favorites />} />
        <Route path="/lista" element={<SharedList />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/recuperar" element={<Recover />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/lojas-seguidas" element={<FollowedStores />} />
        <Route path="/novidades" element={<Novidades />} />
        <Route path="/cupons" element={<Coupons />} />
        <Route path="/moedas" element={<Coins />} />
        <Route path="/cashback" element={<Cashback />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/pedidos/:id" element={<OrderDetail />} />
        <Route path="/devolucoes" element={<Returns />} />
        <Route path="/ajuda" element={<Help />} />
        <Route path="/vendedor" element={<SellerDashboard />} />
              <Route path="/vendedor/produtos" element={<SellerProducts />} />
              <Route path="/vendedor/produtos/novo" element={<SellerNewProduct />} />
          <Route path="/vendedor/promos" element={<SellerPromos />} />
          <Route path="/vendedor/cupons" element={<SellerCoupons />} />
          <Route path="/vendedor/avaliacoes" element={<SellerReviews />} />
              <Route path="/vendedor/pedidos" element={<SellerOrders />} />
              <Route path="/vendedor/perguntas" element={<SellerQuestions />} />
        <Route path="/enderecos" element={<Addresses />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/cartoes" element={<Cards />} />
        <Route path="/preferencias" element={<NotificationPrefs />} />
        <Route path="/privacidade" element={<Privacy />} />
        <Route path="/sobre" element={<About />} />
        <Route path="/guias" element={<Guides />} />
        <Route path="/guias/:slug" element={<GuideDetail />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
        </MotionGate>
        <GuidedTour />
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
