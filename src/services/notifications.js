export async function sendAdminEmailAlert({ orderCode, kind, customerName, phone, email, summary, totalAmount, referenceImageUrl }) {
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  if (!accessKey) return;

  await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_key: accessKey,
      subject: `[Kala & Sutr] New ${kind === 'commission' ? 'Commission Request' : 'Order'} (${orderCode})`,
      from_name: customerName,
      message: [
        `Order Code: ${orderCode}`,
        `Type: ${kind.toUpperCase()}`,
        `Customer: ${customerName}`,
        `Phone/WhatsApp: ${phone}`,
        `Email: ${email || 'N/A'}`,
        `Estimated Total: ₹${totalAmount}`,
        `Details: ${summary}`,
        referenceImageUrl ? `Reference Image: ${referenceImageUrl}` : '',
      ].filter(Boolean).join('\n'),
    }),
  });
}

export function buildWhatsAppLink(whatsappNumber, { orderCode, customerName, summary, totalAmount }) {
  const text = encodeURIComponent(
    `Hello! I just submitted request *${orderCode}* on Kala & Sutr.\nName: ${customerName}\nDetails: ${summary}\nEstimated Total: ₹${totalAmount}\nPlease share payment/UPI details to confirm.`
  );
  return `https://wa.me/${whatsappNumber}?text=${text}`;
}