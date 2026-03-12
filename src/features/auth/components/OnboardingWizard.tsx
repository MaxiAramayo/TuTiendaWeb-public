'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Rocket,
  Store,
  Palette,
  Loader2,
  CheckCircle2,
  MapPin,
  Phone,
  FileText,
  ShoppingBag,
  MessageCircle,
  QrCode,
  ChevronLeft,
  ArrowRight,
  Check,
  X,
  Sparkles,
  Globe,
  LayoutDashboard,
  PartyPopper,
  Gift,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { completeNewOnboardingAction } from '@/features/auth/actions/onboarding.actions';
import { checkSlugAvailabilityAction } from '@/features/auth/actions/auth.actions';
import {
  onboardingCompleteSchema,
  ONBOARDING_STEP_FIELDS,
  ONBOARDING_TOTAL_STEPS,
  type OnboardingCompleteInput,
} from '@/features/auth/schemas/onboarding.schema';
import { ONBOARDING_STORE_TYPES, getProductTemplateKey } from '@/features/onboarding/data/store-types';
import { productTemplates } from '@/features/onboarding/data/product-templates';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// COLOR PRESETS
// ============================================================================

const COLOR_PRESETS = [
  { name: 'Indigo', primary: '#4F46E5', secondary: '#EEF2FF', accent: '#312E81' },
  { name: 'Oceano', primary: '#2563EB', secondary: '#EFF6FF', accent: '#1E3A8A' },
  { name: 'Bosque', primary: '#15803D', secondary: '#F0FDF4', accent: '#14532D' },
  { name: 'Atardecer', primary: '#C2410C', secondary: '#FFF7ED', accent: '#7C2D12' },
  { name: 'Lavanda', primary: '#7C3AED', secondary: '#F5F3FF', accent: '#4C1D95' },
  { name: 'Carbon', primary: '#1F2937', secondary: '#F3F4F6', accent: '#030712' },
];

// ============================================================================
// SLUG UTILITIES
// ============================================================================

function createSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================================
// INTERSTITIAL SLIDE (icon + title + description)
// ============================================================================

function InterstitialSlide({ icon: Icon, title, description, iconColor, bgColor }: {
  icon: React.ElementType;
  title: string;
  description: string;
  iconColor: string;
  bgColor: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={cn('p-6 rounded-[2rem] mb-8', bgColor)}
      >
        <Icon className={cn('w-14 h-14', iconColor)} />
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-extrabold text-slate-900 mb-4"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-slate-500 text-lg max-w-sm"
      >
        {description}
      </motion.p>
    </div>
  );
}

// ============================================================================
// FORM SLIDE (title + description + children)
// ============================================================================

function FormSlide({ icon: Icon, iconColor, bgColor, title, description, children }: {
  icon?: React.ElementType;
  iconColor?: string;
  bgColor?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col justify-center max-w-sm mx-auto w-full py-10 px-4">
      <div className="mb-8">
        {Icon && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-5', bgColor)}
          >
            <Icon className={cn('w-7 h-7', iconColor)} />
          </motion.div>
        )}
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-3xl font-extrabold text-slate-900 mb-3"
        >
          {title}
        </motion.h2>
        {description && (
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-base"
          >
            {description}
          </motion.p>
        )}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

// ============================================================================
// PRODUCT PREVIEW CARD
// ============================================================================

function ProductPreviewCard({ storeType }: { storeType: string }) {
  const templateKey = getProductTemplateKey(storeType);
  const product = productTemplates[templateKey];

  return (
    <div className="flex min-h-full flex-col items-center justify-center max-w-sm mx-auto w-full py-10 px-4">
      <div className="mb-6 w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mb-5"
        >
          <ShoppingBag className="w-7 h-7 text-teal-600" />
        </motion.div>
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-3xl font-extrabold text-slate-900 mb-3"
        >
          Tu catalogo
        </motion.h2>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 text-base"
        >
          Asi se vera un producto en tu tienda. Podras agregar los tuyos desde el panel.
        </motion.p>
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="w-full bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden"
      >
        {/* Product image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="eager"
          />
          {product.tags.length > 0 && (
            <div className="absolute top-3 left-3 flex gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-slate-700 shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="p-5 space-y-3">
          <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{product.description}</p>

          {product.variants && (
            <div className="flex gap-2 flex-wrap">
              {product.variants.map((v) => (
                <span
                  key={v.type}
                  className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  {v.type}: {v.value}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-2xl font-extrabold text-slate-900">
              ${product.price.toLocaleString('es-AR')}
            </span>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 rounded-xl px-3 py-1.5">
              {product.categoryName}
            </span>
          </div>

          <button
            type="button"
            disabled
            className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold text-sm opacity-50 cursor-not-allowed mt-2"
          >
            Agregar al carrito
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

export default function OnboardingWizard({
  storeSlug,
  defaultValues,
}: {
  storeSlug?: string | null;
  defaultValues?: {
    name?: string;
    description?: string;
    whatsapp?: string;
    slug?: string;
    storeType?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    street?: string;
    city?: string;
    zipCode?: string;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  // Slug validation state
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugTimer, setSlugTimer] = useState<NodeJS.Timeout | null>(null);

  const [[page, direction], setPage] = useState([0, 0]);

  const form = useForm<OnboardingCompleteInput>({
    resolver: zodResolver(onboardingCompleteSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      storeType: (defaultValues?.storeType as OnboardingCompleteInput['storeType']) || 'other',
      street: defaultValues?.street || '',
      city: defaultValues?.city || '',
      zipCode: defaultValues?.zipCode || '',
      whatsapp: defaultValues?.whatsapp || '+54 ',
      description: defaultValues?.description || '',
      slug: defaultValues?.slug || '',
      primaryColor: defaultValues?.primaryColor || COLOR_PRESETS[0].primary,
      secondaryColor: defaultValues?.secondaryColor || COLOR_PRESETS[0].secondary,
      accentColor: defaultValues?.accentColor || COLOR_PRESETS[0].accent,
    },
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = form;

  const watchedPrimaryColor = watch('primaryColor');
  const watchedStoreType = watch('storeType');
  const watchedSlug = watch('slug');
  const watchedWhatsapp = watch('whatsapp');

  // ========================================================================
  // SLUG VALIDATION (debounced)
  // ========================================================================

  const checkSlug = useCallback(
    async (value: string) => {
      if (!value || value.length < 3 || !/^[a-z0-9-]+$/.test(value)) {
        setSlugStatus('idle');
        return;
      }
      // Si el slug es el mismo que ya tiene la tienda, es válido sin consultar
      if (storeSlug && value === storeSlug) {
        setSlugStatus('available');
        return;
      }
      setSlugStatus('checking');
      try {
        const result = await checkSlugAvailabilityAction(value);
        if (result.success) {
          setSlugStatus(result.data.isAvailable ? 'available' : 'taken');
        } else {
          setSlugStatus('idle');
        }
      } catch {
        setSlugStatus('idle');
      }
    },
    [storeSlug]
  );

  // Debounce slug check when user edits
  const handleSlugChange = useCallback(
    (value: string) => {
      const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setValue('slug', formatted, { shouldValidate: true });
      setSlugStatus('idle');

      if (slugTimer) clearTimeout(slugTimer);
      const timer = setTimeout(() => checkSlug(formatted), 600);
      setSlugTimer(timer);
    },
    [setValue, slugTimer, checkSlug]
  );

  // Auto-generate slug from name on step 1
  const handleNameChange = useCallback(
    (name: string) => {
      const generated = createSlug(name);
      setValue('slug', generated);
      // Check availability after a small delay
      if (slugTimer) clearTimeout(slugTimer);
      const timer = setTimeout(() => checkSlug(generated), 800);
      setSlugTimer(timer);
    },
    [setValue, slugTimer, checkSlug]
  );

  // Check slug on mount if default exists
  useEffect(() => {
    if (defaultValues?.slug && defaultValues.slug.length >= 3) {
      checkSlug(defaultValues.slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================================================================
  // NAVIGATION
  // ========================================================================

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const handleNext = async () => {
    // Last step → submit
    if (page === ONBOARDING_TOTAL_STEPS - 1) {
      handleSubmit(onSubmit)();
      return;
    }

    // Validate fields for current step
    const fieldsToValidate = ONBOARDING_STEP_FIELDS[page] || [];
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate as (keyof OnboardingCompleteInput)[]);
      if (!isValid) return;
    }

    // Extra: if leaving slug step and slug is taken or still checking, block
    if (page === 4 && slugStatus === 'taken') {
      toast.error('La URL no esta disponible. Proba con otra.');
      return;
    }
    if (page === 4 && slugStatus === 'checking') {
      toast.error('Verificando disponibilidad de la URL, espera un momento.');
      return;
    }

    paginate(1);
  };

  const handlePrev = () => {
    if (page > 0) paginate(-1);
  };

  // ========================================================================
  // SUBMIT
  // ========================================================================

  const onSubmit = (data: OnboardingCompleteInput) => {
    if (isPending) return;

    startTransition(async () => {
      try {
        const safeData = JSON.parse(JSON.stringify(data));
        const res = await completeNewOnboardingAction(safeData);

        if (res.success && res.data?.storeId) {
          setSuccessSlug(data.slug || null);
          setIsSuccess(true);
        } else if (!res.success) {
          const errorMsg = res.errors?._form?.[0] || 'Revisa los errores del formulario';
          toast.error(errorMsg);
        }
      } catch {
        toast.error('Ocurrio un error inesperado');
      }
    });
  };

  // ========================================================================
  // ANIMATION VARIANTS
  // ========================================================================

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 50 : -50, opacity: 0 }),
  };

  // ========================================================================
  // SUCCESS SCREEN
  // ========================================================================

  if (isSuccess) {
    return (
      <div className="flex fixed inset-0 flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-6 overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-100/60 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full space-y-6">
          {/* Ícono animado */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
            className="w-24 h-24 rounded-[2rem] bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-200"
          >
            <PartyPopper className="w-12 h-12 text-white" />
          </motion.div>

          {/* Texto */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
              ¡Felicitaciones!<br />Tu tienda ya esta activa
            </h2>
            <p className="text-slate-500 text-base">
              Todo esta listo para empezar a vender. ¿Que queres hacer ahora?
            </p>
          </motion.div>

          {/* Botones */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="w-full space-y-3 pt-2"
          >
            <button
              onClick={() => router.push('/dashboard/products')}
              className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-lg shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-3"
            >
              <ShoppingBag className="w-6 h-6" />
              Agregar productos
            </button>
            {successSlug && (
              <a
                href={'/' + successSlug}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-lg shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-3"
              >
                <Globe className="w-6 h-6" />
                Visitar mi tienda
              </a>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER SLIDES
  // ========================================================================

  const renderSlide = (index: number) => {
    switch (index) {
      // ---- Step 0: Welcome ----
      case 0:
        return (
          <InterstitialSlide
            icon={Rocket}
            iconColor="text-indigo-600"
            bgColor="bg-indigo-100"
            title="¡Lanza tu Tienda!"
            description="Vamos a configurar tu catalogo en unos simples pasos. Sera rapido, fluido y sin complicaciones."
          />
        );

      // ---- Step 1: Store name & type ----
      case 1:
        return (
          <FormSlide
            icon={Store}
            iconColor="text-indigo-600"
            bgColor="bg-indigo-100"
            title="Tu negocio"
            description="Dinos el nombre y el rubro principal de tu tienda."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Nombre de la tienda
                </label>
                <Input
                  {...register('name')}
                  placeholder="Ej. Mi Tienda Increible"
                  className="h-14 text-lg rounded-2xl px-4 border-slate-200 bg-white"
                  onChange={(e) => {
                    register('name').onChange(e);
                    handleNameChange(e.target.value);
                  }}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 ml-1">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Categoria
                </label>
                <select
                  {...register('storeType')}
                  className="flex h-14 w-full text-lg rounded-2xl border border-slate-200 bg-white px-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  {ONBOARDING_STORE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.storeType && (
                  <p className="text-sm text-red-500 ml-1">{errors.storeType.message}</p>
                )}
              </div>
            </div>
          </FormSlide>
        );

      // ---- Step 2: Address ----
      case 2:
        return (
          <FormSlide
            icon={MapPin}
            iconColor="text-orange-500"
            bgColor="bg-orange-100"
            title="Tu direccion"
            description="Indica donde se encuentra tu negocio para que tus clientes te ubiquen facilmente."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Calle y numero
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    {...register('street')}
                    placeholder="Ej. Av. Corrientes 1234"
                    className="h-14 text-lg rounded-2xl pl-12 border-slate-200 bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">
                    Ciudad
                  </label>
                  <Input
                    {...register('city')}
                    placeholder="Buenos Aires"
                    className="h-14 text-lg rounded-2xl px-4 border-slate-200 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">
                    Codigo postal
                  </label>
                  <Input
                    {...register('zipCode')}
                    placeholder="C1425"
                    className="h-14 text-lg rounded-2xl px-4 border-slate-200 bg-white"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 ml-1">
                Estos campos son opcionales. Podes completarlos mas tarde.
              </p>
            </div>
          </FormSlide>
        );

      // ---- Step 3: Contact (WhatsApp) ----
      case 3:
        return (
          <FormSlide
            icon={MessageCircle}
            iconColor="text-emerald-600"
            bgColor="bg-emerald-100"
            title="Tu contacto"
            description="Indica tu numero de WhatsApp para que tus clientes puedan contactarte."
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Numero de WhatsApp
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none z-10">
                  <span className="text-lg leading-none">🇦🇷</span>
                  <span className="text-sm font-medium text-slate-500">+54</span>
                </div>
                <Input
                  value={watchedWhatsapp || ''}
                  onChange={(e) => {
                    const PREFIX = '+54 ';
                    let val = e.target.value;
                    if (!val.startsWith(PREFIX)) {
                      val = PREFIX + val.replace(/^\+\d+\s?/, '');
                    }
                    setValue('whatsapp', val, { shouldValidate: true });
                  }}
                  placeholder="9 11 1234-5678"
                  className="h-14 text-lg rounded-2xl pl-[5.5rem] border-slate-200 bg-white"
                />
              </div>
              {errors.whatsapp && (
                <p className="text-sm text-red-500 ml-1">{errors.whatsapp.message}</p>
              )}
              <p className="text-xs text-slate-400 ml-1">
                A este numero les llegaran los pedidos de tus clientes.
              </p>
            </div>
          </FormSlide>
        );

      // ---- Step 4: Description & Slug ----
      case 4:
        return (
          <FormSlide
            icon={Sparkles}
            iconColor="text-violet-600"
            bgColor="bg-violet-100"
            title="Tu identidad online"
            description="Una breve descripcion y la URL unica de tu tienda."
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Descripcion
                </label>
                <Textarea
                  {...register('description')}
                  placeholder="Cuenta un poco sobre lo que vendes..."
                  className="min-h-[120px] text-lg resize-none rounded-2xl p-4 border-slate-200 bg-white"
                />
                {errors.description && (
                  <p className="text-sm text-red-500 ml-1">{errors.description.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  URL de tu tienda
                </label>
                <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 h-14 focus-within:ring-2 focus-within:ring-indigo-600 transition-all">
                  <span className="text-slate-400 font-medium whitespace-nowrap text-sm">
                    tutienda.com/
                  </span>
                  <input
                    value={watchedSlug || ''}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="flex h-full w-full bg-transparent text-lg font-medium text-slate-900 outline-none placeholder:text-slate-300 ml-1"
                    placeholder="mi-tienda"
                  />
                  <div className="ml-2 shrink-0">
                    {slugStatus === 'checking' && (
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    )}
                    {slugStatus === 'available' && (
                      <Check className="h-5 w-5 text-emerald-500" />
                    )}
                    {slugStatus === 'taken' && (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
                {errors.slug && (
                  <p className="text-sm text-red-500 ml-1">{errors.slug.message}</p>
                )}
                {slugStatus === 'taken' && (
                  <p className="text-sm text-red-500 ml-1">
                    Esta URL ya esta en uso. Proba con otra.
                  </p>
                )}
                {slugStatus === 'available' && (
                  <p className="text-sm text-emerald-600 ml-1">
                    ¡Disponible!
                  </p>
                )}
              </div>
            </div>
          </FormSlide>
        );

      // ---- Step 5: Colors ----
      case 5:
        return (
          <FormSlide
            icon={Palette}
            iconColor="text-pink-500"
            bgColor="bg-pink-100"
            title="Paleta de colores"
            description="Elige el color principal que represente mejor a tu marca."
          >
            <div className="grid grid-cols-2 gap-4">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = watchedPrimaryColor === preset.primary;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setValue('primaryColor', preset.primary);
                      setValue('secondaryColor', preset.secondary);
                      setValue('accentColor', preset.accent);
                    }}
                    className={cn(
                      'relative flex flex-col items-center gap-3 rounded-3xl border-2 p-5 transition-all',
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    )}
                  >
                    <div
                      className="h-10 w-10 shrink-0 rounded-full shadow-inner"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span className="text-sm font-bold text-slate-700">{preset.name}</span>
                    {isSelected && (
                      <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-indigo-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </FormSlide>
        );

      // ---- Step 6: Product Preview ----
      case 6:
        return <ProductPreviewCard storeType={watchedStoreType} />;

      // ---- Step 7: WhatsApp Share + Store URL ----
      case 7:
        return (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-[2rem] mb-8 bg-emerald-100"
            >
              <MessageCircle className="w-14 h-14 text-emerald-600" />
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-extrabold text-slate-900 mb-4"
            >
              Comparte por WhatsApp
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-500 text-lg max-w-sm mb-8"
            >
              Envia el link de tu catalogo a tus clientes directamente por WhatsApp o redes sociales.
            </motion.p>
            {watchedSlug && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-sm rounded-3xl bg-blue-50 border-2 border-blue-200 p-5 space-y-2"
              >
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest">
                  Tu URL
                </p>
                <p className="text-xl font-extrabold text-blue-700 break-all leading-snug">
                  tutiendaweb.com.ar/<span className="text-blue-900">{watchedSlug}</span>
                </p>
              </motion.div>
            )}
          </div>
        );

      // ---- Step 8: Free trial ----
      case 8:
        return (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-[2rem] mb-8 bg-amber-100"
            >
              <Gift className="w-14 h-14 text-amber-500" />
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-extrabold text-slate-900 mb-4"
            >
              7 dias de prueba gratis
            </motion.h2>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4 max-w-sm"
            >
              <p className="text-slate-500 text-lg">
                Probá todas las funciones sin costo. Si te gusta, activá tu suscripcion mensual.
              </p>
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 space-y-2 text-left">
                {[
                  'Catalogo online ilimitado',
                  'Pedidos por WhatsApp',
                  'Panel de control completo',
                  'Podes cancelar cuando quieras',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        );

      // ---- Step 9: Finish ----
      case 9:
        return (
          <InterstitialSlide
            icon={Store}
            iconColor="text-blue-600"
            bgColor="bg-blue-100"
            title="¡Todo listo!"
            description="Tu configuracion esta completa. Estas a un clic de lanzar tu tienda al mundo."
          />
        );

      default:
        return null;
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="flex fixed inset-0 w-full flex-col bg-slate-50 overflow-hidden">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 h-1.5 bg-slate-200 w-full z-50">
        <motion.div
          className="h-full bg-indigo-600 rounded-r-full"
          initial={{ width: 0 }}
          animate={{ width: `${(page / (ONBOARDING_TOTAL_STEPS - 1)) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Top Nav */}
      <div className="h-16 flex items-center px-4 z-40 shrink-0">
        {page > 0 && !isSuccess && (
          <button
            onClick={handlePrev}
            className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-200/50"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}
        <div className="ml-auto pr-4 font-medium text-slate-400 text-sm">
          Paso {page + 1} de {ONBOARDING_TOTAL_STEPS}
        </div>
      </div>

      {/* Content Slider */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full min-h-full flex flex-col items-center justify-center py-8"
          >
            {renderSlide(page)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Button */}
      <div className="bg-white border-t border-slate-100 p-4 sm:p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] relative z-20 shrink-0 mt-auto">
        <div className="max-w-md mx-auto w-full">
          <Button
            onClick={handleNext}
            disabled={isPending}
            className={cn(
              'h-16 w-full rounded-[1.25rem] text-xl font-bold shadow-lg transition-all active:scale-[0.98]',
              page === ONBOARDING_TOTAL_STEPS - 1
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Creando tienda...
              </>
            ) : page === ONBOARDING_TOTAL_STEPS - 1 ? (
              <>
                <Rocket className="mr-2 h-6 w-6" /> Crear mi tienda
              </>
            ) : (
              <>
                {page === 0 ? 'Empezar ahora' : page === 8 ? 'Entendido, continuar' : 'Continuar'}
                <ArrowRight className="ml-2 h-6 w-6" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
