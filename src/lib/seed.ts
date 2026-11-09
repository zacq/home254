import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, deliveryZones, installServices, products, settings } from "@/db/schema";
import { CATALOG } from "@/lib/catalog";
import { slugify } from "@/lib/format";

const SEED_VERSION = "2";
const MOTOR_WARRANTY = "10-year motor warranty + 2-year general warranty (terms apply)";
const GENERAL = "2-year general warranty";
const PRD_CHECKED = new Date("2026-11-09T09:00:00+03:00");

type Seed = {
  name: string;
  model: string;
  category: string;
  sub: string;
  type: string;
  brand?: string;
  wash?: number;
  dry?: number;
  rpm?: number;
  energy?: string;
  motor?: string;
  features?: string[];
  specs?: Record<string, string>;
  warranty?: string;
  price: number;
  was?: number;
  offer?: number;
  competitor?: number;
  competitorWas?: number;
  stock: number;
  colour?: string;
  dims?: string;
  weight?: number;
  benefit: string;
  featured?: boolean;
  pop?: number;
  sample?: boolean;
};

// The laundry range carried over from v1. Models named in PRD v2 are real; the rest are samples.
const LAUNDRY: Seed[] = [
  { name: "MIKA Washer-Dryer Combo 10/7kg, Silver", model: "MWAFCV3310BDS", category: "washers", sub: "washer-dryers", type: "Washer-dryer", wash: 10, dry: 7, rpm: 1500, energy: "A", motor: "Brushless inverter (BLDC)", features: ["SpaCare steam wash", "Ozone/Airwash", "Auto-dose", "Drum clean", "Baby care"], warranty: MOTOR_WARRANTY, price: 114995, stock: 4, colour: "Silver", dims: "60 × 62 × 85", weight: 74, benefit: "Wash and dry a full week of laundry in one machine — no line, no vent pipe.", featured: true, pop: 100 },
  { name: "MIKA 12kg Front-Load Washer, A+++ Steam", model: "MWFL1214BDS", category: "washers", sub: "front-load", type: "Front-load", wash: 12, rpm: 1400, energy: "A+++", motor: "Brushless inverter (BLDC)", features: ["SpaCare steam wash", "Microfiber catcher", "Drum clean", "Auto-dose"], warranty: MOTOR_WARRANTY, price: 119995, was: 129995, stock: 3, colour: "Graphite", dims: "60 × 64 × 85", weight: 72, benefit: "Big-family capacity with A+++ running costs and a 10-year motor warranty.", featured: true, pop: 95 },
  { name: "MIKA 10kg Front-Load Washer, Steam Wash", model: "MWFL1014BDS", category: "washers", sub: "front-load", type: "Front-load", wash: 10, rpm: 1400, energy: "A++", motor: "Brushless inverter (BLDC)", features: ["SpaCare steam wash", "Drum clean", "Baby care"], warranty: MOTOR_WARRANTY, price: 94995, stock: 6, colour: "White", dims: "60 × 58 × 85", weight: 68, benefit: "Steam-hygienic washing for baby clothes and bedding at a sensible price.", pop: 80, sample: true },
  { name: "MIKA 9kg Front-Load Inverter Washer", model: "MWFL0912BDI", category: "washers", sub: "front-load", type: "Front-load", wash: 9, rpm: 1200, energy: "A++", motor: "Brushless inverter (BLDC)", features: ["Drum clean", "Quick 15'"], warranty: MOTOR_WARRANTY, price: 74995, stock: 8, colour: "Silver", dims: "60 × 55 × 85", weight: 62, benefit: "Quiet inverter motor and a 15-minute quick wash for busy households.", pop: 70, sample: true },
  { name: "MIKA 8kg Front-Load Washer", model: "MWFL0812STD", category: "washers", sub: "front-load", type: "Front-load", wash: 8, rpm: 1200, energy: "A+", motor: "Standard", features: ["Quick 15'"], warranty: GENERAL, price: 59995, stock: 10, colour: "White", dims: "60 × 52 × 85", weight: 58, benefit: "Your first automatic front-loader — simple, reliable, easy on water.", pop: 60, sample: true },
  { name: "MIKA 11kg Front-Load Washer, Baby Care", model: "MWFL1114BDB", category: "washers", sub: "front-load", type: "Front-load", wash: 11, rpm: 1400, energy: "A+++", motor: "Brushless inverter (BLDC)", features: ["SpaCare steam wash", "Baby care", "Microfiber catcher", "Auto-dose"], warranty: MOTOR_WARRANTY, price: 109995, stock: 2, colour: "Silver", dims: "60 × 62 × 85", weight: 70, benefit: "Allergen-reducing steam and baby-care cycle for growing families.", pop: 75, sample: true },
  { name: "MIKA 10kg Top-Load Washer, Inverter", model: "MWTL1010BDI", category: "washers", sub: "top-load", type: "Top-load", wash: 10, rpm: 800, energy: "A+", motor: "Brushless inverter (BLDC)", features: ["Drum clean"], warranty: MOTOR_WARRANTY, price: 64995, stock: 5, colour: "Silver", dims: "58 × 60 × 100", weight: 45, benefit: "Load mid-cycle and skip bending — top-load convenience with an inverter motor.", pop: 50, sample: true },
  { name: "MIKA Washer-Dryer Combo 8/5kg, White", model: "MWAFC2805STD", category: "washers", sub: "washer-dryers", type: "Washer-dryer", wash: 8, dry: 5, rpm: 1200, energy: "A", motor: "Standard", features: ["Quick 15'", "Drum clean"], warranty: GENERAL, price: 84995, stock: 5, colour: "White", dims: "60 × 55 × 85", weight: 66, benefit: "Compact wash-and-dry for small apartments and couples.", pop: 65, sample: true },
  { name: "MIKA Washer-Dryer Combo 9/6kg Inverter", model: "MWAFC3906BDI", category: "washers", sub: "washer-dryers", type: "Washer-dryer", wash: 9, dry: 6, rpm: 1400, energy: "A", motor: "Brushless inverter (BLDC)", features: ["SpaCare steam wash", "Drum clean"], warranty: MOTOR_WARRANTY, price: 99995, stock: 3, colour: "Silver", dims: "60 × 58 × 85", weight: 70, benefit: "Steam wash and drying in one quiet inverter-driven machine.", pop: 72, sample: true },
  { name: "MIKA Washer-Dryer Combo 12/8kg, Graphite", model: "MWAFC3128BDS", category: "washers", sub: "washer-dryers", type: "Washer-dryer", wash: 12, dry: 8, rpm: 1400, energy: "A", motor: "Brushless inverter (BLDC)", features: ["SpaCare steam wash", "Auto-dose", "Ozone/Airwash", "Drum clean", "Baby care"], warranty: MOTOR_WARRANTY, price: 139995, stock: 2, colour: "Graphite", dims: "60 × 66 × 85", weight: 80, benefit: "The biggest wash-and-dry capacity for a family of five or more.", pop: 85, sample: true },
  { name: "MIKA 10kg Heat Pump Tumble Dryer, A+++", model: "MDRH3110DS", category: "washers", sub: "tumble-dryers", type: "Heat-pump dryer", dry: 10, energy: "A+++", motor: "Brushless inverter (BLDC)", features: ["Heat pump", "Drum clean"], warranty: MOTOR_WARRANTY, price: 84995, was: 114995, competitor: 86995, competitorWas: 114995, stock: 3, colour: "Graphite", dims: "60 × 65 × 85", weight: 52, benefit: "Gentle drying that uses far less power — and needs no vent pipe.", featured: true, pop: 78 },
  { name: "MIKA 8kg Heat Pump Tumble Dryer", model: "MDRH3108DS", category: "washers", sub: "tumble-dryers", type: "Heat-pump dryer", dry: 8, energy: "A++", motor: "Standard", features: ["Heat pump"], warranty: GENERAL, price: 99995, stock: 4, colour: "White", dims: "60 × 60 × 85", weight: 48, benefit: "Heat-pump efficiency in a compact 8kg drum.", pop: 55, sample: true },
  { name: "MIKA 8kg Condenser Tumble Dryer", model: "MDRC2008STD", category: "washers", sub: "tumble-dryers", type: "Condenser dryer", dry: 8, energy: "B", motor: "Standard", features: ["Quick 15'"], warranty: GENERAL, price: 54995, stock: 6, colour: "White", dims: "60 × 60 × 85", weight: 36, benefit: "Dry clothes in any weather without a vent — at an entry price.", pop: 45, sample: true },
  { name: "MIKA 9kg Condenser Tumble Dryer, Inverter", model: "MDRC2009BDI", category: "washers", sub: "tumble-dryers", type: "Condenser dryer", dry: 9, energy: "B", motor: "Brushless inverter (BLDC)", features: ["Quick 15'", "Drum clean"], warranty: MOTOR_WARRANTY, price: 69995, stock: 0, colour: "Silver", dims: "60 × 62 × 85", weight: 40, benefit: "Quiet inverter drying with a quick-dry cycle.", pop: 40, sample: true },
  { name: "MIKA 7kg Entry-Level Top-Load Washer", model: "MWTL0707STD", category: "washers", sub: "top-load", type: "Top-load", wash: 7, rpm: 700, energy: "A", motor: "Standard", warranty: "1-year general warranty", price: 34995, stock: 12, colour: "White", dims: "54 × 55 × 94", weight: 32, benefit: "Reliable automatic washing near KSh 35K — Pay on Delivery available.", pop: 58, sample: true },
  { name: "MIKA 8kg Semi-Automatic Twin-Tub Washer", model: "MWTT0808STD", category: "washers", sub: "twin-tub", type: "Twin-tub", wash: 8, rpm: 1300, energy: "A", motor: "Standard", warranty: "1-year general warranty", price: 29995, stock: 9, colour: "White", dims: "76 × 44 × 90", weight: 28, benefit: "Familiar twin-tub operation with a strong spin dryer.", pop: 42, sample: true },
  { name: "MIKA 450L Double-Door Fridge, Stainless", model: "MRDD450SS", category: "fridges", sub: "double-door", type: "Double-door", energy: "A+", specs: { capacityL: "450", doors: "2", inverter: "No", waterDispenser: "No", defrost: "Frost-free" }, warranty: "2-year general warranty + compressor warranty", price: 89995, stock: 4, colour: "Stainless steel", dims: "83 × 70 × 178", weight: 82, benefit: "Frost-free cooling with room for a big family shop.", pop: 35, sample: true },
  { name: "MIKA 138L Single-Door Fridge", model: "MRSD138WH", category: "fridges", sub: "single-door", type: "Single-door", energy: "A", specs: { capacityL: "138", doors: "1", inverter: "No", waterDispenser: "No", defrost: "Direct cool" }, warranty: "1-year general warranty", price: 24995, stock: 7, colour: "White", dims: "48 × 52 × 112", weight: 30, benefit: "Compact, efficient fridge for bedsitters and offices.", pop: 30, sample: true },
  { name: "MIKA 25L Digital Microwave", model: "MMW25DG", category: "kitchen-appliances", sub: "microwaves", type: "Microwave", specs: { capacity: "25L", powerW: "900" }, warranty: "1-year general warranty", price: 11995, stock: 15, colour: "Black", dims: "48 × 36 × 28", weight: 12, benefit: "Digital presets for quick reheating and defrosting.", pop: 25, sample: true },
  { name: "MIKA 30L Grill Microwave, Stainless", model: "MMW30GR", category: "kitchen-appliances", sub: "microwaves", type: "Microwave", specs: { capacity: "30L", powerW: "1000" }, warranty: "1-year general warranty", price: 15995, stock: 1, colour: "Stainless steel", dims: "52 × 42 × 31", weight: 15, benefit: "Microwave and grill in one for crisp, browned results.", pop: 20, sample: true },
];

// Launch models and prices from PRD v2 section 8 (competitor reference checked 9 Nov 2026).
// Stock is 0 until the real count is entered; check each price against cost before selling.
const LAUNCH: Seed[] = [
  { name: "LG 15kg Commercial Tumble Dryer", model: "RV1840CD7", brand: "LG", category: "commercial", sub: "commercial-dryers", type: "Commercial dryer", dry: 15, specs: { capacity: "15kg" }, price: 277995, competitor: 279995, competitorWas: 369995, stock: 0, benefit: "Heavy-duty drying for laundromats, hotels and large households.", pop: 30 },
  { name: "LG Commercial Tumble Dryer", model: "RV1329C7T", brand: "LG", category: "commercial", sub: "commercial-dryers", type: "Commercial dryer", specs: { capacity: "Commercial" }, price: 187995, competitor: 189995, competitorWas: 249995, stock: 0, benefit: "Commercial-grade dryer built for back-to-back loads.", pop: 28 },
  { name: "LG 8kg Heat Pump Tumble Dryer", model: "RH80T2SP7RM", brand: "LG", category: "washers", sub: "tumble-dryers", type: "Heat-pump dryer", dry: 8, features: ["Heat pump"], price: 78495, competitor: 79995, competitorWas: 113995, stock: 0, benefit: "Low-temperature heat-pump drying that is gentle on fabrics and power bills.", pop: 60 },
  { name: "Samsung 9kg Heat Pump Tumble Dryer", model: "DV90CGC2A0ABNQ", brand: "Samsung", category: "washers", sub: "tumble-dryers", type: "Heat-pump dryer", dry: 9, features: ["Heat pump"], price: 97995, competitor: 99995, competitorWas: 109995, stock: 0, benefit: "9kg heat-pump drying with smart sensors that stop when clothes are dry.", pop: 62 },
  { name: "MIKA 36kg Ice Maker", model: "MIC1D3615X", category: "fridges", sub: "ice-makers", type: "Ice maker", specs: { capacityL: "36" }, price: 167995, competitor: 169995, stock: 0, benefit: "Up to 36kg of ice a day for bars, restaurants and events.", pop: 20 },
  { name: "MIKA Facial Kit", model: "MFK1004SS", category: "health-personal-care", sub: "facial-steamers", type: "Facial kit", specs: { capacity: "Kit" }, price: 330, competitor: 350, stock: 0, benefit: "A compact facial care kit for everyday grooming.", pop: 10 },
  { name: "MIKA Steamer Accessory Pad", model: "MACP1020", category: "washers", sub: "irons-steamers", type: "Accessory", specs: {}, price: 95, competitor: 100, stock: 0, benefit: "Replacement pad for MIKA garment steamers.", pop: 5 },
];

// Sample range so every sub-category can be reviewed before the real catalogue is loaded.
type V = [brand: string, name: string, price: number, specs?: Record<string, string>];
type Line = [cat: string, sub: string, type: string, benefit: string, variants: V[]];
const TV = (size: string, resolution: string, panel: string, platform: string) => ({ screenSize: size, resolution, panel, platform });
const AU = (powerW: string, connectivity: string, channels = "") => ({ powerW, connectivity, ...(channels ? { channels } : {}) });
const FR = (capacityL: string, doors: string, inverter = "No", waterDispenser = "No", defrost = "Frost-free") => ({ capacityL, doors, inverter, waterDispenser, defrost });
const CK = (fuel: string, burners: string, ovenL: string, widthCm: string) => ({ fuel, burners, ...(ovenL ? { ovenL } : {}), widthCm });
const B = (capacity: string, powerW = "") => ({ capacity, ...(powerW ? { powerW } : {}) });

const SAMPLES: Line[] = [
  ["tvs", "smart-tvs", "Smart TV", "Stream YouTube, Netflix and Showmax on a sharp, bright screen.", [["Hisense", "43\" Full HD Smart TV", 37995, TV("43", "Full HD", "LED", "VIDAA")], ["Samsung", "55\" 4K UHD Smart TV", 69995, TV("55", "4K UHD", "LED", "Tizen")], ["LG", "65\" 4K UHD Smart TV", 109995, TV("65", "4K UHD", "LED", "webOS")]]],
  ["tvs", "led-tvs", "LED TV", "A reliable everyday TV with clear picture and simple controls.", [["Hisense", "32\" HD LED TV", 18995, TV("32", "HD", "LED", "Not smart")], ["Von", "43\" Full HD Android TV", 29995, TV("43", "Full HD", "LED", "Android TV")], ["Samsung", "50\" 4K LED TV", 49995, TV("50", "4K UHD", "LED", "Tizen")]]],
  ["tvs", "qled-oled-tvs", "QLED / OLED TV", "Deep blacks and rich colour for films and sport.", [["Samsung", "55\" QLED 4K Smart TV", 99995, TV("55", "4K UHD", "QLED", "Tizen")], ["LG", "65\" OLED 4K Smart TV", 249995, TV("65", "4K UHD", "OLED", "webOS")], ["Hisense", "75\" Mini LED 4K Google TV", 189995, TV("75", "4K UHD", "Mini LED", "Google TV")]]],
  ["tvs", "wall-mounts-stands", "Wall mount", "Mount your TV safely at the right viewing height.", [["Von", "Fixed TV Wall Mount 32–55\"", 2495, B("32–55\"")], ["Von", "Tilting TV Wall Mount 43–75\"", 3995, B("43–75\"")], ["MIKA", "TV Floor Stand 40–70\"", 9995, B("40–70\"")]]],
  ["audio", "soundbars", "Soundbar", "Clearer dialogue and fuller sound than your TV speakers.", [["Hisense", "2.1ch 120W Soundbar", 14995, AU("120", "Bluetooth, HDMI ARC, Optical", "2.1")], ["Samsung", "3.1ch 340W Soundbar", 32995, AU("340", "Bluetooth, HDMI ARC", "3.1")], ["LG", "5.1ch 500W Soundbar", 54995, AU("500", "Bluetooth, HDMI ARC, Wi-Fi", "5.1")]]],
  ["audio", "home-theatre", "Home theatre", "Surround sound that fills the living room.", [["LG", "1000W 5.1 Home Theatre", 44995, AU("1000", "Bluetooth, HDMI ARC, USB", "5.1")], ["Samsung", "1000W Home Theatre System", 49995, AU("1000", "Bluetooth, HDMI ARC", "5.1")], ["Von", "600W 5.1 Home Theatre", 24995, AU("600", "Bluetooth, USB", "5.1")]]],
  ["audio", "speakers", "Speaker", "Big, portable sound for parties and gatherings.", [["Von", "300W Party Speaker", 19995, AU("300", "Bluetooth, USB")], ["LG", "80W Portable Bluetooth Speaker", 12995, AU("80", "Bluetooth")], ["Samsung", "160W Sound Tower", 29995, AU("160", "Bluetooth, USB")]]],
  ["audio", "hifi-micro-systems", "Hi-fi system", "Room-filling music from your phone, USB or radio.", [["LG", "2000W Hi-Fi System", 64995, AU("2000", "Bluetooth, USB")], ["Ramtons", "50W Micro System", 8995, AU("50", "Bluetooth, FM")], ["Von", "150W Micro System", 11995, AU("150", "Bluetooth, USB, FM")]]],
  ["audio", "radios", "Radio", "News, music and football commentary wherever you are.", [["Ramtons", "Bluetooth FM Radio", 2495, AU("5", "Bluetooth, FM")], ["MIKA", "Rechargeable FM Radio", 1995, AU("3", "FM")], ["Von", "10W Desktop Radio", 3495, AU("10", "Bluetooth, FM, USB")]]],
  ["audio", "headphones", "Headphones", "Private listening with long battery life.", [["Samsung", "Wireless Earbuds", 7995, AU("", "Bluetooth")], ["LG", "Noise-Cancelling Earbuds", 9995, AU("", "Bluetooth")], ["Von", "Wired Headphones", 1495, AU("", "3.5mm jack")]]],
  ["fridges", "single-door", "Single-door", "Compact cooling for small kitchens and offices.", [["Ramtons", "92L Single-Door Fridge", 21995, FR("92", "1", "No", "No", "Direct cool")], ["Hisense", "176L Single-Door Fridge", 27995, FR("176", "1", "No", "No", "Direct cool")]]],
  ["fridges", "double-door", "Double-door", "Separate fridge and freezer for the weekly shop.", [["Hisense", "205L Double-Door Fridge", 39995, FR("205", "2")], ["LG", "315L Inverter Double-Door Fridge", 69995, FR("315", "2", "Yes")], ["Samsung", "385L Double-Door Fridge", 84995, FR("385", "2", "Yes")]]],
  ["fridges", "side-by-side", "Side-by-side", "Big capacity with fridge and freezer side by side.", [["Hisense", "519L Side-by-Side Fridge", 129995, FR("519", "2", "Yes")], ["Samsung", "635L Side-by-Side Fridge", 189995, FR("635", "2", "Yes", "Yes")], ["LG", "613L Side-by-Side Fridge", 229995, FR("613", "2", "Yes", "Yes")]]],
  ["fridges", "french-door", "French-door", "Wide shelves at eye level and a pull-out freezer.", [["Samsung", "580L French-Door Fridge", 279995, FR("580", "4+", "Yes", "Yes")], ["LG", "530L French-Door Fridge", 259995, FR("530", "3", "Yes", "Yes")], ["Hisense", "432L French-Door Fridge", 169995, FR("432", "4+", "Yes")]]],
  ["fridges", "bar-mini-fridges", "Bar fridge", "Cold drinks within reach in a bedroom, office or bar.", [["Ramtons", "50L Bar Fridge", 15995, FR("50", "1", "No", "No", "Direct cool")], ["MIKA", "46L Mini Fridge", 14995, FR("46", "1", "No", "No", "Direct cool")], ["Von", "90L Bar Fridge", 19995, FR("90", "1", "No", "No", "Direct cool")]]],
  ["fridges", "freezers", "Chest freezer", "Store bulk meat and frozen food for weeks.", [["MIKA", "200L Chest Freezer", 34995, FR("200", "1", "No", "No", "Direct cool")], ["Ramtons", "300L Chest Freezer", 46995, FR("300", "1", "No", "No", "Direct cool")], ["Hisense", "420L Chest Freezer", 59995, FR("420", "2", "No", "No", "Direct cool")]]],
  ["fridges", "ice-makers", "Ice maker", "Fresh ice on demand for events and bars.", [["Ramtons", "15kg Countertop Ice Maker", 54995, FR("15", "1")], ["Von", "25kg Ice Maker", 119995, FR("25", "1")]]],
  ["fridges", "wine-chillers", "Wine chiller", "Keeps wine at the right serving temperature.", [["Hisense", "12-Bottle Wine Chiller", 34995, FR("35", "1")], ["LG", "24-Bottle Wine Chiller", 69995, FR("70", "1")], ["Von", "18-Bottle Wine Chiller", 39995, FR("50", "1")]]],
  ["fridges", "showcase-chillers", "Showcase chiller", "Glass-door display cooling for shops and bars.", [["MIKA", "350L Showcase Chiller", 89995, FR("350", "1")], ["Ramtons", "208L Back-Bar Chiller", 64995, FR("208", "2")], ["Hisense", "400L Showcase Chiller", 99995, FR("400", "1")]]],
  ["washers", "top-load", "Top-load", "Easy loading with no bending.", [["Hisense", "8kg Top-Load Washer", 36995]]],
  ["washers", "twin-tub", "Twin-tub", "Familiar, economical washing with a fast spin tub.", [["Ramtons", "7kg Twin-Tub Washer", 22995], ["Von", "10kg Twin-Tub Washer", 34995]]],
  ["washers", "irons-steamers", "Iron", "Crisp, wrinkle-free clothes in minutes.", [["MIKA", "Dry Iron", 1995], ["Ramtons", "Steam Iron", 3495], ["Von", "Garment Steamer", 6995]]],
  ["washers", "laundry-accessories", "Accessory", "Small helpers that make laundry day easier.", [["Ramtons", "Ironing Board", 4995], ["MIKA", "Laundry Basket", 1495], ["MIKA", "Washing Machine Cleaner", 795]]],
  ["cookers", "standing-cookers", "Standing cooker", "A full cooker with oven for everyday family meals.", [["MIKA", "60×60 Full Gas Cooker, 4 Burners", 39995, CK("Full gas", "4", "60", "60")], ["Von", "50×55 Cooker, 3 Gas + 1 Electric", 34995, CK("Gas + electric", "4", "50", "50")], ["Ramtons", "90×60 Gas Cooker, 5 Burners", 74995, CK("Full gas", "5", "100", "90")]]],
  ["cookers", "table-top-gas", "Table-top gas", "Fast, affordable gas cooking for any kitchen.", [["MIKA", "2-Burner Table-Top Gas Cooker", 3495, CK("Full gas", "2", "", "50")], ["Ramtons", "3-Burner Table-Top Gas Cooker", 5995, CK("Full gas", "3", "", "60")], ["Von", "2-Burner Glass-Top Gas Cooker", 4495, CK("Full gas", "2", "", "50")]]],
  ["cookers", "induction-portable", "Induction cooker", "Quick, precise cooking on electricity.", [["MIKA", "Single Induction Cooker", 4995, CK("Induction", "1", "", "30")], ["Ramtons", "Double Induction Cooker", 11995, CK("Induction", "2", "", "60")], ["Von", "Single Hot Plate", 2495, CK("Full electric", "1", "", "30")]]],
  ["cookers", "built-in-hobs-ovens", "Built-in", "A seamless built-in look for modern kitchens.", [["MIKA", "60cm Built-in Gas Hob, 4 Burners", 24995, CK("Full gas", "4", "", "60")], ["Von", "65L Built-in Electric Oven", 54995, CK("Full electric", "0", "65", "60")], ["Ramtons", "90cm Built-in Gas Hob, 5 Burners", 39995, CK("Full gas", "5", "", "90")]]],
  ["cookers", "cooker-hoods", "Cooker hood", "Clears smoke and cooking smells.", [["MIKA", "60cm Cooker Hood", 14995, CK("Full electric", "0", "", "60")], ["Ramtons", "90cm Chimney Hood", 24995, CK("Full electric", "0", "", "90")], ["Von", "60cm Chimney Hood", 19995, CK("Full electric", "0", "", "60")]]],
  ["kitchen-appliances", "microwaves", "Microwave", "Quick reheating and defrosting.", [["Ramtons", "20L Solo Microwave", 8995, B("20L", "700")]]],
  ["kitchen-appliances", "air-fryers", "Air fryer", "Crispy chips and chicken with little or no oil.", [["MIKA", "4L Air Fryer", 7995, B("4L", "1400")], ["Ramtons", "5.5L Air Fryer", 10995, B("5.5L", "1700")], ["Von", "7L Digital Air Fryer", 14995, B("7L", "1800")]]],
  ["kitchen-appliances", "deep-fryers", "Deep fryer", "Golden chips and mandazi at home.", [["MIKA", "2.5L Deep Fryer", 5995, B("2.5L", "1800")], ["Ramtons", "3L Deep Fryer", 7495, B("3L", "2000")], ["Von", "4L Deep Fryer", 8995, B("4L", "2200")]]],
  ["kitchen-appliances", "rice-cookers", "Rice cooker", "Perfect rice every time, then keeps it warm.", [["MIKA", "1.8L Rice Cooker", 3995, B("1.8L", "700")], ["Ramtons", "2.8L Rice Cooker", 5495, B("2.8L", "900")], ["Von", "1L Rice Cooker", 2995, B("1L", "400")]]],
  ["kitchen-appliances", "pressure-cookers", "Pressure cooker", "Beans, githeri and stews in a fraction of the time.", [["MIKA", "6L Smart Pressure Cooker", 8995, B("6L", "1000")], ["Ramtons", "5L Electric Pressure Cooker", 7995, B("5L", "900")], ["Von", "8L Smart Pressure Cooker", 10995, B("8L", "1200")]]],
  ["kitchen-appliances", "blenders", "Blender", "Smoothies, juices and sauces in seconds.", [["MIKA", "1.5L Blender", 3495, B("1.5L", "400")], ["Ramtons", "2L Blender with Grinder", 5995, B("2L", "600")], ["Von", "1.75L Blender", 4495, B("1.75L", "500")]]],
  ["kitchen-appliances", "kettles", "Kettle", "Boils water for tea in minutes.", [["MIKA", "1.7L Cordless Kettle", 1995, B("1.7L", "2200")], ["Ramtons", "1.8L Glass Kettle", 2995, B("1.8L", "2200")], ["Von", "1.5L Kettle", 1795, B("1.5L", "1800")]]],
  ["built-in", "built-in-ovens", "Built-in oven", "Even baking in a built-in oven.", [["MIKA", "60L Built-in Oven", 44995, B("60L", "2500")], ["Hisense", "70L Built-in Oven", 59995, B("70L", "3000")], ["Von", "65L Built-in Multifunction Oven", 54995, B("65L", "2800")]]],
  ["built-in", "built-in-hobs", "Built-in hob", "A sleek, easy-to-clean cooking surface.", [["MIKA", "4-Burner Built-in Gas Hob", 22995, B("4 burners")], ["Ramtons", "4-Zone Ceramic Hob", 34995, B("4 zones", "6000")], ["Von", "2-Zone Domino Hob", 17995, B("2 zones", "3000")]]],
  ["built-in", "built-in-microwaves", "Built-in microwave", "Frees counter space with a fitted microwave.", [["Samsung", "28L Built-in Microwave", 39995, B("28L", "900")], ["Hisense", "25L Built-in Microwave", 34995, B("25L", "900")], ["MIKA", "25L Built-in Microwave", 32995, B("25L", "900")]]],
  ["water-dispensers", "top-load-dispensers", "Top-load dispenser", "Hot and cold water on tap.", [["MIKA", "Hot & Cold Water Dispenser", 11995, B("Top-load")], ["Ramtons", "Hot & Normal Water Dispenser", 13995, B("Top-load")], ["Von", "Table-Top Water Dispenser", 9995, B("Top-load")]]],
  ["water-dispensers", "bottom-load-dispensers", "Bottom-load dispenser", "No lifting heavy bottles onto the top.", [["MIKA", "Bottom-Load Water Dispenser", 21995, B("Bottom-load")], ["Ramtons", "Bottom-Load Dispenser with Fridge", 24995, B("Bottom-load")], ["Hisense", "Bottom-Load Water Dispenser", 26995, B("Bottom-load")]]],
  ["cooling-heating", "fans", "Fan", "A cool breeze on hot days.", [["MIKA", "16\" Standing Fan", 3495, B("16\"", "45")], ["Ramtons", "16\" Wall Fan", 3995, B("16\"", "50")], ["Von", "Tower Fan", 6995, B("Tower", "60")]]],
  ["cooling-heating", "air-conditioners", "Air conditioner", "Quiet, efficient cooling for bedrooms and offices.", [["Hisense", "12,000 BTU Split Air Conditioner", 59995, B("12,000 BTU")], ["LG", "9,000 BTU Inverter Air Conditioner", 64995, B("9,000 BTU")], ["Samsung", "18,000 BTU Split Air Conditioner", 89995, B("18,000 BTU")]]],
  ["cooling-heating", "heaters", "Heater", "Warmth for cold Nairobi nights.", [["MIKA", "Oil-Filled Heater", 7995, B("7 fins", "1500")], ["Ramtons", "Fan Heater", 2995, B("Fan", "2000")], ["Von", "9-Fin Oil Heater", 8995, B("9 fins", "2000")]]],
  ["health-personal-care", "facial-steamers", "Facial steamer", "Spa-style facial care at home.", [["MIKA", "Facial Steamer", 3495, B("Steamer")], ["Ramtons", "Facial Sauna", 2995, B("Steamer")]]],
  ["health-personal-care", "scales", "Scale", "Track your weight accurately.", [["MIKA", "Digital Bathroom Scale", 1995, B("180kg")], ["Ramtons", "Glass Bathroom Scale", 2495, B("180kg")], ["Von", "Body Fat Scale", 1795, B("150kg")]]],
  ["health-personal-care", "clippers", "Clipper", "Neat haircuts and beard trims at home.", [["MIKA", "Hair Clipper", 1995, B("Cordless")], ["Ramtons", "Hair & Beard Trimmer", 2495, B("Cordless")], ["Von", "Professional Clipper", 2995, B("Corded")]]],
  ["health-personal-care", "hair-dryers", "Hair dryer", "Fast, gentle drying.", [["MIKA", "1200W Hair Dryer", 1995, B("Compact", "1200")], ["Ramtons", "2000W Hair Dryer", 2995, B("Salon", "2000")], ["Von", "2200W Ionic Hair Dryer", 3495, B("Salon", "2200")]]],
  ["health-personal-care", "straighteners", "Straightener", "Smooth, straight hair without salon visits.", [["MIKA", "Ceramic Hair Straightener", 2495, B("Ceramic")], ["Ramtons", "Hair Straightener", 2995, B("Ceramic")], ["Von", "Wide-Plate Straightener", 3495, B("Titanium")]]],
  ["health-personal-care", "shavers", "Shaver", "A close, comfortable shave.", [["MIKA", "Rotary Shaver", 2495, B("Cordless")], ["Ramtons", "Foil Shaver", 3995, B("Cordless")], ["Von", "Rechargeable Shaver", 2995, B("Cordless")]]],
  ["power-guards", "fridge-guards", "Fridge guard", "Protects your fridge compressor from power surges.", [["MIKA", "Fridge Guard", 1295, B("13A")], ["Ramtons", "Digital Fridge Guard", 1495, B("13A")], ["Von", "Fridge Guard", 1195, B("13A")]]],
  ["power-guards", "tv-guards", "TV guard", "Protects your TV and sound system from surges.", [["MIKA", "TV Guard", 1295, B("13A")], ["Ramtons", "Digital TV Guard", 1495, B("13A")], ["Von", "TV Guard with USB", 1595, B("13A")]]],
  ["power-guards", "extension-guards", "Surge extension", "Surge-protected sockets for all your electronics.", [["MIKA", "4-Way Surge Extension", 1795, B("4-way")], ["Ramtons", "6-Way Surge Extension", 2495, B("6-way")], ["Von", "4-Way Extension with USB", 1995, B("4-way")]]],
  ["home-cleaning", "vacuum-cleaners", "Vacuum cleaner", "Dust-free floors and carpets with less effort.", [["MIKA", "1400W Vacuum Cleaner", 9995, B("1.5L", "1400")], ["Ramtons", "15L Wet & Dry Vacuum", 12995, B("15L", "1200")], ["Samsung", "2000W Vacuum Cleaner", 24995, B("2L", "2000")]]],
  ["home-cleaning", "steam-mops", "Steam mop", "Cleans and sanitises floors with steam.", [["MIKA", "Steam Mop", 6995, B("350ml", "1300")], ["Ramtons", "Steam Mop", 8995, B("400ml", "1500")], ["Von", "2-in-1 Steam Mop", 7995, B("350ml", "1300")]]],
  ["kitchenware", "cookware", "Cookware set", "Non-stick pots and pans for everyday cooking.", [["MIKA", "7-Piece Non-Stick Cookware Set", 5995, B("7 pieces")], ["Ramtons", "10-Piece Cookware Set", 8995, B("10 pieces")], ["Von", "5-Piece Cookware Set", 4495, B("5 pieces")]]],
  ["kitchenware", "utensils", "Utensils", "The essentials for a well-equipped kitchen.", [["MIKA", "6-Piece Knife Set", 1995, B("6 pieces")], ["Ramtons", "Kitchen Utensil Set", 1495, B("8 pieces")], ["Von", "Silicone Utensil Set", 1295, B("6 pieces")]]],
  ["commercial", "commercial-dryers", "Commercial dryer", "Heavy-duty drying for laundromats and hotels.", [["MIKA", "20kg Commercial Tumble Dryer", 249995, B("20kg")]]],
  ["commercial", "commercial-ice-makers", "Commercial ice maker", "High-volume ice for hotels and bars.", [["Ramtons", "50kg Commercial Ice Maker", 149995, B("50kg/day")], ["MIKA", "60kg Commercial Ice Maker", 189995, B("60kg/day")], ["Von", "45kg Commercial Ice Maker", 129995, B("45kg/day")]]],
  ["commercial", "commercial-chillers", "Commercial chiller", "Upright display cooling for shops and supermarkets.", [["MIKA", "1000L Double-Door Upright Chiller", 149995, B("1000L")], ["Ramtons", "800L Upright Chiller", 129995, B("800L")], ["Hisense", "700L Upright Chiller", 119995, B("700L")]]],
];

const BRAND_CODE: Record<string, string> = { MIKA: "MK", LG: "LG", Samsung: "SS", Hisense: "HS", Ramtons: "RT", Von: "VN" };

function sampleSeeds(): Seed[] {
  let n = 0;
  return SAMPLES.flatMap(([category, sub, type, benefit, variants]) =>
    variants.map(([brand, name, price, specs]) => {
      n++;
      // Every fourth sample carries an offer so deal rows, badges and countdowns can be reviewed.
      const offer = n % 4 === 0 ? Math.round((price * 0.9) / 5) * 5 : undefined;
      return {
        name: `${brand} ${name}`,
        model: `${BRAND_CODE[brand] ?? "XX"}-SMP${String(n).padStart(3, "0")}`,
        brand,
        category,
        sub,
        type,
        specs,
        price,
        offer,
        stock: n % 13 === 0 ? 0 : (n * 7) % 9 + 1,
        benefit,
        pop: Math.max(1, 60 - (n % 50)),
        sample: true,
      } satisfies Seed;
    }),
  );
}

function describe(s: Seed) {
  const cap = s.wash && s.dry ? `${s.wash}kg wash / ${s.dry}kg dry` : s.wash ? `${s.wash}kg wash` : s.dry ? `${s.dry}kg dry` : "";
  const feats = s.features?.length ? ` Key features: ${s.features.join(", ")}.` : "";
  return `${s.benefit} ${cap ? `Capacity: ${cap}. ` : ""}${s.energy ? `Energy rating ${s.energy}. ` : ""}${s.motor && s.motor !== "Standard" ? `Powered by a ${s.motor} motor for quieter, longer-lasting operation. ` : ""}${feats} Final price and availability are confirmed when we confirm your order.`.trim();
}

function toRow(s: Seed, offerEnd: Date) {
  return {
    name: s.name,
    brand: s.brand ?? "MIKA",
    modelNumber: s.model,
    slug: slugify(`${s.name}-${s.model}`),
    category: s.category,
    subcategory: s.sub,
    type: s.type,
    specs: s.specs ?? {},
    washCapacityKg: s.wash ?? null,
    dryCapacityKg: s.dry ?? null,
    spinRpm: s.rpm ?? null,
    energyRating: s.energy ?? null,
    motor: s.motor ?? "Standard",
    features: s.features ?? [],
    warranty: s.warranty ?? (s.category === "washers" ? GENERAL : "1-year general warranty"),
    priceKsh: s.price,
    wasPriceKsh: s.was ?? null,
    competitorPriceKsh: s.competitor ?? null,
    competitorWasKsh: s.competitorWas ?? null,
    competitorCheckedAt: s.competitor ? PRD_CHECKED : null,
    offerPriceKsh: s.offer ?? null,
    offerStart: s.offer ? new Date() : null,
    offerEnd: s.offer ? offerEnd : null,
    offerBadge: s.offer ? "Sale" : null,
    stockQty: s.stock,
    lowStockAt: 2,
    colour: s.colour ?? null,
    dimensionsCm: s.dims ?? null,
    weightKg: s.weight ?? null,
    images: [],
    shortBenefit: s.benefit,
    description: describe(s),
    featured: !!s.featured,
    isSample: !!s.sample,
    popularity: s.pop ?? 0,
  };
}

// PRD section 10 example zones; admin-editable.
const ZONES = [
  { name: "Zone 1 — core Nairobi estates", fee: 500, freeAbove: 20000, goldFree: true, installFee: 0, podAllowed: true, leadTime: "Same or next day" },
  { name: "Zone 2 — wider Nairobi", fee: 800, freeAbove: null, goldFree: true, installFee: 0, podAllowed: true, leadTime: "Next day" },
  { name: "Zone 3 — Kiambu, Ruiru, Athi River, Ngong", fee: 1500, freeAbove: null, goldFree: false, installFee: 1000, podAllowed: false, leadTime: "1–2 days" },
  { name: "Upcountry — courier (fee confirmed by phone)", fee: 0, freeAbove: null, goldFree: false, installFee: 2500, podAllowed: false, leadTime: "2–5 days" },
];
const V1_ZONES = [
  "Nairobi — inner (CBD, Westlands, Kilimani, Lavington, Karen)",
  "Nairobi — outskirts (Rongai, Kitengela, Ruiru, Ngong)",
  "Kiambu, Thika, Machakos, Athi River",
  "Mombasa, Nakuru, Kisumu, Eldoret",
];

// Placeholder prices: set real ones in Admin → Delivery zones before launch.
const INSTALL = [
  { name: "Washer / dryer installation", category: "washers", price: 0 },
  { name: "TV wall mounting (bracket sold separately)", category: "tvs", price: 2000 },
  { name: "Cooker gas connection", category: "cookers", price: 1500 },
  { name: "Built-in appliance fitting", category: "built-in", price: 3000 },
  { name: "Air conditioner installation", category: "cooling-heating", price: 6000 },
];

const SUB_INTROS: Record<string, string> = {
  "washers/washer-dryers":
    "Washer-dryer combos suit apartments with no space to line-dry: one machine washes and dries, so clothes are wearable the same evening. They dry smaller loads than they wash (e.g. 10kg wash / 7kg dry).",
  "washers/tumble-dryers":
    "Heat-pump dryers use much less power, dry gently and need no vent pipe. Condenser dryers are a lower-cost way to dry in any weather. Large families pair a dryer with a 10–12kg front-load washer.",
};

const LEGACY_CATEGORIES =["combos", "dryers", "entry-washers", "microwaves"];

let seeded: Promise<void> | null = null;

export function ensureSeed() {
  if (!seeded) {
    seeded = runSeed().catch((e) => {
      seeded = null;
      throw e;
    });
  }
  return seeded;
}

async function runSeed() {
  // Idempotent: unique indexes + onConflictDoNothing make concurrent first runs safe.
  const [version] = await db.select().from(settings).where(eq(settings.key, "seedVersion")).limit(1);
  if (version?.value === SEED_VERSION) return;

  await db
    .insert(categories)
    .values(
      CATALOG.flatMap((c, i) => [
        { slug: c.slug, parent: null, name: c.name, menuOrder: i, isCore: c.core, intro: c.metaDesc, marginFloorPct: c.marginFloorPct },
        ...c.subs.map((s, j) => ({ slug: `${c.slug}/${s.slug}`, parent: c.slug, name: s.name, menuOrder: j, intro: SUB_INTROS[`${c.slug}/${s.slug}`] ?? null })),
      ]),
    )
    .onConflictDoNothing();

  const offerEnd = new Date(Date.now() + 14 * 86_400_000);
  const all = [...LAUNDRY, ...LAUNCH, ...sampleSeeds()];

  // v1 → v2: move existing products into the new category tree by model number.
  const existing = await db.select({ id: products.id, model: products.modelNumber, category: products.category, competitor: products.competitorPriceKsh }).from(products);
  for (const row of existing) {
    const s = all.find((x) => x.model === row.model);
    if (!s) {
      if (LEGACY_CATEGORIES.includes(row.category)) {
        const [category, sub] = row.category === "microwaves" ? ["kitchen-appliances", "microwaves"] : row.category === "dryers" ? ["washers", "tumble-dryers"] : row.category === "combos" ? ["washers", "washer-dryers"] : ["washers", "top-load"];
        await db.update(products).set({ category, subcategory: sub }).where(eq(products.id, row.id));
      }
      continue;
    }
    const set: Partial<typeof products.$inferInsert> = { category: s.category, subcategory: s.sub, type: s.type, isSample: !!s.sample };
    if (s.specs) set.specs = s.specs;
    if (s.competitor && row.competitor == null) {
      Object.assign(set, { priceKsh: s.price, wasPriceKsh: s.was ?? null, competitorPriceKsh: s.competitor, competitorWasKsh: s.competitorWas ?? null, competitorCheckedAt: PRD_CHECKED });
      if (s.was) Object.assign(set, { offerPriceKsh: null, offerStart: null, offerEnd: null, offerBadge: null });
    }
    await db.update(products).set(set).where(eq(products.id, row.id));
  }
  await db.insert(products).values(all.map((s) => toRow(s, offerEnd))).onConflictDoNothing();

  // Replace untouched v1 sample zones with the PRD zone structure.
  const [{ z }] = await db.select({ z: sql<number>`count(*)::int` }).from(deliveryZones);
  if (z > 0) await db.delete(deliveryZones).where(inArray(deliveryZones.name, V1_ZONES));
  const [{ z2 }] = await db.select({ z2: sql<number>`count(*)::int` }).from(deliveryZones);
  if (z2 === 0) await db.insert(deliveryZones).values(ZONES).onConflictDoNothing();

  const [{ i }] = await db.select({ i: sql<number>`count(*)::int` }).from(installServices);
  if (i === 0) await db.insert(installServices).values(INSTALL);

  await db.insert(settings).values({ key: "seedVersion", value: SEED_VERSION }).onConflictDoUpdate({ target: settings.key, set: { value: SEED_VERSION } });
}
