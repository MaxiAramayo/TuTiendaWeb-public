'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Rocket,
  Store,
  Palette,
  PackagePlus,
  Loader2,
  CheckCircle2,
  ImagePlus,
  Phone,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAuthClient } from '@/features/auth/hooks/use-auth-client';
import { profileClientService } from '@/features/dashboard/modules/store-settings/services/profile-client.service';
import { completeFullOnboardingAction, saveOnboardingDesignAction } from '@/features/auth/actions/onboarding.actions';
import { onboardingCompleteSchema, type OnboardingCompleteInput } from '@/features/auth/schemas/onboarding.schema';
import { motion, AnimatePresence } from 'framer-motion';

const COLOR_PRESETS = [
  { name: 'Índigo', primary: '#4F46E5', secondary: '#EEF2FF', accent: '#312E81' },
  { name: 'Océano', primary: '#2563EB', secondary: '#EFF6FF', accent: '#1E3A8A' },
  { name: 'Bosque', primary: '#15803D', secondary: '#F0FDF4', accent: '#14532D' },
  { name: 'Atardecer', primary: '#C2410C', secondary: '#FFF7ED', accent: '#7C2D12' },
  { name: 'Lavanda', primary: '#7C3AED', secondary: '#F5F3FF', accent: '#4C1D95' },
  { name: 'Carbón', primary: '#1F2937', secondary: '#F3F4F6', accent: '#030712' },
];

const STORE_TYPES = [
  { value: 'retail', label: 'Tienda Física' },
  { value: 'restaurant', label: 'Gastronomía' },
  { value: 'service', label: 'Servicios' },
  { value: 'digital', label: 'Productos Digitales' },
  { value: 'fashion', label: 'Ropa y Moda' },
  { value: 'beauty', label: 'Salud y Belleza' },
  { value: 'sports', label: 'Deportes' },
  { value: 'electronics', label: 'Tecnología' },
  { value: 'home', label: 'Hogar y Deco' },
  { value: 'automotive', label: 'Automotor' },
  { value: 'other', label: 'Otro' },
] as const;

function createSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const SLIDES_COUNT = 10;
const SLIDE_FIELDS = [
  [], // 0: welcome
  ['basicInfo.name', 'basicInfo.storeType'], // 1: basic 1
  ['basicInfo.description'], // 2: basic 2
  ['basicInfo.whatsapp', 'basicInfo.slug'], // 3: basic 3
  [], // 4: design intro
  ['design.primaryColor'], // 5: colors
  [], // 6: logo
  [], // 7: product intro
  ['product.name', 'product.price'], // 8: product
  [], // 9: submit
];


function InterstitialSlide({ icon: Icon, title, description, iconColor, bgColor }: any) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center px-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={cn("p-6 rounded-[2rem] mb-8", bgColor)}
      >
        <Icon className={cn("w-14 h-14", iconColor)} />
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

function FormSlide({ title, description, children }: any) {
  return (
    <div className="flex min-h-full flex-col justify-center max-w-sm mx-auto w-full py-10 px-4">
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{title}</h2>
        {description && <p className="text-slate-500 text-base">{description}</p>}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

export default function OnboardingWizard({
  storeSlug,
  defaultValues,
}: {
  initialStep?: string;
  storeSlug?: string | null;
  defaultValues?: any;
}) {
  const router = useRouter();
  const { user } = useAuthClient();
  const [isPending, startTransition] = useTransition();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [[page, direction], setPage] = useState([0, 0]);

  const form = useForm<OnboardingCompleteInput>({
    // @ts-ignore
    resolver: zodResolver(onboardingCompleteSchema),
    defaultValues: {
      basicInfo: {
        name: defaultValues?.name || '',
        description: defaultValues?.description || '',
        whatsapp: defaultValues?.whatsapp || '',
        slug: storeSlug || defaultValues?.slug || '',
        storeType: (defaultValues?.storeType as any) || 'other',
      },
      design: {
        primaryColor: defaultValues?.primaryColor || COLOR_PRESETS[0].primary,
        secondaryColor: defaultValues?.secondaryColor || COLOR_PRESETS[0].secondary,
        accentColor: defaultValues?.accentColor || COLOR_PRESETS[0].accent,
        logoUrl: defaultValues?.logoUrl || '',
      },
      product: {
        name: '',
        price: 0,
        categoryName: 'General',
        description: '',
      } as any,
    },
    mode: 'onChange'
  });

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = form;

  const watchedPrimaryColor = watch('design.primaryColor');

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const handleNext = async () => {
    if (page === SLIDES_COUNT - 1) {
      handleSubmit(onSubmit as any)();
      return;
    }
    
    const fieldsToValidate = SLIDE_FIELDS[page];
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) return; 
    }
    
    paginate(1);
  };

  const handlePrev = () => {
    if (page > 0) paginate(-1);
  };

  const handleUploadLogo = (file?: File | null) => {
    if (!file) return;
    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    setValue('design.logoUrl', objectUrl); // temporal, validacion de Zod la ignora o podemos no setearla
  };

  const onSubmit = (data: OnboardingCompleteInput) => {
    if (isPending || isUploadingLogo) return;

    startTransition(async () => {
      setIsUploadingLogo(true);
      try {
        if ((data.product?.name && !data.product?.price) || (!data.product?.name && data.product?.price)) {
          toast.error('Si agregas un producto, completa su nombre y precio o déjalo vacío.');
          setIsUploadingLogo(false);
          return;
        }

        const finalData = { ...data };
        if (!finalData.product?.name || !finalData.product?.price) {
          finalData.product = null;
        }
        
        // Remove temporal objectURL so validation doesn't fail if it's strictly a URL 
        // Actually, schema uses .url(), but we can just set it to empty string for now
        finalData.design.logoUrl = '';

        // Safe clone to prevent Server Actions serialization issues
        const safeData = JSON.parse(JSON.stringify(finalData));
        const res = await completeFullOnboardingAction(safeData);
        if (res.success && res.data?.storeId) {
          
          if (logoFile) {
            try {
              toast.loading('Subiendo imagen...', { id: 'upload' });
              const uploadedUrl = await profileClientService.uploadImage(res.data.storeId, logoFile, 'logo');
              await saveOnboardingDesignAction({ logoUrl: uploadedUrl });
              toast.success('Imagen subida', { id: 'upload' });
            } catch (e) {
              console.error(e);
              toast.error('Error al subir el logo, puedes intentar de nuevo más tarde', { id: 'upload' });
            }
          }
          
          setIsSuccess(true);
          const storeSlug = finalData.basicInfo.slug || 'dashboard';
          setTimeout(() => {
            router.push('/' + storeSlug);
          }, 2000);
        } else if (!res.success) {
          const errorMsg = res.errors?._form?.[0] || 'Revisa los errores del formulario';
          toast.error(errorMsg);
        }
      } catch (err) {
        toast.error('Ocurrió un error inesperado');
      } finally {
        setIsUploadingLogo(false);
      }
    });
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center space-y-6"
        >
          <div className="rounded-full bg-emerald-100 p-6">
            <CheckCircle2 className="h-20 w-20 text-emerald-600" />
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">¡Todo listo!</h2>
          <p className="text-slate-500 text-lg max-w-sm">
            Tu tienda ha sido configurada con éxito. Redirigiendo a tu panel de control...
          </p>
        </motion.div>
      </div>
    );
  }

  const renderSlide = (index: number) => {
    switch (index) {
      case 0:
        return (
          <InterstitialSlide
            icon={Rocket} iconColor="text-indigo-600" bgColor="bg-indigo-100"
            title="¡Lanza tu Tienda!"
            description="Vamos a configurar tu catálogo en unos simples pasos. Será rápido, fluido y sin complicaciones."
          />
        );
      case 1:
        return (
          <FormSlide title="Tu negocio" description="Dinos el nombre y el rubro principal de tu tienda.">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Nombre de la tienda</label>
                <Input
                  {...register('basicInfo.name')}
                  placeholder="Ej. Mi Tienda Increíble"
                  className="h-14 text-lg rounded-2xl px-4 border-slate-200 bg-white"
                  onChange={(e) => {
                    register('basicInfo.name').onChange(e);
                    if (!form.getFieldState('basicInfo.slug').isDirty && !watch('basicInfo.slug')) {
                      setValue('basicInfo.slug', createSlug(e.target.value), { shouldValidate: true });
                    }
                  }}
                />
                {errors.basicInfo?.name && <p className="text-sm text-red-500 ml-1">{errors.basicInfo.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Categoría</label>
                <select
                  {...register('basicInfo.storeType')}
                  className="flex h-14 w-full text-lg rounded-2xl border border-slate-200 bg-white px-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  {STORE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.basicInfo?.storeType && <p className="text-sm text-red-500 ml-1">{errors.basicInfo.storeType.message}</p>}
              </div>
            </div>
          </FormSlide>
        );
      case 2:
        return (
          <FormSlide title="¿De qué trata?" description="Escribe una breve descripción. Esto lo verán tus clientes al ingresar a tu catálogo.">
            <div className="space-y-2">
              <Textarea
                {...register('basicInfo.description')}
                placeholder="Cuenta un poco sobre lo que vendes..."
                className="min-h-[160px] text-lg resize-none rounded-2xl p-4 border-slate-200 bg-white"
              />
              {errors.basicInfo?.description && <p className="text-sm text-red-500 ml-1">{errors.basicInfo.description.message}</p>}
            </div>
          </FormSlide>
        );
      case 3:
        return (
          <FormSlide title="Contacto y Enlace" description="Indica dónde te contactarán tus clientes y cómo será el link a tu tienda.">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">WhatsApp de ventas</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    {...register('basicInfo.whatsapp')}
                    placeholder="+54 9 11 1234-5678"
                    className="h-14 text-lg rounded-2xl pl-12 border-slate-200 bg-white"
                  />
                </div>
                {errors.basicInfo?.whatsapp && <p className="text-sm text-red-500 ml-1">{errors.basicInfo.whatsapp.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">URL de tu tienda</label>
                <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 h-14 focus-within:ring-2 focus-within:ring-indigo-600 transition-all">
                  <span className="text-slate-400 font-medium whitespace-nowrap">tutienda.com/</span>
                  <input
                    {...register('basicInfo.slug')}
                    className="flex h-full w-full bg-transparent text-lg font-medium text-slate-900 outline-none placeholder:text-slate-300 ml-1"
                    placeholder="mi-tienda"
                  />
                </div>
                {errors.basicInfo?.slug && <p className="text-sm text-red-500 ml-1">{errors.basicInfo.slug.message}</p>}
              </div>
            </div>
          </FormSlide>
        );
      case 4:
        return (
          <InterstitialSlide
            icon={Palette} iconColor="text-pink-600" bgColor="bg-pink-100"
            title="Dale tu estilo"
            description="¡Excelente! Tu tienda ya tiene identidad. Ahora vamos a darle un toque de color y personalidad."
          />
        );
      case 5:
        return (
          <FormSlide title="Paleta de colores" description="Elige el color principal que represente mejor a tu marca.">
            <div className="grid grid-cols-2 gap-4">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = watchedPrimaryColor === preset.primary;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setValue('design.primaryColor', preset.primary);
                      setValue('design.secondaryColor', preset.secondary);
                      setValue('design.accentColor', preset.accent);
                    }}
                    className={cn(
                      "relative flex flex-col items-center gap-3 rounded-3xl border-2 p-5 transition-all",
                      isSelected ? "border-indigo-600 bg-indigo-50 shadow-md" : "border-slate-100 bg-white hover:border-slate-200"
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
      case 6:
        return (
          <FormSlide title="Logo de tu tienda" description="Sube tu logo para que tus clientes te reconozcan rápidamente. (Opcional)">
            <div className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-200 rounded-[2rem] gap-6">
              <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-xl bg-slate-50">
                {(logoPreview || watch('design.logoUrl')) ? (
                  <img src={logoPreview || watch('design.logoUrl') || ''} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-12 w-12 text-slate-300" />
                )}
              </div>
              <div className="text-center w-full relative">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingLogo}
                  onChange={(e) => handleUploadLogo(e.target.files?.[0] || null)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                />
                <Button type="button" variant="outline" className="h-14 px-6 rounded-2xl font-bold w-full border-slate-200" disabled={isUploadingLogo}>
                  {isUploadingLogo ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ImagePlus className="mr-2 h-5 w-5" />}
                  {isUploadingLogo ? 'Guardando...' : ((logoPreview || watch('design.logoUrl')) ? 'Cambiar imagen' : 'Elegir imagen')}
                </Button>
                <p className="mt-4 text-sm text-slate-500">Recomendado: formato cuadrado, máximo 2MB.</p>
              </div>
            </div>
          </FormSlide>
        );
      case 7:
        return (
          <InterstitialSlide
            icon={PackagePlus} iconColor="text-emerald-600" bgColor="bg-emerald-100"
            title="Tu primer producto"
            description="Casi listos. ¿Qué tal si subimos tu primer producto para que la tienda no esté vacía?"
          />
        );
      case 8:
        return (
          <FormSlide title="Añade un producto" description="Agrega el nombre y precio. Puedes saltar este paso dejándolo vacío.">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Nombre del producto</label>
                <Input
                  {...register('product.name')}
                  placeholder="Ej. Hamburguesa Doble"
                  className="h-14 text-lg rounded-2xl px-4 border-slate-200 bg-white"
                />
                {errors.product?.name && <p className="text-sm text-red-500 ml-1">{errors.product.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Precio</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-medium">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    {...register('product.price', { valueAsNumber: true })}
                    placeholder="0.00"
                    className="h-14 text-lg rounded-2xl pl-8 border-slate-200 bg-white"
                  />
                </div>
                {errors.product?.price && <p className="text-sm text-red-500 ml-1">{errors.product.price.message}</p>}
              </div>
            </div>
          </FormSlide>
        );
      case 9:
        return (
          <InterstitialSlide
            icon={Store} iconColor="text-blue-600" bgColor="bg-blue-100"
            title="¡Todo listo!"
            description="Tu configuración está completa. Estás a un clic de lanzar tu tienda al mundo."
          />
        );
    }
  };

  return (
    <div className="flex fixed inset-0 w-full flex-col bg-slate-50 overflow-hidden">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 h-1.5 bg-slate-200 w-full z-50">
        <motion.div
          className="h-full bg-indigo-600 rounded-r-full"
          initial={{ width: 0 }}
          animate={{ width: `${(page / (SLIDES_COUNT - 1)) * 100}%` }}
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
          Paso {page + 1} de {SLIDES_COUNT}
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
            transition={{ duration: 0.3, ease: "easeInOut" }}
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
            disabled={isPending || isUploadingLogo}
            className={cn(
              "h-16 w-full rounded-[1.25rem] text-xl font-bold shadow-lg transition-all active:scale-[0.98]",
              page === SLIDES_COUNT - 1 
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
            )}
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Creando tienda...</>
            ) : page === SLIDES_COUNT - 1 ? (
              <><Rocket className="mr-2 h-6 w-6" /> Crear mi tienda</>
            ) : (
              <>
                {page === 0 ? 'Empezar ahora' : 'Continuar'}
                <ArrowRight className="ml-2 h-6 w-6" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
