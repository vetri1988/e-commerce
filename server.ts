import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import { Product, Category, Order, Coupon, ShippingAddress, Enquiry } from './src/types';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Ensure local uploads directory exists and mount it
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Database Helpers
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading database", error);
  }
  return { products: [], categories: [], orders: [], coupons: [], enquiries: [], users: [] };
}

function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing database", error);
  }
}

// ==================== API ENDPOINTS ====================

// --- Local Uploads Management ---
app.get('/api/uploads', (req, res) => {
  try {
    const listDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(listDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(listDir);
    // Filter to only common image types just in case
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'];
    const imageFiles = files.filter(file => 
      imageExtensions.includes(path.extname(file).toLowerCase())
    ).map(filename => ({
      filename,
      url: `/uploads/${filename}`,
      size: fs.statSync(path.join(listDir, filename)).size,
      createdAt: fs.statSync(path.join(listDir, filename)).birthtime
    }));
    res.json(imageFiles);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to read local storage directory' });
  }
});

app.post('/api/upload', (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ error: 'Filename (name) and raw base64 contents (data) are required' });
    }

    // Strip out base64 visual header metadata if exists
    const cleanedBase64 = data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanedBase64, 'base64');
    
    // Generate secure clean unique filename
    const sanitizedName = name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(sanitizedName) || '.png';
    const base = path.basename(sanitizedName, ext);
    const filename = `img-${base}-${Date.now()}${ext}`;
    
    const writePath = path.join(process.cwd(), 'uploads', filename);
    fs.writeFileSync(writePath, buffer);
    
    res.status(201).json({
      success: true,
      url: `/uploads/${filename}`,
      filename
    });
  } catch (err: any) {
    console.error('Error in local file write:', err);
    res.status(500).json({ error: 'Failed to write image locally', details: err.message });
  }
});

app.delete('/api/uploads/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    // Prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const filePath = path.join(process.cwd(), 'uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Image successfully deleted from local filesystem' });
    } else {
      res.status(404).json({ error: 'Specified upload image not found locally' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete local image', details: err.message });
  }
});

// --- Products CRUD ---
app.get('/api/products', (req, res) => {
  const db = loadDb();
  let results = [...db.products];

  // Search filter
  const search = req.query.search as string;
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  // Category filter
  const category = req.query.category as string;
  if (category) {
    results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  // Brand filter
  const brand = req.query.brand as string;
  if (brand) {
    results = results.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  }

  // Min/Max Price filter
  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);
  if (!isNaN(minPrice)) results = results.filter(p => p.offerPrice >= minPrice);
  if (!isNaN(maxPrice)) results = results.filter(p => p.offerPrice <= maxPrice);

  // Sorting
  const sort = req.query.sort as string;
  if (sort === 'price-low') {
    results.sort((a, b) => a.offerPrice - b.offerPrice);
  } else if (sort === 'price-high') {
    results.sort((a, b) => b.offerPrice - a.offerPrice);
  } else if (sort === 'rating') {
    results.sort((a, b) => b.rating - a.rating);
  }

  res.json(results);
});

app.post('/api/products', (req, res) => {
  const db = loadDb();
  const newProduct: Product = {
    id: 'prod-' + Date.now(),
    name: req.body.name,
    brand: req.body.brand,
    sku: req.body.sku || 'SKU-' + Math.floor(Math.random() * 100000),
    hsnCode: req.body.hsnCode || '84713010',
    gstPercentage: req.body.gstPercentage || 18,
    category: req.body.category || 'Accessories',
    price: Number(req.body.price),
    offerPrice: Number(req.body.offerPrice || req.body.price),
    discountPercentage: Math.round(((Number(req.body.price) - Number(req.body.offerPrice || req.body.price)) / Number(req.body.price)) * 100) || 0,
    stock: Number(req.body.stock || 0),
    imageUrl: req.body.imageUrl || 'https://picsum.photos/seed/tech/1000/1000',
    galleryUrls: req.body.galleryUrls || [req.body.imageUrl || 'https://picsum.photos/seed/tech/1000/1000'],
    description: req.body.description || '',
    specifications: req.body.specifications || {},
    features: req.body.features || [],
    warranty: req.body.warranty || '1 Year Brand Warranty',
    rating: 5.0,
    ratingCount: 1,
    isFeatured: !!req.body.isFeatured,
    isNewArrival: !!req.body.isNewArrival,
    isDeal: !!req.body.isDeal,
  };

  db.products.push(newProduct);
  saveDb(db);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  const index = db.products.findIndex((p: Product) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const existing = db.products[index];
  const price = Number(req.body.price ?? existing.price);
  const offerPrice = Number(req.body.offerPrice ?? existing.offerPrice);
  const discountPercentage = Math.round(((price - offerPrice) / price) * 100) || 0;

  db.products[index] = {
    ...existing,
    name: req.body.name ?? existing.name,
    brand: req.body.brand ?? existing.brand,
    sku: req.body.sku ?? existing.sku,
    hsnCode: req.body.hsnCode ?? existing.hsnCode,
    gstPercentage: req.body.gstPercentage ?? existing.gstPercentage,
    category: req.body.category ?? existing.category,
    price,
    offerPrice,
    discountPercentage,
    stock: Number(req.body.stock ?? existing.stock),
    imageUrl: req.body.imageUrl ?? existing.imageUrl,
    galleryUrls: req.body.galleryUrls ?? existing.galleryUrls,
    description: req.body.description ?? existing.description,
    specifications: req.body.specifications ?? existing.specifications,
    features: req.body.features ?? existing.features,
    warranty: req.body.warranty ?? existing.warranty,
    isFeatured: req.body.isFeatured !== undefined ? !!req.body.isFeatured : existing.isFeatured,
    isNewArrival: req.body.isNewArrival !== undefined ? !!req.body.isNewArrival : existing.isNewArrival,
    isDeal: req.body.isDeal !== undefined ? !!req.body.isDeal : existing.isDeal,
  };

  saveDb(db);
  res.json(db.products[index]);
});

app.delete('/api/products/:id', (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  const filtered = db.products.filter((p: Product) => p.id !== id);

  if (filtered.length === db.products.length) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.products = filtered;
  saveDb(db);
  res.json({ success: true, message: 'Product deleted' });
});


// --- Categories ---
app.get('/api/categories', (req, res) => {
  const db = loadDb();
  res.json(db.categories || []);
});

app.post('/api/categories', (req, res) => {
  const db = loadDb();
  const slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newCategory: Category = {
    id: 'cat-' + Date.now(),
    name: req.body.name,
    slug,
    imageUrl: req.body.imageUrl || 'https://picsum.photos/seed/category/400/400',
    itemCount: 0
  };
  db.categories.push(newCategory);
  saveDb(db);
  res.status(201).json(newCategory);
});


// --- Coupons ---
app.get('/api/coupons', (req, res) => {
  const db = loadDb();
  res.json(db.coupons || []);
});

app.post('/api/coupons', (req, res) => {
  const db = loadDb();
  const newCoupon: Coupon = {
    id: 'coup-' + Date.now(),
    code: req.body.code.toUpperCase(),
    discountType: req.body.discountType,
    discountValue: Number(req.body.discountValue),
    minPurchase: Number(req.body.minPurchase || 0),
    expiryDate: req.body.expiryDate,
    isActive: true
  };
  db.coupons.push(newCoupon);
  saveDb(db);
  res.status(201).json(newCoupon);
});

app.delete('/api/coupons/:id', (req, res) => {
  const db = loadDb();
  db.coupons = db.coupons.filter((c: Coupon) => c.id !== req.params.id);
  saveDb(db);
  res.json({ success: true });
});

app.post('/api/coupons/apply', (req, res) => {
  const db = loadDb();
  const { code, cartTotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const coupon = db.coupons.find((c: Coupon) => c.code === code.toUpperCase() && c.isActive);
  if (!coupon) {
    return res.status(400).json({ error: 'Invalid or deactivated coupon code' });
  }

  // Check expiry
  if (new Date(coupon.expiryDate) < new Date()) {
    return res.status(400).json({ error: 'This coupon has expired' });
  }

  // Check min order value
  if (cartTotal < coupon.minPurchase) {
    return res.status(400).json({ error: `Minimum purchase of ₹${coupon.minPurchase} required` });
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((cartTotal * coupon.discountValue) / 100);
  } else {
    discountAmount = coupon.discountValue;
  }

  res.json({
    code: coupon.code,
    discountAmount: Math.min(discountAmount, cartTotal),
    discountType: coupon.discountType,
    discountValue: coupon.discountValue
  });
});


// --- Product Enquiries ---
app.post('/api/enquiries', (req, res) => {
  const db = loadDb();
  const newEnquiry: Enquiry = {
    id: 'enq-' + Date.now(),
    productId: req.body.productId,
    productName: req.body.productName,
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    message: req.body.message,
    date: new Date().toISOString(),
    status: 'Pending'
  };
  db.enquiries.push(newEnquiry);
  saveDb(db);
  res.status(201).json(newEnquiry);
});

app.get('/api/enquiries', (req, res) => {
  const db = loadDb();
  res.json(db.enquiries || []);
});


// --- USER ACCOUNT MANAGEMENT ---
app.get('/api/users', (req, res) => {
  const db = loadDb();
  res.json(db.users || []);
});

app.post('/api/users/register', (req, res) => {
  const db = loadDb();
  db.users = db.users || [];
  
  const { name, email, password, phone, address, city, state, pincode, gstin } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  
  const exists = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'A user with this email address already exists' });
  }
  
  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    password,
    phone: phone || '',
    address: address || '',
    city: city || '',
    state: state || 'Tamil Nadu',
    pincode: pincode || '',
    gstin: gstin || '',
    createdAt: new Date().toISOString()
  };
  
  db.users.push(newUser);
  saveDb(db);
  
  const { password: _, ...userSafe } = newUser;
  res.status(201).json(userSafe);
});

app.post('/api/users/login', (req, res) => {
  const db = loadDb();
  db.users = db.users || [];
  
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email address or passcode' });
  }
  
  const { password: _, ...userSafe } = user;
  res.json(userSafe);
});

app.put('/api/users/:id', (req, res) => {
  const db = loadDb();
  db.users = db.users || [];
  const { id } = req.params;
  const { name, email, password, phone, address, city, state, pincode, gstin } = req.body;

  const userIdx = db.users.findIndex((u: any) => u.id === id);
  if (userIdx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (email) {
    const emailConflict = db.users.some(
      (u: any) => u.id !== id && u.email.toLowerCase() === email.toLowerCase()
    );
    if (emailConflict) {
      return res.status(400).json({ error: 'Email address already in use' });
    }
  }

  const existing = db.users[userIdx];
  const updatedUser = {
    ...existing,
    name: name !== undefined ? name : existing.name,
    email: email !== undefined ? email : existing.email,
    password: password !== undefined ? password : existing.password,
    phone: phone !== undefined ? phone : existing.phone,
    address: address !== undefined ? address : existing.address,
    city: city !== undefined ? city : existing.city,
    state: state !== undefined ? state : existing.state,
    pincode: pincode !== undefined ? pincode : existing.pincode,
    gstin: gstin !== undefined ? gstin : existing.gstin,
  };

  db.users[userIdx] = updatedUser;
  saveDb(db);

  const { password: _, ...userSafe } = updatedUser;
  res.json(userSafe);
});


// --- Orders Billing / GST Calculation and Checkout ---
app.get('/api/orders', (req, res) => {
  const db = loadDb();
  res.json(db.orders || []);
});

app.put('/api/orders/status', (req, res) => {
  const db = loadDb();
  const { id, status, paymentStatus } = req.body;
  const index = db.orders.findIndex((o: any) => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (status !== undefined) db.orders[index].status = status;
  if (paymentStatus !== undefined) db.orders[index].paymentStatus = paymentStatus;
  saveDb(db);
  res.json(db.orders[index]);
});

app.put('/api/orders/:id/status', (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  const { status, paymentStatus } = req.body;
  const index = db.orders.findIndex((o: any) => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (status !== undefined) db.orders[index].status = status;
  if (paymentStatus !== undefined) db.orders[index].paymentStatus = paymentStatus;
  saveDb(db);
  res.json(db.orders[index]);
});

// --- Carts (Active / Abandoned) Management ---
app.get('/api/carts', (req, res) => {
  const db = loadDb();
  res.json(db.carts || []);
});

app.post('/api/carts', (req, res) => {
  const db = loadDb();
  db.carts = db.carts || [];
  
  const { id, userId, userEmail, userPhone, fullName, items, totalAmount, status } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Cart ID is required' });
  }

  const existingIdx = db.carts.findIndex((c: any) => c.id === id);
  const now = new Date().toISOString();

  if (existingIdx !== -1) {
    const existing = db.carts[existingIdx];
    db.carts[existingIdx] = {
      ...existing,
      userId: userId || existing.userId,
      userEmail: userEmail || existing.userEmail,
      userPhone: userPhone || existing.userPhone,
      fullName: fullName || existing.fullName,
      items: items || existing.items,
      totalAmount: totalAmount !== undefined ? totalAmount : existing.totalAmount,
      status: status || existing.status,
      updatedAt: now
    };
    saveDb(db);
    res.json(db.carts[existingIdx]);
  } else {
    const newCart = {
      id,
      userId: userId || null,
      userEmail: userEmail || null,
      userPhone: userPhone || null,
      fullName: fullName || null,
      items: items || [],
      totalAmount: totalAmount || 0,
      status: status || 'active',
      createdAt: now,
      updatedAt: now
    };
    db.carts.push(newCart);
    saveDb(db);
    res.status(201).json(newCart);
  }
});

app.delete('/api/carts/:id', (req, res) => {
  const db = loadDb();
  db.carts = db.carts || [];
  db.carts = db.carts.filter((c: any) => c.id !== req.params.id);
  saveDb(db);
  res.json({ success: true });
});

// Create Order (Calculates exact Indian GST compliant tax invoice)
app.post('/api/orders', (req, res) => {
  try {
    const db = loadDb();
    const { shippingAddress, items, paymentMethod, paymentReference, couponApplied, cartId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in the cart' });
    }

    // 1. Calculate GST components according to Indian Rules (intra-state vs inter-state)
    // Seller State: Tamil Nadu.
    // Intra-state standard splits: CGST (9%) + SGST (9%) for overall 18% GST.
    // Inter-state standard split: IGST (18%) overall.
    const billingState = (shippingAddress.state || '').trim().toLowerCase();
    const isIntrastate = billingState === 'tamil nadu' || billingState === 'tamilnadu';

    // We assign dynamic sequence Invoice No. and Order No.
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const financialYearStart = currentMonth >= 3 ? currentYear : currentYear - 1;
    const financialYearEnd = financialYearStart + 1;
    const financialYearLabel = `${financialYearStart}-${financialYearEnd.toString().slice(-2)}`;
    
    const startDate = new Date(financialYearStart, 3, 1); // April 1st of financial year
    const endDate = new Date(financialYearEnd, 3, 1); // April 1st of next year
    
    const countInYear = (db.orders || []).filter(o => {
        const oDate = new Date(o.date);
        return oDate >= startDate && oDate < endDate;
    }).length + 1;

    const invoiceId = `INV/${financialYearLabel}/${String(countInYear).padStart(4, '0')}`;
    const orderNo = `CROM-ORD-${100000 + Math.floor(Math.random() * 900000)}`;

    let calculatedItems = [];
    let subtotalExclTax = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalDiscount = couponApplied ? Number(couponApplied.discountAmount || 0) : 0;

    // Let's loop items to determine pricing on original values & apply proportional coupon discount
    // Find products in DB to get real price & HSN options
    let originalGrossTotal = 0;
    const validatedItems = items.map((ci: any) => {
      const prod = db.products.find((p: any) => p.id === ci.productId);
      if (!prod) throw new Error(`Product not found: ${ci.productId}`);
      originalGrossTotal += prod.offerPrice * ci.quantity;
      return { prod, quantity: ci.quantity };
    });

  for (const { prod, quantity } of validatedItems) {
    // Proportional discount distribution across products to calculate accurate tax base
    const shareOfTotal = originalGrossTotal > 0 ? (prod.offerPrice * quantity) / originalGrossTotal : 0;
    const itemDiscount = Math.round(totalDiscount * shareOfTotal);
    const itemTotalPaid = (prod.offerPrice * quantity) - itemDiscount;

    // GST calculations are backward calculated from paid values (inclusive of taxes)
    const gstRate = prod.gstPercentage || 18;
    const baseValue = itemTotalPaid / (1 + gstRate / 100);
    const itemTax = itemTotalPaid - baseValue;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isIntrastate) {
      cgst = parseFloat((itemTax / 2).toFixed(2));
      sgst = parseFloat((itemTax / 2).toFixed(2));
    } else {
      igst = parseFloat(itemTax.toFixed(2));
    }

    subtotalExclTax += parseFloat(baseValue.toFixed(2));
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;

    calculatedItems.push({
      productId: prod.id,
      name: prod.name,
      sku: prod.sku,
      hsnCode: prod.hsnCode,
      unitPriceExclTax: parseFloat((baseValue / quantity).toFixed(2)),
      gstPercentage: gstRate,
      quantity,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalAmount: itemTotalPaid
    });

    // Reduce stock in DB
    const dbProd = db.products.find((p: Product) => p.id === prod.id);
    if (dbProd) {
      dbProd.stock = Math.max(0, dbProd.stock - quantity);
    }
  }

  // Save totals in precise precision
  subtotalExclTax = parseFloat(subtotalExclTax.toFixed(2));
  totalCgst = parseFloat(totalCgst.toFixed(2));
  totalSgst = parseFloat(totalSgst.toFixed(2));
  totalIgst = parseFloat(totalIgst.toFixed(2));
  const totalTax = parseFloat((totalCgst + totalSgst + totalIgst).toFixed(2));
  const grandTotal = parseFloat((subtotalExclTax + totalTax).toFixed(2));

  const newOrder: Order = {
    id: invoiceId,
    orderNumber: orderNo,
    date: new Date().toISOString(),
    shippingAddress,
    items: calculatedItems,
    couponApplied: couponApplied ? {
      code: couponApplied.code,
      discountAmount: totalDiscount
    } : undefined,
    subtotalExclTax,
    totalCgst,
    totalSgst,
    totalIgst,
    totalTax,
    grandTotal,
    paymentMethod: paymentMethod || 'Cards/UPI (Razorpay Gateway)',
    paymentReference: paymentReference || `pay_${Math.random().toString(36).substring(2, 16)}`,
    paymentStatus: paymentMethod === 'COD' ? 'COD' : 'Paid',
    status: 'Confirmed'
  };

  db.orders.push(newOrder);

  if (cartId) {
    db.carts = db.carts || [];
    const idx = db.carts.findIndex((c: any) => c.id === cartId);
    if (idx !== -1) {
      db.carts[idx].status = 'ordered';
      db.carts[idx].updatedAt = new Date().toISOString();
    }
  }

  saveDb(db);

  if (db.settings?.email) {
    console.log(`[SYSTEM NOTIFICATION] New order received (${orderNo}). Email triggered to administrative support email (${db.settings.email}).`);

    const smtpUser = db.settings?.smtpSettings?.user || process.env.SMTP_USER;
    const smtpPass = db.settings?.smtpSettings?.pass || process.env.SMTP_PASS;
    const isSmtpEnabled = db.settings?.smtpSettings?.enabled;

    if (isSmtpEnabled && smtpUser && smtpPass) {
      if (smtpUser === 'your-email@gmail.com' || smtpPass === 'your-app-password') {
        console.log('[SYSTEM NOTIFICATION] Default dummy SMTP credentials detected. Skipping email sending.');
      } else {
        const transporter = nodemailer.createTransport({
          host: db.settings?.smtpSettings?.host || process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(db.settings?.smtpSettings?.port || process.env.SMTP_PORT || '587'),
          secure: db.settings?.smtpSettings?.secure !== undefined ? db.settings.smtpSettings.secure : (process.env.SMTP_SECURE === 'true'),
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const mailOptions = {
          from: db.settings?.smtpSettings?.from || process.env.SMTP_FROM || process.env.SMTP_USER || '"Store Admin" <noreply@yourstore.com>',
          to: `${shippingAddress.email}, ${db.settings.email}`,
          subject: `Order Confirmation - ${orderNo}`,
          text: `Hello ${shippingAddress.fullName},

Your order (${orderNo}) has been successfully placed.
Total Amount: ₹${grandTotal.toFixed(2)}

Thank you for your purchase!`,
          html: `<h3>Order Confirmation</h3>
                 <p><strong>Order No:</strong> ${orderNo}</p>
                 <p><strong>Customer:</strong> ${shippingAddress.fullName}</p>
                 <p><strong>Total Amount:</strong> ₹${grandTotal.toFixed(2)}</p>
                 <br>
                 <p>Thank you for shopping with us!</p>`
        };

        transporter.sendMail(mailOptions).then(info => {
          console.log('[SYSTEM NOTIFICATION] Order email sent:', info.messageId);
        }).catch(err => {
          if (err.message && err.message.includes('Invalid login')) {
            console.error('[SYSTEM NOTIFICATION] Invalid SMTP login. If using Gmail, you must configure an App Password inside the Admin Panel. Regular passwords will fail.');
          } else {
            console.error('[SYSTEM NOTIFICATION] Error sending email:', err.message || err);
          }
        });
      }
    } else {
      console.log('[SYSTEM NOTIFICATION] SMTP credentials not set or SMTP is disabled in database settings. Email sending skipped.');
    }
  }

  return res.status(201).json(newOrder);
  } catch (error: any) {
    console.error("Order creation failed.", error);
    return res.status(500).json({ error: error.message || "Failed to create order" });
  }
});


// --- Razorpay Real Gateway Order Integration ---
app.post('/api/razorpay/create-order', async (req, res) => {
  const { amount, currency } = req.body;
  const db = loadDb();
  
  // Try loading from env first, fallback to DB dynamic settings
  let keyId = process.env.RAZORPAY_KEY_ID || db.settings?.razorpayKeyId || "";
  let keySecret = process.env.RAZORPAY_KEY_SECRET || db.settings?.razorpayKeySecret || "";

  keyId = keyId.trim();
  keySecret = keySecret.trim();

  if (!keyId || !keySecret) {
    // Return simulator flag with dummy clean Razorpay structured keys so the front-end works 
    // seamlessly in sandbox/dev mode and shows instructions on how to set real credentials.
    return res.json({
      isSimulated: true,
      keyId: "rzp_test_placeholder_csk_yellow",
      orderId: `order_sim_${Math.random().toString(36).substring(2, 16)}`,
      amount: Math.round((amount || 1) * 100),
      currency: currency || 'INR'
    });
  }

  try {
    const amountInPaise = Math.round((amount || 1) * 100);
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: currency || 'INR',
        receipt: `rcpt_${Date.now()}`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Razorpay Error Response:', errorText);
      return res.status(response.status).json({
        error: 'Razorpay API returned an error',
        details: errorText,
        isSimulated: true, // Failover gracefully
        keyId,
        orderId: `order_sim_err_${Math.random().toString(36).substring(2, 16)}`
      });
    }

    const data = await response.json();
    return res.json({
      isSimulated: false,
      keyId,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency
    });
  } catch (error: any) {
    console.error('Razorpay Order Creation Exception:', error);
    return res.status(500).json({
      error: 'Failed to communicate with Razorpay. Check server logs.',
      details: error.message,
      isSimulated: true,
      keyId: keyId || "rzp_test_placeholder_csk_yellow",
      orderId: `order_sim_catch_${Math.random().toString(36).substring(2, 16)}`
    });
  }
});


// --- Dashboard Analytics & GST reporting API ---
app.get('/api/analytics', (req, res) => {
  const db = loadDb();
  const orders: Order[] = db.orders || [];
  const products: Product[] = db.products || [];

  // Metrics
  const totalSales = orders
    .filter(o => o.paymentStatus === 'Paid' || o.status === 'Delivered')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const totalOrders = orders.length;
  const totalProducts = products.length;
  
  // Unique customers by email phone or name (combined)
  const uniqueEmails = new Set(orders.map(o => o.shippingAddress.email.toLowerCase()));
  const totalCustomers = uniqueEmails.size || 1; // At least seeds or test customers

  // Low stock alerts (stock < 5)
  const lowStockProducts = products.filter(p => p.stock < 5).map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    stock: p.stock
  }));

  // Gst Reports and Hsn Summaries
  let hsnSummaryMap: { [key: string]: { taxableVal: number, cgst: number, sgst: number, igst: number, totalTax: number, salesQty: number, totalVal: number } } = {};
  let monthlySalesReport: { [key: string]: { sales: number, count: number } } = {};

  orders.forEach((o: Order) => {
    // Grouping by Month
    const date = new Date(o.date);
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!monthlySalesReport[monthKey]) {
      monthlySalesReport[monthKey] = { sales: 0, count: 0 };
    }
    monthlySalesReport[monthKey].sales += o.grandTotal;
    monthlySalesReport[monthKey].count += 1;

    // HSN aggregation
    o.items.forEach(item => {
      const hsn = item.hsnCode || '84713010';
      if (!hsnSummaryMap[hsn]) {
        hsnSummaryMap[hsn] = { taxableVal: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, salesQty: 0, totalVal: 0 };
      }
      const itemTaxable = parseFloat((item.unitPriceExclTax * item.quantity).toFixed(2));
      
      const isTamilNadu = o.shippingAddress?.state?.trim().toLowerCase() === 'tamil nadu' || o.shippingAddress?.state?.trim().toLowerCase() === 'tamilnadu';
      const itemTaxAmount = item.totalAmount - itemTaxable;
      
      const cgstAmt = item.cgstAmount !== undefined ? item.cgstAmount : (isTamilNadu ? itemTaxAmount / 2 : 0);
      const sgstAmt = item.sgstAmount !== undefined ? item.sgstAmount : (isTamilNadu ? itemTaxAmount / 2 : 0);
      const igstAmt = item.igstAmount !== undefined ? item.igstAmount : (!isTamilNadu ? itemTaxAmount : 0);

      hsnSummaryMap[hsn].taxableVal += itemTaxable;
      hsnSummaryMap[hsn].cgst += cgstAmt;
      hsnSummaryMap[hsn].sgst += sgstAmt;
      hsnSummaryMap[hsn].igst += igstAmt;
      hsnSummaryMap[hsn].totalTax += (cgstAmt + sgstAmt + igstAmt);
      hsnSummaryMap[hsn].salesQty += item.quantity;
      hsnSummaryMap[hsn].totalVal += item.totalAmount;
    });
  });

  const hsnSummaryList = Object.entries(hsnSummaryMap).map(([hsn, stats]) => ({
    hsnCode: hsn,
    taxableValue: parseFloat(stats.taxableVal.toFixed(2)),
    cgst: parseFloat(stats.cgst.toFixed(2)),
    sgst: parseFloat(stats.sgst.toFixed(2)),
    igst: parseFloat(stats.igst.toFixed(2)),
    totalTax: parseFloat(stats.totalTax.toFixed(2)),
    salesQty: stats.salesQty,
    totalVal: parseFloat(stats.totalVal.toFixed(2))
  }));

  res.json({
    metrics: {
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalOrders,
      totalProducts,
      totalCustomers,
      lowStockCount: lowStockProducts.length
    },
    lowStockAlerts: lowStockProducts,
    monthlySalesReport: Object.entries(monthlySalesReport).map(([month, data]) => ({
      month,
      sales: parseFloat(data.sales.toFixed(2)),
      count: data.count
    })),
    hsnSummary: hsnSummaryList
  });
});


// --- Store & Company Settings endpoints ---
app.get('/api/settings', (req, res) => {
  const db = loadDb();
  const defaults = {
    companyName: "CromaTech India Private Limited",
    shortName: "CromaTech Depot",
    address: "No. 12, GST Road, Guindy, Chennai, Tamil Nadu, 600032",
    gstin: "33AAAAA1111A1Z1",
    phone: "+91 80 4920 1000",
    email: "orders@cromatech.co.in",
    whatsapp: "918049201000",
    adminPassword: "admin",
    razorpayKeyId: "",
    razorpayKeySecret: "",
    enableCod: true,
    flashMessage: {
      enabled: false,
      text: ""
    },
    gstRates: [
      { value: 18, label: "18% (Standard Electronics)" },
      { value: 12, label: "12% (IT / Power accessories)" },
      { value: 28, label: "28% (Luxury Electronic panels)" },
      { value: 5, label: "5% (Specialised scientific parts)" }
    ],
    colorTheme: "csk"
  };

  if (!db.settings) {
    db.settings = defaults;
    saveDb(db);
  } else {
    // Merge newer keys if they don't exist
    let modified = false;
    if (db.settings.razorpayKeyId === undefined) {
      db.settings.razorpayKeyId = "";
      modified = true;
    }
    if (db.settings.razorpayKeySecret === undefined) {
      db.settings.razorpayKeySecret = "";
      modified = true;
    }
    if (db.settings.enableCod === undefined) {
      db.settings.enableCod = true;
      modified = true;
    }
    if (db.settings.gstRates === undefined) {
      db.settings.gstRates = defaults.gstRates;
      modified = true;
    }
    if (db.settings.colorTheme === undefined) {
      db.settings.colorTheme = "csk";
      modified = true;
    }
    if (modified) {
      saveDb(db);
    }
  }

  res.json(db.settings);
});

app.post('/api/settings', (req, res) => {
  const db = loadDb();
  const { companyName, shortName, address, gstin, phone, email, whatsapp, adminPassword, razorpayKeyId, razorpayKeySecret, enableCod, flashMessage, heroSlides, gstRates, colorTheme, smtpSettings } = req.body;

  db.settings = {
    companyName: companyName || "CromaTech India Private Limited",
    shortName: shortName || "CromaTech Depot",
    address: address || "No. 12, GST Road, Guindy, Chennai, Tamil Nadu, 600032",
    gstin: gstin || "33AAAAA1111A1Z1",
    phone: phone || "+91 80 4920 1000",
    email: email || "orders@cromatech.co.in",
    whatsapp: whatsapp || "918049201000",
    adminPassword: adminPassword || "admin",
    razorpayKeyId: razorpayKeyId !== undefined ? razorpayKeyId : (db.settings?.razorpayKeyId || ""),
    razorpayKeySecret: razorpayKeySecret !== undefined ? razorpayKeySecret : (db.settings?.razorpayKeySecret || ""),
    enableCod: enableCod !== undefined ? !!enableCod : true,
    flashMessage: flashMessage || db.settings?.flashMessage || { enabled: false, text: "" },
    heroSlides: heroSlides || db.settings?.heroSlides || [],
    gstRates: gstRates || db.settings?.gstRates || [
      { value: 18, label: "18% (Standard Electronics)" },
      { value: 12, label: "12% (IT / Power accessories)" },
      { value: 28, label: "28% (Luxury Electronic panels)" },
      { value: 5, label: "5% (Specialised scientific parts)" }
    ],
    colorTheme: colorTheme || db.settings?.colorTheme || "csk",
    smtpSettings: smtpSettings || db.settings?.smtpSettings
  };

  saveDb(db);
  res.json({ success: true, settings: db.settings });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const db = loadDb();
  const defaults = {
    companyName: "CromaTech India Private Limited",
    shortName: "CromaTech Depot",
    address: "No. 12, GST Road, Guindy, Chennai, Tamil Nadu, 600032",
    gstin: "33AAAAA1111A1Z1",
    phone: "+91 80 4920 1000",
    email: "orders@cromatech.co.in",
    whatsapp: "918049201000",
    adminPassword: "admin"
  };

  const currentSettings = db.settings || defaults;
  const storedPassword = currentSettings.adminPassword || "admin";

  if (password === storedPassword) {
    res.json({ success: true, message: "Authentication successful" });
  } else {
    res.status(401).json({ success: false, error: "Incorrect administrative security password. Verification failed." });
  }
});


// Ensure backups directory exists
const backupsDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Helper to verify admin password for database operations specifically
function checkAdminAuth(password: string): boolean {
  return password === "securebase";
}

// 1. POST /api/db/backups - List backups
app.post('/api/db/backups', (req, res) => {
  const { password } = req.body;
  if (!checkAdminAuth(password)) {
    return res.status(401).json({ success: false, error: 'Incorrect administrative security password. Authorization failed.' });
  }
  try {
    if (!fs.existsSync(backupsDir)) {
      return res.json({ success: true, backups: [] });
    }
    const files = fs.readdirSync(backupsDir);
    const backupFiles = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ success: true, backups: backupFiles });
  } catch (error) {
    console.error('List backups failed:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve backups list' });
  }
});

// 2. POST /api/db/backup - Create backup
app.post('/api/db/backup', (req, res) => {
  const { password } = req.body;
  if (!checkAdminAuth(password)) {
    return res.status(401).json({ success: false, error: 'Incorrect administrative security password. Authorization failed.' });
  }
  try {
    const db = loadDb();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.json`;
    const backupFilePath = path.join(backupsDir, backupFileName);
    
    fs.writeFileSync(backupFilePath, JSON.stringify(db, null, 2), 'utf8');
    
    res.json({
      success: true,
      message: `Backup created successfully as ${backupFileName}`,
      filename: backupFileName,
      dbContent: db
    });
  } catch (error) {
    console.error('Backup database failed:', error);
    res.status(500).json({ success: false, error: 'Failed to create database backup copy' });
  }
});

// 3. POST /api/db/restore - Restore database
app.post('/api/db/restore', (req, res) => {
  const { password, filename, customData } = req.body;
  if (!checkAdminAuth(password)) {
    return res.status(401).json({ success: false, error: 'Incorrect administrative security password. Authorization failed.' });
  }
  try {
    let targetData: any = null;
    
    if (customData) {
      targetData = typeof customData === 'string' ? JSON.parse(customData) : customData;
    } else if (filename) {
      const backupFilePath = path.join(backupsDir, filename);
      if (!fs.existsSync(backupFilePath)) {
        return res.status(404).json({ success: false, error: 'Backup file not found on server disk.' });
      }
      const fileContent = fs.readFileSync(backupFilePath, 'utf8');
      targetData = JSON.parse(fileContent);
    } else {
      return res.status(400).json({ success: false, error: 'No data or backup file specified for restoration.' });
    }

    if (!targetData || (!targetData.products && !targetData.orders && !targetData.settings)) {
      return res.status(400).json({ success: false, error: 'Invalid database backup structure. Root keys are missing.' });
    }

    saveDb(targetData);
    res.json({ success: true, message: 'Database successfully restored and loaded on the server!' });
  } catch (error) {
    console.error('Restore database failed:', error);
    res.status(500).json({ success: false, error: 'Failed to restore database. Parse or internal disk write error.' });
  }
});

// 4. POST /api/db/clear - Clear database
app.post('/api/db/clear', (req, res) => {
  const { password } = req.body;
  if (!checkAdminAuth(password)) {
    return res.status(401).json({ success: false, error: 'Incorrect administrative security password. Authorization failed.' });
  }
  try {
    const db = loadDb();
    
    // Clear catalog and core transaction data, keep current settings to avoid lockout
    db.products = [];
    db.categories = [
      { id: "cat-1", name: "Laptops", imageUrl: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=400&q=80" },
      { id: "cat-2", name: "Mobile Phones", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80" },
      { id: "cat-3", name: "Accessories", imageUrl: "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=400&q=80" }
    ];
    db.orders = [];
    db.coupons = [];
    db.enquiries = [];
    
    saveDb(db);
    res.json({ success: true, message: 'Database successfully cleared of all catalog listings, orders, coupons, and enquiries!' });
  } catch (error) {
    console.error('Clear database failed:', error);
    res.status(500).json({ success: false, error: 'Failed to reset database.' });
  }
});


// --- Email Invoice with attached PDF ---
app.post('/api/orders/email', async (req, res) => {
  try {
    const { orderEmail, orderId, pdfBase64 } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    if (!orderEmail) {
      return res.status(400).json({ error: 'Recipient customer email is required' });
    }
    if (!pdfBase64) {
      return res.status(400).json({ error: 'Generated PDF base64 content is required' });
    }

    const db = loadDb();
    const order = db.orders.find((o: any) => o.id === orderId || o.orderNumber === orderId);
    if (!order) {
      return res.status(404).json({ error: `Order for ID "${orderId}" was not found in database registry.` });
    }

    const smtpUser = db.settings?.smtpSettings?.user || process.env.SMTP_USER;
    const smtpPass = db.settings?.smtpSettings?.pass || process.env.SMTP_PASS;
    const isSmtpEnabled = db.settings?.smtpSettings?.enabled;

    if (!isSmtpEnabled || !smtpUser || !smtpPass) {
      return res.status(400).json({ error: 'SMTP mailing is not enabled or credentials are missing. Please configure SMTP credentials inside the Admin Settings Panel first.' });
    }

    // Prepare transporter
    const transporter = nodemailer.createTransport({
      host: db.settings?.smtpSettings?.host || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(db.settings?.smtpSettings?.port || process.env.SMTP_PORT || '587'),
      secure: db.settings?.smtpSettings?.secure !== undefined ? db.settings.smtpSettings.secure : (process.env.SMTP_SECURE === 'true'),
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const fromAddress = db.settings?.smtpSettings?.from || process.env.SMTP_FROM || process.env.SMTP_USER || '"Store Admin" <noreply@yourstore.com>';
    const companyName = db.settings?.companyName || "Our Store";

    const mailOptions = {
      from: fromAddress,
      to: orderEmail,
      subject: `Compliant Tax Invoice for Order ${order.orderNumber} - ${companyName}`,
      text: `Dear ${order.shippingAddress.fullName || 'Customer'},\n\nPlease find the official GST compliant tax invoice PDF attached for your purchase order ${order.orderNumber}.\n\nOrder Total: ₹${order.grandTotal.toLocaleString('en-IN')}\nPayment Status: ${order.paymentStatus}\nShipment Status: ${order.status}\n\nThank you for shopping with ${companyName}.\n\nRegards,\nCustomer Support Team\n${companyName}`,
      html: `<h3>Tax Invoice / Bill of Supply</h3>
             <p>Dear <strong>${order.shippingAddress.fullName || 'Customer'}</strong>,</p>
             <p>Please find the official GST compliant tax invoice PDF attached for your purchase order <strong>${order.orderNumber}</strong>.</p>
             <ul>
               <li><strong>Order Amount:</strong> ₹${order.grandTotal.toLocaleString('en-IN')}</li>
               <li><strong>Payment Method:</strong> ${order.paymentMethod}</li>
               <li><strong>Payment Status:</strong> ${order.paymentStatus}</li>
               <li><strong>Shipment Status:</strong> ${order.status}</li>
             </ul>
             <br/>
             <p>Thank you for shopping with us!</p>
             <br/>
             <p>Regards,<br/><strong>${companyName} Support</strong></p>`,
      attachments: [
        {
          filename: `invoice_${order.orderNumber}.pdf`,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Emailed integrated invoice ${order.orderNumber} successfully to ${orderEmail}: ${info.messageId}`);
    res.json({ success: true, message: `Invoice PDF successfully sent to ${orderEmail}` });

  } catch (error: any) {
    console.error('Failed to send invoice email:', error);
    if (error.message && error.message.includes('Invalid login')) {
      return res.status(401).json({ error: 'SMTP Authorization failed. Please verify that you configured a valid Gmail App Password inside admin panel settings.' });
    }
    res.status(500).json({ error: error.message || 'SMTP operation or transmission failed.' });
  }
});

// ==================== VITE & FRONTEND INTEGRATION ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets compiled by vite
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CromaTech Electronics Server running on http://0.0.0.0:${PORT} in env: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
