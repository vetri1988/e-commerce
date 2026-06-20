export interface Product {
  id: string;
  name: string;
  brand: string;
  sku: string;
  hsnCode: string;
  gstPercentage: number;
  category: string;
  price: number;
  offerPrice: number;
  discountPercentage: number;
  stock: number;
  imageUrl: string;
  galleryUrls: string[];
  description: string;
  specifications: { [key: string]: string };
  features: string[];
  warranty: string;
  rating: number;
  ratingCount: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isDeal?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  itemCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minPurchase: number;
  expiryDate: string;
  isActive: boolean;
}

export interface ShippingAddress {
  fullName: string;
  companyName?: string;
  gstNumber?: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
}

export interface Order {
  id: string; // INV/2026/XXXX or similar
  orderNumber: string; // TCT-ORD-XXXXXX
  date: string;
  shippingAddress: ShippingAddress;
  items: {
    productId: string;
    name: string;
    sku: string;
    hsnCode: string;
    unitPriceExclTax: number;
    gstPercentage: number;
    quantity: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalAmount: number;
  }[];
  couponApplied?: {
    code: string;
    discountAmount: number;
  };
  subtotalExclTax: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
  paymentMethod: string;
  paymentReference: string;
  paymentStatus: 'Paid' | 'Pending' | 'COD';
  status: 'Pending' | 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
}

export interface Enquiry {
  id: string;
  productId?: string;
  productName?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  date: string;
  status: 'Pending' | 'Responded';
}

export interface GstReportItem {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerGst?: string;
  hsnCode: string;
  taxableValue: number;
  gstPercentage: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
}

export interface FlashMessage {
  enabled: boolean;
  text: string;
}

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  image: string;
  badge: string;
}

export interface CompanySettings {
  companyName: string;
  shortName: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
  whatsapp: string;
  adminPassword?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  enableCod?: boolean;
  flashMessage?: FlashMessage;
  heroSlides?: HeroSlide[];
  gstRates?: { value: number; label: string }[];
  colorTheme?: string;
  smtpSettings?: {
    enabled?: boolean;
    host: string;
    port: string;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
  };
}

