/**
 * orderEmailTemplate.js
 * Order confirm hone ke baad customer ko jaane wali email
 *
 * @param {string} username  - customer ka naam
 * @param {Object} orders    - Mongoose order document
 * @returns {string}         - HTML string
 */
const OrderConfirmationEmail = (username, orders) => {
    const storeName  = process.env.STORE_NAME  || 'MyStore';
    const storeColor = process.env.STORE_COLOR || '#4CAF50';
    const storeUrl   = process.env.STORE_URL   || '#';
    const year       = new Date().getFullYear();

    const products = Array.isArray(orders?.products) ? orders.products : [];

    // ── Total calculate karo (bug fix: subTotal already per-item total hai) ──
    const grandTotal = products.reduce((sum, item) => {
        // subTotal = price × qty already set by frontend in most cases
        // Agar nahi hai toh price × quantity use karo
        const lineTotal = item?.subTotal
            ? Number(item.subTotal)
            : Number(item?.price || 0) * Number(item?.quantity || 1);
        return sum + lineTotal;
    }, 0);

    const formatINR = (amount) =>
        Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

    const orderId   = orders?._id?.toString() || 'N/A';
    const orderDate = orders?.date
        ? new Date(orders.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const payStatus   = orders?.payment_status || 'Pending';
    const badgeBg     = payStatus?.toLowerCase() === 'paid' ? '#dcfce7' : '#fef9c3';
    const badgeColor  = payStatus?.toLowerCase() === 'paid' ? '#166534' : '#92400e';

    // ── Product Rows ──────────────────────────────────────────────────────────
    const productRowsHtml = products.length > 0
        ? products.map((item) => {
            const name     = item?.productTitle || item?.name || 'Product';
            const qty      = Number(item?.quantity || 1);
            const lineAmt  = item?.subTotal
                ? Number(item.subTotal)
                : Number(item?.price || 0) * qty;
            const image    = item?.image || (Array.isArray(item?.images) ? item.images[0] : '');

            return `
            <tr>
              <td style="padding:14px 12px;border-bottom:1px solid #f0f0f0;vertical-align:middle;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    ${image ? `
                    <td style="padding-right:12px;vertical-align:middle;">
                      <img src="${image}" alt="${name}"
                           width="52" height="52"
                           style="border-radius:8px;object-fit:cover;
                                  border:1px solid #e5e5e5;display:block;"/>
                    </td>` : ''}
                    <td style="vertical-align:middle;">
                      <p style="margin:0;font-size:14px;font-weight:600;color:#111;">${name}</p>
                      ${item?.size  ? `<p style="margin:2px 0 0;font-size:12px;color:#999;">Size: ${item.size}</p>` : ''}
                      ${item?.color ? `<p style="margin:2px 0 0;font-size:12px;color:#999;">Color: ${item.color}</p>` : ''}
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding:14px 12px;border-bottom:1px solid #f0f0f0;
                         text-align:center;font-size:14px;color:#555;vertical-align:middle;">
                ${qty}
              </td>
              <td style="padding:14px 12px;border-bottom:1px solid #f0f0f0;
                         text-align:right;font-size:14px;font-weight:600;
                         color:#111;vertical-align:middle;">
                ${formatINR(lineAmt)}
              </td>
            </tr>`;
        }).join('')
        : `<tr>
             <td colspan="3" style="padding:24px;text-align:center;color:#999;font-size:14px;">
               No products found.
             </td>
           </tr>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Order Confirmed – ${storeName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;color:#333;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 16px;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0"
             style="max-width:620px;width:100%;background:#ffffff;
                    border-radius:10px;overflow:hidden;
                    box-shadow:0 4px 12px rgba(0,0,0,0.1);">

        <!-- ── Header ── -->
        <tr>
          <td style="background:${storeColor};padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">
              ${storeName}
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.88);font-size:14px;">
              Order Confirmation
            </p>
          </td>
        </tr>

        <!-- ── Success message ── -->
        <tr>
          <td style="padding:36px 40px 24px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">✅</div>
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">
              Order Placed Successfully!
            </h2>
            <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">
              Hi <strong>${username}</strong>, your order has been received.<br/>
              We'll start processing it right away.
            </p>
          </td>
        </tr>

        <!-- ── Order Meta Card ── -->
        <tr>
          <td style="padding:0 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#f9f9f9;border:1px solid #eeeeee;border-radius:8px;">
              <tr>
                <td style="padding:18px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;">
                        <span style="font-size:12px;color:#999;display:block;">Order ID</span>
                        <span style="font-size:13px;font-weight:700;color:#111;
                                     font-family:monospace;">#${orderId.slice(-8).toUpperCase()}</span>
                      </td>
                      <td style="padding:4px 0;text-align:center;">
                        <span style="font-size:12px;color:#999;display:block;">Date</span>
                        <span style="font-size:13px;font-weight:600;color:#111;">${orderDate}</span>
                      </td>
                      <td style="padding:4px 0;text-align:right;">
                        <span style="font-size:12px;color:#999;display:block;">Payment</span>
                        <span style="display:inline-block;background:${badgeBg};color:${badgeColor};
                                     font-size:11px;font-weight:700;padding:3px 10px;
                                     border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">
                          ${payStatus}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Products Table ── -->
        <tr>
          <td style="padding:0 40px 16px;">
            <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111;">
              Order Items
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #eeeeee;border-radius:8px;
                           border-collapse:separate;border-spacing:0;overflow:hidden;">
              <!-- Table Header -->
              <tr style="background:#f5f5f5;">
                <th style="padding:12px;text-align:left;font-size:12px;color:#888;
                            font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                  Product
                </th>
                <th style="padding:12px;text-align:center;font-size:12px;color:#888;
                            font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                  Qty
                </th>
                <th style="padding:12px;text-align:right;font-size:12px;color:#888;
                            font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                  Amount
                </th>
              </tr>
              ${productRowsHtml}
            </table>
          </td>
        </tr>

        <!-- ── Grand Total ── -->
        <tr>
          <td style="padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td></td>
                <td style="width:220px;">
                  <table width="100%" cellpadding="0" cellspacing="0"
                         style="background:#f9f9f9;border:1px solid #eeeeee;
                                 border-radius:8px;padding:14px 18px;">
                    <tr>
                      <td style="padding:4px 0 4px 14px;font-size:13px;color:#555;">
                        Estimated Delivery
                      </td>
                      <td style="padding:4px 14px 4px 0;text-align:right;font-size:13px;
                                  font-weight:600;color:#111;">
                        3–5 business days
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0 4px 14px;font-size:15px;font-weight:700;
                                  color:#111;border-top:1px solid #eee;">
                        Total
                      </td>
                      <td style="padding:10px 14px 4px 0;text-align:right;font-size:17px;
                                  font-weight:800;color:${storeColor};border-top:1px solid #eee;">
                        ${formatINR(grandTotal)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── CTA Button ── -->
        <tr>
          <td style="padding:0 40px 36px;text-align:center;">
            <a href="${storeUrl}/orders"
               style="display:inline-block;background:${storeColor};color:#ffffff;
                      font-size:15px;font-weight:700;padding:14px 40px;
                      border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
              View My Orders →
            </a>
            <p style="margin:18px 0 0;font-size:13px;color:#999;line-height:1.6;">
              Questions? Just reply to this email — we're happy to help!
            </p>
          </td>
        </tr>

        <!-- ── Divider ── -->
        <tr>
          <td style="padding:0 40px;">
            <hr style="border:none;border-top:1px solid #eeeeee;margin:0;"/>
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;line-height:1.8;">
              © ${year} ${storeName}. All rights reserved.<br/>
              This is an automated email — please do not reply directly.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
};

export default OrderConfirmationEmail;