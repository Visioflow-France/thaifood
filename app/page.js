import { CartProvider } from '../components/CartContext';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Histoire from '../components/Histoire';
import Commander from '../components/Commander';
import PhoneCTA from '../components/PhoneCTA';
import Avis from '../components/Avis';
import Footer from '../components/Footer';
import Cart from '../components/Cart';

export default function Home() {
  return (
    <CartProvider>
      <Navbar />
      <main>
        <Hero />
        <Histoire />
        <Commander />
        <PhoneCTA />
        <Avis />
      </main>
      <Footer />
      <Cart />
    </CartProvider>
  );
}
