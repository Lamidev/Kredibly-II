import crypto from "crypto";
import { prisma } from "../config/db";
import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { InitializeCheckoutInput } from "../validators/order.validator";
import { EmailService } from "./email.service";
import { NombaService } from "./nomba.service";
import { PushService } from "./push.service";
import { calculateShippingFee } from "../utils/shipping";

export class OrderService {
  /**
   * Preview/validate a promo code during checkout
   */
  static async validatePromoPreview(
    storeSlug: string,
    code: string,
    subtotal: number
  ) {
    const store = await prisma.store.findUnique({
      where: { slug: storeSlug.toLowerCase().trim() },
      select: { id: true },
    });
    if (!store) {
      throw new AppError("Store not found", 404);
    }

    const cleanCode = code.trim().toUpperCase();
    const promo = await prisma.promoCode.findUnique({
      where: { storeId_code: { storeId: store.id, code: cleanCode } },
    });

    if (!promo || !promo.isActive) {
      throw new AppError("Invalid or inactive promo code", 400);
    }
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new AppError("This promo code has expired", 400);
    }
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      throw new AppError("This promo code has reached its usage limit", 400);
    }
    const minOrder = promo.minOrderAmount ? Number(promo.minOrderAmount) : 0;
    if (minOrder > 0 && subtotal < minOrder) {
      throw new AppError(
        `Minimum order of ₦${minOrder.toLocaleString()} required for this promo code`,
        400
      );
    }

    const rawDiscount =
      promo.discountType === "PERCENTAGE"
        ? Math.round(subtotal * (Number(promo.discountValue) / 100) * 100) / 100
        : Number(promo.discountValue);
    const discountAmount = Math.min(subtotal, Math.max(0, rawDiscount));

    return {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      discountAmount,
    };
  }
  /**
   * Initialize a checkout order and request Nomba payment authorization
   */
  static async initializeCheckout(input: InitializeCheckoutInput) {
    // 1. Resolve store and wallet
    const store = await prisma.store.findUnique({
      where: { slug: input.storeSlug.toLowerCase().trim() },
      include: { wallet: true },
    });

    if (!store) {
      throw new AppError("Store not found", 404);
    }

    if (!store.wallet) {
      throw new AppError("Store wallet is not initialized", 400);
    }

    // 2. Fetch and validate all items & prices from database
    let subtotal = 0;
    const validatedItems: Array<{
      productId: string;
      variantId?: string | null;
      productTitle: string;
      variantName?: string | null;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }> = [];

    for (const item of input.items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, storeId: store.id, isActive: true },
        include: { variants: true },
      });

      if (!product) {
        throw new AppError(`Product not available or has been removed`, 400);
      }

      let unitPrice = Number(product.basePrice);
      let variantName: string | null = null;
      let availableStock = product.stockQuantity;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new AppError(`Selected variant not found for ${product.title}`, 400);
        }
        unitPrice = Number(variant.price);
        variantName = variant.name;
        availableStock = variant.stockQuantity;
      }

      if (availableStock < item.quantity) {
        throw new AppError(
          `Sorry, only ${availableStock} unit(s) of "${product.title}" are left in stock`,
          400
        );
      }

      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      validatedItems.push({
        productId: product.id,
        variantId: item.variantId || null,
        productTitle: product.title,
        variantName,
        unitPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    // 3. Upsert Customer by Phone Number & Store
    const cleanPhone = input.customer.phoneNumber.trim();
    const customer = await prisma.customer.upsert({
      where: {
        storeId_phoneNumber: {
          storeId: store.id,
          phoneNumber: cleanPhone,
        },
      },
      update: {
        fullName: input.customer.fullName.trim(),
        address: input.customer.address.trim(),
        state: input.customer.state.trim(),
        city: input.customer.city?.trim() || null,
        email: input.customer.email?.trim() || null,
      },
      create: {
        storeId: store.id,
        fullName: input.customer.fullName.trim(),
        phoneNumber: cleanPhone,
        address: input.customer.address.trim(),
        state: input.customer.state.trim(),
        city: input.customer.city?.trim() || null,
        email: input.customer.email?.trim() || null,
      },
    });

    // 4. Generate unique Order Number & Payment Reference
    const orderNumber = `KRD-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
    const paymentRef = `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Server-side Shipping, Promo Discount & Protection Fee Calculation
    const shippingFee = calculateShippingFee(
      store.shippingConfig,
      input.customer.state,
      subtotal
    );

    let appliedPromoCode: string | null = null;
    let discountAmount = 0;

    if (input.promoCode && input.promoCode.trim()) {
      const promoResult = await OrderService.validatePromoPreview(
        store.slug,
        input.promoCode,
        subtotal
      );
      appliedPromoCode = promoResult.code;
      discountAmount = promoResult.discountAmount;
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    // Nomba DVA fee: max(₦10, min(₦150, 1% of amount)). On Pro & Business with passFeeToCustomer, buyer covers this DVA fee so merchant gets 100%.
    let protectionFee = 0;
    if (store.subscriptionTier !== "STARTER" && store.passFeeToCustomer) {
      const baseCharge = discountedSubtotal + shippingFee;
      protectionFee = Math.max(
        10,
        Math.min(150, Math.round(baseCharge * 0.01 * 100) / 100)
      );
    }
    const totalAmount = discountedSubtotal + shippingFee + protectionFee;

    // 6. Create Order and OrderItems (and atomically increment promo usage if applied)
    const order = await prisma.$transaction(async (tx) => {
      if (appliedPromoCode) {
        const promoRecord = await tx.promoCode.findUnique({
          where: {
            storeId_code: { storeId: store.id, code: appliedPromoCode },
          },
        });
        if (!promoRecord || !promoRecord.isActive) {
          throw new AppError("Promo code is no longer valid", 400);
        }
        if (
          promoRecord.maxUses !== null &&
          promoRecord.usedCount >= promoRecord.maxUses
        ) {
          throw new AppError("Promo code usage limit reached", 400);
        }
        await tx.promoCode.update({
          where: { id: promoRecord.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return tx.order.create({
        data: {
          orderNumber,
          storeId: store.id,
          customerId: customer.id,
          subtotal,
          shippingFee,
          discountAmount,
          promoCode: appliedPromoCode,
          totalAmount,
          orderStatus: "PENDING",
          paymentStatus: "UNPAID",
          paymentRef,
          notes: input.notes?.trim() || null,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productTitle: item.productTitle,
              variantName: item.variantName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });
    });

    const customerEmail =
      input.customer.email || `customer-${customer.id}@kredibly.internal`;

    // 7. Handle Payment Method: Bank Transfer (Nomba DVA) vs Card Checkout
    if (input.paymentMethod === "BANK_TRANSFER") {
      let virtualAccount: {
        accountNumber: string;
        bankName: string;
        accountName: string;
        reference: string;
        expiresAt: string;
      };

      try {
        if (ENV.NOMBA_CLIENT_ID && ENV.NOMBA_PRIVATE_KEY && ENV.NOMBA_ACCOUNT_ID) {
          virtualAccount = await NombaService.createDynamicVirtualAccount({
            amount: totalAmount,
            orderNumber,
            merchantName: store.name,
            customerEmail,
          });

          // Update order with Nomba virtual account reference
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentRef: virtualAccount.reference },
          });
        } else {
          // Dev fallback test virtual account
          virtualAccount = {
            accountNumber: `99${orderNumber.replace(/\D/g, "").padEnd(8, "0").slice(0, 8)}`,
            bankName: "Nombank MFB (Dev Mode)",
            accountName: `Kredibly / ${store.name}`,
            reference: paymentRef,
            expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          };
        }
      } catch (err: any) {
        console.warn("Nomba DVA creation fallback triggered:", err.message);
        virtualAccount = {
          accountNumber: `99${orderNumber.replace(/\D/g, "").padEnd(8, "0").slice(0, 8)}`,
          bankName: "Nombank MFB (Dev Mode)",
          accountName: `Kredibly / ${store.name}`,
          reference: paymentRef,
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        };
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentRef: virtualAccount.reference,
        totalAmount,
        paymentMethod: "BANK_TRANSFER",
        virtualAccount,
      };
    }

    // 8. Checkout Authorization (Nomba Hosted Checkout)
    let authorizationUrl = "";

    if (ENV.NOMBA_CLIENT_ID && ENV.NOMBA_PRIVATE_KEY && ENV.NOMBA_ACCOUNT_ID) {
      try {
        authorizationUrl = await NombaService.createCheckoutOrder({
          amount: totalAmount,
          orderReference: paymentRef,
          customerEmail,
          customerName: customer.fullName,
          callbackUrl: `${ENV.FRONTEND_URL}/${store.slug}/orders/${orderNumber}`,
        });
      } catch (err: any) {
        console.error("Nomba checkout initialization error:", err.message);
        throw new AppError("Payment gateway initialization failed. Try again.", 502);
      }
    } else {
      // Development simulated fallback URL
      authorizationUrl = `${ENV.FRONTEND_URL}/${store.slug}/orders/${orderNumber}?simulated=true&ref=${paymentRef}`;
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentRef: order.paymentRef,
      totalAmount,
      paymentMethod: "CARD",
      authorizationUrl,
    };
  }

  /**
   * Complete payment (used by Nomba webhook & dev simulator)
   */
  static async completePayment(paymentReference: string) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find Order by payment reference or orderNumber
      const order = await tx.order.findFirst({
        where: {
          OR: [
            { paymentRef: paymentReference },
            { orderNumber: paymentReference },
          ],
        },
        include: {
          items: true,
          customer: true,
          store: {
            include: { wallet: true, owner: true },
          },
        },
      });

      if (!order) {
        throw new AppError("Order with this payment reference not found", 404);
      }

      // Idempotency: If already paid, return existing order
      if (order.paymentStatus === "PAID") {
        return {
          success: true,
          message: "Order is already paid",
          order,
          items: order.items,
          customer: order.customer,
          owner: order.store.owner,
          storeName: order.store.name,
          alreadyPaid: true,
        };
      }

      // Atomically claim the order so concurrent webhook + polling calls cannot double-credit
      const claimed = await tx.order.updateMany({
        where: {
          id: order.id,
          paymentStatus: { not: "PAID" },
        },
        data: {
          orderStatus: "PAID",
          paymentStatus: "PAID",
        },
      });

      if (claimed.count === 0) {
        return {
          success: true,
          message: "Order is already paid",
          order: { ...order, orderStatus: "PAID", paymentStatus: "PAID" },
          items: order.items,
          customer: order.customer,
          owner: order.store.owner,
          storeName: order.store.name,
          alreadyPaid: true,
        };
      }

      // 2. Atomically decrement stock for all products and variants
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // 3. Load updated order record
      const updatedOrder = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
      });

      // 4. Calculate net revenue and fee:
      //    - Paid tiers (PRO / BUSINESS): 0% Kredibly commission; only Nomba DVA fee = max(₦10, min(₦150, 1%))
      //    - Starter tier: 2.5% Kredibly commission (min ₦10 floor to cover Nomba DVA fee)
      const totalAmount = Number(order.totalAmount);
      const orderBaseAmount =
        Math.max(0, Number(order.subtotal) - Number(order.discountAmount || 0)) +
        Number(order.shippingFee || 0);
      let platformFee = 0;
      let netAmount = 0;

      if (totalAmount > orderBaseAmount) {
        // Buyer covered the Nomba DVA fee at checkout — Merchant gets 100% of product + shipping!
        platformFee = Math.round((totalAmount - orderBaseAmount) * 100) / 100;
        netAmount = orderBaseAmount;
      } else if (order.store.subscriptionTier === "STARTER") {
        platformFee = Math.min(
          totalAmount,
          Math.max(10, Math.round(totalAmount * 0.025 * 100) / 100)
        );
        netAmount = Math.round((totalAmount - platformFee) * 100) / 100;
      } else {
        // Paid tier absorbing gateway fee: 0% Kredibly commission, only Nomba DVA fee
        const nombaDvaFee = Math.max(
          10,
          Math.min(150, Math.round(totalAmount * 0.01 * 100) / 100)
        );
        platformFee = Math.min(totalAmount, nombaDvaFee);
        netAmount = Math.round((totalAmount - platformFee) * 100) / 100;
      }

      // 5. Create Transaction audit record
      const walletId = order.store.wallet!.id;
      await tx.transaction.create({
        data: {
          walletId,
          orderId: order.id,
          amount: totalAmount,
          platformFee,
          netAmount,
          type: "SALE",
          status: "COMPLETED",
          reference: paymentReference,
        },
      });

      // 6. Deposit net amount directly into Merchant Available Balance
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          availableBalance: {
            increment: netAmount,
          },
        },
      });

      return {
        success: true,
        message: "Payment processed and available balance credited",
        order: updatedOrder,
        items: order.items,
        customer: order.customer,
        owner: order.store.owner,
        storeName: order.store.name,
        storeSlug: order.store.slug,
        storeEmail: order.store.contactEmail,
        netAmount,
        alreadyPaid: false,
      };
    });

    // 7. Asynchronously dispatch confirmation emails on fresh payment (non-blocking)
    if (!result.alreadyPaid) {
      const itemsSummary = result.items
        ? result.items.map((i: any) => `${i.productTitle} (x${i.quantity})`).join(", ")
        : `Order #${result.order.orderNumber}`;
      const deliveryAddress = result.customer
        ? [result.customer.address, result.customer.city, result.customer.state]
            .filter(Boolean)
            .join(", ")
        : undefined;

      if (result.customer?.email) {
        EmailService.sendOrderReceiptToCustomer({
          to: result.customer.email,
          customerName: result.customer.fullName,
          orderNumber: result.order.orderNumber,
          storeName: result.storeName,
          storeSlug: result.storeSlug,
          storeEmail: result.storeEmail,
          totalAmount: Number(result.order.totalAmount),
          shippingFee: Number(result.order.shippingFee || 0),
          discountAmount: Number(result.order.discountAmount || 0),
          deliveryAddress,
          customerPhone: result.customer.phoneNumber,
          items: result.items?.map((i: any) => ({
            productTitle: i.productTitle,
            variantName: i.variantName,
            quantity: i.quantity,
            subtotal: Number(i.subtotal),
          })),
          itemsSummary,
        }).catch((err) => console.error("Customer email dispatch failed:", err));
      }

      if (result.owner?.email) {
        EmailService.sendNewSaleAlertToMerchant({
          to: result.owner.email,
          merchantName: result.owner.fullName,
          storeName: result.storeName,
          orderNumber: result.order.orderNumber,
          customerName: result.customer.fullName,
          customerPhone: result.customer.phoneNumber,
          deliveryAddress,
          itemsSummary,
          totalAmount: Number(result.order.totalAmount),
          netAmount: result.netAmount,
        }).catch((err) => console.error("Merchant alert dispatch failed:", err));
      }

      const formattedOrderTotal = Number(result.order.totalAmount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      PushService.sendStorePush(result.order.storeId, {
        title: `New Paid Order #${result.order.orderNumber}`,
        body: `${result.storeName} · ₦${formattedOrderTotal} from ${result.customer.fullName}`,
        url: "/dashboard/orders",
      }).catch((err) => console.error("Push notification failed:", err));
    }

    return {
      success: true,
      message: result.message,
      order: result.order,
    };
  }

  /**
   * Get public order receipt and status by order number
   * Automatically reconciles pending Nomba DVA transfers so auto-detect & "I Have Transferred" work even if webhook delivery was delayed
   */
  static async getOrderDetails(orderNumber: string) {
    let order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: { images: true, slug: true },
            },
          },
        },
        customer: {
          select: {
            fullName: true,
            phoneNumber: true,
            address: true,
            city: true,
            state: true,
          },
        },
        store: {
          select: {
            name: true,
            slug: true,
            whatsappNumber: true,
            currency: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (
      order.paymentStatus !== "PAID" &&
      order.paymentRef &&
      order.paymentRef.startsWith("KRD-")
    ) {
      const isPaidOnNomba = await NombaService.verifyVirtualAccountPayment(
        order.paymentRef,
        Number(order.totalAmount)
      );
      if (isPaidOnNomba) {
        await OrderService.completePayment(order.paymentRef);
        const refreshed = await prisma.order.findUnique({
          where: { orderNumber },
          include: {
            items: {
              include: {
                product: {
                  select: { images: true, slug: true },
                },
              },
            },
            customer: {
              select: {
                fullName: true,
                phoneNumber: true,
                address: true,
                city: true,
                state: true,
              },
            },
            store: {
              select: {
                name: true,
                slug: true,
                whatsappNumber: true,
                currency: true,
              },
            },
          },
        });
        if (refreshed) {
          order = refreshed;
        }
      }
    }

    return order;
  }
}
