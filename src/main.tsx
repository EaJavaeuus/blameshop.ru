import { StrictMode, useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, X, ChevronLeft, ChevronRight, ShoppingCart, Trash2, Copy, Check } from 'lucide-react';
import './index.css';

// --- ТИПЫ ДАННЫХ ---
interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  description: string;
  sizes: string[];
  category: string;
  images: string[];
}

interface CartItem extends Product {
  selectedSize: string;
  quantity: number;
}

// --- ЗАГРУЗКА ---
const PRODUCT_IDS = ['1', '2', '3'];

async function loadProducts(): Promise<Product[]> {
  const products: Product[] = [];
  for (const id of PRODUCT_IDS) {
    try {
      const response = await fetch(`/tshirts/${id}/config.txt`);
      if (!response.ok) continue;
      const text = await response.text();
      const config: any = {};
      text.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) config[key.trim()] = valueParts.join(':').trim();
      });

      products.push({
        id,
        name: config['Название'] || `T-Shirt ${id}`,
        price: parseInt(config['Цена']) || 0,
        discountPrice: config['Скидка'] ? parseInt(config['Скидка']) : undefined,
        description: config['Описание'] || '',
        sizes: (config['Размеры'] || '').split(',').map((s: string) => s.trim()),
        category: config['Категория'] || 'General',
        images: Array.from({ length: 5 }, (_, i) => `/tshirts/${id}/${i + 1}.png`)
      });
    } catch (e) {
      console.error(`Error loading product ${id}`, e);
    }
  }
  return products;
}

// --- КОМПОНЕНТЫ ---

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Состояния для информационных модалок
  const [activeInfoModal, setActiveInfoModal] = useState<string | null>(null);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);

  useEffect(() => {
    loadProducts().then(data => { setProducts(data); setIsLoading(false); });
  }, []);

  const categories = useMemo(() => ['Все', ...new Set(products.map(p => p.category))], [products]);
  const filteredProducts = useMemo(() => {
    let filtered = activeCategory === 'Все' ? products : products.filter(p => p.category === activeCategory);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
    }
    return filtered;
  }, [products, activeCategory, searchQuery]);

  const handleAddToCart = (product: Product, size: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size);
      if (existing) return prev.map(item => (item.id === product.id && item.selectedSize === size) ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, selectedSize: size, quantity: 1 }];
    });
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const infoContent: Record<string, { title: string, text: string }> = {
    delivery: {
      title: "Доставка",
      text: "Доставка происходит по сдеку/почте/самовывозу/нашей личной доставке (если вы в уфе/кармаскалах/кабаково) и другими удобными для вас способами."
    },
    about: {
      title: "О нас",
      text: "Магазин создан 14-ти летним подростком как свой первый масштабный проект. Магазин был создан 05.05.26. Магазина нет и не будет на вб/озон, поскольку это невыгодно."
    },
    contacts: {
      title: "Контакты",
      text: "Телеграм: @telegram\nМакс: @max\n\nПишите по любым вопросам!"
    },
    payment_help: {
      title: "Оплата",
      text: "Оплата пока что происходит по сбп лично в ЛС, скоро мы все автоматизируем и сделаем удобную оплату через сайт."
    },
    delivery_help: {
      title: "Доставка",
      text: "Перед оплатой лучше удостоверьтесь что в вас город будет возможна доставка и обсудите. Доставка происходит бесплатно если вы в деревне Кабаково."
    },
    terms_help: {
      title: "Условия",
      text: "Если вы выбрали самовывоз/купили доставку лично у нас, то возврат лишь в первый день после получения товара."
    }
  };

  return (
    <div className="min-h-screen text-[#1A1A1A] font-sans selection:bg-black selection:text-white relative">
      {/* Background Image Layer */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <img 
          src="/br.png" 
          className="w-full h-full object-cover scale-105 blur-[60px] opacity-30 saturate-[1.5]"
          onError={(e: any) => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/[0.02]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/30 backdrop-blur-xl border-b border-black/[0.03] px-6 py-5 flex justify-between items-center transition-all">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-display">
            <span className="text-3xl font-black tracking-tighter uppercase italic bg-black text-white px-2 py-1 select-none rounded-xs">BLAME</span>
            <span className="text-3xl font-black tracking-tighter uppercase italic select-none">SHOP</span>
          </div>

          <div className="hidden md:block relative">
            <button 
              onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2"
            >
              Помощь {isHelpMenuOpen ? '↑' : '↓'}
            </button>
            <AnimatePresence>
              {isHelpMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-white/80 backdrop-blur-xl border border-black/5 neo-shadow-lg rounded-xl overflow-hidden py-2"
                >
                  <button onClick={() => { setActiveInfoModal('payment_help'); setIsHelpMenuOpen(false); }} className="w-full text-left px-6 py-3 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-colors">Оплата</button>
                  <button onClick={() => { setActiveInfoModal('delivery_help'); setIsHelpMenuOpen(false); }} className="w-full text-left px-6 py-3 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-colors">Доставка</button>
                  <button onClick={() => { setActiveInfoModal('terms_help'); setIsHelpMenuOpen(false); }} className="w-full text-left px-6 py-3 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-colors">Условия</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 neo-button group">
          <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white/50 animate-in zoom-in duration-300">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Marquee Banner */}
        <div className="mb-20 overflow-hidden bg-white/20 backdrop-blur-md border border-black/[0.03] py-5 neo-shadow rounded-xl relative">
          <motion.div animate={{ x: [0, -1000] }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="whitespace-nowrap flex gap-12 font-display">
             {[...Array(10)].map((_, i) => (
               <span key={i} className="text-xl font-black italic uppercase tracking-[0.3em] opacity-5">
                 BLAME SHOP • LIMITED DROPS • STREETWEAR EXHIBITION • AUTHENTIC •  
               </span>
             ))}
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div className="flex flex-wrap gap-2.5">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`px-6 py-2.5 font-black uppercase text-[10px] tracking-[0.15em] transition-all rounded-full border ${activeCategory === cat ? 'bg-black text-white border-black shadow-xl scale-105' : 'bg-white/20 backdrop-blur-md text-black/40 border-black/[0.03] hover:border-black/10 hover:text-black'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative group w-full md:w-auto">
            <input 
              type="text" 
              placeholder="ПОИСК..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/20 backdrop-blur-md border border-black/[0.03] px-11 py-3 w-full md:w-80 font-bold uppercase text-[11px] focus:outline-none focus:border-black/10 transition-all rounded-full neo-shadow" 
            />
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-10 group-focus-within:opacity-30 transition-opacity" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4.5 top-1/2 -translate-y-1/2 opacity-10 hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {isLoading ? (
            [1, 2, 3].map(i => <div key={i} className="animate-pulse bg-white/10 aspect-[3/4] rounded-2xl"></div>)
          ) : (
            filteredProducts.map(product => (
              <motion.div key={product.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ y: -6 }} onClick={() => setSelectedProduct(product)} className="group cursor-pointer bg-white/20 backdrop-blur-lg border border-black/[0.03] p-4 neo-shadow hover:shadow-2xl transition-all rounded-2xl relative">
                {product.discountPrice && (
                  <div className="absolute top-6 right-6 z-10 bg-red-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-full shadow-lg -rotate-12 translate-x-2">
                    Скидка -{Math.round((1 - product.discountPrice / product.price) * 100)}%
                  </div>
                )}
                <div className="aspect-[3/4] overflow-hidden mb-5 relative bg-black/[0.02] rounded-xl">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" onError={(e: any) => { e.target.src = `https://picsum.photos/seed/${product.id}/400/533`; }} />
                  <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md text-black px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full">{product.category}</div>
                </div>
                <div className="px-1">
                  <h3 className="font-black text-xl uppercase tracking-tight truncate mb-1.5 opacity-80">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-baseline">
                      <span className="font-mono text-base font-bold opacity-30 group-hover:opacity-80 transition-opacity">
                        {product.discountPrice || product.price} ₽
                      </span>
                      {product.discountPrice && (
                        <span className="font-mono text-[11px] opacity-10 line-through italic">
                          {product.price} ₽
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">Смотреть</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-32 border-t border-black/[0.03] bg-white/10 backdrop-blur-2xl px-6 py-20 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          <div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4 font-display">BLAME SHOP</h3>
            <p className="text-[11px] font-bold uppercase tracking-tight text-gray-400 leading-relaxed max-w-[240px]">
              Выставка авторской одежды. Каждый дроп — это история. Сделано с душой.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            <div>
              <h4 className="text-[10px] font-black uppercase mb-6 opacity-30 tracking-widest">Инфо</h4>
              <ul className="space-y-3 text-[12px] font-black uppercase">
                <li><button onClick={() => setActiveInfoModal('delivery')} className="hover:opacity-50 transition-opacity">Доставка</button></li>
                <li><button onClick={() => setActiveInfoModal('about')} className="hover:opacity-50 transition-opacity">О нас</button></li>
                <li><button onClick={() => setActiveInfoModal('contacts')} className="hover:opacity-50 transition-opacity">Контакты</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase mb-6 opacity-30 tracking-widest">Соцсети</h4>
              <ul className="space-y-3 text-[12px] font-black uppercase">
                <li><a href="#" className="hover:opacity-50">TikTok @tiktok</a></li>
                <li><a href="#" className="hover:opacity-50">YouTube @youtube</a></li>
                <li><a href="#" className="hover:opacity-50">Telegram @telegramchannel</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-black/5 text-[9px] font-black uppercase tracking-[0.3em] opacity-20 text-center">
          © 2026 BLAMESHOP • ВСЕ ПРАВА ЗАЩИЩЕНЫ • UFA
        </div>
      </footer>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}>
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-5xl max-h-full overflow-hidden flex flex-col md:flex-row neo-shadow-2xl rounded-sm" onClick={e => e.stopPropagation()}>
              <ProductModalContent product={selectedProduct} onAddToCart={handleAddToCart} onClose={() => setSelectedProduct(null)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[60]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute top-0 right-0 h-full w-full max-w-md bg-white border-l border-black/10 flex flex-col shadow-2xl">
              <CartContent items={cart} onClose={() => setIsCartOpen(false)} onRemove={(id, size) => setCart(prev => prev.filter(i => !(i.id === id && i.selectedSize === size)))} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Modals */}
      <AnimatePresence>
        {activeInfoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md" onClick={() => setActiveInfoModal(null)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white/90 backdrop-blur-2xl p-10 max-w-lg w-full border border-black/5 neo-shadow-lg relative rounded-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setActiveInfoModal(null)} className="absolute top-6 right-6 p-1.5 hover:bg-black hover:text-white transition-all rounded-full border border-black/10"><X size={14} /></button>
              <h2 className="text-2xl font-black uppercase italic mb-6 font-display tracking-tight border-b-2 border-black inline-block">{infoContent[activeInfoModal].title}</h2>
              <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap opacity-60 italic">{infoContent[activeInfoModal].text}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductModalContent({ product, onAddToCart, onClose }: { product: Product, onAddToCart: (p: Product, s: string) => void, onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  
  return (
    <>
      <div className="relative w-full md:w-3/5 aspect-square md:aspect-auto h-full bg-[#F5F5F5] group">
        <img src={`/tshirts/${product.id}/${imgIdx + 1}.png`} className="w-full h-full object-cover" onError={(e: any) => e.target.src = `https://picsum.photos/seed/${product.id}-${imgIdx}/800/1000`} />
        <div className="absolute inset-y-0 left-0 right-0 flex justify-between items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <button onClick={() => setImgIdx((imgIdx - 1 + 5) % 5)} className="pointer-events-auto bg-black text-white p-2 hover:bg-white hover:text-black transition-colors rounded-sm"><ChevronLeft size={20} /></button>
          <button onClick={() => setImgIdx((imgIdx + 1) % 5)} className="pointer-events-auto bg-black text-white p-2 hover:bg-white hover:text-black transition-colors rounded-sm"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="w-full md:w-2/5 p-8 flex flex-col overflow-y-auto">
        <div className="flex justify-between items-start mb-8">
          <div className="font-display">
            <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 mb-2 inline-block tracking-widest">{product.category}</span>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{product.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black hover:text-white transition-all border border-black/10"><X size={20} /></button>
        </div>
        <div className="mb-8">
          <div className="flex gap-3 items-baseline mb-4">
            <span className="text-2xl font-mono font-bold block opacity-80">
              {product.discountPrice ? product.discountPrice : product.price} ₽
            </span>
            {product.discountPrice && (
              <span className="text-sm font-mono opacity-20 line-through italic">
                {product.price} ₽
              </span>
            )}
          </div>
          <p className="text-[13px] font-medium text-gray-500 leading-relaxed italic">{product.description}</p>
        </div>
        <div className="mb-10">
          <h4 className="text-[10px] font-black uppercase mb-4 opacity-30 tracking-widest">Размер</h4>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map(s => <button key={s} onClick={() => setSize(s)} className={`min-w-[50px] h-12 flex items-center justify-center border font-black transition-all rounded-sm ${size === s ? 'bg-black text-white border-black scale-105 shadow-lg' : 'bg-white border-black/10 hover:border-black/30'}`}>{s}</button>)}
          </div>
        </div>
        <div className="mt-auto pt-8 border-t border-black/5 flex flex-col gap-4">
          <button disabled={!size} onClick={() => size && onAddToCart(product, size)} className={`w-full py-5 flex items-center justify-center gap-3 font-black uppercase tracking-widest border transition-all ${size ? 'bg-black text-white border-black neo-shadow-lg active:translate-y-1' : 'bg-gray-100 text-gray-300 border-black/5 cursor-not-allowed'}`}>
            <ShoppingCart size={18} /> Добавить в корзину
          </button>
          {!size && <p className="text-[9px] uppercase font-black text-black/20 text-center">Выберите размер для покупки</p>}
        </div>
      </div>
    </>
  );
}

function CartContent({ items, onClose, onRemove }: { items: CartItem[], onClose: () => void, onRemove: (id: string, s: string) => void }) {
  const total = items.reduce((s, i) => s + (i.discountPrice || i.price) * i.quantity, 0);
  const [copiedCombined, setCopiedCombined] = useState(false);

  const combinedOrderMsg = useMemo(() => {
    if (items.length === 0) return "";
    const itemsText = items.map(item => `• ${item.name} (Размер: ${item.selectedSize}) — ${item.discountPrice || item.price} ₽ x ${item.quantity}`).join('\n');
    return `Здравствуйте, я хочу купить:\n${itemsText}\n\nИтого: ${total} ₽.`;
  }, [items, total]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCombined(true);
    setTimeout(() => setCopiedCombined(false), 2000);
  };

  return (
    <>
      <div className="p-8 border-b border-black/5 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-2xl font-black uppercase flex items-center gap-2 font-display italic tracking-tighter"><ShoppingBag />Корзина</h2>
        <button onClick={onClose} className="hover:rotate-90 transition-transform"><X size={28} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10"><ShoppingBag size={80} strokeWidth={1} /><p className="font-black uppercase italic text-xl mt-4">Пусто</p></div>
        ) : (
          <>
            <div className="space-y-4">
              {items.map(item => (
                <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 border border-black/5 p-3 relative bg-white/40 backdrop-blur-sm rounded-sm">
                  <img src={item.images[0]} className="w-16 h-20 object-cover border border-black/5 flex-shrink-0" onError={(e: any) => e.target.src=`https://picsum.photos/seed/${item.id}/100/120`} />
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="font-black uppercase text-[12px] mb-1 leading-tight">{item.name}</h3>
                      <span className="text-[9px] font-black bg-black text-white px-2 py-0.5 inline-block rounded-xs">SIZE: {item.selectedSize}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-mono text-[13px] font-bold opacity-40">{item.discountPrice || item.price} ₽</span>
                      <span className="text-[10px] font-black uppercase opacity-20">x{item.quantity}</span>
                    </div>
                  </div>
                  <button onClick={() => onRemove(item.id, item.selectedSize)} className="absolute top-2 right-2 opacity-20 hover:opacity-100 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-black/5">
              <div className="bg-white/60 backdrop-blur-md p-5 border border-black/5 rounded-sm neo-shadow-sm">
                <p className="text-[10px] font-black uppercase mb-4 opacity-30 tracking-widest leading-relaxed">
                   Текст для заказа админу:
                </p>
                <div className="text-[11px] font-bold bg-white/80 p-3 border border-black/5 mb-4 select-all whitespace-pre-wrap leading-relaxed opacity-70 italic shadow-inner">
                  {combinedOrderMsg}
                </div>
                <div className="flex flex-col gap-2">
                   <button 
                    onClick={() => copyToClipboard(combinedOrderMsg)} 
                    className="w-full py-3 bg-white border border-black/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all rounded-sm shadow-sm"
                   >
                     {copiedCombined ? <><Check size={14}/> Скопировано</> : <><Copy size={14}/> Скопировать текст</>}
                   </button>
                   <div className="grid grid-cols-2 gap-2">
                     <a href="https://t.me/telegram" target="_blank" rel="noreferrer" className="py-2.5 bg-[#229ED9] text-white flex items-center justify-center text-[9px] font-black uppercase hover:brightness-110 transition-all rounded-sm shadow-md">
                       Telegram
                     </a>
                     <a href="https://t.me/max" target="_blank" rel="noreferrer" className="py-2.5 bg-black text-white flex items-center justify-center text-[9px] font-black uppercase hover:bg-gray-800 transition-all rounded-sm shadow-md">
                       Макс
                     </a>
                   </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="p-8 border-t border-black/5 bg-white/80 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <span className="font-black uppercase text-[10px] opacity-20 tracking-widest">Общий итог</span>
          <span className="text-3xl font-black italic tracking-tighter">{total} ₽</span>
        </div>
        <button disabled={items.length === 0} className="w-full py-5 bg-black text-white font-black border border-black neo-shadow-lg uppercase tracking-widest text-[11px] transition-transform active:scale-[0.98]">
          Оформить заказ
        </button>
      </div>
    </>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
