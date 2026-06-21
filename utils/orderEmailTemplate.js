/**
 * orderEmailTemplate.js
 * Order confirm hone ke baad customer ko jaane wali email
 * Professional & Production-Ready Design — ZeeDaddy
 *
 * @param {string} username  - customer ka naam
 * @param {Object} orders    - Mongoose order document
 * @returns {string}         - HTML string
 */
const OrderConfirmationEmail = (username, orders) => {
    const storeName  = process.env.STORE_NAME || 'Zeedaddy';
    const storeUrl   = process.env.STORE_URL  || '#';
    const year       = new Date().getFullYear();

    // ── Design Tokens ─────────────────────────────────────────────────────────
    const dark          = '#1a1a2e';
    const accent        = '#e94560';
    const emerald       = '#00c896';
    const amber         = '#ffb800';
    const pageBg        = '#f0f0f8';
    const cardBg        = '#ffffff';
    const surfaceBg     = '#f8f8fc';
    const borderColor   = '#ebebf5';
    const textDark      = '#0f0f1a';
    const textMid       = '#4a4a6a';
    const textLight     = '#8888aa';

    // ── Data ──────────────────────────────────────────────────────────────────
    const products = Array.isArray(orders?.products) ? orders.products : [];

    const subTotal = products.reduce((sum, item) => {
        const lineTotal = item?.subTotal
            ? Number(item.subTotal)
            : Number(item?.price || 0) * Number(item?.quantity || 1);
        return sum + lineTotal;
    }, 0);

    const shippingFee    = Number(orders?.shippingFee || 0);
    const deliveryFee    = Number(orders?.deliveryFee || 0);
    const discountAmount = Number(orders?.discount || orders?.discountAmount || orders?.couponDiscount || 0);
    const grandTotal     = Number(orders?.totalAmt || subTotal + shippingFee + deliveryFee - discountAmount);

    const formatINR = (n) =>
        Number(n).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

    const orderId   = orders?._id?.toString() || 'N/A';
    const shortId   = orderId.slice(-8).toUpperCase();
    const orderDate = orders?.date
        ? new Date(orders.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

    const payStatus  = orders?.payment_status || 'Pending';
    const isPaid     = payStatus?.toLowerCase() === 'paid';
    const badgeBg    = isPaid ? '#e6faf5' : '#fff8e6';
    const badgeColor = isPaid ? '#00a87a' : '#cc8800';
    const badgeDot   = isPaid ? emerald   : amber;

    // ── Product Rows ──────────────────────────────────────────────────────────
    const productRowsHtml = products.length > 0
        ? products.map((item, index) => {
            const name    = item?.productTitle || item?.name || 'Product';
            const qty     = Number(item?.quantity || 1);
            const lineAmt = item?.subTotal
                ? Number(item.subTotal)
                : Number(item?.price || 0) * qty;
            const image   = item?.image || (Array.isArray(item?.images) ? item.images[0] : '');
            const isFirst = index === 0;
            const isLast  = index === products.length - 1;

            return `
<tr>
  <td style="padding:${isFirst ? '8px 8px 4px' : isLast ? '4px 8px 8px' : '4px 8px'};">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:${cardBg};border:1px solid ${borderColor};border-radius:12px;">
      <tr>
        <td style="padding:14px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              ${image ? `
              <td style="width:52px;vertical-align:middle;padding-right:14px;">
                <img src="${image}" alt="${name}" width="52" height="52"
                     style="display:block;width:52px;height:52px;border-radius:10px;
                            object-fit:cover;border:1px solid ${borderColor};"/>
              </td>` : ''}
              <td style="vertical-align:middle;">
                <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:${textDark};line-height:1.3;">${name}</p>
                <p style="margin:0;font-size:11px;color:${textLight};line-height:1.5;">
                  ${item?.size  ? `Size: <strong style="color:${textMid};">${item.size}</strong>&nbsp;&nbsp;` : ''}
                  ${item?.color ? `Color: <strong style="color:${textMid};">${item.color}</strong>` : ''}
                </p>
              </td>
              <td style="vertical-align:middle;text-align:right;white-space:nowrap;padding-left:12px;">
                <span style="display:inline-block;background:${surfaceBg};color:${textMid};
                             font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;">
                  Qty: ${qty}
                </span>
                <p style="margin:5px 0 0;font-size:15px;font-weight:800;color:${accent};">${formatINR(lineAmt)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
        }).join('')
        : `<tr>
             <td style="padding:32px;text-align:center;color:${textLight};font-size:13px;">
               No products found.
             </td>
           </tr>`;

    // ── Totals ────────────────────────────────────────────────────────────────
    const discountRow = discountAmount > 0 ? `
<tr>
  <td style="padding:6px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="font-size:12px;color:${textLight};">
          Discount
          ${orders?.coupon ? `<span style="display:inline-block;background:${emerald}18;color:${emerald};font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px;margin-left:6px;text-transform:uppercase;">${orders.coupon}</span>` : ''}
        </td>
        <td style="text-align:right;font-size:12px;color:${emerald};font-weight:700;">-${formatINR(discountAmount)}</td>
      </tr>
    </table>
  </td>
</tr>` : '';

    const deliveryRow = deliveryFee > 0 ? `
<tr>
  <td style="padding:6px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="font-size:12px;color:${textLight};">Delivery Fee</td>
        <td style="text-align:right;font-size:12px;color:${textMid};font-weight:500;">${formatINR(deliveryFee)}</td>
      </tr>
    </table>
  </td>
</tr>` : '';

    // ── Template ──────────────────────────────────────────────────────────────
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Order Confirmed – ${storeName}</title>
</head>
<body style="margin:0;padding:0;background-color:${pageBg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  Order confirmed! Hi ${username}, your order #${shortId} is being processed.
</div>
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${pageBg};padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- ── LOGO ── -->
        <tr>
          <td style="padding-bottom:20px;text-align:center;">
            <table cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td style="background:${dark};padding:10px 28px;border-radius:50px;">
                  <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:2px;font-family:Georgia,serif;">
                    ${storeName.toUpperCase()}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── HERO ── -->
        <tr>
          <td style="background:${dark};border-radius:20px 20px 0 0;padding:48px 40px 36px;text-align:center;">
            <div style="display:inline-block;width:68px;height:68px;background:${accent};border-radius:50%;
                        line-height:68px;text-align:center;margin-bottom:18px;
                        box-shadow:0 8px 24px rgba(233,69,96,0.4);">
              <span style="font-size:30px;line-height:68px;display:inline-block;color:#fff;">✓</span>
            </div>
            <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#ffffff;font-family:Georgia,serif;line-height:1.2;">
              Order Confirmed!
            </h1>
            <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
              Hey <strong style="color:#ffffff;">${username}</strong>, thank you for shopping with us.<br/>
              Your order is confirmed and being processed.
            </p>
            <div style="display:inline-block;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);border-radius:50px;padding:10px 28px;">
              <p style="margin:0 0 3px;font-size:9px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;">Order ID</p>
              <p style="margin:0;font-size:16px;font-weight:800;color:#ffffff;letter-spacing:2px;font-family:'Courier New',monospace;">
                #${shortId}
              </p>
            </div>
          </td>
        </tr>

        <!-- ── META STRIP ── -->
        <tr>
          <td style="background:${cardBg};">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:16px 20px;text-align:center;border-right:1px solid ${borderColor};">
                  <p style="margin:0 0 4px;font-size:9px;color:${textLight};text-transform:uppercase;letter-spacing:1.5px;">Date</p>
                  <p style="margin:0;font-size:12px;font-weight:600;color:${textDark};">${orderDate}</p>
                </td>
                <td style="padding:16px 20px;text-align:center;border-right:1px solid ${borderColor};">
                  <p style="margin:0 0 6px;font-size:9px;color:${textLight};text-transform:uppercase;letter-spacing:1.5px;">Payment</p>
                  <span style="display:inline-block;background:${badgeBg};color:${badgeColor};font-size:10px;font-weight:700;padding:3px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">
                    <span style="display:inline-block;width:5px;height:5px;background:${badgeDot};border-radius:50%;margin-right:4px;vertical-align:middle;"></span>${payStatus}
                  </span>
                </td>
                <td style="padding:16px 20px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:9px;color:${textLight};text-transform:uppercase;letter-spacing:1.5px;">Delivery</p>
                  <p style="margin:0;font-size:12px;font-weight:600;color:${textDark};">3–5 Business Days</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── DIVIDER ── -->
        <tr>
          <td style="background:${cardBg};padding:0 20px;">
            <div style="height:1px;background:${borderColor};"></div>
          </td>
        </tr>

        <!-- ── PRODUCTS ── -->
        <tr>
          <td style="background:${pageBg};padding:16px 12px 8px;">
            <p style="margin:0 0 10px;font-size:9px;font-weight:700;color:${textLight};text-transform:uppercase;letter-spacing:2px;padding:0 4px;">
              Order Items
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${productRowsHtml}
            </table>
          </td>
        </tr>

        <!-- ── TOTALS ── -->
        <tr>
          <td style="background:${cardBg};padding:16px 20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:45%;"></td>
                <td style="width:55%;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="background:${surfaceBg};border-radius:12px;overflow:hidden;">

                    <!-- Subtotal -->
                    <tr>
                      <td style="padding:12px 16px 6px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size:12px;color:${textLight};">Subtotal</td>
                            <td style="text-align:right;font-size:12px;color:${textMid};font-weight:500;">${formatINR(subTotal)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Discount — always rendered, shows ₹0 if no discount -->
                    <tr>
                      <td style="padding:6px 16px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size:12px;color:${textLight};">
                              Discount
                              ${orders?.coupon ? `<span style="display:inline-block;background:${emerald}18;color:${emerald};font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px;margin-left:6px;text-transform:uppercase;">${orders.coupon}</span>` : ''}
                            </td>
                            <td style="text-align:right;font-size:12px;color:${discountAmount > 0 ? emerald : textLight};font-weight:${discountAmount > 0 ? '700' : '400'};">
                              ${discountAmount > 0 ? `-${formatINR(discountAmount)}` : '—'}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Shipping -->
                    <tr>
                      <td style="padding:6px 16px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size:12px;color:${textLight};">Shipping Fee</td>
                            <td style="text-align:right;font-size:12px;color:${shippingFee > 0 ? textMid : emerald};font-weight:${shippingFee > 0 ? '500' : '700'};">
                              ${shippingFee > 0 ? formatINR(shippingFee) : 'FREE'}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    ${deliveryRow}

                    <!-- Grand Total -->
                    <tr>
                      <td style="padding:10px 16px 14px;border-top:1px solid ${borderColor};">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size:13px;font-weight:700;color:${textDark};">Total Amount</td>
                            <td style="text-align:right;font-size:20px;font-weight:800;color:${accent};">${formatINR(grandTotal)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── ORDER JOURNEY ── -->
        <tr>
          <td style="background:${cardBg};padding:0 20px 24px;">
            <div style="background:${surfaceBg};border-radius:14px;padding:18px 20px;">
              <p style="margin:0 0 14px;font-size:9px;font-weight:700;color:${textLight};text-transform:uppercase;letter-spacing:2px;">
                Order Journey
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Confirmed -->
                  <td style="text-align:center;width:22%;">
                    <div style="width:34px;height:34px;background:${accent};border-radius:50%;margin:0 auto 6px;line-height:34px;text-align:center;">
                      <span style="color:#fff;font-size:14px;font-weight:700;line-height:34px;display:inline-block;">✓</span>
                    </div>
                    <p style="margin:0;font-size:9px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:0.5px;">Confirmed</p>
                  </td>
                  <td style="padding-bottom:18px;">
                    <div style="height:2px;background:linear-gradient(to right,${accent},${borderColor});border-radius:2px;"></div>
                  </td>
                  <!-- Processing -->
                  <td style="text-align:center;width:22%;">
                    <div style="width:34px;height:34px;background:${dark};border-radius:50%;margin:0 auto 6px;line-height:34px;text-align:center;">
                      <span style="color:rgba(255,255,255,0.4);font-size:14px;line-height:34px;display:inline-block;">⚙</span>
                    </div>
                    <p style="margin:0;font-size:9px;font-weight:600;color:${textLight};text-transform:uppercase;letter-spacing:0.5px;">Processing</p>
                  </td>
                  <td style="padding-bottom:18px;">
                    <div style="height:2px;background:${borderColor};border-radius:2px;"></div>
                  </td>
                  <!-- Shipped -->
                  <td style="text-align:center;width:22%;">
                    <div style="width:34px;height:34px;background:${pageBg};border:2px solid ${borderColor};border-radius:50%;margin:0 auto 6px;line-height:30px;text-align:center;">
                      <span style="color:${textLight};font-size:14px;line-height:30px;display:inline-block;">📦</span>
                    </div>
                    <p style="margin:0;font-size:9px;font-weight:600;color:${textLight};text-transform:uppercase;letter-spacing:0.5px;">Shipped</p>
                  </td>
                  <td style="padding-bottom:18px;">
                    <div style="height:2px;background:${borderColor};border-radius:2px;"></div>
                  </td>
                  <!-- Delivered -->
                  <td style="text-align:center;width:22%;">
                    <div style="width:34px;height:34px;background:${pageBg};border:2px solid ${borderColor};border-radius:50%;margin:0 auto 6px;line-height:30px;text-align:center;">
                      <span style="color:${textLight};font-size:14px;line-height:30px;display:inline-block;">🏠</span>
                    </div>
                    <p style="margin:0;font-size:9px;font-weight:600;color:${textLight};text-transform:uppercase;letter-spacing:0.5px;">Delivered</p>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- ── CTA ── -->
        <tr>
          <td style="background:${cardBg};padding:0 20px 32px;text-align:center;">
            <a href="${storeUrl}/my-orders"
               style="display:inline-block;background:${dark};color:#ffffff;font-size:14px;
                      font-weight:700;padding:14px 44px;border-radius:50px;text-decoration:none;
                      letter-spacing:0.5px;">
              Track My Order →
            </a>
            <p style="margin:14px 0 0;font-size:12px;color:${textLight};">
              Need help?&nbsp;<a href="mailto:support@${storeName.toLowerCase()}.in" style="color:${accent};text-decoration:none;font-weight:700;">Contact Support</a>
            </p>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="background:${dark};border-radius:0 0 20px 20px;padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:top;">
                  <p style="margin:0 0 2px;font-size:15px;font-weight:800;color:#ffffff;font-family:Georgia,serif;">${storeName}</p>
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">Online Shopping App</p>
                </td>
                <td style="text-align:right;vertical-align:top;">
                  <a href="${storeUrl}"
                     style="display:inline-block;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.65);
                            font-size:11px;font-weight:600;padding:7px 16px;border-radius:20px;text-decoration:none;">
                    Visit Store
                  </a>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
                  <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.25);line-height:1.8;text-align:center;">
                    © ${year} ${storeName}. All rights reserved.<br/>
                    This is an automated email — please do not reply directly.<br/>
                    <a href="${storeUrl}/unsubscribe" style="color:rgba(255,255,255,0.25);text-decoration:underline;">Unsubscribe</a>
                    &nbsp;·&nbsp;
                    <a href="${storeUrl}/privacy" style="color:rgba(255,255,255,0.25);text-decoration:underline;">Privacy Policy</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="height:40px;"></td></tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
};

export default OrderConfirmationEmail;