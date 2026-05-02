import { useState, useEffect, useCallback } from "react";

const TDEE_BASE = 2300;
const PROT_GOAL = 145;
const HEIGHT_CM = 186;

function fmtDate(dateStr) {
  const [y, mo, dy] = dateStr.split("-").map(Number);
  const d = new Date(y, mo - 1, dy);
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

function dayAge(dateStr) {
  const [y, mo, dy] = dateStr.split("-").map(Number);
  return Math.floor((Date.now() - new Date(y, mo - 1, dy).getTime()) / 86400000);
}

const GYM_ACTIVITIES = [
  { id: "", label: "— Sin actividad —", cals: 0 },
  { id: "walk_60", label: "Caminar 60 min", cals: 180 },
  { id: "weights_45", label: "Pesas 45 min", cals: 220 },
  { id: "weights_60", label: "Pesas 60 min", cals: 300 },
  { id: "weights_75", label: "Pesas 75 min", cals: 350 },
  { id: "weights_90", label: "Pesas 90 min", cals: 420 },
  { id: "cycling_45", label: "Bici estática 45 min", cals: 350 },
  { id: "cardio_30", label: "Cardio 30 min", cals: 250 },
  { id: "cardio_45", label: "Cardio 45 min", cals: 370 },
  { id: "cardio_60", label: "Cardio 60 min", cals: 490 },
  { id: "hiit_30", label: "HIIT 30 min", cals: 400 },
  { id: "swim_45", label: "Natación 45 min", cals: 380 },
  { id: "weights_pasos_11k", label: "Pesas 60 min + 11k pasos", cals: 680 },
  { id: "pasos_9700_flexiones", label: "9,700 pasos + 75 flexiones", cals: 345 },
  { id: "weights_pasos_9500", label: "Pesas 60 min + 9,524 pasos", cals: 614 },
  { id: "pasos_9062", label: "9,062 pasos", cals: 299 },
  { id: "weights90_pasos_11k", label: "Pesas 90 min + 11,290 pasos", cals: 792 },
  { id: "pasos_9300", label: "9,300 pasos", cals: 307 },
  { id: "weights_pasos_15k", label: "Pesas 60 min + 15,015 pasos", cals: 795 },
  { id: "pasos_4681", label: "4,681 pasos", cals: 154 },
  { id: "weights_pasos_5900", label: "Pesas 60 min + 5,900 pasos", cals: 495 },
  { id: "pasos_9233", label: "9,233 pasos", cals: 305 },
  { id: "weights75_pasos_11k", label: "Pesas 75 min + 11,227 pasos", cals: 720 },
];
const GYM_MAP = Object.fromEntries(GYM_ACTIVITIES.map(function(a) { return [a.id, a.cals]; }));

const GYM_STEPS = {
  "weights_pasos_11k": 11000,
  "pasos_9700_flexiones": 9700,
  "weights_pasos_9500": 9524,
  "pasos_9062": 9062,
  "weights90_pasos_11k": 11290,
  "pasos_9300": 9300,
  "weights_pasos_15k": 15015,
  "pasos_4681": 4681,
  "weights_pasos_5900": 5900,
  "pasos_9233": 9233,
  "weights75_pasos_11k": 11227,
};

const INITIAL_WEIGHTS = [
  { date: "2026-04-26", kg: 82.15, note: "Tarde, ref. inicio semana 1" },
];

const SEED_DAYS = [
  {
    date: "2026-04-16", label: "jue, 16 abr", gym: "weights_60",
    meals: [
      { id: 1, name: "Medio bocata omelette + jamón serrano", cals: 380, protein: 22, carbs: 32, fat: 17, time: "13:00", note: "~100g pan, 2 huevos, 40g jamón" },
      { id: 2, name: "Coca-Cola Light", cals: 2, protein: 0, carbs: 0.1, fat: 0, time: "13:00", note: "330ml" },
      { id: 3, name: "Big Mac", cals: 563, protein: 26, carbs: 43, fat: 33, time: "19:30", note: "Datos oficiales McDonald's" },
      { id: 4, name: "Patatas medianas McDonald's", cals: 337, protein: 4, carbs: 44, fat: 16, time: "19:30", note: "~115g" },
      { id: 5, name: "Coca-Cola Zero", cals: 1, protein: 0, carbs: 0.1, fat: 0, time: "19:30", note: "330ml" },
      { id: 6, name: "Bowl muesli + blueberries + yogurt griego", cals: 390, protein: 18, carbs: 52, fat: 8, time: "22:00", note: "60g muesli, 150g yogurt 0%, 80g blueberries" },
    ],
  },
  {
    date: "2026-04-20", label: "lun, 20 abr", gym: "weights_pasos_11k",
    meals: [
      { id: 101, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "08:00", note: "Sin azúcar" },
      { id: 102, name: "Jugo de naranja (~150ml) + creatina 5g", cals: 55, protein: 1, carbs: 13, fat: 0, time: "08:30", note: "Medio vaso" },
      { id: 103, name: "Medio bocata jamón serrano", cals: 310, protein: 20, carbs: 28, fat: 12, time: "10:00", note: "~100g pan, 40g jamón" },
      { id: 104, name: "Mandarina", cals: 45, protein: 1, carbs: 11, fat: 0, time: "12:00", note: "~100g" },
      { id: 105, name: "Bowl tierra burrito (arroz, frijoles, verduras, pollo)", cals: 520, protein: 35, carbs: 62, fat: 10, time: "14:00", note: "Ración generosa ~400g" },
      { id: 106, name: "Coca-Cola Light", cals: 2, protein: 0, carbs: 0.1, fat: 0, time: "14:00", note: "330ml" },
      { id: 107, name: "Manzana", cals: 80, protein: 0, carbs: 21, fat: 0, time: "17:00", note: "~150g" },
      { id: 108, name: "Barrita Kind Protein", cals: 250, protein: 12, carbs: 25, fat: 12, time: "18:30", note: "Kind Protein" },
      { id: 109, name: "Bowl yogurt griego + granola + blueberries", cals: 390, protein: 18, carbs: 52, fat: 8, time: "21:00", note: "150g yogurt, 60g granola, 80g blueberries" },
    ],
  },
  {
    date: "2026-04-21", label: "mar, 21 abr", gym: "pasos_9700_flexiones",
    meals: [
      { id: 201, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "08:00", note: "Sin azúcar" },
      { id: 202, name: "Bowl yogurt griego + granola", cals: 350, protein: 16, carbs: 48, fat: 8, time: "08:30", note: "150g yogurt, 60g granola" },
      { id: 203, name: "Jugo de naranja (~150ml) + creatina 5g", cals: 55, protein: 1, carbs: 13, fat: 0, time: "09:30", note: "Medio vaso" },
      { id: 204, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "11:00", note: "Sin azúcar" },
      { id: 205, name: "Mandarina", cals: 45, protein: 1, carbs: 11, fat: 0, time: "12:00", note: "~100g" },
      { id: 206, name: "Bocata de atún, lechuga y tomate", cals: 420, protein: 28, carbs: 38, fat: 12, time: "14:00", note: "~180g pan, ~80g atún en agua" },
      { id: 207, name: "Coca-Cola Zero", cals: 1, protein: 0, carbs: 0, fat: 0, time: "14:00", note: "330ml" },
      { id: 208, name: "6 crackers Salmas + garbanzos + aguacate + pepinillos", cals: 310, protein: 9, carbs: 32, fat: 16, time: "19:00", note: "30g crackers, 50g garbanzos, ½ aguacate" },
    ],
  },
  {
    date: "2026-04-22", label: "mié, 22 abr", gym: "weights_pasos_9500",
    meals: [
      { id: 301, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "08:00", note: "Sin azúcar" },
      { id: 302, name: "Bowl yogurt griego + granola + blueberries + creatina 5g", cals: 390, protein: 18, carbs: 52, fat: 8, time: "08:30", note: "150g yogurt, 60g granola, blueberries" },
      { id: 303, name: "Bowl Tierra burrito (arroz, frijoles, pimientos, pollo, maíz)", cals: 520, protein: 35, carbs: 62, fat: 10, time: "14:00", note: "Ración generosa ~400g, salsa picante" },
      { id: 304, name: "Coca-Cola Zero", cals: 1, protein: 0, carbs: 0, fat: 0, time: "14:00", note: "330ml" },
      { id: 305, name: "Café americano doble", cals: 10, protein: 0, carbs: 1, fat: 0, time: "16:00", note: "Sin azúcar" },
      { id: 306, name: "Pera", cals: 70, protein: 0, carbs: 18, fat: 0, time: "17:00", note: "~150g" },
      { id: 307, name: "Kiwi", cals: 50, protein: 1, carbs: 12, fat: 0, time: "17:30", note: "~100g" },
      { id: 308, name: "Barrita Kind Protein", cals: 250, protein: 12, carbs: 25, fat: 12, time: "19:00", note: "Kind Protein" },
      { id: 309, name: "Media pizza casera (base Mercadona, tomate, mozzarella, atún, aceitunas, piparra)", cals: 480, protein: 28, carbs: 42, fat: 20, time: "21:00", note: "Base healthy ~300g total" },
      { id: 310, name: "Cerveza Moritz original", cals: 145, protein: 1, carbs: 13, fat: 0, time: "21:30", note: "330ml lata" },
    ],
  },
  {
    date: "2026-04-23", label: "jue, 23 abr", gym: "pasos_9062",
    meals: [
      { id: 401, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "08:00", note: "Sin azúcar" },
      { id: 402, name: "Bowl yogurt griego + blueberries", cals: 200, protein: 16, carbs: 22, fat: 4, time: "08:30", note: "150g yogurt 0%, sin granola" },
      { id: 403, name: "Jugo naranja (~120ml) + creatina 5g", cals: 45, protein: 1, carbs: 11, fat: 0, time: "09:00", note: "Media taza" },
      { id: 404, name: "Plátano", cals: 90, protein: 1, carbs: 23, fat: 0, time: "11:00", note: "~100g" },
      { id: 405, name: "Medio baguette jamón serrano", cals: 310, protein: 20, carbs: 28, fat: 12, time: "13:00", note: "~100g pan, 40g jamón" },
      { id: 406, name: "Cupcake pequeño", cals: 180, protein: 2, carbs: 24, fat: 9, time: "14:00", note: "~60g" },
      { id: 407, name: "Coca-Cola Light", cals: 2, protein: 0, carbs: 0, fat: 0, time: "14:00", note: "330ml" },
      { id: 408, name: "Cerveza pinta IPA", cals: 250, protein: 2, carbs: 20, fat: 0, time: "18:00", note: "~500ml" },
      { id: 409, name: "Cena Superauto — ⅓ ensalada + bravas + tostada pescado + schnitzel", cals: 520, protein: 22, carbs: 38, fat: 28, time: "21:00", note: "Porción ~⅓ de todo compartido" },
      { id: 410, name: "Copa vino blanco", cals: 120, protein: 0, carbs: 4, fat: 0, time: "21:30", note: "~150ml" },
      { id: 411, name: "Lata cerveza IPA", cals: 180, protein: 1, carbs: 14, fat: 0, time: "22:00", note: "330ml" },
      { id: 412, name: "Cerveza sin gluten", cals: 130, protein: 1, carbs: 12, fat: 0, time: "22:30", note: "330ml" },
    ],
  },
  {
    date: "2026-04-24", label: "vie, 24 abr", gym: "weights90_pasos_11k",
    meals: [
      { id: 501, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "08:00", note: "Sin azúcar" },
      { id: 502, name: "Flauta tortilla de huevo y patatas con tomate", cals: 420, protein: 14, carbs: 48, fat: 18, time: "09:30", note: "Flauta mediana" },
      { id: 503, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "11:00", note: "Sin azúcar" },
      { id: 504, name: "Manzana", cals: 80, protein: 0, carbs: 21, fat: 0, time: "12:30", note: "~150g" },
      { id: 505, name: "4 rebanadas pizza Papa John's", cals: 760, protein: 32, carbs: 88, fat: 28, time: "14:00", note: "Est. pizza mediana ~4 rebanadas" },
      { id: 506, name: "Galleta Born Winner Double Chocolate (75g)", cals: 270, protein: 23, carbs: 22, fat: 9, time: "17:00", note: "23g proteína por cookie" },
      { id: 507, name: "Pink Fit Protein Shake — Nude", cals: 220, protein: 18, carbs: 24, fat: 6, time: "18:00", note: "Frambuesa, coco, proteína vegana" },
      { id: 508, name: "Ramen Nongshim Shin Kimchi", cals: 500, protein: 10, carbs: 72, fat: 18, time: "21:00", note: "Paquete completo" },
      { id: 509, name: "Huevo entero", cals: 70, protein: 6, carbs: 0, fat: 5, time: "21:00", note: "Añadido al ramen" },
      { id: 510, name: "Mayonesa (~1 cucharada)", cals: 90, protein: 0, carbs: 0, fat: 10, time: "21:00", note: "Toque al ramen" },
      { id: 511, name: "Aceite picante + setas + cebolla china", cals: 45, protein: 1, carbs: 3, fat: 3, time: "21:00", note: "Toppings ramen" },
    ],
  },
  {
    date: "2026-04-25", label: "sáb, 25 abr", gym: "pasos_9300",
    meals: [
      { id: 601, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "08:30", note: "Sin azúcar" },
      { id: 602, name: "Flauta jamón serrano", cals: 310, protein: 20, carbs: 28, fat: 12, time: "09:30", note: "~100g pan, 40g jamón" },
      { id: 603, name: "Matcha latte de avena", cals: 120, protein: 3, carbs: 18, fat: 4, time: "10:00", note: "~250ml leche avena" },
      { id: 604, name: "Picnic playa ⅓ (gildas, patatas, fuet + ⅓ botella vino blanco)", cals: 390, protein: 7, carbs: 20, fat: 22, time: "13:00", note: "Sin pan, compartido entre 3" },
      { id: 605, name: "5 cervezas Estrella Galicia 25cl", cals: 375, protein: 2, carbs: 32, fat: 0, time: "13:30", note: "~75 kcal cada una" },
      { id: 606, name: "Cena compartida ⅓ (gambas coco + pad thai + ceviche + fideuá + ⅓ vino)", cals: 620, protein: 24, carbs: 62, fat: 24, time: "21:00", note: "Porción ~⅓ de todo compartido" },
      { id: 607, name: "Medio plato arroz + atún + tomate + sardina", cals: 320, protein: 22, carbs: 38, fat: 8, time: "23:00", note: "Cena tardía en casa" },
    ],
  },
  {
    date: "2026-04-26", label: "dom, 26 abr", gym: "weights_pasos_15k",
    meals: [
      { id: 701, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "08:00", note: "Sin azúcar" },
      { id: 702, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "10:00", note: "Sin azúcar" },
      { id: 703, name: "Tortilla vaga (3 huevos + salmón 50g + piparras + setas) + wrap espelta integral", cals: 430, protein: 37, carbs: 31, fat: 18, time: "11:30", note: "Alta proteína, baja caloría" },
      { id: 704, name: "Yogurt griego Oikos sin azúcar", cals: 90, protein: 10, carbs: 4, fat: 4, time: "13:00", note: "~125g" },
      { id: 705, name: "Creatina 5g en agua", cals: 0, protein: 0, carbs: 0, fat: 0, time: "13:00", note: "Sin calorías" },
      { id: 706, name: "Barrita Kind Protein", cals: 250, protein: 12, carbs: 25, fat: 12, time: "16:00", note: "Kind Protein" },
      { id: 707, name: "Coca-Cola Zero", cals: 1, protein: 0, carbs: 0, fat: 0, time: "16:00", note: "330ml" },
      { id: 708, name: "Bocata focaccia de atún con tomate (Buenas Migas)", cals: 480, protein: 26, carbs: 52, fat: 16, time: "19:00", note: "Focaccia mediana, atún generoso" },
      { id: 709, name: "Picoteo ½ (patatillas + mejillones escabeche + piparras + pepinillos + salsas)", cals: 280, protein: 8, carbs: 22, fat: 16, time: "21:00", note: "Compartido entre dos" },
      { id: 710, name: "Lata Moritz", cals: 145, protein: 1, carbs: 13, fat: 0, time: "21:30", note: "330ml" },
    ],
  },
  {
    date: "2026-04-27", label: "lun, 27 abr", gym: "pasos_4681",
    meals: [
      { id: 801, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "08:00", note: "Sin azúcar" },
      { id: 802, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "10:00", note: "Sin azúcar" },
      { id: 803, name: "Yogurt griego Oikos sin azúcar", cals: 90, protein: 10, carbs: 4, fat: 4, time: "09:00", note: "~125g" },
      { id: 804, name: "Naranja", cals: 60, protein: 1, carbs: 15, fat: 0, time: "11:00", note: "~150g" },
      { id: 805, name: "Veggie plate Honest Greens", cals: 580, protein: 18, carbs: 72, fat: 22, time: "14:00", note: "½ ensalada verde + ½ granos + boniato tahini + arroz marroquí + tofu" },
      { id: 806, name: "Matcha protein ball Honest Greens", cals: 120, protein: 6, carbs: 14, fat: 5, time: "14:30", note: "~40g aprox" },
      { id: 807, name: "Coca-Cola Light", cals: 2, protein: 0, carbs: 0, fat: 0, time: "14:30", note: "330ml" },
      { id: 808, name: "Plato grande orzo + albóndigas de pollo", cals: 620, protein: 38, carbs: 72, fat: 18, time: "21:00", note: "~350g orzo cocido + ~150g albóndigas pollo" },
    ],
  },
  {
    date: "2026-04-28", label: "mar, 28 abr", gym: "weights_pasos_5900",
    meals: [
      { id: 901, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "08:00", note: "Sin azúcar" },
      { id: 902, name: "Yogurt griego Oikos sin azúcar", cals: 90, protein: 10, carbs: 4, fat: 4, time: "08:30", note: "~125g" },
      { id: 903, name: "Plátano", cals: 90, protein: 1, carbs: 23, fat: 0, time: "09:00", note: "~100g" },
      { id: 904, name: "Coca-Cola Light", cals: 2, protein: 0, carbs: 0, fat: 0, time: "10:00", note: "330ml" },
      { id: 905, name: "Plato grande orzo + albóndigas de pollo", cals: 620, protein: 38, carbs: 72, fat: 18, time: "14:00", note: "~350g orzo cocido + ~150g albóndigas pollo" },
      { id: 906, name: "Manzana", cals: 80, protein: 0, carbs: 21, fat: 0, time: "17:00", note: "~150g" },
      { id: 907, name: "Coca-Cola Light", cals: 2, protein: 0, carbs: 0, fat: 0, time: "17:00", note: "330ml" },
      { id: 908, name: "Galleta Born Winner Double Chocolate (75g)", cals: 270, protein: 23, carbs: 22, fat: 9, time: "19:00", note: "23g proteína por cookie" },
      { id: 909, name: "Sardinas en aceite oliva + cebolla china + piparra + feta + mostaza + mayo", cals: 340, protein: 22, carbs: 4, fat: 26, time: "21:00", note: "~1 lata 90g + toppings" },
      { id: 910, name: "6 crackers Salmas", cals: 110, protein: 2, carbs: 18, fat: 3, time: "21:00", note: "~30g" },
      { id: 911, name: "Yogurt Alpro 150g + arándanos + muesli", cals: 280, protein: 6, carbs: 42, fat: 8, time: "22:00", note: "Vegetal, menos proteína que Oikos" },
    ],
  },
  {
    date: "2026-04-29", label: "mié, 29 abr", gym: "pasos_9233",
    meals: [
      { id: 1001, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "08:00", note: "Sin azúcar" },
      { id: 1002, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "10:00", note: "Sin azúcar" },
      { id: 1003, name: "Honest Greens Breakfast Burrito (tofu scramble, aguacate, kale, frijoles)", cals: 520, protein: 18, carbs: 58, fat: 22, time: "09:30", note: "Plant-based, high protein" },
      { id: 1004, name: "Bowl Tierra burrito (arroz integral, frijoles, pollo, crema ácida)", cals: 540, protein: 36, carbs: 64, fat: 12, time: "14:00", note: "Arroz integral, ración generosa" },
      { id: 1005, name: "Manzana", cals: 80, protein: 0, carbs: 21, fat: 0, time: "17:00", note: "~150g" },
      { id: 1006, name: "Coca-Cola Light", cals: 2, protein: 0, carbs: 0, fat: 0, time: "17:00", note: "330ml" },
      { id: 1007, name: "Shake HSN EvoWhey 2.0 (1 scoop 30g + 250ml agua)", cals: 115, protein: 23, carbs: 3, fat: 2, time: "18:00", note: "Primera toma EvoWhey" },
      { id: 1008, name: "Gyro halloumi + media ración patatas fritas", cals: 620, protein: 22, carbs: 48, fat: 36, time: "21:00", note: "Halloumi frito, media ración patatas" },
      { id: 1009, name: "Coca-Cola Zero", cals: 1, protein: 0, carbs: 0, fat: 0, time: "21:00", note: "330ml" },
    ],
  },
  {
    date: "2026-04-30", label: "jue, 30 abr", gym: "weights75_pasos_11k",
    meals: [
      { id: 1101, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "08:00", note: "Sin azúcar" },
      { id: 1102, name: "Café americano (solo)", cals: 5, protein: 0, carbs: 1, fat: 0, time: "10:00", note: "Sin azúcar" },
      { id: 1103, name: "Bocata flauta completo jamón serrano", cals: 520, protein: 32, carbs: 48, fat: 18, time: "09:30", note: "Flauta entera ~200g pan, 60g jamón" },
      { id: 1104, name: "Manzana", cals: 80, protein: 0, carbs: 21, fat: 0, time: "12:00", note: "~150g" },
      { id: 1105, name: "Comida china (albóndigas pollo + huevo cocido + vegetales + tofu + salsa picante)", cals: 480, protein: 38, carbs: 22, fat: 24, time: "14:00", note: "Plato combinado, alta proteína" },
      { id: 1106, name: "Shake HSN EvoWhey 2.0 (1 scoop 30g + agua)", cals: 115, protein: 23, carbs: 3, fat: 2, time: "17:00", note: "EvoWhey con agua" },
      { id: 1107, name: "Cena india ½ (butter chicken + chana masala + paneer kofta + arroz + garlic naan)", cals: 780, protein: 34, carbs: 72, fat: 32, time: "21:00", note: "Mitad de cena para dos, curry + naan" },
    ],
  },
];

function dayTotals(day) {
  var cals = day.meals.reduce(function(s, m) { return s + m.cals; }, 0);
  var protein = day.meals.reduce(function(s, m) { return s + (m.protein || 0); }, 0);
  var carbs = day.meals.reduce(function(s, m) { return s + (m.carbs || 0); }, 0);
  var fat = day.meals.reduce(function(s, m) { return s + (m.fat || 0); }, 0);
  var burn = (day.oura && day.oura.active_calories) ? day.oura.active_calories : (GYM_MAP[day.gym] || 0);
  var steps = (day.oura && day.oura.steps) ? day.oura.steps : (GYM_STEPS[day.gym] || null);
  return { cals: cals, protein: protein, carbs: carbs, fat: fat, burn: burn, steps: steps, balance: cals - burn - TDEE_BASE };
}

function bmi(kg) { return (kg / ((HEIGHT_CM / 100) * (HEIGHT_CM / 100))).toFixed(1); }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#080b0f;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:#1e2530;border-radius:2px;}
  input,select{font-family:'JetBrains Mono',monospace;}
  .inp{background:#0e1318;border:1px solid #1a2230;color:#d4dde8;padding:9px 12px;border-radius:6px;font-size:12px;outline:none;transition:border .2s;width:100%;}
  .inp:focus{border-color:#38bdf8;}
  .inp::placeholder{color:#445566;}
  .btn{background:#38bdf8;color:#080b0f;border:none;padding:9px 18px;border-radius:6px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;letter-spacing:.06em;transition:all .2s;}
  .btn:hover{background:#7dd3fc;}
  .btn-g{background:none;border:1px solid #1a2230;color:#6688aa;padding:8px 14px;border-radius:6px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.06em;transition:all .2s;}
  .btn-g:hover,.btn-g.on{border-color:#38bdf8;color:#38bdf8;}
  .btn-del{background:none;border:none;color:#445566;cursor:pointer;font-size:18px;line-height:1;padding:2px 5px;transition:color .2s;flex-shrink:0;}
  .btn-del:hover{color:#f87171;}
  .tab{background:none;border:none;cursor:pointer;padding:9px 10px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;transition:all .2s;border-bottom:2px solid transparent;}
  .tab.on{color:#38bdf8;border-bottom-color:#38bdf8;}
  .tab:not(.on){color:#445566;}
  .tab:hover:not(.on){color:#7799aa;}
  .card{background:#0c1117;border:1px solid #131c26;border-radius:10px;padding:18px 20px;}
  .mrow{display:flex;align-items:flex-start;gap:10px;padding:12px 0;border-bottom:1px solid #0e1520;transition:background .15s;}
  .mrow:hover{background:rgba(56,189,248,.03);}
  .badge{display:inline-block;padding:2px 7px;border-radius:3px;font-size:9px;letter-spacing:.07em;font-weight:500;}
  .day-pill{border-radius:8px;padding:10px 12px;cursor:pointer;border:1px solid #131c26;transition:all .2s;background:#0c1117;flex-shrink:0;}
  .day-pill:hover{border-color:#38bdf8;}
  .day-pill.active{border-color:#38bdf8;background:#0e1a26;}
  .bar{height:6px;border-radius:3px;background:#0e1520;overflow:hidden;margin-top:4px;}
  .bar-fill{height:100%;border-radius:3px;transition:width .5s;}
  @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  .fi{animation:fi .25s ease forwards;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .saving{animation:pulse .9s infinite;font-size:9px;color:#38bdf8;margin-top:2px;}
  .sync-btn{background:#0e1a26;border:1px solid #38bdf8;color:#38bdf8;border-radius:6px;padding:6px 12px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:10px;flex-shrink:0;margin-left:10px;}
  .sync-btn:disabled{opacity:.5;}
`;

export default function App() {
  const [history, setHistory] = useState(null);
  const [weights, setWeights] = useState(null);
  const [activeDate, setActiveDate] = useState(null);
  const [tab, setTab] = useState("log");
  const [showAdd, setShowAdd] = useState(false);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [form, setForm] = useState({ name: "", cals: "", prot: "", carbs: "", fat: "", time: "13:00", note: "" });
  const [weightForm, setWeightForm] = useState({ date: "", kg: "" });
  const [saving, setSaving] = useState(false);
  const [histTab, setHistTab] = useState("days");
  const [ouraLoading, setOuraLoading] = useState(false);
  const [ouraError, setOuraError] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiItems, setAiItems] = useState([]);
  const [aiError, setAiError] = useState(null);

  useEffect(function() {
    function initWithData(stored) {
      if (!stored.weights) stored.weights = [];
      var changed = false;
      SEED_DAYS.forEach(function(seed) {
        if (!stored.days.find(function(d) { return d.date === seed.date; })) {
          stored.days.push(seed);
          changed = true;
        }
      });
      INITIAL_WEIGHTS.forEach(function(wt) {
        if (!stored.weights.find(function(w) { return w.date === wt.date; })) {
          stored.weights.push(wt);
          changed = true;
        }
      });
      // Auto-generate days from last seed to today
      var today = new Date();
      var yy = today.getFullYear();
      var mm = today.getMonth() + 1;
      var dd = today.getDate();
      var todayStr = yy + "-" + (mm < 10 ? "0" + mm : mm) + "-" + (dd < 10 ? "0" + dd : dd);
      var lastSeed = SEED_DAYS[SEED_DAYS.length - 1].date;
      var cursor = new Date(lastSeed);
      cursor.setDate(cursor.getDate() + 1);
      var existingDates = stored.days.map(function(d) { return d.date; });
      while (true) {
        var cy = cursor.getFullYear();
        var cmo = cursor.getMonth() + 1;
        var cdd = cursor.getDate();
        var curStr = cy + "-" + (cmo < 10 ? "0" + cmo : cmo) + "-" + (cdd < 10 ? "0" + cdd : cdd);
        if (curStr > todayStr) break;
        if (existingDates.indexOf(curStr) === -1) {
          var lbl = cursor.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
          stored.days.push({ date: curStr, label: lbl, gym: "", meals: [] });
          existingDates.push(curStr);
          changed = true;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      stored.days.sort(function(a, b) { return a.date.localeCompare(b.date); });
      stored.weights.sort(function(a, b) { return a.date.localeCompare(b.date); });
      setHistory({ days: stored.days });
      setWeights(stored.weights);
      setActiveDate(stored.days[stored.days.length - 1].date);
      return { stored: stored, changed: changed };
    }

    fetch("/api/db")
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.days && data.days.length > 0) {
          var result = initWithData({ days: data.days, weights: data.weights || [] });
          if (result.changed) {
            fetch("/api/db", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ days: result.stored.days, weights: result.stored.weights })
            }).catch(function() {});
          }
        } else {
          var result2 = initWithData({ days: [], weights: [] });
          fetch("/api/db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ days: result2.stored.days, weights: result2.stored.weights })
          }).catch(function() {});
        }
      })
      .catch(function(e) {
        initWithData({ days: [], weights: [] });
      });
  }, []);

  var save = useCallback(function(days, ws, changedDate) {
    setSaving(true);
    var payload = {};
    if (changedDate) {
      var changedDay = days.find(function(d) { return d.date === changedDate; });
      payload.days = changedDay ? [changedDay] : [];
    } else {
      payload.days = days;
    }
    payload.weights = ws;
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(function() {});
    setTimeout(function() { setSaving(false); }, 700);
  }, []);

  function update(newDays, newWeights) {
    var w = newWeights !== undefined ? newWeights : weights;
    setHistory({ days: newDays });
    if (newWeights !== undefined) setWeights(newWeights);
    save(newDays, w, activeDate);
  }

  function fetchOura(dateStr) {
    setOuraLoading(true);
    setOuraError(null);
    var parts = dateStr.split("-").map(Number);
    var nd = new Date(parts[0], parts[1] - 1, parts[2] + 1);
    var nm = nd.getMonth() + 1;
    var ndd = nd.getDate();
    var nextDay = nd.getFullYear() + "-" + (nm < 10 ? "0" + nm : nm) + "-" + (ndd < 10 ? "0" + ndd : ndd);
    fetch("/api/oura?start_date=" + dateStr + "&end_date=" + nextDay)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) { setOuraError(data.error); return; }
        if (!data.activity && !data.sleep && (!data.workouts || data.workouts.length === 0)) {
          setOuraError("Sin datos para esta fecha");
          return;
        }
        var ouraData = {
          steps: data.activity ? data.activity.steps : null,
          active_calories: data.activity ? data.activity.active_calories : null,
          total_calories: data.activity ? data.activity.total_calories : null,
          sleep_score: data.sleep ? data.sleep.score : null,
          workouts: data.workouts || [],
          fetched_at: new Date().toISOString(),
        };
        var newDays = history.days.map(function(d2) { return d2.date === dateStr ? Object.assign({}, d2, { oura: ouraData }) : d2; });
        update(newDays);
      })
      .catch(function(e) { setOuraError("Error: " + e.message); })
      .finally(function() { setOuraLoading(false); });
  }

  function estimateAI() {
    setAiLoading(true);
    setAiError(null);
    setAiItems([]);
    fetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: aiText })
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) { setAiError("Error: " + data.error); return; }
        if (!data.items || !Array.isArray(data.items)) { setAiError("Respuesta inesperada, intenta de nuevo"); return; }
        setAiItems(data.items);
      })
      .catch(function(e) { setAiError("Error de conexión: " + e.message); })
      .finally(function() { setAiLoading(false); });
  }

  function confirmAI() {
    var newMeals = aiItems.map(function(item) {
      return Object.assign({ id: Date.now() + Math.random() }, item);
    });
    var newDays = history.days.map(function(d) {
      return d.date === activeDate ? Object.assign({}, d, { meals: d.meals.concat(newMeals) }) : d;
    });
    update(newDays);
    setAiItems([]);
    setAiText("");
    setShowAI(false);
  }

  if (!history || !weights) {
    return (
      <div style={{ background: "#080b0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{css}</style>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#445566" }}>Cargando...</span>
      </div>
    );
  }

  var day = history.days.find(function(d) { return d.date === activeDate; }) || history.days[history.days.length - 1];
  var t = dayTotals(day);
  var balColor = t.balance > 300 ? "#f87171" : t.balance < -300 ? "#34d399" : "#fbbf24";
  var protPct = Math.min(100, Math.round(t.protein / PROT_GOAL * 100));
  var protColor = protPct >= 80 ? "#34d399" : protPct >= 50 ? "#fbbf24" : "#f87171";
  var burnPct = Math.min(100, Math.round((t.burn / 800) * 100));
  var stepsPct = t.steps ? Math.min(100, Math.round((t.steps / 15000) * 100)) : 0;
  var stepsColor = t.steps ? (t.steps >= 8000 ? "#34d399" : t.steps <= 3000 ? "#f87171" : "#fbbf24") : "#445566";
  var lastWeight = weights[weights.length - 1];
  var firstWeight = weights[0] ? weights[0].kg : 82.15;
  var weightChange = weights.length > 1 ? (lastWeight.kg - firstWeight).toFixed(2) : null;
  var trend = history.days.map(function(d) { var tt = dayTotals(d); return Object.assign({}, tt, { date: d.date, label: d.label || fmtDate(d.date) }); });
  var totalCals = trend.reduce(function(s, d) { return s + d.cals; }, 0);
  var totalBalance = trend.reduce(function(s, d) { return s + d.balance; }, 0);
  var avgCals = Math.round(totalCals / trend.length);
  var avgBalance = Math.round(totalBalance / trend.length);
  var canSync = dayAge(day.date) <= 30;

  function removeItem(id) {
    var newDays = history.days.map(function(d) { return d.date === activeDate ? Object.assign({}, d, { meals: d.meals.filter(function(m) { return m.id !== id; }) }) : d; });
    update(newDays);
  }
  function addItem() {
    if (!form.name.trim() || !form.cals) return;
    var item = { id: Date.now(), name: form.name, cals: parseFloat(form.cals) || 0, protein: parseFloat(form.prot) || 0, carbs: parseFloat(form.carbs) || 0, fat: parseFloat(form.fat) || 0, time: form.time, note: form.note || "Manual" };
    var newDays = history.days.map(function(d) { return d.date === activeDate ? Object.assign({}, d, { meals: d.meals.concat([item]) }) : d; });
    update(newDays);
    setForm({ name: "", cals: "", prot: "", carbs: "", fat: "", time: "13:00", note: "" });
    setShowAdd(false);
  }
  function addWeight() {
    if (!weightForm.date || !weightForm.kg) return;
    var newW = weights.filter(function(w) { return w.date !== weightForm.date; }).concat([{ date: weightForm.date, kg: parseFloat(weightForm.kg), note: "Manual" }]);
    newW.sort(function(a, b) { return a.date.localeCompare(b.date); });
    setWeights(newW);
    save(history.days, newW);
    setWeightForm({ date: "", kg: "" });
    setShowAddWeight(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080b0f", fontFamily: "'JetBrains Mono',monospace", color: "#c8d8e8", paddingBottom: "calc(env(safe-area-inset-bottom) + 60px)" }}>
      <style>{css}</style>

      <div style={{ background: "#060910", borderBottom: "1px solid #0e1520", paddingTop: "calc(env(safe-area-inset-top) + 18px)", paddingLeft: "20px", paddingRight: "20px", paddingBottom: "0" }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 4 }}>PULSO JOURNAL</div>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-.02em", color: "#e8f4ff" }}>{day.label || fmtDate(day.date)}</h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: "#38bdf8", lineHeight: 1 }}>{Math.round(t.cals)}</div>
              <div style={{ fontSize: 9, color: "#6688aa", marginTop: 2 }}>kcal ingeridas</div>
              <button
                onClick={function() {
                  setSaving(true);
                  fetch("/api/db", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ days: [day], weights: weights })
                  })
                  .then(function() { setSaving(false); })
                  .catch(function() { setSaving(false); });
                }}
                style={{ marginTop: 6, background: saving ? "#0e1a26" : "#0e1a26", border: "1px solid " + (saving ? "#34d399" : "#1a2a3a"), color: saving ? "#34d399" : "#6688aa", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".06em" }}>
                {saving ? "✓ guardado" : "💾 guardar"}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ padding: "7px 12px", background: "#0a0f14", borderRadius: 7, border: "1px solid #0e1a20" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".1em", textTransform: "uppercase" }}>Proteína</span>
                <span style={{ fontSize: 10, color: protColor }}>{Math.round(t.protein)}g / {PROT_GOAL}g</span>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: protPct + "%", background: protColor }} /></div>
            </div>
            <div style={{ padding: "7px 12px", background: "#0a0f14", borderRadius: 7, border: "1px solid #0e1a20" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".1em", textTransform: "uppercase" }}>Quemado</span>
                <span style={{ fontSize: 10, color: t.burn > 0 ? "#34d399" : "#445566" }}>{t.burn > 0 ? t.burn + " kcal" : "sin actividad"}</span>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: burnPct + "%", background: "#34d399" }} /></div>
            </div>
            <div style={{ padding: "7px 12px", background: "#0a0f14", borderRadius: 7, border: "1px solid #0e1a20" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".1em", textTransform: "uppercase" }}>Pasos</span>
                <span style={{ fontSize: 10, color: stepsColor }}>{t.steps ? t.steps.toLocaleString("es-ES") : "—"}</span>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: stepsPct + "%", background: stepsColor }} /></div>
            </div>
          </div>

          <div style={{ display: "flex" }}>
            {["log", "balance", "peso", "historial"].map(function(k) {
              return (
                <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={function() { setTab(k); }}>
                  {k === "log" ? "Comidas" : k === "balance" ? "Balance" : k === "peso" ? "Peso" : "Historial"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "20px 20px" }}>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 20, scrollbarWidth: "none" }}>
          {history.days.slice().reverse().map(function(d) {
            var tt = dayTotals(d);
            return (
              <div key={d.date} className={"day-pill" + (d.date === activeDate ? " active" : "")} onClick={function() { setActiveDate(d.date); }} style={{ minWidth: 86 }}>
                <div style={{ fontSize: 8, color: "#6688aa", marginBottom: 3, whiteSpace: "nowrap" }}>{d.label || fmtDate(d.date)}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: d.date === activeDate ? "#38bdf8" : "#2a4a60" }}>{Math.round(tt.cals)}</div>
                <div style={{ fontSize: 7, color: "#445566", marginTop: 1 }}>kcal</div>
              </div>
            );
          })}
          <div className="day-pill" onClick={function() {
            var today = new Date();
            var yy = today.getFullYear();
            var mm = today.getMonth() + 1;
            var dd = today.getDate();
            var dateStr = yy + "-" + (mm < 10 ? "0" + mm : mm) + "-" + (dd < 10 ? "0" + dd : dd);
            var label = today.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
            if (history.days.find(function(d) { return d.date === dateStr; })) {
              setActiveDate(dateStr);
              return;
            }
            var newDay = { date: dateStr, label: label, gym: "", meals: [] };
            var newDays = history.days.concat([newDay]);
            newDays.sort(function(a, b) { return a.date.localeCompare(b.date); });
            update(newDays);
            setActiveDate(dateStr);
          }} style={{ minWidth: 60, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #1a2230" }}>
            <div style={{ fontSize: 20, color: "#2a4a60", lineHeight: 1 }}>+</div>
          </div>
        </div>

        {tab === "log" && (
          <div className="fi">
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>Oura Ring</div>
                  {day.oura ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {day.oura.steps && <span style={{ fontSize: 10, color: "#34d399" }}>👟 {day.oura.steps.toLocaleString("es-ES")} pasos</span>}
                        {day.oura.active_calories && <span style={{ fontSize: 10, color: "#34d399" }}>🔥 {day.oura.active_calories} kcal</span>}
                        {day.oura.sleep_score && <span style={{ fontSize: 10, color: "#a78bfa" }}>😴 {day.oura.sleep_score} sueño</span>}
                      </div>
                      {day.oura.workouts && day.oura.workouts.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 2 }}>
                          {day.oura.workouts.map(function(w, i) {
                            var mins = w.duration ? Math.round(w.duration / 60) : null;
                            var hrs = mins ? Math.floor(mins / 60) : 0;
                            var rem = mins ? mins % 60 : 0;
                            var durStr = hrs > 0 ? hrs + "h " + rem + "min" : (rem + "min");
                            var activity = w.activity || w.sport || "Entrenamiento";
                            var actMap = { "strength_training": "Entrenamiento de fuerza", "running": "Carrera", "walking": "Caminar", "cycling": "Ciclismo", "swimming": "Natación", "yoga": "Yoga", "hiit": "HIIT", "elliptical": "Elíptica", "rowing": "Remo" };
                            var actLabel = actMap[activity] || activity;
                            return (
                              <div key={i} style={{ fontSize: 10, color: "#38bdf8" }}>
                                💪 {actLabel}{mins ? " · " + durStr : ""}{w.calories ? " · " + w.calories + " cal" : ""}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: "#6688aa" }}>Sin datos — toca Sync para obtener actividad, sueño y entrenamientos</div>
                  )}
                  {ouraError && <div style={{ fontSize: 9, color: "#f87171", marginTop: 3 }}>{ouraError}</div>}
                </div>
                {canSync && (
                  <button className="sync-btn" onClick={function() { fetchOura(day.date); }} disabled={ouraLoading}>
                    {ouraLoading ? "↻" : day.oura ? "↻ Sync" : "Sync"}
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 10, color: "#6688aa", letterSpacing: ".08em", textTransform: "uppercase" }}>{day.meals.length} alimentos</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-g" onClick={function() { setShowAI(!showAI); setShowAdd(false); }}>{showAI ? "✕" : "✨ IA"}</button>
                <button className="btn-g" onClick={function() { setShowAdd(!showAdd); setShowAI(false); }}>{showAdd ? "✕" : "+ Manual"}</button>
              </div>
            </div>

            {showAI && (
              <div className="fi card" style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 9 }}>
                <div style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".1em", textTransform: "uppercase" }}>Describe lo que comiste</div>
                <textarea
                  style={{ background: "#0e1318", border: "1px solid #1a2230", color: "#d4dde8", padding: "9px 12px", borderRadius: 6, fontSize: 12, outline: "none", width: "100%", minHeight: 80, resize: "vertical", fontFamily: "'JetBrains Mono',monospace", boxSizing: "border-box" }}
                  placeholder="Ej: café solo, bocata de jamón serrano, manzana y un yogurt griego..."
                  value={aiText}
                  onChange={function(e) { setAiText(e.target.value); }}
                />
                {aiError && <div style={{ fontSize: 9, color: "#f87171" }}>{aiError}</div>}
                {aiItems.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".1em", textTransform: "uppercase" }}>Estimación — confirma para guardar:</div>
                    {aiItems.map(function(item, idx) {
                      return (
                        <div key={idx} style={{ background: "#080b0f", borderRadius: 7, padding: "10px 12px", border: "1px solid #1a2230" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 12, color: "#c8dce8", fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>{item.name}</span>
                            <span style={{ fontSize: 14, color: "#38bdf8", fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>{item.cals} kcal</span>
                          </div>
                          <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                            <span className="badge" style={{ background: "#0e1a30", color: "#60a5fa" }}>P {item.protein}g</span>
                            <span className="badge" style={{ background: "#0a1a20", color: "#34d399" }}>C {item.carbs}g</span>
                            <span className="badge" style={{ background: "#1a1510", color: "#fbbf24" }}>G {item.fat}g</span>
                            <span style={{ fontSize: 9, color: "#6688aa", marginLeft: 4, alignSelf: "center" }}>{item.time}</span>
                          </div>
                        </div>
                      );
                    })}
                    <button className="btn" onClick={confirmAI}>Guardar todos</button>
                  </div>
                )}
                {aiItems.length === 0 && (
                  <button className="btn" disabled={aiLoading || !aiText.trim()} onClick={estimateAI} style={{ opacity: aiLoading ? 0.6 : 1 }}>
                    {aiLoading ? "Estimando..." : "Estimar con IA"}
                  </button>
                )}
              </div>
            )}

            {showAdd && (
              <div className="fi card" style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 9 }}>
                <input className="inp" placeholder="Alimento..." value={form.name} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { name: e.target.value }); }); }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="inp" placeholder="kcal *" type="number" value={form.cals} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { cals: e.target.value }); }); }} />
                  <input className="inp" type="time" value={form.time} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { time: e.target.value }); }); }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="inp" placeholder="Prot g" type="number" value={form.prot} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { prot: e.target.value }); }); }} />
                  <input className="inp" placeholder="Carbs g" type="number" value={form.carbs} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { carbs: e.target.value }); }); }} />
                  <input className="inp" placeholder="Grasas g" type="number" value={form.fat} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { fat: e.target.value }); }); }} />
                </div>
                <input className="inp" placeholder="Nota opcional..." value={form.note} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { note: e.target.value }); }); }} />
                <button className="btn" onClick={addItem}>Añadir al registro</button>
              </div>
            )}

            {day.meals.map(function(meal) {
              return (
                <div key={meal.id} className="mrow">
                  <button className="btn-del" onClick={function() { removeItem(meal.id); }}>×</button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, color: "#c8dce8", lineHeight: 1.3 }}>{meal.name}</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "#38bdf8", flexShrink: 0 }}>{Math.round(meal.cals)}</div>
                    </div>
                    <div style={{ fontSize: 9, color: "#6688aa", marginTop: 4 }}>{meal.time} · {meal.note}</div>
                    {(meal.protein > 0 || meal.carbs > 0 || meal.fat > 0) && (
                      <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                        <span className="badge" style={{ background: "#0e1a30", color: "#60a5fa" }}>P {Math.round(meal.protein)}g</span>
                        <span className="badge" style={{ background: "#0a1a20", color: "#34d399" }}>C {Math.round(meal.carbs)}g</span>
                        <span className="badge" style={{ background: "#1a1510", color: "#fbbf24" }}>G {Math.round(meal.fat)}g</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "balance" && (
          <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="card">
              <div style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 12 }}>Actividad del día</div>
              {day.oura ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {day.oura.workouts && day.oura.workouts.length > 0 && day.oura.workouts.map(function(w, i) {
                    var mins = w.duration ? Math.round(w.duration / 60) : null;
                    var hrs = mins ? Math.floor(mins / 60) : 0;
                    var rem = mins ? mins % 60 : 0;
                    var durStr = hrs > 0 ? hrs + "h " + rem + "min" : (rem + "min");
                    var actMap = { "strength_training": "Entrenamiento de fuerza", "running": "Carrera", "walking": "Caminar", "cycling": "Ciclismo", "swimming": "Natación", "yoga": "Yoga", "hiit": "HIIT", "elliptical": "Elíptica", "rowing": "Remo" };
                    var actLabel = actMap[w.activity || w.sport] || (w.activity || w.sport || "Entrenamiento");
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #0e1520" }}>
                        <span style={{ fontSize: 11, color: "#c8dce8" }}>💪 {actLabel}{mins ? " · " + durStr : ""}</span>
                        <span style={{ fontSize: 11, color: "#34d399", fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{w.calories ? w.calories + " cal" : ""}</span>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "#6688aa" }}>Total quemado</span>
                    <span style={{ fontSize: 14, color: "#34d399", fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>-{t.burn} kcal</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "#445566" }}>Sin datos de Oura — ve a Comidas y toca Sync</div>
              )}
            </div>

            <div className="card">
              <div style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 14 }}>Ecuación</div>
              {[["Ingerido", Math.round(t.cals), "#38bdf8", ""], ["Actividad (quemado)", t.burn, "#34d399", "-"], ["TDEE base", TDEE_BASE, "#445566", "-"]].map(function(row, i) {
                return (
                  <div key={row[0]} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 2 ? "1px solid #0e1520" : "none" }}>
                    <span style={{ fontSize: 11, color: "#6688aa" }}>{row[0]}</span>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: row[2] }}>{row[3]}{row[1]} kcal</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 8, background: "#080b0f", border: "1px solid " + balColor + "33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".1em", textTransform: "uppercase" }}>Balance neto</div>
                  <div style={{ fontSize: 10, color: balColor, marginTop: 3 }}>{t.balance > 300 ? "Superávit calórico" : t.balance < -300 ? "Déficit calórico" : "Cerca del mantenimiento"}</div>
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 30, fontWeight: 800, color: balColor }}>{t.balance > 0 ? "+" : ""}{Math.round(t.balance)}</div>
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 14 }}>Macros vs objetivos</div>
              {[["Proteína", Math.round(t.protein), 145, "#60a5fa"], ["Carbohidratos", Math.round(t.carbs), 250, "#34d399"], ["Grasas", Math.round(t.fat), 70, "#fbbf24"]].map(function(m) {
                return (
                  <div key={m[0]} style={{ marginBottom: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: "#7799aa" }}>{m[0]}</span>
                      <span style={{ fontSize: 11, color: m[3] }}>{m[1]}g / {m[2]}g</span>
                    </div>
                    <div style={{ background: "#0e1520", borderRadius: 3, height: 5, overflow: "hidden" }}>
                      <div style={{ width: Math.min(100, m[1] / m[2] * 100) + "%", background: m[3], height: "100%", borderRadius: 3, transition: "width .5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card" style={{ background: "#0a0f1a", borderColor: "#131c30" }}>
              <div style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 14 }}>Resumen total registrado</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[["Días", trend.length + "", "#38bdf8"], ["Balance total", (totalBalance > 0 ? "+" : "") + Math.round(totalBalance) + " kcal", "#34d399"], ["Prom. diario", avgCals + " kcal", "#38bdf8"], ["Prom. balance", (avgBalance > 0 ? "+" : "") + avgBalance + " kcal", avgBalance < 0 ? "#34d399" : "#f87171"]].map(function(s) {
                  return (
                    <div key={s[0]} style={{ background: "#080b0f", borderRadius: 7, padding: "10px 12px" }}>
                      <div style={{ fontSize: 9, color: "#6688aa", marginBottom: 3 }}>{s[0]}</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: s[2] }}>{s[1]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "peso" && (
          <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="card">
              <div style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 14 }}>Perfil</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["Altura", HEIGHT_CM + " cm", "#38bdf8"], ["Peso actual", lastWeight ? lastWeight.kg + " kg" : "—", "#a78bfa"], ["IMC", lastWeight ? bmi(lastWeight.kg) : "—", "#34d399"]].map(function(s) {
                  return (
                    <div key={s[0]} style={{ background: "#0a0f14", borderRadius: 8, padding: "12px 10px", textAlign: "center" }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: s[2] }}>{s[1]}</div>
                      <div style={{ fontSize: 8, color: "#6688aa", marginTop: 3 }}>{s[0]}</div>
                    </div>
                  );
                })}
              </div>
              {weightChange !== null && weights.length > 1 && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 7, background: "#080b0f", border: "1px solid " + (parseFloat(weightChange) <= 0 ? "#34d39933" : "#f8717133") }}>
                  <span style={{ fontSize: 10, color: "#6688aa" }}>Cambio desde inicio: </span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: parseFloat(weightChange) <= 0 ? "#34d399" : "#f87171" }}>{parseFloat(weightChange) > 0 ? "+" : ""}{weightChange} kg</span>
                </div>
              )}
            </div>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".12em", textTransform: "uppercase" }}>Registro de peso</div>
                <button className="btn-g" style={{ fontSize: 10, padding: "6px 12px" }} onClick={function() { setShowAddWeight(!showAddWeight); }}>{showAddWeight ? "✕" : "+ Peso"}</button>
              </div>
              {showAddWeight && (
                <div className="fi" style={{ marginBottom: 14, display: "flex", gap: 8 }}>
                  <input className="inp" type="date" value={weightForm.date} onChange={function(e) { setWeightForm(function(f) { return Object.assign({}, f, { date: e.target.value }); }); }} />
                  <input className="inp" placeholder="kg" type="number" step="0.01" value={weightForm.kg} onChange={function(e) { setWeightForm(function(f) { return Object.assign({}, f, { kg: e.target.value }); }); }} style={{ width: 100 }} />
                  <button className="btn" style={{ whiteSpace: "nowrap", padding: "9px 14px" }} onClick={addWeight}>OK</button>
                </div>
              )}
              {weights.slice().reverse().map(function(w, i) {
                return (
                  <div key={w.date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < weights.length - 1 ? "1px solid #0e1520" : "none" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#7799aa" }}>{fmtDate(w.date)}</div>
                      <div style={{ fontSize: 9, color: "#6688aa", marginTop: 2 }}>{w.note}</div>
                    </div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: "#a78bfa" }}>{w.kg} <span style={{ fontSize: 10, color: "#6688aa" }}>kg</span></div>
                  </div>
                );
              })}
            </div>
            <div className="card" style={{ background: "#0a130e", borderColor: "#1a2e1e" }}>
              <div style={{ fontSize: 9, color: "#4a8060", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Objetivo</div>
              <div style={{ fontSize: 11, color: "#4a8060", lineHeight: 1.7 }}>Déficit de ~400-500 kcal/día &rarr; pérdida estimada de ~0.3-0.5 kg/semana.<br/>Pesaje semanal: <span style={{ color: "#34d399" }}>lunes por la mañana, en ayunas</span>.</div>
            </div>
          </div>
        )}

        {tab === "historial" && (
          <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <button className={"btn-g" + (histTab === "days" ? " on" : "")} onClick={function() { setHistTab("days"); }}>Días</button>
              <button className={"btn-g" + (histTab === "trend" ? " on" : "")} onClick={function() { setHistTab("trend"); }}>Tendencia</button>
            </div>

            {histTab === "days" && history.days.slice().reverse().map(function(d) {
              var tt = dayTotals(d);
              var bc = tt.balance > 300 ? "#f87171" : tt.balance < -300 ? "#34d399" : "#fbbf24";
              var pp = Math.min(100, Math.round(tt.protein / PROT_GOAL * 100));
              var pc = pp >= 80 ? "#34d399" : pp >= 50 ? "#fbbf24" : "#f87171";
              return (
                <div key={d.date} className="card" style={{ cursor: "pointer" }} onClick={function() { setActiveDate(d.date); setTab("log"); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: "#c8dce8", marginBottom: 3 }}>{d.label || fmtDate(d.date)}</div>
                      <div style={{ fontSize: 9, color: "#6688aa" }}>{d.meals.length} alimentos</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: "#38bdf8" }}>{Math.round(tt.cals)}</div>
                      <div style={{ fontSize: 9, color: bc, marginTop: 1 }}>{tt.balance > 0 ? "+" : ""}{Math.round(tt.balance)} bal</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span className="badge" style={{ background: "#0e1a30", color: "#60a5fa" }}>P {Math.round(tt.protein)}g</span>
                    <span className="badge" style={{ background: "#0a1a20", color: "#34d399" }}>C {Math.round(tt.carbs)}g</span>
                    <span className="badge" style={{ background: "#1a1510", color: "#fbbf24" }}>G {Math.round(tt.fat)}g</span>
                    {tt.burn > 0 && <span className="badge" style={{ background: "#0a1a14", color: "#4ade80" }}>- {tt.burn} kcal</span>}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 8, color: "#6688aa" }}>Proteína</span>
                      <span style={{ fontSize: 8, color: pc }}>{Math.round(tt.protein)}g / {PROT_GOAL}g</span>
                    </div>
                    <div className="bar"><div className="bar-fill" style={{ width: pp + "%", background: pc }} /></div>
                  </div>
                </div>
              );
            })}

            {histTab === "trend" && (
              <div className="card">
                <div style={{ fontSize: 9, color: "#6688aa", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>Calorías por día</div>
                <div style={{ fontSize: 8, color: "#445566", marginBottom: 12 }}>Scroll para ver todos los días →</div>
                <div style={{ overflowX: "auto", overflowY: "visible", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
                  {(function() {
                    var BAR_W = 44;
                    var GAP = 16;
                    var STEP = BAR_W + GAP;
                    var H = 100;
                    var n = trend.length;
                    var totalW = n * STEP + 20;
                    var visibleW = 7 * STEP;
                    var trendMaxCals = Math.max.apply(null, trend.map(function(d) { return d.cals; }).concat([TDEE_BASE + 200]));

                    // Trend line points (linear regression)
                    var validDays = trend.filter(function(d) { return d.cals > 0; });
                    var trendPoints = "";
                    if (validDays.length >= 2) {
                      var sumX = 0; var sumY = 0; var sumXY = 0; var sumX2 = 0; var vn = validDays.length;
                      validDays.forEach(function(d, i) { sumX += i; sumY += d.cals; sumXY += i * d.cals; sumX2 += i * i; });
                      var slope = (vn * sumXY - sumX * sumY) / (vn * sumX2 - sumX * sumX);
                      var intercept = (sumY - slope * sumX) / vn;
                      var firstIdx = trend.indexOf(validDays[0]);
                      var lastIdx = trend.indexOf(validDays[validDays.length - 1]);
                      var x0 = firstIdx * STEP + BAR_W / 2 + 10;
                      var y0 = H - (intercept / trendMaxCals) * H;
                      var x1 = lastIdx * STEP + BAR_W / 2 + 10;
                      var y1 = H - ((intercept + slope * (validDays.length - 1)) / trendMaxCals) * H;
                      trendPoints = x0 + "," + y0 + " " + x1 + "," + y1;
                    }

                    return (
                      <svg width={Math.max(totalW, visibleW)} height="130" viewBox={"0 0 " + Math.max(totalW, visibleW) + " 130"} style={{ display: "block", minWidth: totalW }}>
                        <line x1="0" y1={H - (TDEE_BASE / trendMaxCals) * H} x2={totalW} y2={H - (TDEE_BASE / trendMaxCals) * H} stroke="#2a3848" strokeWidth="1" strokeDasharray="4 3" />
                        <text x={totalW - 4} y={H - (TDEE_BASE / trendMaxCals) * H - 3} fontSize="7" fill="#445566" fontFamily="JetBrains Mono" textAnchor="end">TDEE</text>
                        {trend.map(function(d, i) {
                          var barH = d.cals > 0 ? Math.max(4, (d.cals / trendMaxCals) * H) : 0;
                          var x = i * STEP + 10;
                          var bc2 = d.balance > 300 ? "#f87171" : d.balance < -300 ? "#34d399" : "#38bdf8";
                          return (
                            <g key={d.date}>
                              {barH > 0 && <rect x={x} y={H - barH} width={BAR_W} height={barH} rx={3} fill={bc2} opacity={d.date === activeDate ? 1 : 0.45} />}
                              <text x={x + BAR_W / 2} y={118} textAnchor="middle" fontSize="6" fill="#445566" fontFamily="JetBrains Mono">{(d.label || "").slice(0, 7)}</text>
                              {barH > 0 && <text x={x + BAR_W / 2} y={H - barH - 4} textAnchor="middle" fontSize="7" fill={bc2} fontFamily="JetBrains Mono">{Math.round(d.cals)}</text>}
                            </g>
                          );
                        })}
                        {trendPoints && <polyline points={trendPoints} fill="none" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" opacity="0.8" />}
                      </svg>
                    );
                  })()}
                </div>
                <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6688aa" }}>
                  <span>Promedio: <span style={{ color: "#38bdf8" }}>{avgCals} kcal</span></span>
                  <span>Balance medio: <span style={{ color: "#34d399" }}>{avgBalance} kcal</span></span>
                </div>
              </div>
            )}

            <div style={{ textAlign: "center", fontSize: 9, color: "#445566", paddingTop: 4 }}>{history.days.length} días registrados</div>
          </div>
        )}

      </div>
    </div>
  );
}
