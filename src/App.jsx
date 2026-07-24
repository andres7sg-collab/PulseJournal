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

// ---------- Objetivos para el semáforo del calendario ----------
const PROT_MIN = 130;      // g — objetivo mínimo diario (meta de junio)
const STEPS_GOAL = 8000;   // pasos — meta diaria
const BURN_GOOD = 400;     // kcal activas que cuentan como día de ejercicio
const SCORE_C = { good: "#4ADE80", mid: "#F2B23E", bad: "#FB7185", none: "#39404d" };
const SCORE_BG = { good: "rgba(74,222,128,.17)", mid: "rgba(242,178,62,.15)", bad: "rgba(251,113,133,.16)", none: "rgba(120,132,150,.07)" };

function dayScores(d) {
  if (!d) return { food: "none", ex: "none", hasData: false };
  var tt = dayTotals(d);
  var food = "none";
  if (d.meals.length > 0) {
    if (tt.balance > 300) food = "bad";
    else if (tt.balance <= 0 && tt.protein >= PROT_MIN) food = "good";
    else food = "mid";
  }
  var hasEx = (tt.steps !== null && tt.steps !== undefined && tt.steps > 0) || tt.burn > 0;
  var ex = "none";
  if (hasEx) {
    var st = tt.steps || 0;
    if (st >= STEPS_GOAL || tt.burn >= BURN_GOOD) ex = "good";
    else if (st < 4000 && tt.burn < 150) ex = "bad";
    else ex = "mid";
  }
  return { food: food, ex: ex, t: tt, hasData: food !== "none" || ex !== "none" };
}

function todayStr() {
  var t = new Date();
  var mm = t.getMonth() + 1;
  var dd = t.getDate();
  return t.getFullYear() + "-" + (mm < 10 ? "0" + mm : mm) + "-" + (dd < 10 ? "0" + dd : dd);
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');
  :root{
    --bg:#0B0D11; --surf:#13171F; --raised:#1A1F2A; --line:#222937; --line-soft:#1A202B;
    --hi:#EEF2F7; --mid:#98A3B6; --low:#5B6675;
    --acc:#2DD4BF; --acc-soft:rgba(45,212,191,.13);
    --good:#4ADE80; --warn:#F2B23E; --bad:#FB7185;
    --prot:#7AA7FF; --carb:#4ADE80; --fat:#F2B23E; --burn:#34D399; --sleep:#A78BFA;
  }
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
  body{background:var(--bg);}
  ::-webkit-scrollbar{width:3px;height:3px;}
  ::-webkit-scrollbar-thumb{background:#222937;border-radius:2px;}
  input,select,textarea{font-family:'Manrope',sans-serif;}
  .num{font-family:'Sora',sans-serif;font-variant-numeric:tabular-nums;}
  .hero{font-family:'Fraunces',Georgia,serif;font-variant-numeric:tabular-nums lining-nums;font-weight:700;letter-spacing:-.02em;}
  .eyebrow{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--low);}
  .inp{background:var(--raised);border:1px solid var(--line);color:var(--hi);padding:10px 12px;border-radius:10px;font-size:13px;outline:none;transition:border .2s;width:100%;}
  .inp:focus{border-color:var(--acc);}
  .inp::placeholder{color:var(--low);}
  .btn{background:var(--acc);color:#06231F;border:none;padding:11px 18px;border-radius:10px;cursor:pointer;font-family:'Manrope',sans-serif;font-size:13px;font-weight:700;transition:filter .2s;}
  .btn:hover{filter:brightness(1.1);}
  .btn:disabled{opacity:.55;}
  .btn-g{background:var(--raised);border:1px solid var(--line);color:var(--mid);padding:9px 14px;border-radius:10px;cursor:pointer;font-family:'Manrope',sans-serif;font-size:12px;font-weight:600;transition:all .2s;}
  .btn-g:hover,.btn-g.on{border-color:var(--acc);color:var(--acc);background:var(--acc-soft);}
  .btn-del{background:none;border:none;color:var(--low);cursor:pointer;font-size:18px;line-height:1;padding:2px 6px;transition:color .2s;flex-shrink:0;}
  .btn-del:hover{color:var(--bad);}
  .card{background:var(--surf);border:1px solid var(--line-soft);border-radius:16px;padding:18px;}
  .mrow{display:flex;align-items:flex-start;gap:10px;padding:13px 0;border-bottom:1px solid var(--line-soft);}
  .mrow:last-child{border-bottom:none;}
  .badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;font-family:'Manrope',sans-serif;}
  .day-pill{border-radius:12px;padding:8px 6px;cursor:pointer;border:1px solid var(--line-soft);transition:all .2s;background:var(--surf);flex-shrink:0;width:54px;text-align:center;}
  .day-pill.active{border-color:var(--acc);background:var(--acc-soft);}
  .bar{height:5px;border-radius:3px;background:var(--raised);overflow:hidden;}
  .bar-fill{height:100%;border-radius:3px;transition:width .5s;}
  @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  .fi{animation:fi .25s ease forwards;}
  @media (prefers-reduced-motion: reduce){.fi{animation:none;}.bar-fill{transition:none;}}
  .sync-btn{background:var(--acc-soft);border:1px solid var(--acc);color:var(--acc);border-radius:10px;padding:7px 13px;cursor:pointer;font-family:'Manrope',sans-serif;font-size:12px;font-weight:600;flex-shrink:0;margin-left:10px;}
  .sync-btn:disabled{opacity:.5;}
  .navbtn{flex:1;background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 0 4px;color:var(--low);transition:color .2s;}
  .navbtn.on{color:var(--acc);}
  .navbtn span{font-family:'Manrope',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.02em;}
  .cal-cell{position:relative;aspect-ratio:1;border-radius:10px;border:1px solid var(--line-soft);cursor:pointer;display:flex;align-items:flex-start;justify-content:flex-start;padding:5px;transition:transform .12s;}
  .cal-cell:active{transform:scale(.94);}
  .cal-cell.off{cursor:default;opacity:.35;}
  .cal-cell.today{outline:2px solid var(--acc);outline-offset:-1px;}
  .cal-cell.sel{border-color:var(--hi);}
  .dotrow{position:absolute;bottom:5px;left:0;right:0;display:flex;justify-content:center;gap:4px;}
  .sdot{width:6px;height:6px;border-radius:50%;}
`;

function Icon(props) {
  var p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (props.name === "hoy") return (<svg width="21" height="21" viewBox="0 0 24 24" {...p}><path d="M4 6h16M4 12h16M4 18h10"/></svg>);
  if (props.name === "cal") return (<svg width="21" height="21" viewBox="0 0 24 24" {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5"/></svg>);
  if (props.name === "bal") return (<svg width="21" height="21" viewBox="0 0 24 24" {...p}><path d="M7 4v16M7 4l-3 4M7 4l3 4M17 20V4M17 20l-3-4M17 20l3-4"/></svg>);
  if (props.name === "peso") return (<svg width="21" height="21" viewBox="0 0 24 24" {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 9.5a4.5 4.5 0 0 1 7 0M12 12l2.2-2.6"/></svg>);
  return (<svg width="21" height="21" viewBox="0 0 24 24" {...p}><path d="M4 19V11M9.5 19V5M15 19v-8M20.5 19V8"/></svg>);
}

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
  const [histTab, setHistTab] = useState("30");
  const [ouraLoading, setOuraLoading] = useState(false);
  const [ouraError, setOuraError] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiItems, setAiItems] = useState([]);
  const [aiError, setAiError] = useState(null);
  const [calCursor, setCalCursor] = useState(function() {
    var t = new Date();
    return { y: t.getFullYear(), m: t.getMonth() };
  });

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
      var tStr = todayStr();
      var lastSeed = SEED_DAYS[SEED_DAYS.length - 1].date;
      var cursor = new Date(lastSeed);
      cursor.setDate(cursor.getDate() + 1);
      var existingDates = stored.days.map(function(d) { return d.date; });
      while (true) {
        var cy = cursor.getFullYear();
        var cmo = cursor.getMonth() + 1;
        var cdd = cursor.getDate();
        var curStr = cy + "-" + (cmo < 10 ? "0" + cmo : cmo) + "-" + (cdd < 10 ? "0" + cdd : cdd);
        if (curStr > tStr) break;
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
          workouts: (data.workouts || []).map(function(w) {
            return Object.assign({}, w, {
              activity: (w.activity || w.sport || "other").toLowerCase(),
              calories: w.calories ? Math.round(w.calories) : null,
              duration: w.duration ? Math.round(w.duration) : null
            });
          }),
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
      <div style={{ background: "#0B0D11", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{css}</style>
        <span className="eyebrow">Cargando...</span>
      </div>
    );
  }

  var day = history.days.find(function(d) { return d.date === activeDate; }) || history.days[history.days.length - 1];
  var t = dayTotals(day);
  var balColor = t.balance > 300 ? "var(--bad)" : t.balance < -300 ? "var(--good)" : "var(--warn)";
  var protPct = Math.min(100, Math.round(t.protein / PROT_GOAL * 100));
  var protColor = protPct >= 80 ? "var(--good)" : protPct >= 50 ? "var(--warn)" : "var(--bad)";
  var stepsPct = t.steps ? Math.min(100, Math.round((t.steps / 15000) * 100)) : 0;
  var stepsColor = t.steps ? (t.steps >= STEPS_GOAL ? "var(--good)" : t.steps <= 3000 ? "var(--bad)" : "var(--warn)") : "var(--low)";
  var protLeft = PROT_GOAL - t.protein;
  var protHint = protLeft <= 0 ? "Meta cumplida" : protLeft <= 12 ? "Casi está" : protLeft <= 30 ? "1 batido lo cierra" : protLeft <= 55 ? "2 batidos lo cierran" : "Aún queda camino";
  var sleepScore = day.oura && day.oura.sleep_score ? day.oura.sleep_score : null;
  var sleepPct = sleepScore ? Math.min(100, sleepScore) : 0;
  var sleepColor = !sleepScore ? "var(--low)" : sleepScore >= 80 ? "var(--good)" : sleepScore >= 65 ? "var(--warn)" : "var(--bad)";
  var isToday = day.date === todayStr();
  var nowH = new Date().getHours() + new Date().getMinutes() / 60;
  var paceTarget;
  if (!isToday) paceTarget = 1;
  else if (nowH < 11) paceTarget = (nowH - 7) / 4 * 0.30;
  else if (nowH < 16) paceTarget = 0.30 + (nowH - 11) / 5 * 0.35;
  else if (nowH < 22) paceTarget = 0.65 + (nowH - 16) / 6 * 0.35;
  else paceTarget = 1;
  paceTarget = Math.max(0, Math.min(1, paceTarget));
  var paceExpected = Math.round(PROT_GOAL * paceTarget);
  var paceDelta = Math.round(t.protein) - paceExpected;
  var pacePct = paceExpected > 0 ? Math.min(100, Math.round(t.protein / paceExpected * 100)) : (t.protein > 0 ? 100 : 0);
  var paceColor = paceDelta >= 0 ? "var(--good)" : paceDelta >= -20 ? "var(--warn)" : "var(--bad)";
  var paceLabel = !isToday ? (t.protein >= PROT_GOAL ? "Meta cumplida" : Math.round(PROT_GOAL - t.protein) + "g por debajo") : (paceDelta >= 0 ? "+" + paceDelta + "g vs ritmo" : paceDelta + "g vs ritmo");
  var lastWeight = weights[weights.length - 1];
  var firstWeight = weights[0] ? weights[0].kg : 82.15;
  var weightChange = weights.length > 1 ? (lastWeight.kg - firstWeight).toFixed(2) : null;
  var trend = history.days.map(function(d) { var tt = dayTotals(d); return Object.assign({}, tt, { date: d.date, label: d.label || fmtDate(d.date) }); });
  var totalCals = trend.reduce(function(s, d) { return s + d.cals; }, 0);
  var totalBalance = trend.reduce(function(s, d) { return s + d.balance; }, 0);
  var avgCals = Math.round(totalCals / trend.length);
  var avgBalance = Math.round(totalBalance / trend.length);
  var canSync = dayAge(day.date) <= 30;
  var tStr = todayStr();

  var daysByDate = {};
  history.days.forEach(function(d) { daysByDate[d.date] = d; });

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
    if (!weightForm.kg) return;
    var dateToUse = weightForm.date || todayStr();
    var newEntry = { date: dateToUse, kg: parseFloat(weightForm.kg), note: "Manual" };
    var newW = weights.filter(function(w) { return w.date !== dateToUse; }).concat([newEntry]);
    newW.sort(function(a, b) { return a.date.localeCompare(b.date); });
    setWeights(newW);
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: [], weights: [newEntry] })
    }).catch(function() {});
    setWeightForm({ date: "", kg: "" });
    setShowAddWeight(false);
  }
  function goToday() {
    var dateStr = todayStr();
    if (daysByDate[dateStr]) { setActiveDate(dateStr); return; }
    var today = new Date();
    var label = today.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
    var newDay = { date: dateStr, label: label, gym: "", meals: [] };
    var newDays = history.days.concat([newDay]);
    newDays.sort(function(a, b) { return a.date.localeCompare(b.date); });
    update(newDays);
    setActiveDate(dateStr);
  }

  var dateStrip = (
    <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
      <div className="day-pill" onClick={goToday} style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--line)" }}>
        <div style={{ fontSize: 18, color: "var(--low)", lineHeight: 1 }}>+</div>
      </div>
      {history.days.slice().reverse().map(function(d) {
        var sc = dayScores(d);
        var dnum = d.date.slice(8);
        return (
          <div key={d.date} className={"day-pill" + (d.date === activeDate ? " active" : "")} onClick={function() { setActiveDate(d.date); }}>
            <div style={{ fontSize: 9, color: "var(--low)", textTransform: "uppercase" }}>{(d.label || fmtDate(d.date)).slice(0, 3)}</div>
            <div className="num" style={{ fontWeight: 700, fontSize: 16, color: d.date === activeDate ? "var(--acc)" : "var(--hi)", margin: "2px 0" }}>{parseInt(dnum, 10)}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 3 }}>
              <span className="sdot" style={{ background: SCORE_C[sc.food] }} />
              <span className="sdot" style={{ background: SCORE_C[sc.ex] }} />
            </div>
          </div>
        );
      })}
    </div>
  );

  // ----- Calendario -----
  var MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  var WD = ["L", "M", "X", "J", "V", "S", "D"];
  var calFirst = new Date(calCursor.y, calCursor.m, 1);
  var calOffset = (calFirst.getDay() + 6) % 7;
  var calDays = new Date(calCursor.y, calCursor.m + 1, 0).getDate();
  var calCells = [];
  var ci;
  for (ci = 0; ci < calOffset; ci++) calCells.push(null);
  for (ci = 1; ci <= calDays; ci++) calCells.push(ci);
  var monthStats = { foodGood: 0, exGood: 0, tracked: 0, balSum: 0, protDays: 0 };
  calCells.forEach(function(n) {
    if (!n) return;
    var ds = calCursor.y + "-" + (calCursor.m + 1 < 10 ? "0" + (calCursor.m + 1) : calCursor.m + 1) + "-" + (n < 10 ? "0" + n : n);
    var sc = dayScores(daysByDate[ds]);
    if (sc.hasData) {
      monthStats.tracked++;
      monthStats.balSum += sc.t.balance;
      if (sc.food === "good") monthStats.foodGood++;
      if (sc.ex === "good") monthStats.exGood++;
      if (sc.t.protein >= PROT_MIN) monthStats.protDays++;
    }
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'Manrope',sans-serif", color: "var(--hi)", paddingBottom: "calc(env(safe-area-inset-bottom) + 78px)" }}>
      <style>{css}</style>

      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(11,13,17,.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid var(--line-soft)", paddingTop: "calc(env(safe-area-inset-top) + 12px)", paddingBottom: 10 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--acc)", marginBottom: 2 }}>Pulso Journal</div>
            <div className="num" style={{ fontSize: 16, fontWeight: 700, textTransform: "capitalize" }}>{day.label || fmtDate(day.date)}</div>
          </div>
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
            className="btn-g" style={{ borderColor: saving ? "var(--good)" : "var(--line)", color: saving ? "var(--good)" : "var(--mid)", fontSize: 12, padding: "8px 14px" }}>
            {saving ? "✓ Guardado" : "Guardar"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 18px 0" }}>

        {tab === "log" && (
          <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {dateStrip}

            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "var(--raised)", borderRadius: 12, padding: "13px 14px" }}>
                  <div style={{ fontSize: 10, color: "var(--mid)", marginBottom: 5 }}>Faltan de proteína</div>
                  <div className="hero" style={{ fontSize: 38, lineHeight: 1, color: protLeft <= 0 ? "var(--good)" : protColor }}>
                    {protLeft <= 0 ? "0" : Math.round(protLeft)}<span style={{ fontSize: 18, color: "var(--low)" }}> g</span>
                  </div>
                  <div style={{ fontSize: 10, color: protLeft <= 0 ? "var(--good)" : "var(--low)", marginTop: 6, lineHeight: 1.3 }}>{protHint}</div>
                </div>
                <div style={{ background: "var(--raised)", borderRadius: 12, padding: "13px 14px" }}>
                  <div style={{ fontSize: 10, color: "var(--mid)", marginBottom: 5 }}>Balance neto</div>
                  <div className="hero" style={{ fontSize: 38, lineHeight: 1, color: balColor }}>
                    {t.balance > 0 ? "+" : "−"}{Math.abs(Math.round(t.balance))}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--low)", marginTop: 6, lineHeight: 1.3 }}>{Math.round(t.cals)} in · {t.burn} out</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["Ritmo de proteína", paceLabel, pacePct, paceColor],
                  ["Sueño", sleepScore ? sleepScore + " / 100" : "—", sleepPct, sleepColor],
                  ["Pasos", t.steps ? t.steps.toLocaleString("es-ES") : "—", stepsPct, stepsColor]].map(function(row) {
                  return (
                    <div key={row[0]}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--mid)" }}>{row[0]}</span>
                        <span className="num" style={{ fontSize: 11, color: row[3], fontWeight: 600 }}>{row[1]}</span>
                      </div>
                      <div className="bar"><div className="bar-fill" style={{ width: row[2] + "%", background: row[3] }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Oura Ring</div>
                  {day.oura ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {day.oura.steps && <span style={{ fontSize: 11.5, color: "var(--burn)" }}>👟 {day.oura.steps.toLocaleString("es-ES")} pasos</span>}
                        {day.oura.active_calories && <span style={{ fontSize: 11.5, color: "var(--burn)" }}>🔥 {day.oura.active_calories} kcal</span>}
                        {day.oura.sleep_score && <span style={{ fontSize: 11.5, color: "var(--sleep)" }}>😴 {day.oura.sleep_score} sueño</span>}
                      </div>
                      {day.oura.workouts && day.oura.workouts.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 2 }}>
                          {day.oura.workouts.map(function(w, i) {
                            var mins = w.duration ? Math.round(w.duration / 60) : null;
                            var hrs = mins ? Math.floor(mins / 60) : 0;
                            var rem = mins ? mins % 60 : 0;
                            var durStr = hrs > 0 ? hrs + "h " + rem + "min" : (rem + "min");
                            var actMap = { "strength_training": "Entrenamiento de fuerza", "running": "Carrera", "walking": "Caminar", "cycling": "Ciclismo", "swimming": "Natación", "yoga": "Yoga", "hiit": "HIIT", "elliptical": "Elíptica", "rowing": "Remo", "weight_training": "Entrenamiento de fuerza", "functional_training": "Entrenamiento funcional", "sport": "Deporte", "other": "Entrenamiento" };
                            var actKey = (w.activity || w.sport || "").toLowerCase();
                            var actLabel = actMap[actKey] || (w.activity || w.sport || "Entrenamiento");
                            var cal = w.calories ? Math.round(w.calories) : null;
                            return (
                              <div key={i} style={{ fontSize: 11, color: "var(--acc)" }}>
                                💪 {actLabel}{mins ? " · " + durStr : ""}{cal ? " · " + cal + " cal" : ""}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11.5, color: "var(--low)" }}>Sin datos — toca Sync para traer actividad, sueño y entrenamientos</div>
                  )}
                  {ouraError && <div style={{ fontSize: 10, color: "var(--bad)", marginTop: 4 }}>{ouraError}</div>}
                </div>
                {canSync && (
                  <button className="sync-btn" onClick={function() { fetchOura(day.date); }} disabled={ouraLoading}>
                    {ouraLoading ? "↻" : day.oura ? "↻ Sync" : "Sync"}
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="eyebrow">{day.meals.length} alimentos</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-g" onClick={function() { setShowAI(!showAI); setShowAdd(false); }}>{showAI ? "✕" : "✨ IA"}</button>
                <button className="btn-g" onClick={function() { setShowAdd(!showAdd); setShowAI(false); }}>{showAdd ? "✕" : "+ Manual"}</button>
              </div>
            </div>

            {showAI && (
              <div className="fi card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="eyebrow">Describe lo que comiste</div>
                <textarea
                  style={{ background: "var(--raised)", border: "1px solid var(--line)", color: "var(--hi)", padding: "10px 12px", borderRadius: 10, fontSize: 13, outline: "none", width: "100%", minHeight: 80, resize: "vertical", boxSizing: "border-box" }}
                  placeholder="Ej: café solo, bocata de jamón serrano, manzana y un yogurt griego..."
                  value={aiText}
                  onChange={function(e) { setAiText(e.target.value); }}
                />
                {aiError && <div style={{ fontSize: 10, color: "var(--bad)" }}>{aiError}</div>}
                {aiItems.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="eyebrow">Estimación — confirma para guardar:</div>
                    {aiItems.map(function(item, idx) {
                      return (
                        <div key={idx} style={{ background: "var(--raised)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--line)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</span>
                            <span className="num" style={{ fontSize: 14, color: "var(--acc)", fontWeight: 800, flexShrink: 0 }}>{item.cals} kcal</span>
                          </div>
                          <div style={{ display: "flex", gap: 5, marginTop: 6, alignItems: "center" }}>
                            <span className="badge" style={{ background: "rgba(122,167,255,.13)", color: "var(--prot)" }}>P {item.protein}g</span>
                            <span className="badge" style={{ background: "rgba(74,222,128,.12)", color: "var(--carb)" }}>C {item.carbs}g</span>
                            <span className="badge" style={{ background: "rgba(242,178,62,.12)", color: "var(--fat)" }}>G {item.fat}g</span>
                            <span style={{ fontSize: 10, color: "var(--low)", marginLeft: 4 }}>{item.time}</span>
                          </div>
                        </div>
                      );
                    })}
                    <button className="btn" onClick={confirmAI}>Guardar todos</button>
                  </div>
                )}
                {aiItems.length === 0 && (
                  <button className="btn" disabled={aiLoading || !aiText.trim()} onClick={estimateAI}>
                    {aiLoading ? "Estimando..." : "Estimar con IA"}
                  </button>
                )}
              </div>
            )}

            {showAdd && (
              <div className="fi card" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
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

            <div className="card" style={{ padding: "4px 18px" }}>
              {day.meals.length === 0 && (
                <div style={{ padding: "22px 0", textAlign: "center", fontSize: 12, color: "var(--low)" }}>Nada registrado aún — usa ✨ IA para describir lo que comiste</div>
              )}
              {day.meals.map(function(meal) {
                return (
                  <div key={meal.id} className="mrow">
                    <button className="btn-del" onClick={function() { removeItem(meal.id); }}>×</button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{meal.name}</div>
                        <div className="num" style={{ fontSize: 15, fontWeight: 800, color: "var(--acc)", flexShrink: 0 }}>{Math.round(meal.cals)}</div>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--low)", marginTop: 4 }}>{meal.time} · {meal.note}</div>
                      {(meal.protein > 0 || meal.carbs > 0 || meal.fat > 0) && (
                        <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                          <span className="badge" style={{ background: "rgba(122,167,255,.13)", color: "var(--prot)" }}>P {Math.round(meal.protein)}g</span>
                          <span className="badge" style={{ background: "rgba(74,222,128,.12)", color: "var(--carb)" }}>C {Math.round(meal.carbs)}g</span>
                          <span className="badge" style={{ background: "rgba(242,178,62,.12)", color: "var(--fat)" }}>G {Math.round(meal.fat)}g</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "calendario" && (
          <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <button className="btn-g" style={{ padding: "6px 13px" }} onClick={function() {
                  setCalCursor(function(c) { var m = c.m - 1; return m < 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: m }; });
                }}>‹</button>
                <div className="num" style={{ fontSize: 16, fontWeight: 700 }}>{MONTHS_ES[calCursor.m]} {calCursor.y}</div>
                <button className="btn-g" style={{ padding: "6px 13px" }} onClick={function() {
                  setCalCursor(function(c) { var m = c.m + 1; return m > 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: m }; });
                }}>›</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginBottom: 6 }}>
                {WD.map(function(w, i) {
                  return <div key={i} style={{ textAlign: "center", fontSize: 9.5, fontWeight: 700, color: "var(--low)" }}>{w}</div>;
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
                {calCells.map(function(n, i) {
                  if (!n) return <div key={"e" + i} />;
                  var ds = calCursor.y + "-" + (calCursor.m + 1 < 10 ? "0" + (calCursor.m + 1) : calCursor.m + 1) + "-" + (n < 10 ? "0" + n : n);
                  var d = daysByDate[ds];
                  var sc = dayScores(d);
                  var clickable = !!d;
                  var bgStyle = sc.hasData
                    ? "linear-gradient(135deg, " + SCORE_BG[sc.food] + " 0%, " + SCORE_BG[sc.food] + " 50%, " + SCORE_BG[sc.ex] + " 50%, " + SCORE_BG[sc.ex] + " 100%)"
                    : "var(--surf)";
                  return (
                    <div key={ds}
                      className={"cal-cell" + (!clickable ? " off" : "") + (ds === tStr ? " today" : "") + (ds === activeDate ? " sel" : "")}
                      style={{ background: bgStyle }}
                      onClick={function() { if (clickable) { setActiveDate(ds); setTab("log"); } }}>
                      <span className="num" style={{ fontSize: 10.5, fontWeight: 600, color: sc.hasData ? "var(--hi)" : "var(--low)" }}>{n}</span>
                      {sc.hasData && (
                        <div className="dotrow">
                          <span className="sdot" style={{ background: SCORE_C[sc.food] }} />
                          <span className="sdot" style={{ background: SCORE_C[sc.ex] }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line-soft)", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="sdot" style={{ background: "var(--hi)", opacity: .9, borderRadius: 2, width: 8, height: 8, clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
                  <span style={{ fontSize: 10.5, color: "var(--mid)" }}>Mitad superior y punto izquierdo: <b style={{ color: "var(--hi)" }}>alimentación</b> · mitad inferior y punto derecho: <b style={{ color: "var(--hi)" }}>ejercicio</b></span>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[["var(--good)", "Bien"], ["var(--warn)", "Regular"], ["var(--bad)", "Mal"], ["#39404d", "Sin datos"]].map(function(l) {
                    return (
                      <span key={l[1]} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--mid)" }}>
                        <span className="sdot" style={{ background: l[0] }} />{l[1]}
                      </span>
                    );
                  })}
                </div>
                <div style={{ fontSize: 9.5, color: "var(--low)", lineHeight: 1.6 }}>
                  Alimentación: <span style={{ color: "var(--good)" }}>bien</span> = balance ≤ 0 y proteína ≥ {PROT_MIN}g · <span style={{ color: "var(--bad)" }}>mal</span> = superávit &gt; 300 kcal<br />
                  Ejercicio: <span style={{ color: "var(--good)" }}>bien</span> = ≥ {STEPS_GOAL.toLocaleString("es-ES")} pasos o ≥ {BURN_GOOD} kcal activas · <span style={{ color: "var(--bad)" }}>mal</span> = &lt; 4.000 pasos sin actividad
                </div>
              </div>
            </div>

            <div className="card">
              <div className="eyebrow" style={{ marginBottom: 12 }}>Resumen de {MONTHS_ES[calCursor.m]}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                {[["Días registrados", monthStats.tracked + "", "var(--hi)"],
                  ["Alimentación bien", monthStats.foodGood + " días", "var(--good)"],
                  ["Ejercicio bien", monthStats.exGood + " días", "var(--good)"],
                  ["Proteína ≥ " + PROT_MIN + "g", monthStats.protDays + " días", "var(--prot)"],
                  ["Balance medio", monthStats.tracked > 0 ? (Math.round(monthStats.balSum / monthStats.tracked) > 0 ? "+" : "") + Math.round(monthStats.balSum / monthStats.tracked) + " kcal" : "—", monthStats.tracked > 0 && monthStats.balSum / monthStats.tracked < 0 ? "var(--good)" : "var(--bad)"]].map(function(s) {
                  return (
                    <div key={s[0]} style={{ background: "var(--raised)", borderRadius: 12, padding: "11px 13px" }}>
                      <div style={{ fontSize: 10, color: "var(--mid)", marginBottom: 4 }}>{s[0]}</div>
                      <div className="num" style={{ fontWeight: 700, fontSize: 16, color: s[2] }}>{s[1]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "balance" && (
          <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {dateStrip}
            <div className="card">
              <div className="eyebrow" style={{ marginBottom: 12 }}>Actividad del día</div>
              {day.oura ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {day.oura.workouts && day.oura.workouts.length > 0 && day.oura.workouts.map(function(w, i) {
                    var mins = w.duration ? Math.round(w.duration / 60) : null;
                    var hrs = mins ? Math.floor(mins / 60) : 0;
                    var rem = mins ? mins % 60 : 0;
                    var durStr = hrs > 0 ? hrs + "h " + rem + "min" : (rem + "min");
                    var actMap = { "strength_training": "Entrenamiento de fuerza", "running": "Carrera", "walking": "Caminar", "cycling": "Ciclismo", "swimming": "Natación", "yoga": "Yoga", "hiit": "HIIT", "elliptical": "Elíptica", "rowing": "Remo", "weight_training": "Entrenamiento de fuerza", "functional_training": "Entrenamiento funcional", "sport": "Deporte", "other": "Entrenamiento" };
                    var actKey = (w.activity || w.sport || "").toLowerCase();
                    var actLabel = actMap[actKey] || (w.activity || w.sport || "Entrenamiento");
                    var cal = w.calories ? Math.round(w.calories) : null;
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
                        <span style={{ fontSize: 12 }}>💪 {actLabel}{mins ? " · " + durStr : ""}</span>
                        <span className="num" style={{ fontSize: 12, color: "var(--burn)", fontWeight: 700 }}>{cal ? cal + " cal" : ""}</span>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--mid)" }}>Total quemado</span>
                    <span className="num" style={{ fontSize: 15, color: "var(--burn)", fontWeight: 700 }}>-{t.burn} kcal</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 11.5, color: "var(--low)" }}>Sin datos de Oura — ve a Hoy y toca Sync</div>
              )}
            </div>

            <div className="card">
              <div className="eyebrow" style={{ marginBottom: 14 }}>Ecuación</div>
              {[["Ingerido", Math.round(t.cals), "var(--acc)", ""], ["Actividad (quemado)", t.burn, "var(--burn)", "-"], ["TDEE base", TDEE_BASE, "var(--low)", "-"]].map(function(row, i) {
                return (
                  <div key={row[0]} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 2 ? "1px solid var(--line-soft)" : "none" }}>
                    <span style={{ fontSize: 12, color: "var(--mid)" }}>{row[0]}</span>
                    <span className="num" style={{ fontWeight: 700, fontSize: 14, color: row[2] }}>{row[3]}{row[1]} kcal</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: "var(--raised)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="eyebrow">Balance neto</div>
                  <div style={{ fontSize: 10.5, color: balColor, marginTop: 3 }}>{t.balance > 300 ? "Superávit calórico" : t.balance < -300 ? "Déficit calórico" : "Cerca del mantenimiento"}</div>
                </div>
                <div className="num" style={{ fontSize: 30, fontWeight: 800, color: balColor }}>{t.balance > 0 ? "+" : ""}{Math.round(t.balance)}</div>
              </div>
            </div>

            <div className="card">
              <div className="eyebrow" style={{ marginBottom: 14 }}>Macros vs objetivos</div>
              {[["Proteína", Math.round(t.protein), 145, "var(--prot)"], ["Carbohidratos", Math.round(t.carbs), 250, "var(--carb)"], ["Grasas", Math.round(t.fat), 70, "var(--fat)"]].map(function(m) {
                return (
                  <div key={m[0]} style={{ marginBottom: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "var(--mid)" }}>{m[0]}</span>
                      <span className="num" style={{ fontSize: 12, color: m[3] }}>{m[1]}g / {m[2]}g</span>
                    </div>
                    <div className="bar"><div className="bar-fill" style={{ width: Math.min(100, m[1] / m[2] * 100) + "%", background: m[3] }} /></div>
                  </div>
                );
              })}
            </div>

            <div className="card">
              <div className="eyebrow" style={{ marginBottom: 14 }}>Resumen total registrado</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                {[["Días", trend.length + "", "var(--acc)"], ["Balance total", (totalBalance > 0 ? "+" : "") + Math.round(totalBalance) + " kcal", "var(--burn)"], ["Prom. diario", avgCals + " kcal", "var(--acc)"], ["Prom. balance", (avgBalance > 0 ? "+" : "") + avgBalance + " kcal", avgBalance < 0 ? "var(--good)" : "var(--bad)"]].map(function(s) {
                  return (
                    <div key={s[0]} style={{ background: "var(--raised)", borderRadius: 12, padding: "11px 13px" }}>
                      <div style={{ fontSize: 10, color: "var(--mid)", marginBottom: 4 }}>{s[0]}</div>
                      <div className="num" style={{ fontWeight: 700, fontSize: 15, color: s[2] }}>{s[1]}</div>
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
              <div className="eyebrow" style={{ marginBottom: 14 }}>Perfil</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
                {[["Altura", HEIGHT_CM + " cm", "var(--acc)"], ["Peso actual", lastWeight ? lastWeight.kg + " kg" : "—", "var(--sleep)"], ["IMC", lastWeight ? bmi(lastWeight.kg) : "—", "var(--good)"]].map(function(s) {
                  return (
                    <div key={s[0]} style={{ background: "var(--raised)", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                      <div className="num" style={{ fontWeight: 800, fontSize: 17, color: s[2] }}>{s[1]}</div>
                      <div style={{ fontSize: 9.5, color: "var(--mid)", marginTop: 3 }}>{s[0]}</div>
                    </div>
                  );
                })}
              </div>
              {weightChange !== null && weights.length > 1 && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "var(--raised)" }}>
                  <span style={{ fontSize: 11, color: "var(--mid)" }}>Cambio desde inicio: </span>
                  <span className="num" style={{ fontWeight: 700, color: parseFloat(weightChange) <= 0 ? "var(--good)" : "var(--bad)" }}>{parseFloat(weightChange) > 0 ? "+" : ""}{weightChange} kg</span>
                </div>
              )}
            </div>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div className="eyebrow">Registro de peso</div>
                <button className="btn-g" style={{ fontSize: 11, padding: "6px 12px" }} onClick={function() { setShowAddWeight(!showAddWeight); }}>{showAddWeight ? "✕" : "+ Peso"}</button>
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
                  <div key={w.date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < weights.length - 1 ? "1px solid var(--line-soft)" : "none" }}>
                    <div>
                      <div style={{ fontSize: 12 }}>{fmtDate(w.date)}</div>
                      <div style={{ fontSize: 10, color: "var(--low)", marginTop: 2 }}>{w.note}</div>
                    </div>
                    <div className="num" style={{ fontWeight: 800, fontSize: 17, color: "var(--sleep)" }}>{w.kg} <span style={{ fontSize: 10, color: "var(--low)" }}>kg</span></div>
                  </div>
                );
              })}
            </div>
            <div className="card" style={{ background: "rgba(74,222,128,.05)", borderColor: "rgba(74,222,128,.18)" }}>
              <div className="eyebrow" style={{ color: "var(--good)", marginBottom: 8 }}>Objetivo</div>
              <div style={{ fontSize: 11.5, color: "var(--mid)", lineHeight: 1.7 }}>Déficit de ~400-500 kcal/día &rarr; pérdida estimada de ~0.3-0.5 kg/semana.<br />Pesaje semanal: <span style={{ color: "var(--good)" }}>lunes por la mañana, en ayunas</span>.</div>
            </div>
          </div>
        )}

        {tab === "historial" && (
          <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div style={{ display: "flex", gap: 8 }}>
              {[["7", "7 días"], ["30", "30 días"], ["all", "Todo"]].map(function(p) {
                return (
                  <button key={p[0]} className={"btn-g" + (histTab === p[0] ? " on" : "")} onClick={function() { setHistTab(p[0]); }}>{p[1]}</button>
                );
              })}
            </div>

            {(function() {
              var tracked = trend.filter(function(d) { return d.cals > 0; });
              var n = histTab === "7" ? 7 : histTab === "30" ? 30 : tracked.length;
              var period = tracked.slice(-n);
              if (period.length === 0) {
                return <div className="card" style={{ textAlign: "center", fontSize: 12, color: "var(--low)" }}>Aún no hay días registrados en este periodo</div>;
              }

              var pAvgCals = Math.round(period.reduce(function(s, d) { return s + d.cals; }, 0) / period.length);
              var pAvgBal = Math.round(period.reduce(function(s, d) { return s + d.balance; }, 0) / period.length);
              var pAvgProt = Math.round(period.reduce(function(s, d) { return s + d.protein; }, 0) / period.length);
              var stepDays = period.filter(function(d) { return d.steps; });
              var pAvgSteps = stepDays.length > 0 ? Math.round(stepDays.reduce(function(s, d) { return s + d.steps; }, 0) / stepDays.length) : null;
              var kgEquiv = (period.reduce(function(s, d) { return s + d.balance; }, 0) / 7700).toFixed(2);

              // ---- Gráfica de balance divergente ----
              var W = 420;
              var CH = 150;
              var MID = CH / 2;
              var PADL = 6;
              var bw = Math.max(4, Math.floor((W - PADL * 2) / period.length) - 2);
              var step = (W - PADL * 2) / period.length;
              var maxAbs = Math.max.apply(null, period.map(function(d) { return Math.abs(d.balance); }).concat([400]));
              var scaleY = (MID - 16) / maxAbs;

              // ---- Patrón semanal (promedio de balance por día de la semana, todo el registro) ----
              var WDFULL = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
              var wdSum = [0, 0, 0, 0, 0, 0, 0];
              var wdCnt = [0, 0, 0, 0, 0, 0, 0];
              tracked.forEach(function(d) {
                var parts = d.date.split("-").map(Number);
                var wd = (new Date(parts[0], parts[1] - 1, parts[2]).getDay() + 6) % 7;
                wdSum[wd] += d.balance;
                wdCnt[wd]++;
              });
              var wdAvg = wdSum.map(function(s, i) { return wdCnt[i] > 0 ? Math.round(s / wdCnt[i]) : null; });
              var wdMaxAbs = Math.max.apply(null, wdAvg.map(function(v) { return v === null ? 0 : Math.abs(v); }).concat([200]));
              var worstIdx = -1;
              wdAvg.forEach(function(v, i) { if (v !== null && (worstIdx === -1 || v > wdAvg[worstIdx])) worstIdx = i; });

              // ---- Rachas (días consecutivos cumpliendo la meta, desde el más reciente) ----
              function streak(check) {
                var s = 0;
                var i;
                for (i = tracked.length - 1; i >= 0; i--) {
                  if (check(tracked[i])) s++;
                  else break;
                }
                return s;
              }
              var protStreak = streak(function(d) { return d.protein >= PROT_MIN; });
              var stepStreak = streak(function(d) { return (d.steps || 0) >= STEPS_GOAL; });
              var defStreak = streak(function(d) { return d.balance <= 0; });

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  <div className="card">
                    <div className="eyebrow" style={{ marginBottom: 4 }}>Balance diario</div>
                    <div style={{ fontSize: 9.5, color: "var(--low)", marginBottom: 12 }}>Hacia abajo = déficit (bien) · hacia arriba = superávit</div>
                    <svg width="100%" viewBox={"0 0 " + W + " " + CH} style={{ display: "block" }}>
                      <line x1="0" y1={MID} x2={W} y2={MID} stroke="#2a3343" strokeWidth="1" />
                      <text x={W - 2} y={MID - 4} fontSize="7" fill="#5B6675" fontFamily="JetBrains Mono" textAnchor="end">0</text>
                      {period.map(function(d, i) {
                        var h = Math.abs(d.balance) * scaleY;
                        var up = d.balance > 0;
                        var x = PADL + i * step + (step - bw) / 2;
                        var y = up ? MID - h : MID;
                        var c = d.balance > 300 ? "#FB7185" : d.balance < -300 ? "#4ADE80" : "#F2B23E";
                        var dnum = parseInt(d.date.slice(8), 10);
                        return (
                          <g key={d.date} onClick={function() { setActiveDate(d.date); setTab("log"); }} style={{ cursor: "pointer" }}>
                            <rect x={x} y={y} width={bw} height={Math.max(2, h)} rx={2} fill={c} opacity={d.date === activeDate ? 1 : 0.65} />
                            {period.length <= 14 && <text x={x + bw / 2} y={CH - 3} textAnchor="middle" fontSize="7" fill="#5B6675" fontFamily="JetBrains Mono">{dnum}</text>}
                          </g>
                        );
                      })}
                    </svg>
                    <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--mid)" }}>
                      <span>Balance medio: <span className="num" style={{ color: pAvgBal <= 0 ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{pAvgBal > 0 ? "+" : ""}{pAvgBal} kcal</span></span>
                      <span>≈ <span className="num" style={{ color: parseFloat(kgEquiv) <= 0 ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{parseFloat(kgEquiv) > 0 ? "+" : ""}{kgEquiv} kg</span> teóricos</span>
                    </div>
                  </div>

                  <div className="card">
                    <div className="eyebrow" style={{ marginBottom: 4 }}>Patrón semanal</div>
                    <div style={{ fontSize: 9.5, color: "var(--low)", marginBottom: 12 }}>Balance medio por día de la semana (todo el registro)</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 110 }}>
                      {WDFULL.map(function(w, i) {
                        var v = wdAvg[i];
                        var h = v === null ? 0 : Math.max(4, Math.abs(v) / wdMaxAbs * 70);
                        var c = v === null ? "var(--raised)" : v > 300 ? "var(--bad)" : v < -300 ? "var(--good)" : v > 0 ? "var(--warn)" : "var(--acc)";
                        return (
                          <div key={w} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 4, height: "100%" }}>
                            <span className="num" style={{ fontSize: 8.5, color: c, fontWeight: 600 }}>{v === null ? "—" : (v > 0 ? "+" : "") + v}</span>
                            <div style={{ width: "100%", maxWidth: 30, height: h, borderRadius: 5, background: c, opacity: i === worstIdx ? 1 : 0.7, border: i === worstIdx ? "1px solid var(--hi)" : "none" }} />
                            <span style={{ fontSize: 9, color: i >= 5 ? "var(--mid)" : "var(--low)", fontWeight: i === worstIdx ? 700 : 400 }}>{w}</span>
                          </div>
                        );
                      })}
                    </div>
                    {worstIdx >= 0 && wdAvg[worstIdx] > 0 && (
                      <div style={{ marginTop: 10, fontSize: 10.5, color: "var(--mid)" }}>Tu día más débil es el <b style={{ color: "var(--hi)" }}>{WDFULL[worstIdx]}</b> (+{wdAvg[worstIdx]} kcal de media)</div>
                    )}
                    {worstIdx >= 0 && wdAvg[worstIdx] <= 0 && (
                      <div style={{ marginTop: 10, fontSize: 10.5, color: "var(--good)" }}>Todos los días de la semana en déficit medio 💪</div>
                    )}
                  </div>

                  <div className="card">
                    <div className="eyebrow" style={{ marginBottom: 12 }}>Rachas actuales</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
                      {[["🥩", "Proteína ≥ " + PROT_MIN + "g", protStreak], ["👟", "≥ " + (STEPS_GOAL / 1000) + "k pasos", stepStreak], ["⚖️", "En déficit", defStreak]].map(function(s) {
                        return (
                          <div key={s[1]} style={{ background: "var(--raised)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                            <div style={{ fontSize: 16 }}>{s[0]}</div>
                            <div className="num" style={{ fontWeight: 800, fontSize: 20, color: s[2] > 0 ? "var(--good)" : "var(--low)", margin: "2px 0" }}>{s[2]}</div>
                            <div style={{ fontSize: 8.5, color: "var(--mid)", lineHeight: 1.3 }}>{s[1]}<br />{s[2] === 1 ? "día seguido" : "días seguidos"}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card">
                    <div className="eyebrow" style={{ marginBottom: 12 }}>Promedios del periodo ({period.length} días)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                      {[["Ingesta media", pAvgCals + " kcal", "var(--acc)"],
                        ["Balance medio", (pAvgBal > 0 ? "+" : "") + pAvgBal + " kcal", pAvgBal <= 0 ? "var(--good)" : "var(--bad)"],
                        ["Proteína media", pAvgProt + " g", pAvgProt >= PROT_MIN ? "var(--good)" : "var(--warn)"],
                        ["Pasos medios", pAvgSteps ? pAvgSteps.toLocaleString("es-ES") : "—", pAvgSteps && pAvgSteps >= STEPS_GOAL ? "var(--good)" : "var(--warn)"]].map(function(s) {
                        return (
                          <div key={s[0]} style={{ background: "var(--raised)", borderRadius: 12, padding: "11px 13px" }}>
                            <div style={{ fontSize: 10, color: "var(--mid)", marginBottom: 4 }}>{s[0]}</div>
                            <div className="num" style={{ fontWeight: 700, fontSize: 16, color: s[2] }}>{s[1]}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ textAlign: "center", fontSize: 10, color: "var(--low)", paddingTop: 2 }}>{tracked.length} días con registro en total</div>
                </div>
              );
            })()}
          </div>
        )}

      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, background: "rgba(15,18,24,.94)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderTop: "1px solid var(--line-soft)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex" }}>
          {[["log", "hoy", "Hoy"], ["calendario", "cal", "Calendario"], ["balance", "bal", "Balance"], ["peso", "peso", "Peso"], ["historial", "hist", "Tendencias"]].map(function(nv) {
            return (
              <button key={nv[0]} className={"navbtn" + (tab === nv[0] ? " on" : "")} onClick={function() { setTab(nv[0]); }}>
                <Icon name={nv[1]} />
                <span>{nv[2]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
