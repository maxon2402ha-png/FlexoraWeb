import React, { useState, useEffect, useRef } from 'react';
import { Zap, Shield, Smartphone, Menu, X, Check, ArrowRight, ChevronLeft, ChevronRight, Send, User, Settings, CreditCard, Award, LogOut, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENT: PIE CHART ---
const CircleProgress = ({ value, max, title, subtitle, color }: { value: number, max: number, title: string, subtitle: string, color: string }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = max === 0 ? circumference : circumference - (value / max) * circumference;

  return (
    <div className="flex flex-col items-center group">
      <h4 className="text-xl md:text-2xl font-bold uppercase mb-4 md:mb-6 font-['Exo_2'] text-gray-200 group-hover:text-white transition-colors">{title}</h4>
      <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
        <svg className="transform -rotate-90 w-full h-full drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <circle cx="50%" cy="50%" r="45%" stroke="#2A0910" strokeWidth="12" fill="transparent" />
          <circle 
            cx="50%" cy="50%" r="45%" 
            stroke={value > 0 ? color : 'transparent'} 
            strokeWidth="12" fill="transparent" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ strokeDasharray: 2 * Math.PI * (window.innerWidth < 768 ? 40 : 60) }} // Адаптация радиуса для расчета
          />
        </svg>
        <div className="absolute text-center flex flex-col items-center">
          <span className={`text-3xl md:text-5xl font-black font-['Exo_2'] leading-none drop-shadow-md ${value > 0 ? 'text-white' : 'text-gray-600'}`}>
            {value}
          </span>
          <span className="text-[10px] md:text-xs uppercase font-bold text-gray-400 mt-1 md:mt-2 tracking-widest">{subtitle}</span>
        </div>
      </div>
    </div>
  );
};

// --- ТИП ДАННЫХ ПОЛЬЗОВАТЕЛЯ ---
interface UserProfile {
  login: string; 
  email: string;
  avatar_url: string; 
  level: number;
  xp: number;
  maxXp: number;
  subscriptions: { internet: number; cloud: number; server: number };
  achievements: number[];
}

const DEFAULT_EMPTY_PROFILE: UserProfile = {
  login: "Гость",
  email: "",
  avatar_url: "",
  level: 1,
  xp: 0,
  maxXp: 1000,
  subscriptions: { internet: 0, cloud: 0, server: 0 },
  achievements: []
};

// URL API (Берем из ENV или локальный)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // --- AUTH STATES ---
  const [isAuthOpen, setIsAuthOpen] = useState(false); 
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login'); 
  
  // --- MODAL STATES ---
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // --- FORMS ---
  const [emailForm, setEmailForm] = useState({ oldEmail: '', newEmail: '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loginForm, setLoginForm] = useState({ newLogin: '' });
  const [formData, setFormData] = useState({ login: '', password: '', email: '' }); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_EMPTY_PROFILE);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const plans = [
    { name: "Ronin", price: "199₽", features: ["1 устройство", "Высокая скорость", "Без логов"], gradient: "from-[#2A0910] to-black" },
    { name: "Samurai", price: "399₽", features: ["3 устройства", "Игровой режим", "Личный IP", "AdBlock"], gradient: "from-[#4A0E19] to-[#1a0508]" },
    { name: "Shogun", price: "599₽", features: ["5 устройств", "4K стриминг", "VIP Поддержка", "Double VPN"], gradient: "from-[#5e121f] to-[#25080d]" }
  ];

  // --- API CALLS ---
  const fetchUserProfile = async (token: string) => {
    try {
        const response = await fetch(`${API_URL}/api/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            setUserProfile(prev => ({ ...prev, ...data }));
            setIsLoggedIn(true);
        } else {
            handleLogout();
        }
    } catch (e) {
        console.error("Error loading profile", e);
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const tokenUrl = query.get("token");
    const tokenLocal = localStorage.getItem("token");
    const activeToken = tokenUrl || tokenLocal;

    if (activeToken) {
      if (tokenUrl) {
          localStorage.setItem("token", tokenUrl);
          window.history.replaceState({}, document.title, "/");
      }
      fetchUserProfile(activeToken);
    }
  }, []);

  const handleAuth = async () => {
    if (!formData.password || (authMode === 'register' && !formData.email) || (authMode === 'login' && !formData.login)) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    setIsLoading(true);
    const endpoint = authMode === 'login' ? 'login' : 'register';

    try {
      const response = await fetch(`${API_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        if (authMode === 'register') {
          alert("Регистрация успешна! Теперь войдите.");
          setAuthMode('login');
        } else {
          if (data.token) {
              localStorage.setItem("token", data.token);
              fetchUserProfile(data.token);
              setIsAuthOpen(false);
          }
        }
      } else {
        alert(data.error || "Ошибка сервера");
      }
    } catch (error) {
      alert("Нет соединения с сервером");
    } finally {
      setIsLoading(false);
    }
  };

  // --- OBSOLETE PROMPT LOGIN CHANGE ---
  const handleUpdateLogin = async () => {
      // This is now redundant as we have a modal, but keeping just in case
      // or redirecting to modal
      setIsLoginModalOpen(true);
  };

  const handleLoginSubmit = async () => {
      if (!loginForm.newLogin) { alert("Введите новый логин"); return; }
      const token = localStorage.getItem("token");
      try {
          const response = await fetch(`${API_URL}/api/me`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ login: loginForm.newLogin })
          });
          if (response.ok) {
              alert("Логин успешно обновлен!");
              fetchUserProfile(token!); 
              setIsLoginModalOpen(false);
              setLoginForm({ newLogin: '' });
          } else { alert("Ошибка обновления"); }
      } catch (e) { alert("Ошибка сети"); }
  };

  const handleEmailSubmit = async () => {
    if (!emailForm.oldEmail || !emailForm.newEmail) { alert("Заполните оба поля"); return; }
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/api/me`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailForm.newEmail })
        });
        if (response.ok) {
            alert("Почта успешно изменена!");
            fetchUserProfile(token!);
            setIsEmailModalOpen(false);
            setEmailForm({ oldEmail: '', newEmail: '' });
        } else { alert("Ошибка при смене почты"); }
    } catch (e) { alert("Ошибка сети"); }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) { alert("Заполните все поля"); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { alert("Новые пароли не совпадают"); return; }
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/api/me`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: passwordForm.newPassword })
        });
        if (response.ok) {
            alert("Пароль успешно изменен!");
            setIsPasswordModalOpen(false);
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } else { alert("Ошибка при смене пароля"); }
    } catch (e) { alert("Ошибка сети"); }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('avatar', file);
      const token = localStorage.getItem("token");
      try {
          const response = await fetch(`${API_URL}/api/avatar`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData 
          });
          if (response.ok) {
              const data = await response.json();
              setUserProfile(prev => ({ ...prev, avatar_url: data.url }));
          } else { alert("Ошибка загрузки фото"); }
      } catch (e) { alert("Ошибка сети при загрузке фото"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserProfile(DEFAULT_EMPTY_PROFILE);
  };

  useEffect(() => {
    if (isLoggedIn) return; 
    const timer = setInterval(() => nextSlide(), 4000);
    return () => clearInterval(timer);
  }, [currentPlanIndex, isLoggedIn]);

  const nextSlide = () => setCurrentPlanIndex((prev) => (prev + 1) % plans.length);
  const prevSlide = () => setCurrentPlanIndex((prev) => (prev - 1 + plans.length) % plans.length);

  const floatingAnimation = { y: [0, -25, 0], rotateZ: [0, 1, 0, -1, 0], transition: { repeat: Infinity, duration: 8, ease: "easeInOut" as const } };
  const cardHover = { scale: 1.02, boxShadow: "0 0 40px rgba(82, 18, 36, 0.5)", borderColor: "rgba(82, 18, 36, 0.5)", transition: { duration: 0.3 } };

  return (
    <div className="min-h-screen bg-main text-white font-sans overflow-x-hidden relative selection:bg-accent selection:text-white pb-10">
      <div className="bg-noise"></div>
      <div className="absolute top-0 right-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-[#473452]/30 blur-[100px] md:blur-[180px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3 z-0 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[#521224]/20 blur-[80px] md:blur-[150px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/4 z-0 animate-pulse-slow"></div>

      {/* HEADER */}
      <motion.header 
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.8 }} 
        className="fixed top-0 w-full z-[100] py-4 md:py-6 px-4 md:px-12 flex justify-between items-center backdrop-blur-xl bg-[#1A121F]/80 border-b border-white/5"
      >
        <div className="text-xl md:text-2xl font-black tracking-widest text-[#521224] flex items-center gap-2 cursor-pointer font-['Exo_2'] drop-shadow-[0_0_15px_rgba(82,18,36,0.6)]" onClick={handleLogout}>FLEXORA</div>
        <nav className="hidden md:flex gap-12 text-sm font-bold uppercase tracking-wider text-gray-400">
          {['Услуги', 'Сервисы', 'Раздачи'].map((item) => (<a key={item} href="#" className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-300">{item}</a>))}
        </nav>
        <div className="flex items-center gap-4 md:gap-6">
           {!isLoggedIn ? (
             <motion.button onClick={() => setIsAuthOpen(true)} whileHover={{ scale: 1.1, rotate: 180 }} transition={{ duration: 0.5 }} className="flex w-10 h-10 bg-[#521224]/20 rounded-full items-center justify-center cursor-pointer hover:bg-[#521224] transition-colors group border border-[#521224]/30 neon-shadow"><span className="text-lg">🌐</span></motion.button>
           ) : (
             <div className="flex items-center gap-2 md:gap-4">
                <div className="text-right hidden md:block"><div className="text-sm font-bold text-white">{userProfile.login}</div><div className="text-xs text-[#521224] font-bold">Standard</div></div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#42304C] border-2 border-[#521224] overflow-hidden shadow-[0_0_15px_rgba(82,18,36,0.5)] flex items-center justify-center">
                    {userProfile.avatar_url ? (<img src={userProfile.avatar_url} alt="Аватар" className="w-full h-full object-cover" />) : (<User size={20} className="text-white/50" />)}
                </div>
                <button onClick={handleLogout} className="text-gray-500 hover:text-[#521224] transition"><LogOut size={20} /></button>
             </div>
           )}
           <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}><Menu size={28} /></button>
        </div>
      </motion.header>

      {isLoggedIn ? (
        // === ЛИЧНЫЙ КАБИНЕТ (АДАПТИРОВАННЫЙ) ===
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="pt-24 md:pt-32 pb-20 container mx-auto px-4 md:px-12 relative z-10">
            {/* КАРТОЧКА ПРОФИЛЯ */}
            <div className="w-full bg-[#1A121F] border border-[#521224]/30 rounded-[20px] md:rounded-[30px] p-6 md:p-12 relative overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)] mb-12 md:mb-20">
                <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none"><img src="/images/ronin-smoke.png" className="w-full h-full object-cover mix-blend-screen opacity-50" /></div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-center">
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#521224] p-1 shadow-[0_0_30px_rgba(82,18,36,0.5)] bg-[#1A121F] flex items-center justify-center overflow-hidden">
                                {userProfile.avatar_url ? (<img src={userProfile.avatar_url} className="w-full h-full object-cover rounded-full" />) : (<User size={48} className="text-[#521224]" />)}
                            </div>
                            <div>
                                <h2 className="text-3xl md:text-5xl font-black font-['Exo_2'] uppercase tracking-widest text-white drop-shadow-lg">{userProfile.login}</h2>
                                <p className="text-xs md:text-sm text-[#521224] font-bold uppercase tracking-[0.2em] mb-2">Новобранец</p>
                                <div className="w-40 md:w-48 h-3 bg-[#0f0408] rounded-full overflow-hidden border border-white/10 relative mx-auto lg:mx-0">
                                    <div className="absolute top-0 left-0 h-full bg-[#521224] shadow-[0_0_10px_#521224] transition-all duration-1000" style={{ width: `${(userProfile.xp / userProfile.maxXp) * 100}%` }}></div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold text-center lg:text-right w-40 md:w-48">Lvl {userProfile.level} • {userProfile.xp}/{userProfile.maxXp}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-2 w-full md:w-auto">
                            <button onClick={() => setIsLoginModalOpen(true)} className="flex-1 md:flex-none px-6 py-3 bg-[#521224] rounded-xl font-bold uppercase text-[10px] md:text-xs tracking-wider hover:bg-white hover:text-black transition-all shadow-lg">Изменить логин</button>
                            <button className="flex-1 md:flex-none px-6 py-3 bg-[#42304C] rounded-xl font-bold uppercase text-[10px] md:text-xs tracking-wider hover:bg-white hover:text-black transition-all border border-white/10">Покупки</button>
                        </div>
                    </div>
                    <div className="hidden lg:block"></div>
                    <div className="bg-[#0f0408]/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-[#521224] blur-[50px] opacity-40"></div>
                        <h3 className="text-lg md:text-xl font-black uppercase mb-4 md:mb-6 text-white font-['Exo_2'] flex items-center gap-2"><Award className="text-[#521224]" /> Достижения</h3>
                        {userProfile.achievements.length > 0 ? (
                            <div className="grid grid-cols-4 gap-4 mb-6">{userProfile.achievements.map((id) => (<div key={id} className="aspect-square bg-[#2A0910] rounded-xl flex items-center justify-center border border-[#521224] shadow-[0_0_15px_rgba(82,18,36,0.4)]"><Award size={20} className="text-white"/></div>))}</div>
                        ) : (<div className="h-20 flex items-center justify-center text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wider mb-6 border-2 border-dashed border-white/5 rounded-xl">Пока нет достижений</div>)}
                        <div className="flex justify-between text-center border-t border-white/10 pt-4">
                            <div><div className="text-xl md:text-2xl font-black text-white">{userProfile.subscriptions.server}</div><div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold tracking-wider">Серверов</div></div>
                            <div><div className="text-xl md:text-2xl font-black text-white">0</div><div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold tracking-wider">Устройств</div></div>
                            <div><div className="text-xl md:text-2xl font-black text-[#521224]">-</div><div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold tracking-wider">Ранк</div></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ПОДПИСКИ */}
            <div className="mb-20 md:mb-32 text-center">
                <h2 className="text-3xl md:text-5xl font-black mb-10 md:mb-20 uppercase font-['Exo_2'] drop-shadow-xl">Мои подписки</h2>
                <div className="flex flex-wrap justify-center gap-8 md:gap-32">
                    <CircleProgress value={userProfile.subscriptions.internet} max={30} title="Интернет" subtitle="Дней" color="#FF1F1F" />
                    <CircleProgress value={userProfile.subscriptions.cloud} max={30} title="Облако" subtitle="Дней" color="#42304C" />
                    <CircleProgress value={userProfile.subscriptions.server} max={30} title="Сервер" subtitle="Дней" color="#521224" />
                </div>
            </div>

            {/* НАСТРОЙКИ */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
                <div className="flex justify-center order-2 lg:order-1">
                    <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full border-[1px] border-[#521224]/50 p-4">
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                        <div 
                            className="w-full h-full rounded-full overflow-hidden shadow-[0_0_100px_rgba(82,18,36,0.3)] bg-[#0f0408] relative group cursor-pointer flex items-center justify-center"
                            onClick={() => fileInputRef.current?.click()}
                        >
                             {userProfile.avatar_url ? (<img src={userProfile.avatar_url} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" />) : (<User size={80} className="text-[#521224] opacity-50" />)}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center"><Camera size={32} className="text-[#521224] mb-2"/><span className="uppercase font-bold tracking-widest text-xs md:text-sm">Загрузить фото</span></div>
                        </div>
                    </div>
                </div>
                <div className="space-y-6 md:space-y-8 order-1 lg:order-2">
                    <h2 className="text-4xl md:text-6xl font-black mb-4 md:mb-8 uppercase font-['Exo_2'] text-center lg:text-left">Изменить <br/> <span className="text-[#521224]">Данные</span></h2>
                    
                    <button onClick={() => setIsLoginModalOpen(true)} className="w-full h-20 md:h-24 bg-[#1A121F] border border-[#521224]/30 hover:border-[#521224] hover:bg-[#2A0910] text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg flex items-center justify-between px-6 md:px-10 group text-lg md:text-xl">
                        <span>Изменить логин</span> <div className="w-8 h-8 md:w-10 md:h-10 bg-[#521224] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><User size={18}/></div>
                    </button>
                    
                    <button onClick={() => setIsPasswordModalOpen(true)} className="w-full h-20 md:h-24 bg-[#1A121F] border border-[#521224]/30 hover:border-[#521224] hover:bg-[#2A0910] text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg flex items-center justify-between px-6 md:px-10 group text-lg md:text-xl">
                        <span>Сменить пароль</span> <div className="w-8 h-8 md:w-10 md:h-10 bg-[#521224] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Shield size={18}/></div>
                    </button>
                    
                    <button onClick={() => setIsEmailModalOpen(true)} className="w-full h-20 md:h-24 bg-[#1A121F] border border-[#521224]/30 hover:border-[#521224] hover:bg-[#2A0910] text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg flex items-center justify-between px-6 md:px-10 group text-lg md:text-xl">
                        <span>Сменить почту</span> <div className="w-8 h-8 md:w-10 md:h-10 bg-[#521224] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Send size={18}/></div>
                    </button>
                    
                    <button className="w-full h-20 md:h-24 bg-[#521224] hover:bg-white hover:text-black text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_30px_rgba(82,18,36,0.4)] flex items-center justify-center gap-4 text-lg md:text-xl">
                        Привязать соц сети
                    </button>
                </div>
            </div>
        </motion.div>
      ) : (
        // === ЛЕНДИНГ (ГЛАВНАЯ) ===
        <>
          <section className="relative pt-28 md:pt-40 pb-20 min-h-screen flex items-center overflow-hidden">
            <div className="container mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-10 items-center relative z-10">
              <motion.div initial={{ opacity: 0, x: -50, filter: "blur(10px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} transition={{ duration: 1.2 }} className="max-w-2xl relative z-10 text-center lg:text-left">
                <h1 className="text-4xl md:text-[64px] font-black leading-[1.1] mb-6 md:mb-8 drop-shadow-2xl font-['Exo_2'] uppercase">Защитите свою <br/>активность <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#521224] via-[#7a1c36] to-[#473452] drop-shadow-[0_0_15px_rgba(82,18,36,0.3)]">в интернете</span></h1>
                <p className="text-gray-400 text-base md:text-lg mb-8 md:mb-12 border-l-0 md:border-l-[6px] border-[#521224] md:pl-8 max-w-md leading-relaxed mx-auto lg:mx-0">Полная анонимность. <br/> Обход любых блокировок. <br/> Скорость света.</p>
                <motion.button whileHover={{ scale: 1.05, backgroundColor: "#521224" }} whileTap={{ scale: 0.98 }} className="group relative px-10 md:px-14 py-4 md:py-5 bg-transparent border-2 border-[#521224] text-white font-bold uppercase tracking-[0.2em] transition-all duration-500 rounded-sm overflow-hidden neon-shadow"><span className="relative z-10 flex items-center gap-2 justify-center">Узнать больше <ArrowRight className="group-hover:translate-x-2 transition-transform"/></span></motion.button>
              </motion.div>
              <div className="relative h-[400px] md:h-[800px] w-full hidden lg:block z-0"><motion.img animate={floatingAnimation} src="/images/samurai-hero.png" alt="Samurai" className="absolute top-0 right-0 h-full w-auto object-contain scale-125 translate-x-[10%] translate-y-[-10%] pointer-events-none drop-shadow-[0_0_80px_rgba(82,18,36,0.3)]" /></div>
            </div>
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }} className="absolute bottom-0 left-0 w-full z-20 hidden lg:block lg:mb-10">
              <div className="container mx-auto px-6 md:px-12"><div className="bg-[#42304C]/80 backdrop-blur-2xl rounded-3xl p-8 flex flex-wrap justify-around items-center gap-8 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">{[ { icon: Zap, title: "Быстрая скорость" }, { icon: Shield, title: "Без логов" }, { icon: Smartphone, title: "P2P Поддержка" } ].map((item, idx) => (<motion.div whileHover={{ y: -5 }} key={idx} className="flex flex-col md:flex-row items-center gap-4 group cursor-pointer"><div className="p-4 bg-[#521224]/20 rounded-full group-hover:bg-[#521224] transition-all duration-500 neon-shadow"><item.icon className="text-[#521224] group-hover:text-white transition-colors" size={28} /></div><span className="text-sm font-black uppercase tracking-widest font-['Exo_2'] text-center md:text-left">{item.title}</span></motion.div>))}</div></div>
            </motion.div>
          </section>
          
          <section className="py-20 md:py-32 relative overflow-hidden bg-black/20">
            <div className="container mx-auto px-6 md:px-12 relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-12 md:mb-16 text-white text-center uppercase font-['Exo_2'] drop-shadow-xl">Тарифные планы</h2>
              <div className="relative w-full max-w-lg mx-auto h-[500px] md:h-[600px] flex items-center justify-center">
                <button onClick={prevSlide} className="absolute left-[-20px] md:left-[-80px] w-10 h-10 md:w-14 md:h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#521224] hover:border-[#521224] transition-all z-30 group bg-black/40 backdrop-blur-sm"><ChevronLeft size={24} className="text-gray-400 group-hover:text-white"/></button>
                <div className="relative w-full h-full perspective-1000">
                  <AnimatePresence mode="wait">
                    <motion.div key={currentPlanIndex} initial={{ opacity: 0, x: 100, rotateY: 20 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} exit={{ opacity: 0, x: -100, rotateY: -20 }} transition={{ duration: 0.5, ease: "easeInOut" }} className={`absolute inset-0 w-full h-full bg-gradient-to-br ${plans[currentPlanIndex].gradient} rounded-[30px] md:rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col justify-between p-6 md:p-10 overflow-hidden`}>
                      <span className="absolute -right-8 top-12 text-[6rem] md:text-[9rem] font-black text-black/20 rotate-90 select-none font-['Exo_2'] opacity-60">{plans[currentPlanIndex].name}</span>
                      <div className="relative z-10">
                        <h3 className="text-3xl md:text-5xl font-black uppercase font-['Exo_2'] mb-4 drop-shadow-md text-white">{plans[currentPlanIndex].name}</h3>
                        <div className="text-4xl md:text-6xl font-black text-[#521224] mb-6 md:mb-8 drop-shadow-[0_0_20px_rgba(82,18,36,0.6)] font-['Exo_2']">{plans[currentPlanIndex].price}<span className="text-xl md:text-2xl text-white/50 font-sans font-medium">/мес</span></div>
                        <ul className="space-y-4 md:space-y-6">
                          {plans[currentPlanIndex].features.map((feature, i) => (<li key={i} className="flex items-center gap-4 text-white/90 text-sm md:text-lg font-bold tracking-wide"><div className="w-6 h-6 md:w-8 md:h-8 bg-black/30 rounded-full flex items-center justify-center border border-white/10 shadow-inner"><Check size={14} className="text-[#521224]"/></div>{feature}</li>))}
                        </ul>
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full h-16 md:h-20 bg-black/40 hover:bg-[#521224] text-white text-lg md:text-xl font-bold uppercase rounded-2xl transition-all duration-300 relative z-10 border border-white/10 hover:border-[#521224] tracking-widest shadow-lg mt-4 neon-shadow">Выбрать тариф</motion.button>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <button onClick={nextSlide} className="absolute right-[-20px] md:right-[-80px] w-10 h-10 md:w-14 md:h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#521224] hover:border-[#521224] transition-all z-30 group bg-black/40 backdrop-blur-sm"><ChevronRight size={24} className="text-gray-400 group-hover:text-white"/></button>
              </div>
              <div className="flex justify-center gap-4 mt-8 md:mt-12">{plans.map((_, idx) => (<button key={idx} onClick={() => setCurrentPlanIndex(idx)} className={`h-3 rounded-full transition-all duration-500 ${idx === currentPlanIndex ? 'w-12 bg-[#521224] shadow-[0_0_15px_#521224]' : 'w-3 bg-gray-600 hover:bg-gray-400'}`} />))}</div>
            </div>
          </section>
          
          <section className="py-20 md:py-32 relative overflow-hidden">
            <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-20 items-center relative z-10">
                <motion.div initial={{ opacity: 0, x: -100, filter: "blur(10px)" }} whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }} viewport={{ once: true }} transition={{ duration: 1.5 }} className="hidden md:block h-[750px] relative -ml-32"><img src="/images/katana-girl.png" alt="Katana" className="w-full h-full object-contain scale-125 origin-center drop-shadow-[0_0_50px_rgba(82,18,36,0.1)]" /></motion.div>
                <div className="space-y-10 relative z-20 text-center md:text-left"><h2 className="text-4xl md:text-6xl font-black mb-8 uppercase font-['Exo_2'] drop-shadow-xl">Наши соц сети</h2><p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-md border-l-0 md:border-l-4 border-[#521224] md:pl-6 mx-auto md:mx-0">Подписывайтесь на наш официальный канал, чтобы быть в курсе новостей, обновлений и участвовать в эксклюзивных раздачах.</p><motion.a href="https://t.me/Flexorochka" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.02, backgroundColor: "#6b182f" }} whileTap={{ scale: 0.98 }} className="w-full h-24 md:h-28 bg-[#521224] rounded-[20px] text-2xl md:text-3xl font-black uppercase tracking-[0.1em] shadow-xl neon-shadow transition-all flex items-center justify-center gap-4 md:gap-6 border-2 border-transparent hover:border-[#521224] cursor-pointer group"><Send size={32} className="text-[#1A121F] group-hover:text-white transition-colors" />Telegram Канал</motion.a></div>
            </div>
             <div className="container mx-auto px-6 mt-20 md:mt-40 border-t border-white/5 pt-10 text-center md:text-right text-xs md:text-sm text-gray-500 uppercase tracking-[0.2em] font-bold"><p>Flexers GG © 2025. All rights reserved.</p></div>
          </section>
        </>
      )}

      {/* === МОДАЛЬНЫЕ ОКНА (АДАПТИРОВАННЫЕ) === */}
      <AnimatePresence>
        {/* АВТОРИЗАЦИЯ */}
        {isAuthOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1A121F]/95 backdrop-blur-md p-4">
            <div className="absolute inset-0" onClick={() => setIsAuthOpen(false)}></div>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-[350px] md:max-w-[400px] bg-[#1A121F] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-[0_0_60px_rgba(82,18,36,0.4)]">
              <div className="text-center mb-2"><span className="text-3xl md:text-4xl font-black italic font-['Exo_2'] text-white tracking-wide">Flexora</span></div>
              <div className="flex gap-2 p-1">
                 <button onClick={() => setAuthMode('login')} className={`flex-1 py-3 rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest transition-all shadow-lg ${authMode === 'login' ? 'bg-white text-black' : 'bg-[#521224] text-white opacity-50 hover:opacity-100'}`}>Вход</button>
                 <button onClick={() => setAuthMode('register')} className={`flex-1 py-3 rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest transition-all shadow-lg ${authMode === 'register' ? 'bg-white text-black' : 'bg-[#521224] text-white hover:opacity-90'}`}>Регистрация</button>
              </div>
              <div className="space-y-4">
                 <input type={authMode === 'login' ? 'text' : 'email'} placeholder={authMode === 'login' ? 'Логин' : 'Почта'} className="w-full h-12 md:h-14 bg-[#42304C] border border-white/5 rounded-2xl px-6 text-white placeholder-white/50 focus:outline-none focus:border-[#521224] transition-all" value={authMode === 'login' ? formData.login : formData.email} onChange={(e) => setFormData({...formData, [authMode === 'login' ? 'login' : 'email']: e.target.value})} />
                 <input type="password" placeholder="Пароль" className="w-full h-12 md:h-14 bg-[#42304C] border border-white/5 rounded-2xl px-6 text-white placeholder-white/50 focus:outline-none focus:border-[#521224] transition-all" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
              <button onClick={handleAuth} disabled={isLoading} className={`w-full h-12 md:h-14 bg-[#521224] hover:bg-[#6b182f] text-white font-bold uppercase tracking-widest rounded-2xl shadow-[0_0_25px_rgba(82,18,36,0.5)] transition-all mt-2 border border-white/10 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>{isLoading ? 'Загрузка...' : (authMode === 'login' ? "Вход" : "Создать аккаунт")}</button>
              <div className="space-y-3">
                 <a href="http://localhost:8080/auth/google/login" className="w-full h-10 md:h-12 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition"><span className="text-base md:text-lg font-bold">G</span> <span className="text-xs md:text-sm">Войти через Google</span></a>
                 <button className="w-full h-10 md:h-12 bg-[#0088cc] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#0077b5] transition"><span className="text-base md:text-lg">✈</span> <span className="text-xs md:text-sm">Войти через Telegram</span></button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* СМЕНА ЛОГИНА */}
        {isLoginModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] flex items-center justify-center bg-[#1A121F]/95 backdrop-blur-md p-4">
            <div className="absolute inset-0" onClick={() => setIsLoginModalOpen(false)}></div>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="relative w-full max-w-[700px] h-auto md:h-[400px] bg-[#1A121F] border border-[#521224]/50 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(82,18,36,0.6)] flex flex-col md:flex-row">
               <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center gap-6 relative z-10 bg-[#1A121F]">
                  <h2 className="text-2xl md:text-3xl font-black font-['Exo_2'] text-white leading-tight">Смена <br/><span className="text-[#521224]">логина</span></h2>
                  <div className="space-y-4">
                      <input type="text" placeholder="Введите новый логин" className="w-full h-12 md:h-14 bg-[#42304C] border border-white/10 rounded-xl px-5 text-white placeholder-white/40 focus:outline-none focus:border-[#521224] transition-all" value={loginForm.newLogin} onChange={(e) => setLoginForm({ newLogin: e.target.value })} />
                  </div>
                  <div className="flex gap-4 mt-2">
                      <button onClick={handleLoginSubmit} className="flex-1 h-12 bg-[#521224] hover:bg-[#6b182f] text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg text-sm">Применить</button>
                      <button onClick={() => setIsLoginModalOpen(false)} className="flex-1 h-12 bg-[#42304C] hover:bg-[#523b5e] text-white/80 hover:text-white font-bold uppercase tracking-widest rounded-xl transition-all text-sm">Отменить</button>
                  </div>
               </div>
               <div className="hidden md:block w-1/2 h-full relative"><div className="absolute inset-0 bg-gradient-to-r from-[#1A121F] via-transparent to-transparent z-10"></div><img src="/images/demon-mask.png" alt="Demon Mask" className="w-full h-full object-cover object-center scale-110" /></div>
            </motion.div>
          </motion.div>
        )}

        {/* СМЕНА ПОЧТЫ */}
        {isEmailModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] flex items-center justify-center bg-[#1A121F]/95 backdrop-blur-md p-4">
            <div className="absolute inset-0" onClick={() => setIsEmailModalOpen(false)}></div>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="relative w-full max-w-[700px] h-auto md:h-[450px] bg-[#1A121F] border border-[#521224]/50 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(82,18,36,0.6)] flex flex-col md:flex-row">
               <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center gap-6 relative z-10 bg-[#1A121F]">
                  <h2 className="text-2xl md:text-3xl font-black font-['Exo_2'] text-white leading-tight">Смена <br/><span className="text-[#521224]">почты</span></h2>
                  <div className="space-y-4">
                      <input type="email" placeholder="Введите старую почту" className="w-full h-12 md:h-14 bg-[#42304C] border border-white/10 rounded-xl px-5 text-white placeholder-white/40 focus:outline-none focus:border-[#521224] transition-all" value={emailForm.oldEmail} onChange={(e) => setEmailForm({...emailForm, oldEmail: e.target.value})} />
                      <input type="email" placeholder="Введите новую почту" className="w-full h-12 md:h-14 bg-[#42304C] border border-white/10 rounded-xl px-5 text-white placeholder-white/40 focus:outline-none focus:border-[#521224] transition-all" value={emailForm.newEmail} onChange={(e) => setEmailForm({...emailForm, newEmail: e.target.value})} />
                  </div>
                  <div className="flex gap-4 mt-2">
                      <button onClick={handleEmailSubmit} className="flex-1 h-12 bg-[#521224] hover:bg-[#6b182f] text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg text-sm">Применить</button>
                      <button onClick={() => setIsEmailModalOpen(false)} className="flex-1 h-12 bg-[#42304C] hover:bg-[#523b5e] text-white/80 hover:text-white font-bold uppercase tracking-widest rounded-xl transition-all text-sm">Отменить</button>
                  </div>
               </div>
               <div className="hidden md:block w-1/2 h-full relative"><div className="absolute inset-0 bg-gradient-to-r from-[#1A121F] via-transparent to-transparent z-10"></div><img src="/images/demon-girl.png" alt="Samurai" className="w-full h-full object-cover object-center" /></div>
            </motion.div>
          </motion.div>
        )}

        {/* СМЕНА ПАРОЛЯ */}
        {isPasswordModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] flex items-center justify-center bg-[#1A121F]/95 backdrop-blur-md p-4">
            <div className="absolute inset-0" onClick={() => setIsPasswordModalOpen(false)}></div>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="relative w-full max-w-[700px] h-auto md:h-[500px] bg-[#1A121F] border border-[#521224]/50 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(82,18,36,0.6)] flex flex-col md:flex-row">
               <div className="hidden md:block w-1/2 h-full relative"><div className="absolute inset-0 bg-gradient-to-l from-[#1A121F] via-transparent to-transparent z-10"></div><img src="/images/demon-samurai.png" alt="Demon Samurai" className="w-full h-full object-cover object-center transform scale-125" /></div>
               <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center gap-6 relative z-10 bg-[#1A121F]">
                  <h2 className="text-2xl md:text-3xl font-black font-['Exo_2'] text-white leading-tight text-left md:text-right">Смена <br/><span className="text-[#521224]">пароля</span></h2>
                  <div className="space-y-4">
                      <input type="password" placeholder="Введите старый пароль" className="w-full h-12 md:h-14 bg-[#42304C] border border-white/10 rounded-xl px-5 text-white placeholder-white/40 focus:outline-none focus:border-[#521224] transition-all" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})} />
                      <input type="password" placeholder="Введите новый пароль" className="w-full h-12 md:h-14 bg-[#42304C] border border-white/10 rounded-xl px-5 text-white placeholder-white/40 focus:outline-none focus:border-[#521224] transition-all" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
                      <input type="password" placeholder="Повторите новый пароль" className="w-full h-12 md:h-14 bg-[#42304C] border border-white/10 rounded-xl px-5 text-white placeholder-white/40 focus:outline-none focus:border-[#521224] transition-all" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                  </div>
                  <div className="flex gap-4 mt-2">
                      <button onClick={handlePasswordSubmit} className="flex-1 h-12 bg-[#521224] hover:bg-[#6b182f] text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg text-sm">Применить</button>
                      <button onClick={() => setIsPasswordModalOpen(false)} className="flex-1 h-12 bg-[#42304C] hover:bg-[#523b5e] text-white/80 hover:text-white font-bold uppercase tracking-widest rounded-xl transition-all text-sm">Отменить</button>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, backdropFilter: "blur(0px)" }} animate={{ opacity: 1, backdropFilter: "blur(20px)" }} exit={{ opacity: 0, backdropFilter: "blur(0px)" }} className="fixed inset-0 bg-[#1A121F]/95 z-[90] flex flex-col items-center justify-center gap-10 md:hidden">
            {['Услуги', 'Сервисы', 'Раздачи'].map((item, idx) => (<motion.a initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} key={item} href="#" onClick={() => setIsMenuOpen(false)} className="text-3xl font-black uppercase font-['Exo_2'] hover:text-[#521224] transition tracking-widest">{item}</motion.a>))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;