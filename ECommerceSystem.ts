// Products implementation
abstract class Product {
  protected name: string;
  protected price: number;
  protected quantity: number;

  constructor(name: string, price: number, quantity: number) {
    this.name = name;
    this.price = price;
    this.quantity = quantity;
  }

  getName(): string {
    return this.name;
  }
  getPrice(): number {
    return this.price;
  }
  getQuantity(): number {
    return this.quantity;
  }

  reduceQuantity(amount: number): void {
    if (amount > this.quantity) {
      throw new Error("Not enough stock available");
    }
    this.quantity -= amount;
  }

  abstract isExpired(): boolean;
  abstract requiresShipping(): boolean;
}

class ExpirableProduct extends Product {
  private expiryDate: Date;
  private requiresShippingFlag: boolean;
  private weight: number;

  constructor(
    name: string,
    price: number,
    quantity: number,
    expiryDate: Date,
    requiresShipping: boolean,
    weight: number
  ) {
    super(name, price, quantity);
    this.expiryDate = expiryDate;
    this.requiresShippingFlag = requiresShipping;
    this.weight = weight;
  }

  isExpired(): boolean {
    return new Date() > this.expiryDate;
  }

  requiresShipping(): boolean {
    return this.requiresShippingFlag;
  }

  getWeight(): number {
    return this.weight;
  }
}

class NonExpirableProduct extends Product {
  private requiresShippingFlag: boolean;
  private weight: number;

  constructor(
    name: string,
    price: number,
    quantity: number,
    requiresShipping: boolean,
    weight: number
  ) {
    super(name, price, quantity);
    this.requiresShippingFlag = requiresShipping;
    this.weight = weight;
  }

  isExpired(): boolean {
    return false;
  }

  requiresShipping(): boolean {
    return this.requiresShippingFlag;
  }

  getWeight(): number {
    return this.weight;
  }
}

// Cart implementation
class CartItem {
  private product: Product;
  private quantity: number;

  constructor(product: Product, quantity: number) {
    this.product = product;
    this.quantity = quantity;
  }

  getProduct(): Product {
    return this.product;
  }
  getQuantity(): number {
    return this.quantity;
  }
  getTotalPrice(): number {
    return this.product.getPrice() * this.quantity;
  }
}

class Customer {
  private name: string;
  private balance: number;

  constructor(name: string, balance: number) {
    this.name = name;
    this.balance = balance;
  }

  getName(): string {
    return this.name;
  }
  getBalance(): number {
    return this.balance;
  }

  deductBalance(amount: number): void {
    if (amount > this.balance) {
      throw new Error("Insufficient balance");
    }
    this.balance -= amount;
  }
}

class Cart {
  private items: CartItem[];

  constructor() {
    this.items = [];
  }

  add(product: Product, quantity: number): void {
    if (quantity > product.getQuantity()) {
      throw new Error("Requested quantity exceeds available stock");
    }

    // Check if product already exists in cart
    const existingItemIndex = this.items.findIndex(
      (item) => item.getProduct() === product
    );

    if (existingItemIndex !== -1) {
      const existingItem = this.items[existingItemIndex];
      const newQuantity = existingItem.getQuantity() + quantity;
      if (newQuantity > product.getQuantity()) {
        throw new Error("Total quantity in cart exceeds available stock");
      }
      this.items[existingItemIndex] = new CartItem(product, newQuantity);
    } else {
      this.items.push(new CartItem(product, quantity));
    }
  }

  getItems(): CartItem[] {
    return this.items;
  }
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.getTotalPrice(), 0);
  }
}

// Shipping implementation
interface Shippable {
  getName(): string;
  getWeight(): number;
}

class ShippableItem implements Shippable {
  private name: string;
  private weight: number;

  constructor(name: string, weight: number) {
    this.name = name;
    this.weight = weight;
  }

  getName(): string {
    return this.name;
  }
  getWeight(): number {
    return this.weight;
  }
}

class ShippingService {
  private static readonly SHIPPING_RATE_PER_KG: number = 30.0; // $30 per kg

  calculateShippingFee(items: Shippable[]): number {
    if (items.length === 0) return 0;

    const totalWeight = items.reduce((sum, item) => sum + item.getWeight(), 0);

    console.log("** Shipment notice **");
    items.forEach((item) => {
      console.log(`${item.getName()} ${Math.round(item.getWeight() * 1000)}g`);
    });
    console.log(`Total package weight ${totalWeight.toFixed(1)}kg`);

    return Math.ceil(totalWeight * ShippingService.SHIPPING_RATE_PER_KG);
  }
}

// E-commerce System
class ECommerceSystem {
  private shippingService: ShippingService;

  constructor() {
    this.shippingService = new ShippingService();
  }

  checkout(customer: Customer, cart: Cart): void {
    if (cart.isEmpty()) {
      throw new Error("Cart is empty");
    }

    // Validate cart items
    for (const item of cart.getItems()) {
      const product = item.getProduct();
      if (product.isExpired()) {
        throw new Error(`Product ${product.getName()} is expired`);
      }
      if (product.getQuantity() < item.getQuantity()) {
        throw new Error(`Product ${product.getName()} is out of stock`);
      }
    }

    const subtotal = cart.getSubtotal();

    // Collect shippable items
    const shippableItems: Shippable[] = [];
    for (const item of cart.getItems()) {
      const product = item.getProduct();
      if (product.requiresShipping()) {
        let weight = 0;
        if (product instanceof ExpirableProduct) {
          weight = product.getWeight();
        } else if (product instanceof NonExpirableProduct) {
          weight = product.getWeight();
        }

        for (let i = 0; i < item.getQuantity(); i++) {
          shippableItems.push(new ShippableItem(product.getName(), weight));
        }
      }
    }

    const shippingFees =
      this.shippingService.calculateShippingFee(shippableItems);
    const totalAmount = subtotal + shippingFees;

    if (customer.getBalance() < totalAmount) {
      throw new Error("Customer's balance is insufficient");
    }

    // Process payment and update inventory
    customer.deductBalance(totalAmount);

    for (const item of cart.getItems()) {
      item.getProduct().reduceQuantity(item.getQuantity());
    }

    // Print receipt
    console.log("** Checkout receipt **");
    for (const item of cart.getItems()) {
      console.log(
        `${item.getQuantity()}x ${item.getProduct().getName()} ${Math.round(
          item.getTotalPrice()
        )}`
      );
    }
    console.log("----------------------");
    console.log(`Subtotal ${Math.round(subtotal)}`);
    console.log(`Shipping ${Math.round(shippingFees)}`);
    console.log(`Amount ${Math.round(totalAmount)}`);
    console.log(
      `Customer balance after payment: ${customer.getBalance().toFixed(2)}`
    );
  }
}

// Helper function to create date from days offset
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Create products
const cheese = new ExpirableProduct(
  "Cheese",
  100,
  10,
  addDays(new Date(), 5),
  true,
  0.2
); // 200g

const biscuits = new ExpirableProduct(
  "Biscuits",
  150,
  15,
  addDays(new Date(), 30),
  true,
  0.7
); // 700g
const tv = new NonExpirableProduct("TV", 500, 5, true, 15.0); // 15kg
const scratchCard = new NonExpirableProduct(
  "Mobile Scratch Card",
  25,
  100,
  false,
  0.001
); // 1g

const customer = new Customer("John Doe", 1000.0);

const cart = new Cart();

try {
  cart.add(cheese, 2);
  // cart.add(tv, 3); // ====> if you uncomment this it will not show the receipt because the balance will be insufficient
  cart.add(biscuits, 1);
  cart.add(scratchCard, 1);

  const store = new ECommerceSystem();
  store.checkout(customer, cart);
} catch (error) {
  console.error("Error:", error instanceof Error ? error.message : error);
}
