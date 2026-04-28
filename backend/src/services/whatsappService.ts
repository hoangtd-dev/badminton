export async function sendWhatsApp(
  phone: string,
  apiKey: string,
  message: string,
): Promise<void> {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`WhatsApp send failed for ${phone}: ${res.status}`);
    }
  } catch (err) {
    console.error(`WhatsApp fetch error for ${phone}:`, err);
  }
}

export function buildLowBalanceMessage(name: string, balance: number): string {
  return `🏸 *Badminton Group Manager*\n\nHi ${name}, your balance is running low!\n\n💰 Current balance: *AUD ${balance.toFixed(2)}*\n\nPlease top up soon to keep playing. Contact your admin to add funds.`;
}
