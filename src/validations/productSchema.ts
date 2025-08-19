import { z } from "zod";

const spanishErrorMessages = {
  required_error: "Este campo es obligatorio.",
  invalid_type_error: "Este campo es obligatorio.",
  string: {
    min: "Debe contener al menos {minimum} caracteres.",
    max: "Debe contener como máximo {maximum} caracteres.",
    category: "Debe seleccionar una categoria existente o agregar una nueva",
  },
  number: {
    min: "El valor debe ser al menos {minimum}.",
  },
  array: {
    min: "Debe contener al menos {minimum} elementos.",
  },
};

export const productSchema = z.object({
  name: z
    .string({
      required_error: spanishErrorMessages.required_error,
      invalid_type_error: spanishErrorMessages.invalid_type_error,
    })
    .min(2, {
      message: spanishErrorMessages.string.min.replace("{minimum}", "2"),
    })
    .max(40, {
      message: spanishErrorMessages.string.max.replace("{maximum}", "40"),
    }),
  description: z
    .string({
      required_error: spanishErrorMessages.required_error,
      invalid_type_error: spanishErrorMessages.invalid_type_error,
    })
    .min(2, {
      message: spanishErrorMessages.string.min.replace("{minimum}", "2"),
    })
    .max(100, {
      message: spanishErrorMessages.string.max.replace("{maximum}", "100"),
    }),
  price: z
    .number({
      required_error: spanishErrorMessages.required_error,
      invalid_type_error: spanishErrorMessages.invalid_type_error,
    })
    .min(0, {
      message: spanishErrorMessages.number.min.replace("{minimum}", "0"),
    }),
  image: z.any({
    required_error: spanishErrorMessages.required_error,
    invalid_type_error: spanishErrorMessages.invalid_type_error,
  }),
  category: z
    .string({
      required_error: spanishErrorMessages.required_error,
      invalid_type_error: spanishErrorMessages.invalid_type_error,
    })
    .min(2, {
      message: spanishErrorMessages.string.category,
    })
    .max(40, {
      message: spanishErrorMessages.string.max.replace("{maximum}", "40"),
    }),
  available: z.boolean({
    required_error: spanishErrorMessages.required_error,
    invalid_type_error: spanishErrorMessages.invalid_type_error,
  }),
  topics: z.array(
    z.object({
      id: z
        .string({
          required_error: spanishErrorMessages.required_error,
          invalid_type_error: spanishErrorMessages.invalid_type_error,
        })
        .min(2, {
          message: spanishErrorMessages.string.min.replace("{minimum}", "2"),
        })
        .max(255, {
          message: spanishErrorMessages.string.max.replace("{maximum}", "255"),
        }),
      name: z
        .string({
          required_error: spanishErrorMessages.required_error,
          invalid_type_error: spanishErrorMessages.invalid_type_error,
        })
        .min(2, {
          message: spanishErrorMessages.string.min.replace("{minimum}", "2"),
        })
        .max(30, {
          message: spanishErrorMessages.string.max.replace("{maximum}", "30"),
        }),
      price: z
        .number({
          required_error: spanishErrorMessages.required_error,
          invalid_type_error: spanishErrorMessages.invalid_type_error,
        })
        .min(0, {
          message: spanishErrorMessages.number.min.replace("{minimum}", "0"),
        }),
    })
  ),
});

export const profileSchema = z.object({
  // Basic Info fields
  name: z
    .string({
      required_error: spanishErrorMessages.required_error,
      invalid_type_error: spanishErrorMessages.invalid_type_error,
    })
    .min(2, {
      message: spanishErrorMessages.string.min.replace("{minimum}", "2"),
    })
    .max(40, {
      message: spanishErrorMessages.string.max.replace("{maximum}", "40"),
    }),
  description: z
    .string({
      required_error: spanishErrorMessages.required_error,
      invalid_type_error: spanishErrorMessages.invalid_type_error,
    })
    .min(2, {
      message: spanishErrorMessages.string.min.replace("{minimum}", "2"),
    })
    .max(150, {
      message: spanishErrorMessages.string.max.replace("{maximum}", "150"),
    }),
  slug: z
    .string({
      required_error: spanishErrorMessages.required_error,
      invalid_type_error: spanishErrorMessages.invalid_type_error,
    })
    .min(2, {
      message: spanishErrorMessages.string.min.replace("{minimum}", "2"),
    })
    .max(20, {
      message: spanishErrorMessages.string.max.replace("{maximum}", "20"),
    }),
  type: z.string().optional(),
  
  // Contact Info fields
  whatsapp: z
    .string({
      required_error: spanishErrorMessages.required_error,
      invalid_type_error: spanishErrorMessages.invalid_type_error,
    })
    .min(2, {
      message: spanishErrorMessages.string.min.replace("{minimum}", "2"),
    })
    .max(15, {
      message: spanishErrorMessages.string.max.replace("{maximum}", "15"),
    }),
  website: z.string().optional(),
  
  // Address fields
  street: z
    .string({
      required_error: spanishErrorMessages.required_error,
      invalid_type_error: spanishErrorMessages.invalid_type_error,
    })
    .min(2, {
      message: spanishErrorMessages.string.min.replace("{minimum}", "2"),
    })
    .max(60, {
      message: spanishErrorMessages.string.max.replace("{maximum}", "60"),
    }),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  mapsLink: z.string().optional(),
  
  // Schedule fields
  monday: z.string().optional(),
  tuesday: z.string().optional(),
  wednesday: z.string().optional(),
  thursday: z.string().optional(),
  friday: z.string().optional(),
  saturday: z.string().optional(),
  sunday: z.string().optional(),
  
  // Social Links fields
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  youtube: z.string().optional(),
  tiktok: z.string().optional(),
  linkedin: z.string().optional(),
});
