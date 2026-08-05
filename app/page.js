import { CartProvider } from '../components/CartContext';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Commander from '../components/Commander';
import Footer from '../components/Footer';
import Cart from '../components/Cart';
import JsonLdRestaurant from '../components/JsonLdRestaurant';

export const metadata = {
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <CartProvider>
      <Navbar />
      <main>
        <Hero />
        <Commander />
      </main>
      <Footer />
      <Cart />
      <JsonLdRestaurant />
    </CartProvider>
  );
}
